'use client';

import { useState } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import { calculateRetirement } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currencies';

export default function RetirementCalculatorPage() {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [planUntil, setPlanUntil] = useState(85);
  const [expenses, setExpenses] = useState(50000);
  const [savings, setSavings] = useState(1000000);
  const [inflation, setInflation] = useState(6);
  const [preReturn, setPreReturn] = useState(12);
  const [postReturn, setPostReturn] = useState(8);

  const res = calculateRetirement(
    currentAge,
    retirementAge,
    planUntil,
    expenses,
    savings,
    inflation,
    preReturn,
    postReturn
  );

  return (
    <CalculatorLayout
      title="Retirement Calculator"
      description="Work out the corpus you need to retire comfortably after accounting for inflation, and the monthly SIP that gets you there."
      slug="Retirement"
      faqs={[
        {
          q: 'Why does inflation matter so much for retirement?',
          a: 'At 6% annual inflation, prices double every 12 years. Expenses of ₹50,000/month today become nearly ₹2.8 Lakhs/month in 30 years. Sizing your corpus without inflation leaves you severely underfunded.'
        },
        {
          q: 'What is a safe post-retirement withdrawal rate?',
          a: 'The Trinity Study suggests a 3% to 4% withdrawal rate adjusted for inflation ensures your corpus lasts 30+ years without running out.'
        }
      ]}
      educationalContent={
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground mb-2">Plan Backwards From Your Lifestyle</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Effective retirement planning starts with what you spend today, grows it with realistic inflation to retirement age, and sizes a capital base that sustains your lifestyle until age 85 or 90.
          </p>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">Your Age</label>
              <input
                type="number"
                min="18"
                max="80"
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                className="w-full text-xs bg-muted/60 border border-border rounded px-2.5 py-1.5 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">Retire At</label>
              <input
                type="number"
                min={currentAge + 1}
                max="90"
                value={retirementAge}
                onChange={(e) => setRetirementAge(Number(e.target.value))}
                className="w-full text-xs bg-muted/60 border border-border rounded px-2.5 py-1.5 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">Plan Until</label>
              <input
                type="number"
                min={retirementAge + 1}
                max="105"
                value={planUntil}
                onChange={(e) => setPlanUntil(Number(e.target.value))}
                className="w-full text-xs bg-muted/60 border border-border rounded px-2.5 py-1.5 text-foreground"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Monthly Expenses Today</span>
              <span className="font-bold text-primary">{formatCurrency(expenses, 'INR')}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="300000"
              step="5000"
              value={expenses}
              onChange={(e) => setExpenses(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Current Savings So Far</span>
              <span className="font-bold text-foreground">{formatCurrency(savings, 'INR')}</span>
            </div>
            <input
              type="range"
              min="0"
              max="50000000"
              step="100000"
              value={savings}
              onChange={(e) => setSavings(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">Inflation %</label>
              <input
                type="number"
                step="0.5"
                value={inflation}
                onChange={(e) => setInflation(Number(e.target.value))}
                className="w-full text-xs bg-muted/60 border border-border rounded px-2 py-1 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">Pre Return %</label>
              <input
                type="number"
                step="0.5"
                value={preReturn}
                onChange={(e) => setPreReturn(Number(e.target.value))}
                className="w-full text-xs bg-muted/60 border border-border rounded px-2 py-1 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">Post Return %</label>
              <input
                type="number"
                step="0.5"
                value={postReturn}
                onChange={(e) => setPostReturn(Number(e.target.value))}
                className="w-full text-xs bg-muted/60 border border-border rounded px-2 py-1 text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-muted/40 border border-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Required Corpus At Age {retirementAge}
            </span>
            <div className="text-3xl font-serif font-bold text-foreground mt-1">
              {formatCurrency(res.requiredCorpus, 'INR')}
            </div>
            <div className="text-xs text-primary font-bold mt-1">
              {formatCurrency(res.requiredCorpus, 'INR', true)}
            </div>

            <div className="space-y-3 mt-6 pt-4 border-t border-border text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly expense at age {retirementAge}:</span>
                <span className="font-semibold text-foreground">{formatCurrency(res.inflatedMonthlyExpenses, 'INR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Years until retirement:</span>
                <span className="font-semibold text-foreground">{res.yearsToRetirement} Years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Retirement duration:</span>
                <span className="font-semibold text-foreground">{res.retirementDurationYears} Years</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border bg-card p-4 rounded-xl border border-primary/20">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Monthly SIP Needed
            </span>
            <div className="text-2xl font-serif font-bold text-primary mt-1">
              {formatCurrency(res.requiredMonthlySip, 'INR')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Invest this monthly for {res.yearsToRetirement} years at {preReturn}% return to meet your retirement corpus goal.
            </p>
          </div>
        </div>
      </div>
    </CalculatorLayout>
  );
}
