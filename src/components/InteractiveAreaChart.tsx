'use client';

import { useState, useRef } from 'react';
import { Snapshot } from '@/lib/mock-data';
import { formatCurrency, convertAmount } from '@/lib/currencies';

interface InteractiveAreaChartProps {
  snapshots: Snapshot[];
  currency: string;
  title?: string;
  className?: string;
}

export default function InteractiveAreaChart({
  snapshots,
  currency,
  title = 'Consolidated Net Worth Trend',
  className = '',
}: InteractiveAreaChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!snapshots || snapshots.length === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">No snapshot data available.</div>;
  }

  // Convert values to selected currency
  const data = snapshots.map((s) => ({
    ...s,
    convertedNetWorth: convertAmount(s.netWorthBase, s.baseCurrency, currency),
    convertedAssets: convertAmount(s.totalAssetsBase, s.baseCurrency, currency),
    convertedLiabilities: convertAmount(s.totalLiabilitiesBase, s.baseCurrency, currency),
  }));

  const values = data.map((d) => d.convertedNetWorth);
  const minVal = Math.min(...values) * 0.95;
  const maxVal = Math.max(...values) * 1.05;
  const range = maxVal - minVal || 1;

  const width = 800;
  const height = 260;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = data.length <= 1 ? width / 2 : paddingX + (i / (data.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - ((d.convertedNetWorth - minVal) / range) * chartHeight;
    return { x: isNaN(x) ? width / 2 : x, y: isNaN(y) ? height / 2 : y, ...d };
  });

  const linePath =
    data.length === 1
      ? `M ${paddingX} ${points[0].y.toFixed(1)} L ${width - paddingX} ${points[0].y.toFixed(1)}`
      : points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const areaPath =
    data.length === 1
      ? `M ${paddingX} ${points[0].y.toFixed(1)} L ${width - paddingX} ${points[0].y.toFixed(1)} L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`
      : `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - paddingY} L ${points[0].x.toFixed(1)} ${height - paddingY} Z`;

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <div className={`relative w-full bg-card rounded-xl border border-border p-5 shadow-sm ${className}`} ref={containerRef}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {title}
          </span>
          <div className="text-2xl font-serif font-bold text-foreground">
            {formatCurrency(activePoint.convertedNetWorth, currency)}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(activePoint.takenAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          {activePoint.label ? ` · ${activePoint.label}` : ''}
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="var(--border)"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartHeight / 2}
            x2={width - paddingX}
            y2={paddingY + chartHeight / 2}
            stroke="var(--border)"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="var(--border)"
            opacity="0.8"
          />

          {/* Area under curve */}
          <path d={areaPath} fill="url(#netWorthGrad)" />

          {/* Stroke path */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data nodes & interactive zones */}
          {points.map((p, i) => (
            <g key={p.id}>
              {/* Invisible wide hit area for hover */}
              <circle
                cx={p.x}
                cy={p.y}
                r="18"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onClick={() => setHoveredIndex(i)}
              />
              {/* Small point marker */}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? '6' : '3.5'}
                fill="var(--card)"
                stroke="var(--primary)"
                strokeWidth={hoveredIndex === i ? '3' : '2'}
                className="transition-all"
              />
            </g>
          ))}

          {/* Active indicator line */}
          {hoveredIndex !== null && (
            <line
              x1={activePoint.x}
              y1={paddingY}
              x2={activePoint.x}
              y2={height - paddingY}
              stroke="var(--primary)"
              strokeDasharray="2 2"
              strokeWidth="1.5"
            />
          )}
        </svg>

        {/* Floating breakdown pill */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-2 border-t border-border/60">
          <div>
            Assets: <span className="font-semibold text-foreground">{formatCurrency(activePoint.convertedAssets, currency, true)}</span>
          </div>
          <div>
            Liabilities: <span className="font-semibold text-destructive">{formatCurrency(activePoint.convertedLiabilities, currency, true)}</span>
          </div>
          <div>
            Net: <span className="font-semibold text-primary">{formatCurrency(activePoint.convertedNetWorth, currency, true)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
