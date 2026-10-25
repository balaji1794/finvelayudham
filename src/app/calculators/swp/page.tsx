'use client';

import { useState } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import { calculateSWP } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currencies';

export default function SwpCalculatorPage() {
  const [corpus, setCorpus] = useState(15000000); // 1.5 Cr
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState(60000);
  const [returnRate, setReturnRate] = useState(9);
  const [inflationRate, setInflationRate] = useState(6);

  const res = calculateSWP(corpus, monthlyWithdrawal, returnRate, inflationRate);

  return (
    <CalculatorLayout
      title="SWP with Inflation Calculator"
      description="Estimate how many years and months your retirement corpus will last with inflation-adjusted monthly payouts."
      slug="SWP"
      faqs={[
        {
          q: 'What is a Systematic Withdrawal Plan (SWP)?',
          a: 'An SWP lets you redeem a predetermined amount from your mutual fund investments on a scheduled monthly basis, generating predictable monthly income for retirement.'
        }
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Total Corpus</label>
            <input
              type="number"
              value={corpus}
              onChange={(e) => setCorpus(Number(e.target.value))}
              className="w-full text-sm bg-muted/60 border border-border rounded px-3 py-2 text-foreground font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Initial Monthly Withdrawal</label>
            <input
              type="number"
              value={monthlyWithdrawal}
              onChange={(e) => setMonthlyWithdrawal(Number(e.target.value))}
              className="w-full text-sm bg-muted/60 border border-border rounded px-3 py-2 text-foreground font-mono"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Expected Annual Portfolio Return (% p.a.)</span>
              <span className="font-bold text-primary font-mono">{returnRate}%</span>
            </div>
            <input
              type="range"
              min="4"
              max="16"
              step="0.5"
              value={returnRate}
              onChange={(e) => setReturnRate(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Annual Withdrawal Inflation (% increase each year)</span>
              <span className="font-bold text-destructive font-mono">{inflationRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>
        </div>

        <div className="bg-muted/40 border border-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Corpus Runway Duration
            </span>
            <div className="text-3xl font-serif font-bold text-primary mt-1">
              {res.yearsLasted >= 100 ? 'Perpetual (100+ Years)' : `${res.yearsLasted} Years, ${res.remainingMonths} Months`}
            </div>

            <div className="space-y-3 mt-6 pt-4 border-t border-border text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Initial Corpus:</span>
                <span className="font-semibold text-foreground">{formatCurrency(corpus, 'INR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Payouts Withdrawn:</span>
                <span className="font-semibold text-foreground">{formatCurrency(res.totalWithdrawn, 'INR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CalculatorLayout>
  );
}
