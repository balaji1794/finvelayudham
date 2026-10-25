'use client';

import { useState } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import { calculateLumpsum } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currencies';

export default function LumpsumCalculatorPage() {
  const [investment, setInvestment] = useState(100000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const res = calculateLumpsum(investment, rate, years);

  return (
    <CalculatorLayout
      title="Lumpsum Calculator"
      description="Calculate the wealth growth of a one-time one-off investment compounded over your chosen horizon."
      slug="Lumpsum"
      faqs={[
        {
          q: 'What is the Rule of 72 in lumpsum investing?',
          a: 'Divide 72 by your expected annual return to estimate how many years it will take your investment to double. At 12% annual return, your money doubles every 6 years.'
        }
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>One-Time Investment</span>
              <span className="font-bold text-primary font-mono">{formatCurrency(investment, 'INR')}</span>
            </div>
            <input
              type="range"
              min="5000"
              max="5000000"
              step="5000"
              value={investment}
              onChange={(e) => setInvestment(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Expected Annual Return (% p.a.)</span>
              <span className="font-bold text-primary font-mono">{rate}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Time Period (Years)</span>
              <span className="font-bold text-primary font-mono">{years} Years</span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>
        </div>

        <div className="bg-muted/40 border border-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Future Maturity Value
            </span>
            <div className="text-3xl font-serif font-bold text-foreground mt-1">
              {formatCurrency(res.totalValue, 'INR')}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
              <div>
                <span className="text-xs text-muted-foreground">Invested Amount</span>
                <div className="text-base font-semibold text-foreground mt-0.5">
                  {formatCurrency(res.investedAmount, 'INR')}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Est. Capital Growth</span>
                <div className="text-base font-semibold text-primary mt-0.5">
                  +{formatCurrency(res.estimatedReturns, 'INR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CalculatorLayout>
  );
}
