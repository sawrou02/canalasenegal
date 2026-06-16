/**
 * Pure, dependency-free implementations of the critical SENDISTRI business
 * rules. These functions hold no I/O and no framework concerns so they can be
 * unit-tested directly and reused by the NestJS services (the production code
 * is therefore the tested code).
 */

/** Per-option surcharges added on top of the formule price (in FCFA). */
export const OPTION_PRICES = {
  premium: 6000,
  intl: 6000,
  timbre: 100,
} as const;

/** Default commission parameters (mirrors COMMISSION_PARAMS in the service). */
export const DEFAULT_COMMISSION_PARAMS = {
  bonusMateriel: 3500, // FCFA per recrutement
  tauxFormule: 0.1, // 10% of CA recrutement
  tauxReabo: 0.1, // 10% of CA réabonnement
  primeMigration: 2000, // FCFA per migration
} as const;

export interface EncaissementOptions {
  premium?: boolean;
  intl?: boolean;
  timbre?: boolean;
}

export interface EncaissementResult {
  montantTotal: number;
  optionsTotal: number;
  monnaieRendue: number;
}

/**
 * Compute the amount owed for an encaissement and the change to return.
 * montantTotal = prixFormule * nbMois + selected option surcharges.
 * monnaieRendue = montantRecu - montantTotal (may be negative if insufficient).
 */
export function computeEncaissement(
  prixFormule: number,
  nbMois: number,
  options: EncaissementOptions,
  montantRecu: number,
): EncaissementResult {
  const opts = options || {};
  const optionsTotal =
    (opts.premium ? OPTION_PRICES.premium : 0) +
    (opts.intl ? OPTION_PRICES.intl : 0) +
    (opts.timbre ? OPTION_PRICES.timbre : 0);

  const montantTotal = prixFormule * nbMois + optionsTotal;
  const monnaieRendue = montantRecu - montantTotal;

  return { montantTotal, optionsTotal, monnaieRendue };
}

/** True when the received amount covers the total owed. */
export function isMontantSuffisant(
  montantRecu: number,
  montantTotal: number,
): boolean {
  return montantRecu - montantTotal >= 0;
}

export interface CommissionParams {
  bonusMateriel: number;
  tauxFormule: number;
  tauxReabo: number;
  primeMigration: number;
}

export interface CommissionInput {
  nbRecru: number;
  caRecru: number;
  caReabo: number;
  nbMigration: number;
  deductions?: number;
}

export interface CommissionResult {
  comRecrutement: number;
  comFormule: number;
  comReabo: number;
  primeMigration: number;
  deductions: number;
  comNette: number;
}

/**
 * Compute a partner's commission breakdown.
 * comNette = comRecrutement + comFormule + comReabo + primeMigration - deductions
 */
export function computeCommission(
  input: CommissionInput,
  params: CommissionParams = DEFAULT_COMMISSION_PARAMS,
): CommissionResult {
  const comRecrutement = input.nbRecru * params.bonusMateriel;
  const comFormule = params.tauxFormule * input.caRecru;
  const comReabo = params.tauxReabo * input.caReabo;
  const primeMigration = params.primeMigration * input.nbMigration;
  const deductions = input.deductions ?? 0;
  const comNette =
    comRecrutement + comFormule + comReabo + primeMigration - deductions;

  return {
    comRecrutement,
    comFormule,
    comReabo,
    primeMigration,
    deductions,
    comNette,
  };
}

/**
 * PDV running balance owed to SENDISTRI.
 * solde = Σ encaissements − Σ versements validés
 */
export function computePdvSolde(
  totalEncaissements: number,
  totalVersementsValides: number,
): number {
  return totalEncaissements - totalVersementsValides;
}

/** Difference between the declared report value and the encaissed value. */
export function computeMatchingEcart(rapport: number, encaisse: number): number {
  return rapport - encaisse;
}
