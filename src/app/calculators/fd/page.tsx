'use client';

import { useState } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import { calculateFD } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currencies';

export default function FdCalculatorPage() {
  const [principal, setPrincipal] = useState(500000);
  const [rate, setRate] = useState(7.25);
  const [years, setYears] = useState(3);
  const [compounding, setCompounding] = useState<'quarterly' | 'monthly' | 'half_yearly' | 'yearly'>('quarterly');

  const res = calculateFD(principal, rate, years, 0, compounding);

  return (
    <CalculatorLayout
      title="FD Calculator"
      description="Calculate the maturity value and earned interest on a fixed deposit across different compounding frequencies."
      slug="Fixed Deposit"
      faqs={[
        {
          q: 'Why do Indian banks compound quarterly on FDs?',
          a: 'By convention established by RBI, most Indian commercial banks compute term deposit interest on a quarterly compounding cycle, which yields slightly more than simple interest.'
        }
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Deposit Principal</label>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full text-sm bg-muted/60 border border-border rounded px-3 py-2 text-foreground font-mono"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Annual Interest Rate (% p.a.)</span>
              <span className="font-bold text-primary font-mono">{rate}%</span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Tenure (Years)</span>
              <span className="font-bold text-primary font-mono">{years} Years</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Compounding Frequency</label>
            <select
              value={compounding}
              onChange={(e) => setCompounding(e.target.value as any)}
              className="w-full text-xs bg-muted/60 border border-border rounded px-3 py-2 text-foreground"
            >
              <option value="quarterly">Quarterly (Standard Bank FD)</option>
              <option value="monthly">Monthly</option>
              <option value="half_yearly">Half-Yearly</option>
              <option value="yearly">Annually</option>
            </select>
          </div>
        </div>

        <div className="bg-muted/40 border border-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Maturity Value
            </span>
            <div className="text-3xl font-serif font-bold text-foreground mt-1">
              {formatCurrency(res.maturityAmount, 'INR')}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
              <div>
                <span className="text-xs text-muted-foreground">Principal Deposited</span>
                <div className="text-base font-semibold text-foreground mt-0.5">
                  {formatCurrency(res.principal, 'INR')}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Total Interest Earned</span>
                <div className="text-base font-semibold text-primary mt-0.5">
                  +{formatCurrency(res.totalInterest, 'INR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CalculatorLayout>
  );
}
