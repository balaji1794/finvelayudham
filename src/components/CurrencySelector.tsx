'use client';

import { SUPPORTED_CURRENCIES } from '@/lib/currencies';

interface CurrencySelectorProps {
  currentCurrency: string;
  onCurrencyChange: (code: string) => void;
  className?: string;
}

export default function CurrencySelector({
  currentCurrency,
  onCurrencyChange,
  className = '',
}: CurrencySelectorProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={currentCurrency}
        onChange={(e) => onCurrencyChange(e.target.value)}
        aria-label="Select Base Currency"
        className="text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all"
      >
        {Object.values(SUPPORTED_CURRENCIES).map((c) => (
          <option key={c.code} value={c.code} className="bg-card text-foreground">
            {c.code} ({c.symbol})
          </option>
        ))}
      </select>
    </div>
  );
}
