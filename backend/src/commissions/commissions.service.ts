import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeCommission } from '../domain/calculations';

/**
 * Business-rule constants for commission computation. Exposed explicitly
 * (returned in every response) so the figures are auditable, never hidden magic.
 */
export const COMMISSION_PARAMS = {
  bonusMateriel: 3500, // FCFA per recrutement
  tauxFormule: 0.1, // 10% of CA recrutement
  tauxReabo: 0.1, // 10% of CA réabonnement
  primeMigration: 2000, // FCFA per migration
  deductionParNonQualifie: 0, // no model yet => 0
};

interface PdvAggregate {
  nbRecru: number;
  caRecru: number;
  nbReabo: number;
  caReabo: number;
  nbMigration: number;
}

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolve a YYYY-MM period to [start, end) month bounds.
   * Falls back to the current month for missing/invalid input.
   */
  private resolvePeriode(periode?: string): {
    periode: string;
    start: Date;
    end: Date;
  } {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // 0-based
    const m = periode?.match(/^(\d{4})-(\d{1,2})$/);
    if (m) {
      year = parseInt(m[1], 10);
      month = parseInt(m[2], 10) - 1;
    }
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    const normalized = `${year}-${String(month + 1).padStart(2, '0')}`;
    return { periode: normalized, start, end };
  }

  async getCommissions(periodeParam?: string) {
    const { periode, start, end } = this.resolvePeriode(periodeParam);

    const [pdvs, grouped] = await Promise.all([
      this.prisma.pDV.findMany({
        select: { id: true, code: true, raisonSociale: true },
        orderBy: { raisonSociale: 'asc' },
      }),
      this.prisma.encaissement.groupBy({
        by: ['pdvId', 'nature'],
        where: { date: { gte: start, lt: end } },
        _count: { _all: true },
        _sum: { montantTotal: true },
      }),
    ]);

    // Merge grouped aggregates (pdvId x nature) back per PDV.
    const aggByPdv = new Map<string, PdvAggregate>();
    const ensure = (pdvId: string): PdvAggregate => {
      let a = aggByPdv.get(pdvId);
      if (!a) {
        a = { nbRecru: 0, caRecru: 0, nbReabo: 0, caReabo: 0, nbMigration: 0 };
        aggByPdv.set(pdvId, a);
      }
      return a;
    };
    for (const g of grouped) {
      const a = ensure(g.pdvId);
      const count = g._count?._all || 0;
      const montant = g._sum?.montantTotal || 0;
      if (g.nature === ('RECRUTEMENT' as any)) {
        a.nbRecru += count;
        a.caRecru += montant;
      } else if (g.nature === ('REABONNEMENT' as any)) {
        a.nbReabo += count;
        a.caReabo += montant;
      } else if (g.nature === ('MIGRATION' as any)) {
        a.nbMigration += count;
      }
    }

    const lignes = pdvs.map((pdv) => {
      const a =
        aggByPdv.get(pdv.id) ||
        ({
          nbRecru: 0,
          caRecru: 0,
          nbReabo: 0,
          caReabo: 0,
          nbMigration: 0,
        } as PdvAggregate);

      const { comRecrutement, comFormule, comReabo, primeMigration, comNette } =
        computeCommission(
          {
            nbRecru: a.nbRecru,
            caRecru: a.caRecru,
            caReabo: a.caReabo,
            nbMigration: a.nbMigration,
          },
          COMMISSION_PARAMS,
        );

      return {
        pdv: { code: pdv.code, raisonSociale: pdv.raisonSociale },
        nbRecru: a.nbRecru,
        caRecru: a.caRecru,
        nbReabo: a.nbReabo,
        caReabo: a.caReabo,
        nbMigration: a.nbMigration,
        comRecrutement,
        comFormule,
        comReabo,
        primeMigration,
        comNette,
      };
    });

    const comBrute = lignes.reduce((s, l) => s + l.comNette, 0);
    const deductions = COMMISSION_PARAMS.deductionParNonQualifie;
    const comNetteTotal = comBrute - deductions;
    const partenaires = lignes.filter((l) => l.comNette > 0).length;

    return {
      periode,
      params: COMMISSION_PARAMS,
      lignes,
      totaux: {
        comBrute,
        deductions,
        comNette: comNetteTotal,
        partenaires,
      },
    };
  }
}
