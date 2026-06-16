import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SendSmsDto } from './dto/send-sms.dto';

/**
 * Shared include used across most list endpoints. Keeps the formule/pdv
 * projection consistent with the rest of the codebase (see abonnes.service).
 */
const FORMULE_PDV_INCLUDE = {
  formule: { select: { code: true, nomCommercial: true } },
  pdv: { select: { raisonSociale: true } },
};

/** Add `n` days to a date, returning a new Date. */
function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

@Injectable()
export class ServiceAbonnementService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Aggregate counters + two derived KPIs (ARPU, taux de réabonnement).
   * All numbers come straight from DB counts/sums; the only modelling choices
   * are documented inline.
   */
  async getStats() {
    const now = new Date();
    const in30 = addDays(now, 30);

    const [
      total,
      actifs,
      echus,
      suspendus,
      resilies,
      aae30,
      sumAgg,
      reaboCount,
    ] = await Promise.all([
      this.prisma.abonne.count(),
      this.prisma.abonne.count({ where: { statut: 'ACTIF' as any } }),
      this.prisma.abonne.count({ where: { statut: 'ECHU' as any } }),
      this.prisma.abonne.count({ where: { statut: 'SUSPENDU' as any } }),
      this.prisma.abonne.count({ where: { statut: 'RESILIE' as any } }),
      this.prisma.abonne.count({
        where: {
          statut: 'ACTIF' as any,
          dateEcheance: { gte: now, lte: in30 },
        },
      }),
      this.prisma.encaissement.aggregate({ _sum: { montantTotal: true } }),
      // Réabonnement proxy: an abonné counts as "réabonné" when canalReabo is set.
      this.prisma.abonne.count({ where: { canalReabo: { not: null } } }),
    ]);

    const caTotal = sumAgg._sum.montantTotal || 0;
    // ARPU = CA total encaissé / nombre d'abonnés actifs (guard against /0).
    const arpu = Math.round(caTotal / Math.max(actifs, 1));
    // Taux de réabonnement = part des abonnés ayant un canalReabo renseigné.
    const tauxReabo = Math.round((reaboCount / Math.max(total, 1)) * 100);

    return {
      total,
      actifs,
      echus,
      suspendus,
      resilies,
      aae30,
      arpu,
      tauxReabo,
    };
  }

  /** Abonnés à échéance (ACTIF) tombant dans la fenêtre [today, today+jours]. */
  async getAae(jours = 30) {
    const now = new Date();
    const limit = addDays(now, jours);

    return this.prisma.abonne.findMany({
      where: {
        statut: 'ACTIF' as any,
        dateEcheance: { gte: now, lte: limit },
      },
      include: FORMULE_PDV_INCLUDE,
      orderBy: { dateEcheance: 'asc' },
    });
  }

  /** Abonnés échus. */
  async getEchus() {
    return this.prisma.abonne.findMany({
      where: { statut: 'ECHU' as any },
      include: FORMULE_PDV_INCLUDE,
      orderBy: { dateEcheance: 'asc' },
    });
  }

  /**
   * Fiches non qualifiées (heuristique = dossier incomplet) :
   * décodeur non attribué OU téléphone principal vide.
   */
  async getNonQualifies() {
    const rows = await this.prisma.abonne.findMany({
      where: {
        OR: [{ decodeurId: null }, { tel1: '' }],
      },
      include: FORMULE_PDV_INCLUDE,
    });

    return rows.map((a) => ({
      ...a,
      motif:
        a.decodeurId === null
          ? 'Décodeur non attribué'
          : 'Téléphone manquant',
    }));
  }

  /**
   * Suivi M+ des abonnés actifs. `niveau` = 'M+' + nombre de mois (arrondi au
   * supérieur) avant échéance, borné dans [1, 6].
   */
  async getSuiviMp() {
    const now = new Date();
    const rows = await this.prisma.abonne.findMany({
      where: { statut: 'ACTIF' as any },
      include: FORMULE_PDV_INCLUDE,
      orderBy: { dateEcheance: 'asc' },
    });

    return rows.map((a) => {
      const daysUntil =
        (a.dateEcheance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      const months = Math.ceil(daysUntil / 30);
      const cappedMonths = Math.min(Math.max(months, 1), 6);
      return { ...a, niveau: 'M+' + cappedMonths };
    });
  }

  /**
   * Abonnés ayant au moins un encaissement de nature RECRUTEMENT, enrichis
   * de `dateRecrutement` = date du dernier RECRUTEMENT, triés desc.
   */
  async getBienvenue() {
    const recent = await this.prisma.encaissement.findMany({
      where: { nature: 'RECRUTEMENT' as any },
      select: { abonneId: true, date: true },
      orderBy: { date: 'desc' },
      take: 500,
    });

    if (recent.length === 0) {
      return [];
    }

    // Latest RECRUTEMENT date per abonné (recent[] already sorted desc).
    const latestByAbonne = new Map<string, Date>();
    for (const e of recent) {
      if (!latestByAbonne.has(e.abonneId)) {
        latestByAbonne.set(e.abonneId, e.date);
      }
    }

    const abonneIds = [...latestByAbonne.keys()];
    const abonnes = await this.prisma.abonne.findMany({
      where: { id: { in: abonneIds } },
      include: FORMULE_PDV_INCLUDE,
    });

    return abonnes
      .map((a) => ({
        ...a,
        dateRecrutement: latestByAbonne.get(a.id) as Date,
      }))
      .sort(
        (x, y) => y.dateRecrutement.getTime() - x.dateRecrutement.getTime(),
      );
  }

  /** Derniers encaissements de recrutement. */
  async getRecrutement() {
    return this.prisma.encaissement.findMany({
      where: { nature: 'RECRUTEMENT' as any },
      include: {
        abonne: { select: { numAbonne: true, nom: true, prenom: true } },
        pdv: { select: { raisonSociale: true } },
        formule: { select: { code: true, nomCommercial: true } },
      },
      orderBy: { date: 'desc' },
      take: 200,
    });
  }

  /** Mock SMS dispatch (no real gateway). Audit-logged. */
  async sendSms(dto: SendSmsDto, userId: string, ip: string) {
    if (!dto.abonneIds || dto.abonneIds.length === 0) {
      throw new BadRequestException('Aucun abonné sélectionné');
    }

    await this.audit.log(userId, 'ENVOI_SMS', 'SERVICE_ABONNEMENT', ip);

    return { sent: dto.abonneIds.length };
  }
}
