'use client';

import { useState } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import CalculatorLayout from '@/components/CalculatorLayout';
import { calculateXIRR } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currencies';

export default function XirrCalculatorPage() {
  const [cashflows, setCashflows] = useState([
    { id: '1', date: '2024-01-15', amount: -25000 },
    { id: '2', date: '2024-06-15', amount: -35000 },
    { id: '3', date: '2024-11-20', amount: -50000 },
    { id: '4', date: '2025-05-10', amount: -40000 },
    { id: '5', date: '2026-10-25', amount: 195000 }, // Current portfolio value
  ]);

  const xirr = calculateXIRR(cashflows);

  const addCashflow = () => {
    setCashflows([
      ...cashflows.slice(0, -1),
      {
        id: String(Date.now()),
        date: new Date().toISOString().slice(0, 10),
        amount: -25000,
      },
      cashflows[cashflows.length - 1],
    ]);
  };

  const updateCashflow = (id: string, field: 'date' | 'amount', value: any) => {
    setCashflows(
      cashflows.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeCashflow = (id: string) => {
    if (cashflows.length <= 2) return;
    setCashflows(cashflows.filter((c) => c.id !== id));
  };

  const totalInvested = cashflows
    .filter((c) => c.amount < 0)
    .reduce((sum, c) => sum + Math.abs(c.amount), 0);
  const currentValue = cashflows[cashflows.length - 1]?.amount || 0;

  return (
    <CalculatorLayout
      title="XIRR Calculator"
      description="Calculate the exact Extended Internal Rate of Return (annualized return) on SIPs, lump sums, and irregular investments."
      slug="XIRR"
      faqs={[
        {
          q: 'What is XIRR and why use it instead of CAGR?',
          a: 'CAGR only works for a single initial investment and a single final value. If you invested at multiple dates via SIP or lump sums, XIRR is the only accurate way to measure your annualized percentage return.'
        },
        {
          q: 'Why are cash outflows negative and the final value positive?',
          a: 'In financial mathematics, money invested leaves your pocket (negative cashflow), and money redeemed or the current portfolio value is positive.'
        }
      ]}
      educationalContent={
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground mb-2">How XIRR Works</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            FinVelayudham solves for the discount rate that makes the Net Present Value (NPV) of all past cash inflows and current valuation equal to zero using the Newton-Raphson numerical solver.
          </p>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Cashflow Entries
            </span>
            <button
              onClick={addCashflow}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Instalment
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {cashflows.map((cf, index) => {
              const isFinal = index === cashflows.length - 1;
              return (
                <div
                  key={cf.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs ${
                    isFinal ? 'bg-primary/5 border-primary/30' : 'bg-muted/40 border-border'
                  }`}
                >
                  <div className="w-16 font-semibold text-muted-foreground">
                    {isFinal ? 'Current Value' : `SIP #${index + 1}`}
                  </div>
                  <input
                    type="date"
                    value={cf.date}
                    onChange={(e) => updateCashflow(cf.id, 'date', e.target.value)}
                    className="bg-card border border-border rounded px-2 py-1 text-foreground"
                  />
                  <div className="flex-1 flex items-center gap-1">
                    <span className="font-mono text-muted-foreground">{isFinal ? '+' : '-'}₹</span>
                    <input
                      type="number"
                      value={Math.abs(cf.amount)}
                      onChange={(e) =>
                        updateCashflow(
                          cf.id,
                          'amount',
                          isFinal ? Math.abs(Number(e.target.value)) : -Math.abs(Number(e.target.value))
                        )
                      }
                      className="w-full bg-card border border-border rounded px-2 py-1 font-mono text-foreground font-semibold"
                    />
                  </div>
                  {!isFinal && cashflows.length > 2 && (
                    <button
                      onClick={() => removeCashflow(cf.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Results summary */}
        <div className="bg-muted/40 border border-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Calculated XIRR
            </span>
            <div className={`text-4xl font-serif font-bold mt-2 ${xirr >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {xirr >= 0 ? '+' : ''}{xirr}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Annualized return on invested capital
            </p>

            <div className="space-y-3 mt-6 pt-4 border-t border-border text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Invested:</span>
                <span className="font-semibold text-foreground">{formatCurrency(totalInvested, 'INR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Value:</span>
                <span className="font-semibold text-foreground">{formatCurrency(currentValue, 'INR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Absolute Profit:</span>
                <span className="font-semibold text-primary">
                  +{formatCurrency(currentValue - totalInvested, 'INR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CalculatorLayout>
  );
}
