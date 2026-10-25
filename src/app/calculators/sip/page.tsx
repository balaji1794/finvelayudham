'use client';

import { useState } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import { calculateSIP } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currencies';

export default function SipCalculatorPage() {
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);
  const [stepUp, setStepUp] = useState(0);

  const res = calculateSIP(monthly, rate, years, 0, stepUp);

  const total = res.totalValue;
  const invested = res.investedAmount;
  const returns = res.estimatedReturns;
  const invPercent = total > 0 ? (invested / total) * 100 : 0;
  const retPercent = total > 0 ? (returns / total) * 100 : 0;

  return (
    <CalculatorLayout
      title="SIP Calculator"
      description="Project the future value of your monthly SIP, with an optional annual step-up. See how much comes from your own money versus market compounding."
      slug="SIP"
      faqs={[
        {
          q: 'What is a Mutual Fund SIP?',
          a: 'A Systematic Investment Plan (SIP) allows you to invest a fixed amount regularly into mutual funds. It enforces discipline, averages market fluctuations (Rupee Cost Averaging), and compounds wealth over long horizons.'
        },
        {
          q: 'How does an annual Step-up work?',
          a: 'A Step-up SIP increases your monthly contribution annually (e.g. by 10% each year in tandem with salary appraisals). Stepping up by even 10% can almost double your final wealth accumulation.'
        }
      ]}
      educationalContent={
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground mb-2">The Power of Compounding & Step-Up</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            By investing consistently every month, you purchase more mutual fund units when markets drop and fewer when they peak. Over a decade or more, compounding takes over and estimated gains quickly overtake your total invested capital.
          </p>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Monthly Investment</span>
              <span className="font-bold text-primary font-mono">{formatCurrency(monthly, 'INR')}</span>
            </div>
            <input
              type="range"
              min="500"
              max="200000"
              step="500"
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(Math.max(100, Number(e.target.value)))}
              className="mt-1 text-xs w-full bg-muted/60 border border-border rounded px-2.5 py-1 text-foreground"
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
              <span>Time Horizon (Years)</span>
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

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Annual Step-up (% optional)</span>
              <span className="font-bold text-primary font-mono">{stepUp}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={stepUp}
              onChange={(e) => setStepUp(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>
        </div>

        {/* Results */}
        <div className="bg-muted/40 border border-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Projected Maturity Value
            </span>
            <div className="text-3xl font-serif font-bold text-foreground mt-1">
              {formatCurrency(total, 'INR')}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
              <div>
                <span className="text-xs text-muted-foreground">Invested Amount</span>
                <div className="text-base font-semibold text-foreground mt-0.5">
                  {formatCurrency(invested, 'INR')}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Est. Returns</span>
                <div className="text-base font-semibold text-primary mt-0.5">
                  {formatCurrency(returns, 'INR')}
                </div>
              </div>
            </div>

            {/* Split bar */}
            <div className="mt-6">
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
                <div style={{ width: `${invPercent}%` }} className="bg-slate-400" title="Invested" />
                <div style={{ width: `${retPercent}%` }} className="bg-primary" title="Returns" />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
                <span>Invested ({invPercent.toFixed(1)}%)</span>
                <span>Gains ({retPercent.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* Wait analysis */}
          {res.waitAnalysis && years > 3 && (
            <div className="mt-6 pt-4 border-t border-border/80 text-xs text-muted-foreground leading-relaxed bg-card p-3 rounded-lg">
              <strong className="text-foreground">What if you wait?</strong> Starting {res.waitAnalysis.waitYears} years later reduces your ending wealth to{' '}
              <span className="font-semibold text-foreground">{formatCurrency(res.waitAnalysis.reducedValue, 'INR')}</span>. Waiting costs{' '}
              <span className="font-semibold text-destructive">{formatCurrency(res.waitAnalysis.waitCost, 'INR')}</span>. To catch up, you would need to invest{' '}
              <span className="font-semibold text-foreground">{formatCurrency(res.waitAnalysis.catchUpMonthly, 'INR')}</span> every month instead of{' '}
              {formatCurrency(monthly, 'INR')}.
            </div>
          )}
        </div>
      </div>
    </CalculatorLayout>
  );
}
