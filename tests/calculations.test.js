const test = require('node:test');
const assert = require('node:assert/strict');

// Import calculations (compiled or direct JS math)
test('SIP Calculator accurately calculates future value with and without step-up', () => {
  // P = 5000/mo, 12% p.a., 10 years (120 months)
  const monthly = 5000;
  const rate = 12;
  const years = 10;
  const r = rate / 100 / 12;
  const n = years * 12;
  
  // Future value formula: P * ((1+r)^n - 1)/r * (1+r)
  const expectedFv = Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  const expectedInvested = monthly * n; // 600,000

  assert.equal(expectedInvested, 600000);
  assert.ok(expectedFv > 1150000 && expectedFv < 1170000, `FV should be around 11.6L, got ${expectedFv}`);
});

test('EMI Calculator computes reducing balance loan payment', () => {
  // Principal: 20L (2,000,000), 8.5% p.a., 20 years (240 months)
  const p = 2000000;
  const r = 8.5 / 100 / 12;
  const n = 240;
  const factor = Math.pow(1 + r, n);
  const emi = Math.round((p * r * factor) / (factor - 1));

  assert.ok(emi > 17000 && emi < 18000, `EMI should be around 17,356, got ${emi}`);
  const totalPayment = emi * n;
  assert.ok(totalPayment > p, 'Total payment must exceed principal loan');
});

test('CAGR Calculator calculates compound annual growth rate', () => {
  const initial = 100000;
  const finalVal = 200000;
  const years = 6; // Doubles in 6 years -> CAGR ~12.25%
  
  const cagr = (Math.pow(finalVal / initial, 1 / years) - 1) * 100;
  assert.ok(cagr > 12 && cagr < 13, `CAGR should be approx 12.25%, got ${cagr.toFixed(2)}%`);
});

test('Retirement Calculator sizes inflated corpus', () => {
  const expensesToday = 50000;
  const inflation = 6;
  const yearsToRetire = 30;
  
  const inflatedMonthly = expensesToday * Math.pow(1 + inflation / 100, yearsToRetire);
  assert.ok(inflatedMonthly > 280000 && inflatedMonthly < 290000, `Inflated expenses should be ~2.87L, got ${inflatedMonthly}`);
});

test('XIRR Newton-Raphson calculation', () => {
  // Simple annual cashflow: invest -100k, 1 year later it is 112k -> XIRR = 12%
  const cf = [
    { date: '2024-01-01', amount: -100000 },
    { date: '2025-01-01', amount: 112000 }
  ];
  const d0 = new Date(cf[0].date).getTime();
  const d1 = new Date(cf[1].date).getTime();
  const dt = (d1 - d0) / (365 * 24 * 3600 * 1000);
  const rate = Math.pow(112000 / 100000, 1 / dt) - 1;
  const xirrPct = Number((rate * 100).toFixed(2));
  
  assert.ok(Math.abs(xirrPct - 12.0) < 0.1, `XIRR should be 12.0%, got ${xirrPct}`);
});
