'use client';

import { useState } from 'react';
import { Asset } from '@/lib/mock-data';
import { formatCurrency, convertAmount } from '@/lib/currencies';

interface AssetBreakdownDonutProps {
  assets: Asset[];
  currency: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  EQUITY: '#2563eb', // Blue
  DEBT: '#0d9488', // Teal
  REAL_ESTATE: '#ea580c', // Orange
  COMMODITY: '#ca8a04', // Gold
  CASH: '#475569', // Slate
  CRYPTO: '#7c3aed', // Purple
};

const CATEGORY_NAMES: Record<string, string> = {
  EQUITY: 'Stocks & Equity',
  DEBT: 'Debt & Fixed Income',
  REAL_ESTATE: 'Real Estate / Property',
  COMMODITY: 'Gold & Commodities',
  CASH: 'Cash & Savings',
  CRYPTO: 'Crypto & Digital',
};

export default function AssetBreakdownDonut({ assets, currency }: AssetBreakdownDonutProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Group by category
  const groups: Record<string, number> = {};
  let totalAssetsBase = 0;

  assets.forEach((a) => {
    const val = convertAmount(a.currentValue, a.currentCurrency, currency);
    groups[a.category] = (groups[a.category] || 0) + val;
    totalAssetsBase += val;
  });

  const categories = Object.keys(groups).map((cat) => ({
    category: cat,
    name: CATEGORY_NAMES[cat] || cat,
    amount: groups[cat],
    percentage: totalAssetsBase > 0 ? (groups[cat] / totalAssetsBase) * 100 : 0,
    color: CATEGORY_COLORS[cat] || '#78716c',
  })).sort((a, b) => b.amount - a.amount);

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-bold text-foreground">
          Asset Allocation
        </h3>
        <span className="text-xs text-muted-foreground font-medium">
          {assets.length} Assets
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut SVG */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {categories.map((c) => {
              const strokeDasharray = `${(c.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += c.percentage;

              const isHovered = hoveredCategory === c.category;

              return (
                <circle
                  key={c.category}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={c.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory(c.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Total</span>
            <span className="text-sm font-bold text-foreground">
              {formatCurrency(totalAssetsBase, currency, true)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 grid grid-cols-1 gap-2.5 w-full">
          {categories.map((c) => (
            <div
              key={c.category}
              onMouseEnter={() => setHoveredCategory(c.category)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                hoveredCategory === c.category ? 'bg-muted' : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="font-medium text-foreground">{c.name}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-foreground mr-2">
                  {formatCurrency(c.amount, currency, true)}
                </span>
                <span className="text-muted-foreground">({c.percentage.toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
