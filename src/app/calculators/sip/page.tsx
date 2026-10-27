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
  const [waitYears, setWaitYears] = useState(5);

  const res = calculateSIP(monthly, rate, years, 0, stepUp);

  const total = res.totalValue;
  const invested = res.investedAmount;
  const returns = res.estimatedReturns;
  const invPercent = total > 0 ? (invested / total) * 100 : 0;
  const retPercent = total > 0 ? (returns / total) * 100 : 0;

  // Real-time "What if you wait?" calculations
  const effectiveWait = Math.max(1, Math.min(years - 1, waitYears));
  const remainingYears = Math.max(1, years - effectiveWait);
  const lateRes = calculateSIP(monthly, rate, remainingYears, 0, stepUp);
  const waitCost = Math.max(0, total - lateRes.totalValue);

  // Catch up monthly requirement
  const remainingMonths = remainingYears * 12;
  const monthlyRate = rate / 100 / 12;
  const factor = ((Math.pow(1 + monthlyRate, remainingMonths) - 1) / monthlyRate) * (1 + monthlyRate);
  const catchUpMonthly = factor > 0 ? Math.round(total / factor) : monthly;

  // Late start with 10% annual step-up
  const lateWithStepUp = calculateSIP(monthly, rate, remainingYears, 0, 10);

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

          {/* What if you wait? Interactive delay cost widget */}
          {years > 1 && (
            <div className="mt-6 pt-4 border-t border-border/80 bg-card/80 border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-serif font-bold text-foreground">
                  What if you wait?
                </span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">Start later by</span>
                  <div className="flex items-center bg-muted/80 border border-border rounded px-2 py-0.5 font-mono">
                    <input
                      type="number"
                      min="1"
                      max={Math.max(1, years - 1)}
                      value={waitYears}
                      onChange={(e) => setWaitYears(Math.max(1, Math.min(years - 1, Number(e.target.value) || 1)))}
                      className="w-8 bg-transparent text-xs font-bold text-foreground text-center focus:outline-none"
                    />
                    <span className="text-[11px] text-muted-foreground ml-0.5">yrs</span>
                  </div>
                </div>
              </div>

              <div>
                <input
                  type="range"
                  min="1"
                  max={Math.max(1, years - 1)}
                  step="1"
                  value={effectiveWait}
                  onChange={(e) => setWaitYears(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1.5"
                />
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                <p>
                  Start <strong className="text-foreground">{effectiveWait} years later</strong> and stop on the same date, and you end with{' '}
                  <strong className="text-foreground font-mono">{formatCurrency(lateRes.totalValue, 'INR')}</strong>. Waiting costs{' '}
                  <strong className="text-destructive font-mono">{formatCurrency(waitCost, 'INR')}</strong>.
                </p>
                <p>
                  To catch up, the late start needs <strong className="text-primary font-mono">{formatCurrency(catchUpMonthly, 'INR')}</strong> a month instead of {formatCurrency(monthly, 'INR')}.
                </p>
                <p>
                  A 10% yearly step-up would lift the late start to <strong className="text-foreground font-mono">{formatCurrency(lateWithStepUp.totalValue, 'INR')}</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </CalculatorLayout>
  );
}
