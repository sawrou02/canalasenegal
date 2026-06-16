import {
  computeEncaissement,
  isMontantSuffisant,
  computeCommission,
  computePdvSolde,
  computeMatchingEcart,
  OPTION_PRICES,
  DEFAULT_COMMISSION_PARAMS,
} from './calculations';

describe('computeEncaissement', () => {
  it('base case: prixFormule 15000 * 1 mois = 15000, with exact change', () => {
    const r = computeEncaissement(15000, 1, {}, 15000);
    expect(r.montantTotal).toBe(15000);
    expect(r.optionsTotal).toBe(0);
    expect(r.monnaieRendue).toBe(0);
  });

  it('returns positive monnaieRendue when reçu exceeds total', () => {
    const r = computeEncaissement(15000, 1, {}, 20000);
    expect(r.montantTotal).toBe(15000);
    expect(r.monnaieRendue).toBe(5000);
  });

  it('adds option surcharges (premium + timbre => +6100)', () => {
    const r = computeEncaissement(15000, 1, { premium: true, timbre: true }, 30000);
    expect(r.optionsTotal).toBe(OPTION_PRICES.premium + OPTION_PRICES.timbre);
    expect(r.optionsTotal).toBe(6100);
    expect(r.montantTotal).toBe(21100);
    expect(r.monnaieRendue).toBe(8900);
  });

  it('adds all three options (premium + intl + timbre => +12100)', () => {
    const r = computeEncaissement(
      15000,
      1,
      { premium: true, intl: true, timbre: true },
      0,
    );
    expect(r.optionsTotal).toBe(12100);
    expect(r.montantTotal).toBe(27100);
  });

  it('handles multi-month: 15000 * 3 = 45000', () => {
    const r = computeEncaissement(15000, 3, {}, 45000);
    expect(r.montantTotal).toBe(45000);
    expect(r.monnaieRendue).toBe(0);
  });

  it('multi-month with options: 10000 * 6 + intl 6000 = 66000', () => {
    const r = computeEncaissement(10000, 6, { intl: true }, 70000);
    expect(r.montantTotal).toBe(66000);
    expect(r.monnaieRendue).toBe(4000);
  });

  it('insufficient amount yields negative monnaieRendue', () => {
    const r = computeEncaissement(15000, 1, {}, 10000);
    expect(r.monnaieRendue).toBe(-5000);
    expect(isMontantSuffisant(10000, r.montantTotal)).toBe(false);
  });

  it('treats undefined options as none', () => {
    const r = computeEncaissement(15000, 1, undefined as any, 15000);
    expect(r.optionsTotal).toBe(0);
    expect(r.montantTotal).toBe(15000);
  });
});

describe('isMontantSuffisant', () => {
  it('true when reçu equals total (exact change)', () => {
    expect(isMontantSuffisant(15000, 15000)).toBe(true);
  });
  it('true when reçu exceeds total', () => {
    expect(isMontantSuffisant(20000, 15000)).toBe(true);
  });
  it('false when reçu is below total', () => {
    expect(isMontantSuffisant(10000, 15000)).toBe(false);
  });
});

describe('computeCommission', () => {
  it('known inputs produce the exact expected breakdown', () => {
    const r = computeCommission({
      nbRecru: 10,
      caRecru: 150000,
      caReabo: 200000,
      nbMigration: 2,
    });
    expect(r.comRecrutement).toBe(35000); // 10 * 3500
    expect(r.comFormule).toBe(15000); // 0.10 * 150000
    expect(r.comReabo).toBe(20000); // 0.10 * 200000
    expect(r.primeMigration).toBe(4000); // 2000 * 2
    expect(r.deductions).toBe(0);
    expect(r.comNette).toBe(74000);
  });

  it('applies deductions to comNette', () => {
    const r = computeCommission({
      nbRecru: 10,
      caRecru: 150000,
      caReabo: 200000,
      nbMigration: 2,
      deductions: 4000,
    });
    expect(r.deductions).toBe(4000);
    expect(r.comNette).toBe(70000); // 74000 - 4000
  });

  it('all-zero input yields zero commission', () => {
    const r = computeCommission({
      nbRecru: 0,
      caRecru: 0,
      caReabo: 0,
      nbMigration: 0,
    });
    expect(r.comNette).toBe(0);
  });

  it('honours custom params over defaults', () => {
    const r = computeCommission(
      { nbRecru: 1, caRecru: 100000, caReabo: 0, nbMigration: 0 },
      { bonusMateriel: 1000, tauxFormule: 0.2, tauxReabo: 0.2, primeMigration: 0 },
    );
    expect(r.comRecrutement).toBe(1000);
    expect(r.comFormule).toBe(20000);
    expect(r.comNette).toBe(21000);
  });

  it('default params match the documented constants', () => {
    expect(DEFAULT_COMMISSION_PARAMS.bonusMateriel).toBe(3500);
    expect(DEFAULT_COMMISSION_PARAMS.tauxFormule).toBe(0.1);
    expect(DEFAULT_COMMISSION_PARAMS.tauxReabo).toBe(0.1);
    expect(DEFAULT_COMMISSION_PARAMS.primeMigration).toBe(2000);
  });
});

describe('computePdvSolde', () => {
  it('solde = encaissements - versements validés', () => {
    expect(computePdvSolde(100000, 60000)).toBe(40000);
  });
  it('zero when fully settled', () => {
    expect(computePdvSolde(50000, 50000)).toBe(0);
  });
  it('negative when versements exceed encaissements (over-payment)', () => {
    expect(computePdvSolde(50000, 80000)).toBe(-30000);
  });
});

describe('computeMatchingEcart', () => {
  it('positive when rapport exceeds encaisse', () => {
    expect(computeMatchingEcart(100000, 80000)).toBe(20000);
  });
  it('zero when equal', () => {
    expect(computeMatchingEcart(100000, 100000)).toBe(0);
  });
  it('negative when encaisse exceeds rapport', () => {
    expect(computeMatchingEcart(80000, 100000)).toBe(-20000);
  });
});
