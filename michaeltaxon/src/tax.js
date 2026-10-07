// Direct port of GameScene#calculateSalary (Argentine payroll-tax satire),
// with the flat 35% "Ganancias" rate replaced by the real progressive AFIP
// income-tax brackets (applied to the taxable excess above the non-taxable
// minimum).
//
// The three flat payroll deductions below are all applied to full gross pay
// (no monthly cap modeled — none was specified for this game's numbers):
//   - Pension Fund (SIPA)         11%  -- was "jubilación" in the original
//   - Healthcare (Obra Social)     3%  -- same in the original
//   - Social Services (PAMI)       3%  -- "Ley 19.032" in the original, the
//                                         law that funds PAMI

export const PENSION_FUND_SIPA = 0.11;
export const HEALTHCARE_OBRA_SOCIAL = 0.03;
export const SOCIAL_SERVICES_PAMI = 0.03;
export const MINIMO_NO_IMPONIBLE = 15000 * 13;

// Net Taxable Income brackets: fixed base fee + marginal rate applied on the
// excess over the bracket's floor.
const GANANCIAS_BRACKETS = [
  { upTo: 2730730.38, base: 0, rate: 0.05, over: 0 },
  { upTo: 5461460.75, base: 136536.52, rate: 0.09, over: 2730730.38 },
  { upTo: 8192191.13, base: 382302.25, rate: 0.12, over: 5461460.75 },
  { upTo: 10922921.51, base: 710000.00, rate: 0.15, over: 8192191.13 },
  { upTo: 16384382.26, base: 1119598.45, rate: 0.19, over: 10922921.51 },
  { upTo: 21845843.02, base: 2157276.00, rate: 0.23, over: 16384382.26 },
  { upTo: 32768764.53, base: 3413412.00, rate: 0.27, over: 21845843.02 },
  { upTo: 65867941.10, base: 6362591.00, rate: 0.31, over: 32768764.53 },
  { upTo: Infinity, base: 16623336.00, rate: 0.35, over: 65867941.10 },
];

function gananciasTax(netTaxableIncome) {
  if (netTaxableIncome <= 0) return 0;
  const bracket = GANANCIAS_BRACKETS.find((b) => netTaxableIncome <= b.upTo);
  return bracket.base + (netTaxableIncome - bracket.over) * bracket.rate;
}

export function calculateSalary(ingresoBruto) {
  let ingresos = ingresoBruto;

  const pensionFund = Math.trunc(ingresoBruto * PENSION_FUND_SIPA);
  ingresos -= pensionFund;

  const healthcare = Math.trunc(ingresoBruto * HEALTHCARE_OBRA_SOCIAL);
  ingresos -= healthcare;

  const socialServices = Math.trunc(ingresoBruto * SOCIAL_SERVICES_PAMI);
  ingresos -= socialServices;

  const netTaxableIncome = ingresoBruto - MINIMO_NO_IMPONIBLE;
  const incomeTax = Math.trunc(gananciasTax(netTaxableIncome));
  ingresos -= incomeTax;

  const neto = Math.trunc(ingresos);

  return {
    bruto: ingresoBruto,
    pensionFund,
    healthcare,
    socialServices,
    incomeTax,
    totalTax: ingresoBruto - neto,
    neto,
    // Ready-to-render rows, in the order they should be displayed.
    breakdown: [
      { label: 'Pension Fund (SIPA)', amount: pensionFund },
      { label: 'Healthcare (Obra Social)', amount: healthcare },
      { label: 'Social Services (PAMI)', amount: socialServices },
      { label: 'Income Tax (Ganancias)', amount: incomeTax },
    ],
  };
}
