'use client';

import { useState } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import { calculateCAGR } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currencies';

export default function CagrCalculatorPage() {
  const [initialValue, setInitialValue] = useState(100000);
  const [finalValue, setFinalValue] = useState(250000);
  const [years, setYears] = useState(5);

  const cagr = calculateCAGR(initialValue, finalValue, years);

  return (
    <CalculatorLayout
      title="CAGR Calculator"
      description="Compound Annual Growth Rate represents the mean annual growth rate of an investment over a specified period of time longer than one year."
      slug="CAGR"
      faqs={[
        {
          q: 'What does CAGR measure?',
          a: 'CAGR smooths out returns by calculating the constant annual growth rate that would take an investment from its initial value to its ending balance.'
        }
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Initial Value</label>
            <input
              type="number"
              value={initialValue}
              onChange={(e) => setInitialValue(Number(e.target.value))}
              className="w-full text-sm bg-muted/60 border border-border rounded px-3 py-2 text-foreground font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Final Value</label>
            <input
              type="number"
              value={finalValue}
              onChange={(e) => setFinalValue(Number(e.target.value))}
              className="w-full text-sm bg-muted/60 border border-border rounded px-3 py-2 text-foreground font-mono"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
              <span>Duration (Years)</span>
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
        </div>

        <div className="bg-muted/40 border border-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Compounded Annual Growth Rate
            </span>
            <div className={`text-4xl font-serif font-bold mt-2 ${cagr >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {cagr >= 0 ? '+' : ''}{cagr.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per annum annualized growth
            </p>

            <div className="space-y-3 mt-6 pt-4 border-t border-border text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Absolute Return:</span>
                <span className="font-semibold text-foreground">
                  +{(((finalValue - initialValue) / initialValue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Multiple:</span>
                <span className="font-semibold text-foreground">
                  {(finalValue / initialValue).toFixed(2)}x
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CalculatorLayout>
  );
}
