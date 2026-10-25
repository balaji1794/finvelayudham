'use client';

import { useState } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import { calculateInflation } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currencies';

export default function InflationCalculatorPage() {
  const [amount, setAmount] = useState(100000);
  const [rate, setRate] = useState(6);
  const [years, setYears] = useState(10);

  const res = calculateInflation(amount, rate, years);

  return (
    <CalculatorLayout
      title="Inflation Calculator"
      description="See how fast the prices you pay rise each year, and how inflation erodes purchasing power over time."
      slug="Inflation"
      faqs={[
        {
          q: 'What is headline vs lifestyle inflation?',
          a: 'Headline inflation measures official CPI basket changes (food, fuel). Lifestyle inflation measures urban expenses like healthcare, private education, and leisure, which frequently inflate at 8% to 10% in India.'
        }
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Current Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full text-sm bg-muted/60 border border-border rounded px-3 py-2 text-foreground font-mono"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Annual Inflation Rate</span>
              <span className="font-bold text-destructive font-mono">{rate}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Number of Years</span>
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
              Future Cost to Buy Same Goods
            </span>
            <div className="text-3xl font-serif font-bold text-destructive mt-1">
              {formatCurrency(res.futureCost, 'INR')}
            </div>

            <div className="space-y-3 mt-6 pt-4 border-t border-border text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original purchasing power:</span>
                <span className="font-semibold text-foreground">{formatCurrency(res.currentAmount, 'INR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Future real value of cash kept idle:</span>
                <span className="font-semibold text-muted-foreground">{formatCurrency(res.purchasingPower, 'INR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loss in purchasing power:</span>
                <span className="font-semibold text-destructive">-{formatCurrency(res.lossInPurchasingPower, 'INR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CalculatorLayout>
  );
}
