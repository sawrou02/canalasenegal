import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  parseRapportFile,
  dayKeyToDate,
  ParsedRow,
} from './rapport-parser';

interface DayAggregate {
  jour: string;
  montantTotal: number;
  nbRecru: number;
  nbReabo: number;
  caFormule: number;
  caReabo: number;
}

/** Sum a parsed file's rows into the per-type summary used by preview/import. */
function summarize(rows: ParsedRow[]) {
  const parType = {
    recrutement: { nb: 0, montant: 0 },
    reabonnement: { nb: 0, montant: 0 },
    migration: { nb: 0, montant: 0 },
  };
  let montantTotal = 0;
  const jours = new Set<string>();
  for (const row of rows) {
    montantTotal += row.montant;
    jours.add(row.jour);
    if (row.type === 'recrutement') {
      parType.recrutement.nb += row.nombre;
      parType.recrutement.montant += row.montant;
    } else if (row.type === 'reabonnement') {
      parType.reabonnement.nb += row.nombre;
      parType.reabonnement.montant += row.montant;
    } else if (row.type === 'migration') {
      parType.migration.nb += row.nombre;
      parType.migration.montant += row.montant;
    }
  }
  return {
    montantTotal,
    parType,
    jours: Array.from(jours).sort(),
  };
}

/** Aggregate rows by day for import into RapportActivite records. */
function aggregateByDay(rows: ParsedRow[]): DayAggregate[] {
  const map = new Map<string, DayAggregate>();
  for (const row of rows) {
    let agg = map.get(row.jour);
    if (!agg) {
      agg = {
        jour: row.jour,
        montantTotal: 0,
        nbRecru: 0,
        nbReabo: 0,
        caFormule: 0,
        caReabo: 0,
      };
      map.set(row.jour, agg);
    }
    agg.montantTotal += row.montant;
    if (row.type === 'recrutement') {
      agg.nbRecru += row.nombre;
      agg.caFormule += row.montant;
    } else if (row.type === 'reabonnement') {
      agg.nbReabo += row.nombre;
      agg.caReabo += row.montant;
    }
  }
  return Array.from(map.values()).sort((a, b) => a.jour.localeCompare(b.jour));
}

@Injectable()
export class RapportsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.rapportActivite.findMany({
      include: { importePar: { select: { prenom: true, nom: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async getStats() {
    const [count, sum, matches, ecarts, enAttente] = await Promise.all([
      this.prisma.rapportActivite.count(),
      this.prisma.rapportActivite.aggregate({
        _sum: { montantTotal: true },
      }),
      this.prisma.rapportActivite.count({
        where: { statutMatching: 'MATCHE' as any },
      }),
      this.prisma.rapportActivite.count({
        where: { statutMatching: 'ECART' as any },
      }),
      this.prisma.rapportActivite.count({
        where: { statutMatching: 'EN_ATTENTE' as any },
      }),
    ]);
    return {
      count,
      caCumule: sum._sum.montantTotal || 0,
      matches,
      ecarts,
      enAttente,
    };
  }

  async preview(buffer: Buffer, originalname: string) {
    const { fichier, rows } = await parseRapportFile(buffer, originalname);
    const { montantTotal, parType, jours } = summarize(rows);
    return {
      fichier,
      lignesDetectees: rows.length,
      montantTotal,
      parType,
      jours,
    };
  }

  async import(
    buffer: Buffer,
    originalname: string,
    userId: string,
    ip: string,
  ) {
    const { fichier, rows } = await parseRapportFile(buffer, originalname);
    const { montantTotal } = summarize(rows);
    const days = aggregateByDay(rows);
    const now = new Date();

    let joursImportes = 0;
    let joursIgnores = 0;

    for (const day of days) {
      const date = dayKeyToDate(day.jour);
      // Idempotence: skip if a report already exists for this exact start-of-day.
      const existing = await this.prisma.rapportActivite.findFirst({
        where: { date },
        select: { id: true },
      });
      if (existing) {
        joursIgnores += 1;
        continue;
      }
      await this.prisma.rapportActivite.create({
        data: {
          date,
          fichierImporte: fichier,
          montantTotal: day.montantTotal,
          sat: 0,
          fibre: 0,
          rex: 0,
          nbReabo: day.nbReabo,
          caReabo: day.caReabo,
          nbRecru: day.nbRecru,
          caFormule: day.caFormule,
          caCreatZ4: 0,
          caCreatGZ: 0,
          caCreatG11: 0,
          caPayech: 0,
          caAccessoires: 0,
          statutMatching: 'EN_ATTENTE' as any,
          importeParId: userId,
          importeLe: now,
        },
      });
      joursImportes += 1;
    }

    await this.audit.log(userId, 'IMPORT_RAPPORT', 'RAPPORTS', ip);

    return {
      fichier,
      joursImportes,
      joursIgnores,
      lignesDetectees: rows.length,
      montantTotal,
    };
  }

  async matcher(id: string, userId: string, ip: string) {
    const updated = await this.prisma.rapportActivite.update({
      where: { id },
      data: { statutMatching: 'MATCHE' as any },
    });
    await this.audit.log(userId, 'MATCHER_RAPPORT', 'RAPPORTS', ip);
    return updated;
  }

  /**
   * Compare a RapportActivite for a day against aggregated Encaissements for the
   * same day. Each ligne carries a numeric ecart (rapport - encaisse).
   */
  async matching(dateStr: string) {
    const dayStart = dayKeyToDate(dateStr);
    if (isNaN(dayStart.getTime())) {
      // Defensive: invalid date string => empty day window yields zeros.
    }
    const dayEnd = new Date(
      dayStart.getFullYear(),
      dayStart.getMonth(),
      dayStart.getDate() + 1,
    );

    const [rapport, encs] = await Promise.all([
      this.prisma.rapportActivite.findFirst({
        where: { date: dayStart },
      }),
      this.prisma.encaissement.findMany({
        where: { date: { gte: dayStart, lt: dayEnd } },
        select: { nature: true, montantTotal: true },
      }),
    ]);

    const enc = {
      nbRecru: 0,
      nbReabo: 0,
      caRecru: 0,
      caReabo: 0,
      montantTotal: 0,
    };
    for (const e of encs) {
      enc.montantTotal += e.montantTotal;
      if (e.nature === ('RECRUTEMENT' as any)) {
        enc.nbRecru += 1;
        enc.caRecru += e.montantTotal;
      } else if (e.nature === ('REABONNEMENT' as any)) {
        enc.nbReabo += 1;
        enc.caReabo += e.montantTotal;
      }
    }

    const ligne = (libelle: string, rapportVal: number, encaisse: number) => ({
      libelle,
      rapport: rapportVal,
      encaisse,
      ecart: rapportVal - encaisse,
    });

    return {
      date: dateStr,
      rapportId: rapport?.id ?? null,
      statutMatching: rapport?.statutMatching ?? null,
      found: !!rapport,
      lignes: [
        ligne('Recrutements (nb)', rapport?.nbRecru ?? 0, enc.nbRecru),
        ligne('Réabonnements (nb)', rapport?.nbReabo ?? 0, enc.nbReabo),
        ligne('CA Recrutement', rapport?.caFormule ?? 0, enc.caRecru),
        ligne('CA Réabonnement', rapport?.caReabo ?? 0, enc.caReabo),
        ligne('Montant total', rapport?.montantTotal ?? 0, enc.montantTotal),
      ],
    };
  }
}
