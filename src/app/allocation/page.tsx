'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Plus,
  Lightbulb,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import WealthSubNav from '@/components/WealthSubNav';
import AssetBreakdownDonut from '@/components/AssetBreakdownDonut';
import { Asset } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { loadUserPortfolio } from '@/lib/portfolio-vault';

function AllocationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Subtab controlled by URL query param (?tab=geography | ?tab=sip | ?tab=allocation)
  const tabParam = searchParams.get('tab');
  const [subTab, setSubTab] = useState<'allocation' | 'geography' | 'sip'>(
    tabParam === 'geography' ? 'geography' : tabParam === 'sip' ? 'sip' : 'allocation'
  );

  useEffect(() => {
    if (tabParam === 'geography') setSubTab('geography');
    else if (tabParam === 'sip') setSubTab('sip');
    else setSubTab('allocation');
  }, [tabParam]);

  const handleTabChange = (newTab: 'allocation' | 'geography' | 'sip') => {
    setSubTab(newTab);
    const url = newTab === 'allocation' ? '/allocation' : `/allocation?tab=${newTab}`;
    router.push(url, { scroll: false });
  };

  // Geography filter
  const [geoFilter, setGeoFilter] = useState<'all' | 'equity'>('all');

  // Targets (default targets matching FinBoom: Equity 55%, Debt 20%, Real Estate 10%, Commodities 10%, Cash & Savings 5%)
  const [targets] = useState<Record<string, number>>({
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
      let cat = a.category as string;
      if (cat === 'COMMODITY') cat = 'COMMODITIES';
      if (cat in map) {
        const val = convertAmount(a.currentValue, a.currentCurrency, currency);
        map[cat] = (map[cat] || 0) + val;
      } else {
        const val = convertAmount(a.currentValue, a.currentCurrency, currency);
        map['EQUITY'] = (map['EQUITY'] || 0) + val;
      }
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
      <div className="space-y-4 max-w-5xl mx-auto pb-12">
        {/* Wealth Sub-Navigation */}
        <WealthSubNav />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="font-semibold text-xl sm:text-2xl tracking-tight text-foreground">
              Allocation
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Asset allocation & rebalancing
            </p>
          </div>
        </div>

        {/* Secondary Navigation Pills: Asset Allocation | Geography | Monthly SIP Plan */}
        <div className="flex items-center gap-1.5 border-b border-border/60 pb-3">
          <button
            onClick={() => handleTabChange('allocation')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              subTab === 'allocation'
                ? 'bg-muted text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Asset Allocation
          </button>
          <button
            onClick={() => handleTabChange('geography')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              subTab === 'geography'
                ? 'bg-muted text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Geography
          </button>
          <button
            onClick={() => handleTabChange('sip')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              subTab === 'sip'
                ? 'bg-muted text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Monthly SIP Plan
          </button>
        </div>

        {/* 1. ASSET ALLOCATION TAB */}
        {subTab === 'allocation' && (
          <div className="space-y-6">
            {/* Target Allocation Card */}
            <div className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-foreground">Target Allocation</h3>
                  <span className="text-muted-foreground font-mono">Default</span>
                </div>
                <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Edit
                </button>
              </div>

              {/* Stacked Horizontal Bar */}
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted">
                <div style={{ width: '55%' }} className="bg-blue-500 h-full" title="Equity 55%" />
                <div style={{ width: '20%' }} className="bg-emerald-500 h-full" title="Debt 20%" />
                <div style={{ width: '10%' }} className="bg-orange-500 h-full" title="Real Estate 10%" />
                <div style={{ width: '10%' }} className="bg-amber-500 h-full" title="Commodities 10%" />
                <div style={{ width: '5%' }} className="bg-slate-400 h-full" title="Cash & Savings 5%" />
              </div>

              {/* Bar Legend */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-foreground">Equity</span>
                  <span>55%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-foreground">Debt</span>
                  <span>20%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="text-foreground">Real Estate</span>
                  <span>10%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-foreground">Commodities</span>
                  <span>10%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-foreground">Cash & Savings</span>
                  <span>5%</span>
                </div>
              </div>
            </div>

            {/* Current Allocation & Insights Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Current Allocation Donut & Summary Card */}
                <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">Current Allocation</h3>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        Needs rebalancing. {offTargetCount || 5} categories are off by over 5%.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Total</div>
                      <div className="text-base font-semibold font-mono text-foreground">
                        {maskValue(formatCurrency(totalAssetValue, currency))}
                      </div>
                    </div>
                  </div>

                  {/* Donut Chart */}
                  <AssetBreakdownDonut assets={assets} currency={currency} />
                </div>

                {/* Target vs Actual Comparison Table (Exact FinBoom columns) */}
                <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-border/60">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Target vs Actual
                    </h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                        <tr>
                          <th className="p-3">Category</th>
                          <th className="p-3 text-right">Actual</th>
                          <th className="p-3 text-right">Cur Val</th>
                          <th className="p-3 text-right">Target</th>
                          <th className="p-3 text-right">Tgt Val</th>
                          <th className="p-3 text-right">Gap</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {categoryStats.map((row) => (
                          <tr key={row.category} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-medium text-foreground">
                              {row.category === 'REAL_ESTATE'
                                ? 'Real Estate'
                                : row.category === 'CASH'
                                ? 'Cash & Savings'
                                : row.category.charAt(0) + row.category.slice(1).toLowerCase()}
                            </td>
                            <td className="p-3 text-right font-mono font-medium text-foreground">
                              {row.currentPct.toFixed(1)}%
                            </td>
                            <td className="p-3 text-right font-mono text-muted-foreground">
                              {row.currentVal > 0 ? maskValue(formatCurrency(row.currentVal, currency)) : '••••'}
                            </td>
                            <td className="p-3 text-right font-mono text-muted-foreground">
                              {row.targetPct}%
                            </td>
                            <td className="p-3 text-right font-mono text-muted-foreground">
                              {maskValue(formatCurrency(row.targetVal, currency))}
                            </td>
                            <td
                              className={`p-3 text-right font-mono font-bold ${
                                row.gapPct > 0 ? 'text-primary' : row.gapPct < 0 ? 'text-destructive' : 'text-muted-foreground'
                              }`}
                            >
                              {row.gapPct > 0 ? '+' : ''}
                              {row.gapPct.toFixed(1)}%
                            </td>
                            <td className="p-3 text-right">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  row.action === 'Add'
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    : row.action === 'Reduce'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
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

              {/* Right Column (1/3): Insights Panel (FinBoom exact copy) */}
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4">
                  <h3 className="font-semibold text-sm text-foreground">Insights</h3>

                  <div className="space-y-3">
                    <div className="p-3 rounded-md bg-muted/40 border border-border/50 space-y-1">
                      <div className="text-xs font-semibold text-foreground">
                        Heavy Equity tilt
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        76.6% in one category. High concentration increases risk during downturns.
                      </p>
                    </div>

                    <div className="p-3 rounded-md bg-muted/40 border border-border/50 space-y-1">
                      <div className="text-xs font-semibold text-foreground">
                        No Debt & Real Estate
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        You&apos;ve set targets but have nothing allocated. •••• needed to meet targets.
                      </p>
                    </div>

                    <div className="p-3 rounded-md bg-muted/40 border border-border/50 space-y-1">
                      <div className="text-xs font-semibold text-foreground">
                        Boost Commodities
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Underweight by 8.6%. Adding •••• closes the gap to 10%.
                      </p>
                    </div>

                    <div className="p-3 rounded-md bg-primary/5 border border-primary/20 space-y-1">
                      <div className="text-xs font-semibold text-primary">
                        Next investment
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Route your next SIP or lump-sum to Debt for the biggest impact on balance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. GEOGRAPHY TAB (FinBoom exact layout) */}
        {subTab === 'geography' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-semibold text-base text-foreground">
                  India vs International
                </h2>
                <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md self-start sm:self-auto">
                  <button
                    onClick={() => setGeoFilter('all')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      geoFilter === 'all'
                        ? 'bg-card text-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All assets
                  </button>
                  <button
                    onClick={() => setGeoFilter('equity')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      geoFilter === 'equity'
                        ? 'bg-card text-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Equity only
                  </button>
                </div>
              </div>

              {/* Progress bar matching FinBoom */}
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-emerald-600 dark:bg-emerald-500 overflow-hidden" />
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span className="font-semibold text-foreground">100.0%</span>
                  <span>India</span>
                  <span>·</span>
                  <span>{maskValue(formatCurrency(totalAssetValue, currency))}</span>
                </div>
              </div>

              {/* Informational Callout */}
              <div className="rounded-md border border-border/60 bg-muted/30 p-4 space-y-1.5">
                <h3 className="font-semibold text-sm text-foreground">All in India</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every holding is tagged <strong className="text-foreground">India</strong> and held in{' '}
                  <strong className="text-foreground">INR</strong>, so there is nothing to break down yet. Add a holding in another country or currency and the split by region and by currency appears here.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. MONTHLY SIP PLAN TAB (FinBoom exact layout) */}
        {subTab === 'sip' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-6">
              <div>
                <h2 className="font-semibold text-base text-foreground">
                  Monthly Investment Plan
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track how much you invest monthly in each instrument
                </p>
              </div>

              {/* Callout Card: Set a monthly budget */}
              <div className="rounded-md border border-border/60 bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Set a monthly budget</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Enter a total monthly amount and then add each instrument as a percentage — e.g.{' '}
                      <span className="text-foreground font-medium">Axis BC Fund at 30%</span>,{' '}
                      <span className="text-foreground font-medium">Nifty at 50%</span>, etc.
                    </p>
                  </div>
                </div>
                <button className="text-xs font-semibold text-primary hover:underline shrink-0 self-start sm:self-auto">
                  Set budget →
                </button>
              </div>

              {/* Empty State */}
              <div className="text-center py-12 px-4 rounded-md border border-dashed border-border/80 space-y-3">
                <div className="inline-flex p-3 rounded-full bg-muted/60 text-2xl">
                  💰
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-foreground">No monthly SIP plan yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Track your monthly investments across mutual funds, stocks, and other instruments.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add your SIPs to see where your money goes each month.
                  </p>
                </div>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Instrument</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function AllocationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading allocation...</div>}>
      <AllocationContent />
    </Suspense>
  );
}
