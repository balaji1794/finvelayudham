'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Camera,
  Coins,
  CreditCard,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Trash2,
  Lock,
  Plus,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import InteractiveAreaChart from '@/components/InteractiveAreaChart';
import AssetBreakdownDonut from '@/components/AssetBreakdownDonut';
import AddAssetModal from '@/components/AddAssetModal';
import AddLiabilityModal from '@/components/AddLiabilityModal';
import AddExpenseModal from '@/components/AddExpenseModal';
import { Asset, Liability, Snapshot, Transaction } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import {
  UserPortfolio,
  loadUserPortfolio,
  saveUserPortfolio,
  loadStarterTemplate,
} from '@/lib/portfolio-vault';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isPrivacyMasked, maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [vaultLoading, setVaultLoading] = useState(true);

  // Portfolio State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [saveBanner, setSaveBanner] = useState<string>('');

  // Modals
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAddLiabilityOpen, setIsAddLiabilityOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseType, setExpenseType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, authLoading, router]);

  // Load vault
  useEffect(() => {
    async function initVault() {
      if (!user) return;
      setVaultLoading(true);
      try {
        const portfolio = await loadUserPortfolio(user.id, user.email);
        setAssets(portfolio.assets || []);
        setLiabilities(portfolio.liabilities || []);
        setSnapshots(portfolio.snapshots || []);
        setTransactions(portfolio.transactions || []);
        setLastSaved(portfolio.updatedAt || new Date().toISOString());
      } catch (err) {
        console.error('Failed to load user vault:', err);
      } finally {
        setVaultLoading(false);
      }
    }
    if (user) {
      initVault();
    }
  }, [user]);

  // Save changes to encrypted vault
  const persistChanges = async (
    newAssets: Asset[],
    newLiabilities: Liability[],
    newSnapshots?: Snapshot[],
    newTransactions?: Transaction[]
  ) => {
    if (!user) return;
    const nowIso = new Date().toISOString();
    const updatedSnapshots = newSnapshots || snapshots;
    const updatedTransactions = newTransactions || transactions;

    const portfolio: UserPortfolio = {
      userId: user.id,
      email: user.email,
      currency,
      assets: newAssets,
      liabilities: newLiabilities,
      snapshots: updatedSnapshots,
      transactions: updatedTransactions,
      updatedAt: nowIso,
      isEncrypted: true,
    };

    const res = await saveUserPortfolio(portfolio);
    if (res.success) {
      setLastSaved(nowIso);
      setSaveBanner('Saved');
      setTimeout(() => setSaveBanner(''), 2500);
    }
  };

  const handleAddAsset = async (newAsset: Asset) => {
    const updated = [newAsset, ...assets];
    setAssets(updated);
    await persistChanges(updated, liabilities);
  };

  const handleAddLiability = async (newLiability: Liability) => {
    const updated = [newLiability, ...liabilities];
    setLiabilities(updated);
    await persistChanges(assets, updated);
  };

  const handleAddTransaction = async (newTx: Transaction) => {
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    await persistChanges(assets, liabilities, snapshots, updated);
  };

  const handleTakeSnapshot = async () => {
    const totalA = assets.reduce(
      (sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency),
      0
    );
    const totalL = liabilities.reduce(
      (sum, l) => sum + convertAmount(l.outstandingAmount, l.currency, currency),
      0
    );
    const nowIso = new Date().toISOString();
    const currentMonth = nowIso.slice(0, 7);

    const newSnap: Snapshot = {
      id: `snap-${Date.now()}`,
      takenAt: currentMonth,
      label: `Checkpoint ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
      netWorthBase: totalA - totalL,
      totalAssetsBase: totalA,
      totalLiabilitiesBase: totalL,
      baseCurrency: currency,
    };

    const updated = [...snapshots, newSnap];
    setSnapshots(updated);
    await persistChanges(assets, liabilities, updated);
    setSaveBanner('Snapshot Checkpoint Captured');
    setTimeout(() => setSaveBanner(''), 2500);
  };

  const handleLoadDemo = async () => {
    if (!user) return;
    setVaultLoading(true);
    const starter = await loadStarterTemplate(user.id, user.email);
    setAssets(starter.assets);
    setLiabilities(starter.liabilities);
    setSnapshots(starter.snapshots);
    setLastSaved(starter.updatedAt);
    setVaultLoading(false);
  };

  // Aggregates
  const totalAssets = useMemo(() => {
    return assets.reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
  }, [assets, currency]);

  const totalLiabilities = useMemo(() => {
    return liabilities.reduce(
      (sum, l) => sum + convertAmount(l.outstandingAmount, l.currency, currency),
      0
    );
  }, [liabilities, currency]);

  const netWorth = totalAssets - totalLiabilities;

  // Monthly Cashflow
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const monthTransactions = transactions.filter((t) => (t.date || '').startsWith(currentMonthKey));
  const monthIncome = monthTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + (t.amountBase || 0), 0);
  const monthExpenses = monthTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (t.amountBase || 0), 0);

  // Recent activity stream
  const recentActivities = useMemo(() => {
    const list: Array<{ id: string; label: string; date: string; amount?: string; isPositive?: boolean }> = [];
    transactions.slice(0, 3).forEach((t) => {
      list.push({
        id: t.id,
        label: t.description || t.category,
        date: t.date,
        amount: (t.type === 'EXPENSE' ? '-' : '+') + formatCurrency(t.amountBase, currency),
        isPositive: t.type === 'INCOME',
      });
    });
    snapshots.slice(-2).reverse().forEach((s) => {
      list.push({
        id: s.id,
        label: `Snapshot: ${s.label || s.takenAt}`,
        date: s.takenAt,
        amount: formatCurrency(s.netWorthBase, currency),
        isPositive: true,
      });
    });
    return list.slice(0, 4);
  }, [transactions, snapshots, currency]);

  const currentMonthFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  }).toUpperCase();

  return (
    <AppLayout
      currency={currency}
      onCurrencyChange={setCurrency}
      title="Overview"
      onAddAsset={handleAddAsset}
      onAddLiability={handleAddLiability}
      onAddTransaction={handleAddTransaction}
      onTakeSnapshot={handleTakeSnapshot}
    >
      <div className="space-y-6">
        {/* Welcome & Free Unlocked Banner (Replaces FinBoom's Paywall Warning) */}
        <div className="p-4 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>Welcome back, {user?.name || 'Investor'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Pro Unlocked · 100% Free
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Client-encrypted private vault. Zero tracking, zero bank logins, unlimited features.
              </p>
            </div>
          </div>

          {assets.length === 0 && (
            <button
              onClick={handleLoadDemo}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
            >
              Load Starter Portfolio
            </button>
          )}
        </div>

        {/* =========================================================================
            ROW 1: TWO PRIMARY CARDS (NET WORTH & THIS MONTH)
            Matches FinBoom's Top Grid Exactly
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: NET WORTH • INR */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Net Worth · {currency}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Pro (Free)
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
                {maskValue(formatCurrency(netWorth, currency))}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <div>
                  Assets: <span className="font-semibold text-foreground">{maskValue(formatCurrency(totalAssets, currency))}</span>
                </div>
                <div>
                  Liabilities: <span className="font-semibold text-destructive">{maskValue(formatCurrency(totalLiabilities, currency))}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-border flex items-center justify-between">
              <button
                onClick={handleTakeSnapshot}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{snapshots.length === 0 ? 'Take your first snapshot →' : 'Record monthly snapshot →'}</span>
              </button>
              <Link href="/wealth" className="text-xs text-muted-foreground hover:text-foreground">
                View Wealth Hub →
              </Link>
            </div>
          </div>

          {/* Card 2: THIS MONTH */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  This Month
                </span>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {currentMonthFormatted}
                </span>
              </div>

              {monthIncome === 0 && monthExpenses === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    No income or spending logged this month.
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setExpenseType('INCOME');
                        setIsAddExpenseOpen(true);
                      }}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Add income →
                    </button>
                    <span className="text-muted-foreground/40">·</span>
                    <button
                      onClick={() => {
                        setExpenseType('EXPENSE');
                        setIsAddExpenseOpen(true);
                      }}
                      className="text-xs font-semibold text-destructive hover:underline cursor-pointer"
                    >
                      Add expense →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">Logged Inflows:</span>
                    <span className="text-sm font-bold text-primary">
                      +{maskValue(formatCurrency(monthIncome, currency))}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">Logged Expenses:</span>
                    <span className="text-sm font-bold text-destructive">
                      -{maskValue(formatCurrency(monthExpenses, currency))}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-border font-bold">
                    <span className="text-xs text-foreground">Net Saved:</span>
                    <span className="text-base text-foreground">
                      {maskValue(formatCurrency(monthIncome - monthExpenses, currency))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs">
              <Link href="/money" className="text-primary hover:underline font-semibold">
                Set a budget →
              </Link>
              <Link href="/money" className="text-muted-foreground hover:text-foreground">
                Insights →
              </Link>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 2: QUICK ADD & RECENT ACTIVITY
            Matches FinBoom's Middle Section Exactly
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section: QUICK ADD */}
          <div>
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Quick Add
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Tile 1: Expense */}
              <button
                onClick={() => {
                  setExpenseType('EXPENSE');
                  setIsAddExpenseOpen(true);
                }}
                className="bg-card border border-border hover:border-destructive/40 hover:bg-destructive/5 rounded-2xl p-4 text-center transition-all shadow-xs group cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-foreground">Expense</span>
              </button>

              {/* Tile 2: Asset */}
              <button
                onClick={() => setIsAddAssetOpen(true)}
                className="bg-card border border-border hover:border-primary/40 hover:bg-primary/5 rounded-2xl p-4 text-center transition-all shadow-xs group cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Coins className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-foreground">Asset</span>
              </button>

              {/* Tile 3: Snapshot */}
              <button
                onClick={handleTakeSnapshot}
                className="bg-card border border-border hover:border-amber-500/40 hover:bg-amber-500/5 rounded-2xl p-4 text-center transition-all shadow-xs group cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-foreground">Snapshot</span>
              </button>

              {/* Tile 4: Import */}
              <Link
                href="/import"
                className="bg-card border border-border hover:border-emerald-500/40 hover:bg-emerald-500/5 rounded-2xl p-4 text-center transition-all shadow-xs group cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-foreground">Import</span>
              </Link>
            </div>
          </div>

          {/* Section: RECENT ACTIVITY */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent Activity
                </span>
                <Link href="/money" className="text-xs text-primary hover:underline font-semibold">
                  All →
                </Link>
              </div>

              {recentActivities.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    Nothing logged in the last 90 days.
                  </p>
                  <button
                    onClick={() => {
                      setExpenseType('EXPENSE');
                      setIsAddExpenseOpen(true);
                    }}
                    className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Add expense →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-foreground">{act.label}</div>
                        <div className="text-[10px] text-muted-foreground">{act.date}</div>
                      </div>
                      {act.amount && (
                        <div
                          className={`font-bold ${
                            act.isPositive ? 'text-primary' : 'text-destructive'
                          }`}
                        >
                          {maskValue(act.amount)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 text-[11px] text-muted-foreground">
              Encrypted event log stored securely on this device.
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 3: WEALTH SECTION (CHART & ALLOCATION)
            Matches FinBoom's Wealth Showcase
           ========================================================================= */}
        <div className="pt-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2 className="font-serif text-lg font-bold text-foreground">
                Wealth Trajectory & Asset Mix
              </h2>
            </div>
            <Link href="/wealth" className="text-xs font-semibold text-primary hover:underline">
              Open Full Wealth Hub →
            </Link>
          </div>

          {/* Net Worth Chart */}
          <InteractiveAreaChart
            snapshots={
              snapshots.length > 0
                ? snapshots
                : [
                    {
                      id: 'current-snap',
                      takenAt: new Date().toISOString().slice(0, 7),
                      label: 'Current Vault Snapshot',
                      netWorthBase: netWorth,
                      totalAssetsBase: totalAssets,
                      totalLiabilitiesBase: totalLiabilities,
                      baseCurrency: currency,
                    },
                  ]
            }
            currency={currency}
            title="Consolidated Net Worth Trend"
          />

          {/* Allocation & Geography */}
          {assets.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Asset Allocation by Class
                </h3>
                <AssetBreakdownDonut assets={assets} currency={currency} />
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Geographic Exposure
                </h3>
                <div className="space-y-4 pt-2">
                  {(() => {
                    const domestic = assets
                      .filter((a) => a.geographyTag === 'DOMESTIC')
                      .reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
                    const intl = assets
                      .filter((a) => a.geographyTag === 'INTERNATIONAL')
                      .reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
                    const total = domestic + intl || 1;
                    const domPct = Math.round((domestic / total) * 100);
                    const intlPct = Math.round((intl / total) * 100);

                    return (
                      <>
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                              Domestic (India)
                            </span>
                            <span>{domPct}% ({maskValue(formatCurrency(domestic, currency))})</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${domPct}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                              International (Global)
                            </span>
                            <span>{intlPct}% ({maskValue(formatCurrency(intl, currency))})</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${intlPct}%` }} />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals for Quick Add */}
      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onAdd={(a) => {
          handleAddAsset(a);
          setIsAddAssetOpen(false);
        }}
        defaultCurrency={currency}
      />

      <AddLiabilityModal
        isOpen={isAddLiabilityOpen}
        onClose={() => setIsAddLiabilityOpen(false)}
        onAdd={(l) => {
          handleAddLiability(l);
          setIsAddLiabilityOpen(false);
        }}
        defaultCurrency={currency}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onAdd={(t) => {
          handleAddTransaction(t);
          setIsAddExpenseOpen(false);
        }}
        defaultType={expenseType}
        defaultCurrency={currency}
      />
    </AppLayout>
  );
}
