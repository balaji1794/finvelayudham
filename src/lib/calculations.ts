// Financial Calculations Engine for FinVelayudham

export interface SIPResult {
  investedAmount: number;
  estimatedReturns: number;
  totalValue: number;
  yearlyBreakdown: Array<{ year: number; invested: number; value: number }>;
  waitAnalysis?: {
    waitYears: number;
    reducedValue: number;
    waitCost: number;
    catchUpMonthly: number;
  };
}

export function calculateSIP(
  monthly: number,
  annualRate: number,
  years: number,
  months: number = 0,
  stepUpPercent: number = 0
): SIPResult {
  const totalMonths = years * 12 + months;
  const monthlyRate = annualRate / 100 / 12;
  
  let currentMonthly = monthly;
  let totalInvested = 0;
  let futureValue = 0;
  const yearlyBreakdown: Array<{ year: number; invested: number; value: number }> = [];

  for (let m = 1; m <= totalMonths; m++) {
    // If step-up enabled, increment every 12 months
    if (m > 1 && m % 12 === 1 && stepUpPercent > 0) {
      currentMonthly += (currentMonthly * stepUpPercent) / 100;
    }
    totalInvested += currentMonthly;
    // Compounding monthly from start of month
    futureValue = (futureValue + currentMonthly) * (1 + monthlyRate);

    if (m % 12 === 0 || m === totalMonths) {
      yearlyBreakdown.push({
        year: Math.ceil(m / 12),
        invested: Math.round(totalInvested),
        value: Math.round(futureValue),
      });
    }
  }

  // Calculate wait cost (e.g. 5 years delay)
  const waitYears = Math.min(5, Math.floor(years / 2) || 1);
  const remainingMonths = Math.max(1, totalMonths - waitYears * 12);
  let lateFv = 0;
  let lateInvested = 0;
  let lateMonthly = monthly;
  for (let m = 1; m <= remainingMonths; m++) {
    if (m > 1 && m % 12 === 1 && stepUpPercent > 0) {
      lateMonthly += (lateMonthly * stepUpPercent) / 100;
    }
    lateInvested += lateMonthly;
    lateFv = (lateFv + lateMonthly) * (1 + monthlyRate);
  }

  const waitCost = Math.max(0, futureValue - lateFv);
  // Monthly SIP needed to catch up
  // FV = P * ((1+r)^n - 1)/r * (1+r)
  const factor = ((Math.pow(1 + monthlyRate, remainingMonths) - 1) / monthlyRate) * (1 + monthlyRate);
  const catchUpMonthly = factor > 0 ? futureValue / factor : monthly;

  return {
    investedAmount: Math.round(totalInvested),
    estimatedReturns: Math.round(Math.max(0, futureValue - totalInvested)),
    totalValue: Math.round(futureValue),
    yearlyBreakdown,
    waitAnalysis: {
      waitYears,
      reducedValue: Math.round(lateFv),
      waitCost: Math.round(waitCost),
      catchUpMonthly: Math.round(catchUpMonthly),
    },
  };
}

export function calculateLumpsum(
  investment: number,
  annualRate: number,
  years: number,
  months: number = 0
) {
  const totalYears = years + months / 12;
  const totalValue = investment * Math.pow(1 + annualRate / 100, totalYears);
  return {
    investedAmount: Math.round(investment),
    estimatedReturns: Math.round(totalValue - investment),
    totalValue: Math.round(totalValue),
  };
}

export function calculateCAGR(initialValue: number, finalValue: number, years: number): number {
  if (initialValue <= 0 || finalValue <= 0 || years <= 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
}

export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureYears: number,
  tenureMonths: number = 0,
  monthlyIncome: number = 0
) {
  const totalMonths = tenureYears * 12 + tenureMonths;
  if (totalMonths <= 0 || principal <= 0) {
    return { monthlyEmi: 0, totalInterest: 0, totalPayment: 0, emiRatio: 0, principal: 0 };
  }
  const monthlyRate = annualRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const monthlyEmi = (principal * monthlyRate * factor) / (factor - 1);
  const totalPayment = monthlyEmi * totalMonths;
  const totalInterest = totalPayment - principal;
  const emiRatio = monthlyIncome > 0 ? (monthlyEmi / monthlyIncome) * 100 : 0;

  return {
    monthlyEmi: Math.round(monthlyEmi),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
    principal: Math.round(principal),
    emiRatio: Number(emiRatio.toFixed(1)),
  };
}

export function calculateInflation(amount: number, inflationRate: number, years: number) {
  const futureValue = amount * Math.pow(1 + inflationRate / 100, years);
  const purchasingPower = amount / Math.pow(1 + inflationRate / 100, years);
  return {
    currentAmount: amount,
    futureCost: Math.round(futureValue),
    purchasingPower: Math.round(purchasingPower),
    lossInPurchasingPower: Math.round(amount - purchasingPower),
  };
}

export function calculateFutureCost(
  currentCost: number,
  years: number,
  inflationRate: number,
  returnRate: number
) {
  const futureCost = currentCost * Math.pow(1 + inflationRate / 100, years);
  const months = years * 12;
  const monthlyRate = returnRate / 100 / 12;
  const factor = ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  const requiredSip = factor > 0 ? futureCost / factor : futureCost / months;

  return {
    currentCost: Math.round(currentCost),
    futureCost: Math.round(futureCost),
    requiredSip: Math.round(requiredSip),
    totalSipInvestment: Math.round(requiredSip * months),
  };
}

export function calculateRetirement(
  currentAge: number,
  retirementAge: number,
  planUntilAge: number,
  monthlyExpensesToday: number,
  savingsSoFar: number,
  inflationRate: number,
  preReturn: number,
  postReturn: number
) {
  const yearsToRetirement = Math.max(1, retirementAge - currentAge);
  const retirementDurationYears = Math.max(1, planUntilAge - retirementAge);

  // Inflated monthly expenses at retirement age
  const inflatedMonthlyExpenses =
    monthlyExpensesToday * Math.pow(1 + inflationRate / 100, yearsToRetirement);
  const inflatedAnnualExpenses = inflatedMonthlyExpenses * 12;

  // Real rate of return post-retirement
  const realRate = (postReturn - inflationRate) / (1 + inflationRate / 100) / 100;
  
  // Corpus needed to fund inflation-adjusted expenses
  let requiredCorpus = 0;
  if (Math.abs(realRate) < 0.0001) {
    requiredCorpus = inflatedAnnualExpenses * retirementDurationYears;
  } else {
    requiredCorpus =
      inflatedAnnualExpenses * ((1 - Math.pow(1 + realRate, -retirementDurationYears)) / realRate);
  }

  // Future value of existing savings at retirement
  const fvExistingSavings = savingsSoFar * Math.pow(1 + preReturn / 100, yearsToRetirement);
  const shortfall = Math.max(0, requiredCorpus - fvExistingSavings);

  // Monthly SIP needed to reach shortfall
  const months = yearsToRetirement * 12;
  const monthlyPreRate = preReturn / 100 / 12;
  const sipFactor =
    ((Math.pow(1 + monthlyPreRate, months) - 1) / monthlyPreRate) * (1 + monthlyPreRate);
  const requiredMonthlySip = shortfall > 0 ? shortfall / sipFactor : 0;

  return {
    requiredCorpus: Math.round(requiredCorpus),
    inflatedMonthlyExpenses: Math.round(inflatedMonthlyExpenses),
    shortfall: Math.round(shortfall),
    requiredMonthlySip: Math.round(requiredMonthlySip),
    yearsToRetirement,
    retirementDurationYears,
  };
}

export function calculateSWP(
  corpus: number,
  initialMonthlyWithdrawal: number,
  annualReturn: number,
  inflationRate: number
) {
  let remainingCorpus = corpus;
  let currentWithdrawal = initialMonthlyWithdrawal;
  let totalWithdrawn = 0;
  let monthsLasted = 0;
  const monthlyRate = annualReturn / 100 / 12;
  const maxMonths = 100 * 12;

  while (remainingCorpus > currentWithdrawal && monthsLasted < maxMonths) {
    monthsLasted++;
    remainingCorpus = (remainingCorpus - currentWithdrawal) * (1 + monthlyRate);
    totalWithdrawn += currentWithdrawal;

    if (monthsLasted % 12 === 0) {
      currentWithdrawal += (currentWithdrawal * inflationRate) / 100;
    }
  }

  return {
    totalMonths: monthsLasted,
    yearsLasted: Math.floor(monthsLasted / 12),
    remainingMonths: monthsLasted % 12,
    totalWithdrawn: Math.round(totalWithdrawn),
    finalCorpus: Math.max(0, Math.round(remainingCorpus)),
  };
}

export function calculateFD(
  principal: number,
  annualRate: number,
  years: number,
  months: number = 0,
  compounding: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' = 'quarterly'
) {
  const nMap = { monthly: 12, quarterly: 4, half_yearly: 2, yearly: 1 };
  const n = nMap[compounding] || 4;
  const t = years + months / 12;
  const r = annualRate / 100;
  const maturityAmount = principal * Math.pow(1 + r / n, n * t);

  return {
    principal: Math.round(principal),
    totalInterest: Math.round(maturityAmount - principal),
    maturityAmount: Math.round(maturityAmount),
  };
}

export function calculateXIRR(cashflows: Array<{ date: string; amount: number }>): number {
  if (cashflows.length < 2) return 0;
  
  // Sort by date
  const sorted = [...cashflows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const d0 = new Date(sorted[0].date).getTime();

  // Newton-Raphson
  let rate = 0.1; // initial guess 10%
  const maxIter = 100;
  const tol = 1e-6;

  for (let iter = 0; iter < maxIter; iter++) {
    let fValue = 0;
    let fDerivative = 0;

    for (const cf of sorted) {
      const dt = (new Date(cf.date).getTime() - d0) / (365 * 24 * 3600 * 1000);
      const denom = Math.pow(1 + rate, dt);
      if (denom === 0) continue;
      fValue += cf.amount / denom;
      fDerivative -= (dt * cf.amount) / (denom * (1 + rate));
    }

    if (Math.abs(fDerivative) < 1e-12) break;
    const newRate = rate - fValue / fDerivative;
    if (Math.abs(newRate - rate) < tol) {
      return Number((newRate * 100).toFixed(2));
    }
    rate = newRate;
  }

  return Number((rate * 100).toFixed(2));
}
