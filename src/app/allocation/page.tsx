'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PieChart,
  ShieldCheck,
  TrendingUp,
  Sliders,
  RefreshCw,
  ArrowRight,
  Globe,
  Coins,
  Building,
  Landmark,
  Wallet,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AssetBreakdownDonut from '@/components/AssetBreakdownDonut';
import { Asset } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { loadUserPortfolio } from '@/lib/portfolio-vault';

export default function AllocationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Target Allocation percentages
  const [targetEquity, setTargetEquity] = useState(60);
  const [targetDebt, setTargetDebt] = useState(25);
  const [targetGold, setTargetGold] = useState(10);
  const [targetCash, setTargetCash] = useState(5);

  // Redirect to login if user is not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/allocation');
    }
  }, [user, authLoading, router]);

  // Load user's private encrypted vault
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

  // Current category totals
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {
      EQUITY: 0,
      DEBT: 0,
      COMMODITY: 0,
      REAL_ESTATE: 0,
      CASH: 0,
      CRYPTO: 0,
    };

    assets.forEach((a) => {
      const val = convertAmount(a.currentValue, a.currentCurrency, currency);
      if (totals[a.category] !== undefined) {
        totals[a.category] += val;
      } else {
        totals.CASH += val;
      }
    });

    return totals;
  }, [assets, currency]);

  // Rebalancing calculation
  const rebalancingData = useMemo(() => {
    if (totalAssetValue === 0) return [];

    const categories = [
      { key: 'EQUITY', label: 'Equity (Stocks & MFs)', currentVal: categoryTotals.EQUITY, targetPct: targetEquity },
      { key: 'DEBT', label: 'Debt (EPF, PPF, FDs)', currentVal: categoryTotals.DEBT, targetPct: targetDebt },
      { key: 'COMMODITY', label: 'Commodities & Gold', currentVal: categoryTotals.COMMODITY, targetPct: targetGold },
      { key: 'CASH', label: 'Cash & Savings', currentVal: categoryTotals.CASH, targetPct: targetCash },
    ];

    return categories.map((cat) => {
      const currentPct = (cat.currentVal / totalAssetValue) * 100;
      const targetVal = (cat.targetPct / 100) * totalAssetValue;
      const driftVal = cat.currentVal - targetVal;
      const driftPct = currentPct - cat.targetPct;

      return {
        ...cat,
        currentPct,
        targetVal,
        driftVal,
        driftPct,
      };
    });
  }, [totalAssetValue, categoryTotals, targetEquity, targetDebt, targetGold, targetCash]);

  // Domestic vs International
  const geoBreakdown = useMemo(() => {
    let domestic = 0;
    let international = 0;
    assets.forEach((a) => {
      const val = convertAmount(a.currentValue, a.currentCurrency, currency);
      if (a.geographyTag === 'INTERNATIONAL') {
        international += val;
      } else {
        domestic += val;
      }
    });
    const domPct = totalAssetValue > 0 ? (domestic / totalAssetValue) * 100 : 0;
    const intPct = totalAssetValue > 0 ? (international / totalAssetValue) * 100 : 0;
    return { domestic, international, domPct, intPct };
  }, [assets, totalAssetValue, currency]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar currentCurrency={currency} onCurrencyChange={setCurrency} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
                Asset Allocation & Rebalancing
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Portfolio Balancer
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize your asset distribution and compute exact buy/sell rebalancing targets.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase font-medium text-muted-foreground">Portfolio Base: </span>
            <span className="font-mono text-sm font-bold text-foreground">
              {formatCurrency(totalAssetValue, currency)}
            </span>
          </div>
        </div>

        {/* Charts & Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Current Asset Class Distribution
              </h3>
              <p className="text-xs text-muted-foreground">
                Breakdown of Equity, Debt, Real Estate, Commodities, and Cash
              </p>
            </div>
            <div className="py-4">
              <AssetBreakdownDonut assets={assets} currency={currency} />
            </div>
          </div>

          {/* Geography Split */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Geographic Diversification
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Domestic (India) vs. Global (US & Developed Markets)
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-foreground font-semibold">Domestic (India)</span>
                  <span className="font-mono text-foreground font-bold">
                    {geoBreakdown.domPct.toFixed(1)}% ({formatCurrency(geoBreakdown.domestic, currency)})
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${geoBreakdown.domPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-foreground font-semibold">International (US / Global)</span>
                  <span className="font-mono text-foreground font-bold">
                    {geoBreakdown.intPct.toFixed(1)}% ({formatCurrency(geoBreakdown.international, currency)})
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${geoBreakdown.intPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted/40 border border-border rounded-lg text-xs text-muted-foreground">
              Tip: Standard wealth advisors recommend 10%–20% allocation in global equities to hedge against single-currency depreciation.
            </div>
          </div>
        </div>

        {/* Target Allocation & Rebalancing Engine */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                <Sliders className="w-5 h-5 text-primary" />
                Smart Rebalancing Engine
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adjust your target weights to calculate exact adjustments to restore balance.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Target Total:</span>
              <span
                className={`font-mono font-bold ${
                  targetEquity + targetDebt + targetGold + targetCash === 100
                    ? 'text-primary'
                    : 'text-destructive'
                }`}
              >
                {targetEquity + targetDebt + targetGold + targetCash}%
              </span>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span>Equity Target</span>
                <span className="font-mono text-primary font-bold">{targetEquity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={targetEquity}
                onChange={(e) => setTargetEquity(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span>Debt Target</span>
                <span className="font-mono text-primary font-bold">{targetDebt}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={targetDebt}
                onChange={(e) => setTargetDebt(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span>Gold Target</span>
                <span className="font-mono text-primary font-bold">{targetGold}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={targetGold}
                onChange={(e) => setTargetGold(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span>Cash Target</span>
                <span className="font-mono text-primary font-bold">{targetCash}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={targetCash}
                onChange={(e) => setTargetCash(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          {/* Rebalancing Recommendations Table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4">Asset Class</th>
                  <th className="py-3 px-4 text-right">Current Value</th>
                  <th className="py-3 px-4 text-right">Current %</th>
                  <th className="py-3 px-4 text-right">Target %</th>
                  <th className="py-3 px-4 text-right">Drift</th>
                  <th className="py-3 px-4">Recommended Rebalancing Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rebalancingData.map((row) => {
                  const isOverweight = row.driftPct > 0.5;
                  const isUnderweight = row.driftPct < -0.5;

                  return (
                    <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">{row.label}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-foreground">
                        {formatCurrency(row.currentVal, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold">
                        {row.currentPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-primary">
                        {row.targetPct}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs">
                        <span
                          className={`font-semibold ${
                            isOverweight
                              ? 'text-amber-500'
                              : isUnderweight
                              ? 'text-blue-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {row.driftPct >= 0 ? '+' : ''}
                          {row.driftPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isOverweight ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Overweight by {formatCurrency(Math.abs(row.driftVal), currency)} (Trim / Reinvest elsewhere)
                          </span>
                        ) : isUnderweight ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            Underweight by {formatCurrency(Math.abs(row.driftVal), currency)} (Allocate next SIP here)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Balanced on target
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
