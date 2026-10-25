'use client';

import { useState } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import { calculateEMI } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currencies';

export default function EmiCalculatorPage() {
  const [loanAmount, setLoanAmount] = useState(2500000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [takeHome, setTakeHome] = useState(80000);

  const res = calculateEMI(loanAmount, rate, years, 0, takeHome);

  const principal = res.principal || loanAmount;
  const interest = res.totalInterest;
  const total = res.totalPayment;
  const pPercent = total > 0 ? (principal / total) * 100 : 0;
  const iPercent = total > 0 ? (interest / total) * 100 : 0;

  return (
    <CalculatorLayout
      title="EMI Calculator"
      description="Work out your monthly loan instalment and see how much of your loan goes to interest versus principal over its lifecycle."
      slug="EMI"
      faqs={[
        {
          q: 'How is reducing balance EMI calculated?',
          a: 'EMI uses standard reducing balance compounding: [P * r * (1+r)^n] / [(1+r)^n - 1]. Each monthly payment pays off accrued interest for that month and chips away at principal.'
        },
        {
          q: 'What is a safe EMI to income ratio?',
          a: 'Lenders and financial advisors recommend that your total monthly EMIs should not exceed 35% to 40% of your take-home pay to maintain financial stability.'
        }
      ]}
      educationalContent={
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground mb-2">Where Your Money Actually Goes</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Early in a long-term loan (like a 20-year home loan), 70% or more of each monthly instalment goes strictly toward interest. As time passes, the balance flips. Making small prepayments early drastically cuts total interest outgo.
          </p>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Loan Amount</span>
              <span className="font-bold text-primary font-mono">{formatCurrency(loanAmount, 'INR')}</span>
            </div>
            <input
              type="range"
              min="50000"
              max="20000000"
              step="50000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Interest Rate (% p.a.)</span>
              <span className="font-bold text-primary font-mono">{rate}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="0.1"
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
              max="30"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Monthly Take-Home Pay (Affordability)</span>
              <span className="font-bold text-foreground font-mono">{formatCurrency(takeHome, 'INR')}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="500000"
              step="5000"
              value={takeHome}
              onChange={(e) => setTakeHome(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>
        </div>

        {/* Results */}
        <div className="bg-muted/40 border border-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Monthly EMI
            </span>
            <div className="text-3xl font-serif font-bold text-foreground mt-1">
              {formatCurrency(res.monthlyEmi, 'INR')}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
              <div>
                <span className="text-xs text-muted-foreground">Principal Loan</span>
                <div className="text-base font-semibold text-foreground mt-0.5">
                  {formatCurrency(principal, 'INR')}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Total Interest</span>
                <div className="text-base font-semibold text-destructive mt-0.5">
                  {formatCurrency(interest, 'INR')}
                </div>
              </div>
            </div>

            {/* Split bar */}
            <div className="mt-6">
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
                <div style={{ width: `${pPercent}%` }} className="bg-primary" title="Principal" />
                <div style={{ width: `${iPercent}%` }} className="bg-red-500" title="Interest" />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
                <span>Principal ({pPercent.toFixed(1)}%)</span>
                <span>Interest ({iPercent.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* Affordability check pill */}
          {takeHome > 0 && (
            <div className={`mt-6 p-3 rounded-lg border text-xs leading-relaxed ${
              res.emiRatio > 40
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
            }`}>
              <strong>Affordability Check:</strong> This EMI consumes{' '}
              <span className="font-bold">{res.emiRatio}%</span> of your monthly take-home income.{' '}
              {res.emiRatio > 40
                ? 'Caution: High debt ratio! Aim to keep EMIs under 35-40%.'
                : 'Safe: Within standard prudent borrowing guidelines.'}
            </div>
          )}
        </div>
      </div>
    </CalculatorLayout>
  );
}
