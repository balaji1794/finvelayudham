'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  PieChart,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Coins,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import WealthSubNav from '@/components/WealthSubNav';
import AssetBreakdownDonut from '@/components/AssetBreakdownDonut';
import { Asset } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { loadUserPortfolio } from '@/lib/portfolio-vault';

export default function AllocationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [subTab, setSubTab] = useState<'allocation' | 'geography' | 'sip'>('allocation');

  // Targets (default targets: Equity 55%, Debt 20%, Real Estate 10%, Commodities 10%, Cash 5%)
  const [targets, setTargets] = useState<Record<string, number>>({
    EQUITY: 55,
    DEBT: 20,
    REAL_ESTATE: 10,
    COMMODITIES: 10,
    CASH: 5,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/allocation');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function initVault() {
      if (!user) return;
      setLoading(true);
      try {
        const portfolio = await loadUserPortfolio(user.id, user.email);
        setAssets(portfolio.assets || []);
        setCurrency(portfolio.currency || 'INR');
      } catch (err) {
        console.error('Failed to load user allocation:', err);
      } finally {
        setLoading(false);
      }
    }
    initVault();
  }, [user]);

  const totalAssetValue = useMemo(() => {
    return assets.reduce(
      (sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency),
      0
    );
  }, [assets, currency]);

  // Compute category totals and percentages
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {
      EQUITY: 0,
      DEBT: 0,
      REAL_ESTATE: 0,
      COMMODITIES: 0,
      CASH: 0,
    };

    assets.forEach((a) => {
      const cat = a.category in map ? a.category : 'EQUITY';
      const val = convertAmount(a.currentValue, a.currentCurrency, currency);
      map[cat] = (map[cat] || 0) + val;
    });

    return Object.entries(targets).map(([cat, targetPct]) => {
      const currentVal = map[cat] || 0;
      const currentPct = totalAssetValue > 0 ? (currentVal / totalAssetValue) * 100 : 0;
      const targetVal = (targetPct / 100) * totalAssetValue;
      const gapPct = currentPct - targetPct;
      let action: 'Hold' | 'Add' | 'Reduce' = 'Hold';
      if (gapPct > 3) action = 'Reduce';
      else if (gapPct < -3) action = 'Add';

      return {
        category: cat,
        currentPct,
        currentVal,
        targetPct,
        targetVal,
        gapPct,
        action,
      };
    });
  }, [assets, targets, totalAssetValue, currency]);

  const offTargetCount = categoryStats.filter((c) => Math.abs(c.gapPct) >= 5).length;

  return (
    <AppLayout
      currency={currency}
      onCurrencyChange={setCurrency}
      title="Asset Allocation"
    >
      <div className="space-y-6">
        {/* Wealth Sub-Navigation */}
        <WealthSubNav />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Allocation</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Asset allocation & rebalancing strategy across portfolio classes.
            </p>
          </div>
        </div>

        {/* Secondary Navigation Pills: Asset Allocation | Geography | Monthly SIP Plan */}
        <div className="flex items-center gap-1.5 border-b border-border/80 pb-2">
          <button
            onClick={() => setSubTab('allocation')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              subTab === 'allocation'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Asset Allocation
          </button>
          <button
            onClick={() => setSubTab('geography')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              subTab === 'geography'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Geography
          </button>
          <button
            onClick={() => setSubTab('sip')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              subTab === 'sip'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Monthly SIP Plan
          </button>
        </div>

        {subTab === 'allocation' && (
          <div className="space-y-6">
            {/* Target Allocation Bar matching Image 5 */}
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span>Target Allocation</span>
                <span className="text-primary font-semibold lowercase text-[11px] cursor-pointer hover:underline">
                  Default Balanced Model
                </span>
              </div>

              {/* Stacked Horizontal Bar */}
              <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-muted">
                <div style={{ width: '55%' }} className="bg-blue-500 h-full" title="Equity 55%" />
                <div style={{ width: '20%' }} className="bg-emerald-500 h-full" title="Debt 20%" />
                <div style={{ width: '10%' }} className="bg-amber-500 h-full" title="Commodities 10%" />
                <div style={{ width: '10%' }} className="bg-orange-500 h-full" title="Real Estate 10%" />
                <div style={{ width: '5%' }} className="bg-slate-500 h-full" title="Cash 5%" />
              </div>

              {/* Bar Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Equity 55%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Debt 20%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Commodities 10%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span>Real Estate 10%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span>Cash 5%</span>
                </div>
              </div>
            </div>

            {/* Main Split: Left (2/3) Table & Chart, Right (1/3) Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Current Allocation Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Current Allocation
                  </h2>

                  {/* Rebalancing Alert Banner */}
                  {offTargetCount > 0 && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Needs rebalancing:</strong> {offTargetCount} categories are off by over 5% from target weights.
                      </div>
                    </div>
                  )}

                  {/* Donut Chart */}
                  <AssetBreakdownDonut assets={assets} currency={currency} />
                </div>

                {/* Target vs Actual Comparison Table */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Target vs Actual Allocation
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 border-b border-border uppercase tracking-wider text-muted-foreground font-semibold">
                        <tr>
                          <th className="p-3 sm:p-4">Category</th>
                          <th className="p-3 sm:p-4 text-right">Current %</th>
                          <th className="p-3 sm:p-4 text-right">Current Value</th>
                          <th className="p-3 sm:p-4 text-right">Target %</th>
                          <th className="p-3 sm:p-4 text-right">Target Value</th>
                          <th className="p-3 sm:p-4 text-right">Gap %</th>
                          <th className="p-3 sm:p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {categoryStats.map((row) => (
                          <tr key={row.category} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3 sm:p-4 font-bold text-foreground capitalize">
                              {row.category.toLowerCase().replace(/_/g, ' ')}
                            </td>
                            <td className="p-3 sm:p-4 text-right font-mono font-medium text-foreground">
                              {row.currentPct.toFixed(1)}%
                            </td>
                            <td className="p-3 sm:p-4 text-right font-mono text-muted-foreground">
                              {maskValue(formatCurrency(row.currentVal, currency))}
                            </td>
                            <td className="p-3 sm:p-4 text-right font-mono text-muted-foreground">
                              {row.targetPct}%
                            </td>
                            <td className="p-3 sm:p-4 text-right font-mono text-muted-foreground">
                              {maskValue(formatCurrency(row.targetVal, currency))}
                            </td>
                            <td
                              className={`p-3 sm:p-4 text-right font-mono font-bold ${
                                row.gapPct > 0 ? 'text-primary' : row.gapPct < 0 ? 'text-destructive' : 'text-muted-foreground'
                              }`}
                            >
                              {row.gapPct > 0 ? '+' : ''}
                              {row.gapPct.toFixed(1)}%
                            </td>
                            <td className="p-3 sm:p-4 text-right">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  row.action === 'Add'
                                    ? 'bg-blue-500/10 text-blue-500'
                                    : row.action === 'Reduce'
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {row.action}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column (1/3): Insights Panel matching Image 5 */}
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Portfolio Insights
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Heavy Equity Tilt</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Holding over 65% in a single asset class increases volatility during market drawdowns.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Boost Fixed Income & Debt</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Consider allocating toward EPF, PPF, or liquid debt funds to buffer your growth portfolio.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Commodities & Gold</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Gold ETFs and sovereign gold bonds provide sovereign inflation hedge and currency depreciation protection.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span>Next Investment Routing</span>
                      </div>
                      <p className="text-[11px] text-foreground/80 leading-relaxed">
                        Route your next monthly SIP or fresh deposit into underweight categories for maximum balancing efficiency.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {subTab === 'geography' && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Geographic Exposure
            </h2>
            <p className="text-xs text-muted-foreground">
              Evaluate your domestic vs international risk exposure.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">Domestic (India)</span>
                  <span className="text-xs font-bold text-primary">85%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nifty 50, Indian mutual funds, EPF, and fixed deposits.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">International (Global)</span>
                  <span className="text-xs font-bold text-blue-500">15%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  US Tech FoF, Nasdaq 100, and emerging global market allocations.
                </p>
              </div>
            </div>
          </div>
        )}

        {subTab === 'sip' && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Monthly SIP Rebalancing Plan
            </h2>
            <p className="text-xs text-muted-foreground">
              Automatically distribute monthly contributions to restore balance without selling existing assets and triggering capital gains tax.
            </p>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground">
              By channeling new SIPs into underweight debt and commodity assets, your portfolio naturally rebalances toward your target weights over 3-6 months with zero tax drag.
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
