'use client';

import { useState } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import { calculateFutureCost } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currencies';

export default function FutureCostCalculatorPage() {
  const [currentCost, setCurrentCost] = useState(2500000); // e.g. Child higher education
  const [years, setYears] = useState(15);
  const [inflationRate, setInflationRate] = useState(8);
  const [returnRate, setReturnRate] = useState(12);

  const res = calculateFutureCost(currentCost, years, inflationRate, returnRate);

  return (
    <CalculatorLayout
      title="Future Cost Calculator"
      description="Estimate what a major financial goal (child's education, wedding, home down payment) will cost after inflation, and the monthly SIP to fund it."
      slug="Future Cost"
      faqs={[
        {
          q: 'Why use a higher inflation rate for education?',
          a: 'Higher education and specialized medical training have historically inflated at 10% to 12% annually in India, substantially faster than ordinary CPI inflation.'
        }
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Current Goal Cost</label>
            <input
              type="number"
              value={currentCost}
              onChange={(e) => setCurrentCost(Number(e.target.value))}
              className="w-full text-sm bg-muted/60 border border-border rounded px-3 py-2 text-foreground font-mono"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Years to Goal</span>
              <span className="font-bold text-primary font-mono">{years} Years</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Goal Specific Inflation Rate (% p.a.)</span>
              <span className="font-bold text-destructive font-mono">{inflationRate}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Expected Investment Return (% p.a.)</span>
              <span className="font-bold text-primary font-mono">{returnRate}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="0.5"
              value={returnRate}
              onChange={(e) => setReturnRate(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>
        </div>

        <div className="bg-muted/40 border border-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Future Cost of Goal in {years} Years
            </span>
            <div className="text-3xl font-serif font-bold text-foreground mt-1">
              {formatCurrency(res.futureCost, 'INR')}
            </div>

            <div className="mt-6 pt-4 border-t border-border bg-card p-4 rounded-xl border border-primary/20">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Required Monthly SIP
              </span>
              <div className="text-2xl font-serif font-bold text-primary mt-1">
                {formatCurrency(res.requiredSip, 'INR')} / month
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Total investment across {years} years: {formatCurrency(res.totalSipInvestment, 'INR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </CalculatorLayout>
  );
}
