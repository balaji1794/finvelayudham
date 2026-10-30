'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Camera,
  Coins,
  CreditCard,
  UploadCloud,
  Download,
  Upload,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Trash2,
  Lock,
  Plus,
  Scale,
  Target,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import InteractiveAreaChart from '@/components/InteractiveAreaChart';
import AssetBreakdownDonut from '@/components/AssetBreakdownDonut';
import AddAssetModal from '@/components/AddAssetModal';
import AddLiabilityModal from '@/components/AddLiabilityModal';
import AddExpenseModal from '@/components/AddExpenseModal';
import { Asset, Liability, Snapshot, Transaction, Goal } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import {
  UserPortfolio,
  loadUserPortfolio,
  saveUserPortfolio,
  loadStarterTemplate,
  STARTER_GOALS,
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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [saveBanner, setSaveBanner] = useState<string>('');

  // Accordion Expand/Collapse States (matches FinBoom overview)
  const [wealthOpen, setWealthOpen] = useState(false);
  const [investmentsOpen, setInvestmentsOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(true);
  const [holdingsFilter, setHoldingsFilter] = useState<'ALL' | 'EQUITY' | 'CASH' | 'COMMODITIES'>('ALL');

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
        setGoals(portfolio.goals && portfolio.goals.length > 0 ? portfolio.goals : STARTER_GOALS);
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

  // Export whole vault data in a single file
  const handleExportWholeVault = async () => {
    if (!user) return;
    try {
      const currentVault = await loadUserPortfolio(user.id, user.email);
      const wholeData = {
        ...currentVault,
        assets,
        liabilities,
        snapshots,
        transactions,
        goals,
        exportedAt: new Date().toISOString(),
        version: '2.0',
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(wholeData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `finvelayudham_vault_backup_${(user.email || 'user').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setSaveBanner(`Exported whole portfolio data (${assets.length} assets, ${goals.length} goals) to single backup file!`);
      setTimeout(() => setSaveBanner(''), 4000);
    } catch (err: any) {
      setSaveBanner(err.message || 'Export failed.');
      setTimeout(() => setSaveBanner(''), 4000);
    }
  };

  // Import whole vault data from a single file
  const handleImportWholeVault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('File is empty.');

        if (file.name.endsWith('.json') || text.trim().startsWith('{')) {
          const parsed = JSON.parse(text);
          const newAssets = Array.isArray(parsed.assets) ? parsed.assets : [];
          const newLiabilities = Array.isArray(parsed.liabilities) ? parsed.liabilities : [];
          const newSnapshots = Array.isArray(parsed.snapshots) ? parsed.snapshots : [];
          const newTransactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
          const newGoals = Array.isArray(parsed.goals) ? parsed.goals : goals;

          setAssets(newAssets);
          setLiabilities(newLiabilities);
          setSnapshots(newSnapshots);
          setTransactions(newTransactions);
          setGoals(newGoals);
          if (parsed.currency) setCurrency(parsed.currency);

          const newVault: UserPortfolio = {
            userId: user.id,
            email: user.email,
            currency: parsed.currency || currency,
            assets: newAssets,
            liabilities: newLiabilities,
            snapshots: newSnapshots,
            transactions: newTransactions,
            goals: newGoals,
            updatedAt: new Date().toISOString(),
            isEncrypted: true,
          };
          await saveUserPortfolio(newVault);
          setSaveBanner(`Successfully imported whole dataset (${newAssets.length} assets, ${newGoals.length} goals) from single file!`);
          setTimeout(() => setSaveBanner(''), 4000);
          return;
        }

        // CSV Statement Fallback
        if (text.includes('Stock Name') && text.includes('ISIN')) {
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          let headerIdx = lines.findIndex((l) => l.includes('Stock Name') && l.includes('ISIN'));
          if (headerIdx === -1) headerIdx = 0;
          const newAssets: Asset[] = [];
          for (let i = headerIdx + 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
            if (cols.length < 7 || !cols[0]) continue;
            const isSgb = cols[0].toUpperCase().includes('GOLDBOND') || cols[0].toUpperCase().includes('SGB') || cols[0].toUpperCase().includes('GOLD');
            newAssets.push({
              id: 'stk_' + cols[1].toLowerCase() + '_' + Math.random().toString(36).substring(2, 7),
              name: cols[0],
              productType: isSgb ? 'SGB' : 'Stock',
              category: isSgb ? 'COMMODITY' : 'EQUITY',
              subClass: isSgb ? 'Sovereign Gold Bond' : 'Direct Equity',
              currentValue: parseFloat(cols[6]) || 0,
              investedAmount: parseFloat(cols[4]) || 0,
              currentCurrency: 'INR',
              geographyTag: 'DOMESTIC',
            });
          }
          const merged = [...assets, ...newAssets];
          setAssets(merged);
          const vault = await loadUserPortfolio(user.id, user.email);
          await saveUserPortfolio({ ...vault, assets: merged });
          setSaveBanner(`Imported ${newAssets.length} holdings from statement file!`);
          setTimeout(() => setSaveBanner(''), 4000);
        }
      } catch (err: any) {
        setSaveBanner(err.message || 'Import failed.');
        setTimeout(() => setSaveBanner(''), 4000);
      }
    };
    reader.readAsText(file);
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

  // Assets categorized for Wealth Accordion
  const assetsByCategory = useMemo(() => {
    const equityTotal = assets
      .filter((a) => (a.category || '').toUpperCase() === 'EQUITY')
      .reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
    const cashTotal = assets
      .filter((a) => (a.category || '').toUpperCase() === 'CASH')
      .reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
    const commoditiesTotal = assets
      .filter((a) => (a.category || '').toUpperCase() === 'COMMODITY' || (a.category || '').toUpperCase() === 'COMMODITIES')
      .reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
    const debtTotal = assets
      .filter((a) => (a.category || '').toUpperCase() === 'DEBT')
      .reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
    const realEstateTotal = assets
      .filter((a) => (a.category || '').toUpperCase() === 'REAL_ESTATE')
      .reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);

    const list = [
      {
        label: 'Equity',
        amount: equityTotal,
        color: '#2563eb', // Blue
        href: '/assets?class=EQUITY',
        pct: totalAssets > 0 ? (equityTotal / totalAssets) * 100 : 0,
      },
      {
        label: 'Cash & Savings',
        amount: cashTotal,
        color: '#059669', // Green
        href: '/accounts',
        pct: totalAssets > 0 ? (cashTotal / totalAssets) * 100 : 0,
      },
      {
        label: 'Commodities',
        amount: commoditiesTotal,
        color: '#d97706', // Amber
        href: '/assets?class=COMMODITIES',
        pct: totalAssets > 0 ? (commoditiesTotal / totalAssets) * 100 : 0,
      },
    ];

    if (debtTotal > 0) {
      list.push({
        label: 'Fixed Income & Debt',
        amount: debtTotal,
        color: '#7c3aed',
        href: '/assets?class=DEBT',
        pct: totalAssets > 0 ? (debtTotal / totalAssets) * 100 : 0,
      });
    }
    if (realEstateTotal > 0) {
      list.push({
        label: 'Real Estate',
        amount: realEstateTotal,
        color: '#ea580c',
        href: '/assets?class=REAL_ESTATE',
        pct: totalAssets > 0 ? (realEstateTotal / totalAssets) * 100 : 0,
      });
    }
    return list;
  }, [assets, currency, totalAssets]);

  // Filtered Holdings for Investments Accordion
  const filteredHoldings = useMemo(() => {
    let list = assets;
    if (holdingsFilter !== 'ALL') {
      if (holdingsFilter === 'COMMODITIES') {
        list = assets.filter((a) => (a.category || '').toUpperCase() === 'COMMODITIES' || (a.category || '').toUpperCase() === 'COMMODITY');
      } else {
        list = assets.filter((a) => (a.category || '').toUpperCase() === holdingsFilter);
      }
    }
    return list.slice(0, 6);
  }, [assets, holdingsFilter]);

  // Goals calculations for Goals Accordion
  const activeGoalList = useMemo(() => {
    if (goals.length > 0) return goals;
    return [
      {
        id: 'retirement-default',
        name: 'Retirement Corpus',
        category: 'RETIREMENT' as const,
        targetAmount: 100000000,
        currentAmount: totalAssets > 0 ? totalAssets : 9125000,
        targetDate: '2050-12-31',
        monthlyContribution: 50000,
        currency: 'INR',
      },
    ];
  }, [goals, totalAssets]);

  const primaryGoal = activeGoalList[0];
  const primaryGoalYear = (primaryGoal.targetDate || '2050').slice(0, 4);
  const primaryGoalPct = Math.min(
    Math.round(((primaryGoal.currentAmount || totalAssets || 9125000) / (primaryGoal.targetAmount || 100000000)) * 100),
    100
  );

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

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportWholeVault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-xs cursor-pointer"
              title="Export whole dataset in a single JSON backup file"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export All</span>
            </button>
            <label
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-xs cursor-pointer"
              title="Import whole dataset from a single JSON or CSV file"
            >
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>Import All</span>
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleImportWholeVault}
                className="hidden"
              />
            </label>
            {assets.length === 0 && (
              <button
                onClick={handleLoadDemo}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
              >
                Load Starter Portfolio
              </button>
            )}
          </div>
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

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
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
              <label
                className="bg-card border border-border hover:border-emerald-500/40 hover:bg-emerald-500/5 rounded-2xl p-4 text-center transition-all shadow-xs group cursor-pointer flex flex-col items-center justify-center gap-2"
                title="Upload and restore whole vault file (.json / .csv)"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-foreground">Import</span>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleImportWholeVault}
                  className="hidden"
                />
              </label>

              {/* Tile 5: Export */}
              <button
                onClick={handleExportWholeVault}
                className="bg-card border border-border hover:border-purple-500/40 hover:bg-purple-500/5 rounded-2xl p-4 text-center transition-all shadow-xs group cursor-pointer flex flex-col items-center justify-center gap-2"
                title="Download whole vault in a single JSON backup file"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-foreground">Export</span>
              </button>
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
            COLLAPSIBLE ACCORDION 1: WEALTH
            Matches FinBoom's Wealth Accordion Section
           ========================================================================= */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setWealthOpen(!wealthOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 sm:py-3.5 text-left min-h-[52px] hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
          >
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                wealthOpen ? 'rotate-180' : ''
              }`}
            />
            <span className="shrink-0">
              <Scale className="h-4 w-4 text-primary" />
            </span>
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground truncate">Wealth</span>
            </div>
          </button>

          {wealthOpen && (
            <div className="border-t border-border bg-background p-4 sm:p-5">
              {/* Assets vs Liabilities Split */}
              <div className="mb-5">
                <div
                  className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label="Assets versus liabilities split"
                >
                  <div
                    className="h-full bg-emerald-600 transition-all duration-500"
                    style={{
                      width: `${
                        totalAssets + totalLiabilities > 0
                          ? ((totalAssets / (totalAssets + totalLiabilities)) * 100).toFixed(1)
                          : 100
                      }%`,
                    }}
                  />
                  <div
                    className="h-full bg-destructive transition-all duration-500"
                    style={{
                      width: `${
                        totalAssets + totalLiabilities > 0
                          ? ((totalLiabilities / (totalAssets + totalLiabilities)) * 100).toFixed(1)
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-mono font-bold">
                  <span className="tabular-nums text-emerald-600 uppercase tracking-wide">
                    {totalAssets + totalLiabilities > 0
                      ? Math.round((totalAssets / (totalAssets + totalLiabilities)) * 100)
                      : 100}
                    % assets
                  </span>
                  <span className="tabular-nums text-destructive uppercase tracking-wide">
                    {totalAssets + totalLiabilities > 0
                      ? Math.round((totalLiabilities / (totalAssets + totalLiabilities)) * 100)
                      : 0}
                    % liabilities
                  </span>
                </div>
              </div>

              {/* 2-Column Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Assets */}
                <div className="relative overflow-hidden border rounded-xl bg-emerald-500/5 border-emerald-500/20">
                  <span className="absolute inset-y-0 left-0 w-[3px] bg-emerald-600" aria-hidden="true" />
                  <div className="pl-4 pr-3 pt-3 pb-3">
                    <div className="flex items-baseline justify-between gap-2 mb-2.5">
                      <Link href="/assets" className="group flex items-center gap-1.5 min-w-0">
                        <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          Assets
                        </span>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground bg-background/60 px-1 rounded">
                          {assets.length}
                        </span>
                      </Link>
                      <span className="font-mono font-bold text-xl text-emerald-600">
                        {maskValue(formatCurrency(totalAssets, currency))}
                      </span>
                    </div>

                    <ul className="space-y-0.5">
                      {assetsByCategory.map((cat) => (
                        <li key={cat.label}>
                          <Link
                            href={cat.href}
                            className="group block py-1.5 px-2 -mx-2 rounded-md hover:bg-background/60 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span className="flex-1 min-w-0 text-xs text-foreground truncate">
                                {cat.label}
                              </span>
                              <span className="text-xs font-mono tabular-nums text-foreground">
                                {maskValue(formatCurrency(cat.amount, currency))}
                              </span>
                              <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                            <div className="mt-1 ml-4 h-[3px] rounded-full bg-background/60 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${cat.pct}%`,
                                  backgroundColor: cat.color,
                                  opacity: 0.7,
                                }}
                              />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Column: Liabilities */}
                <div className="relative overflow-hidden border rounded-xl bg-destructive/5 border-destructive/20 flex flex-col justify-between">
                  <span className="absolute inset-y-0 left-0 w-[3px] bg-destructive" aria-hidden="true" />
                  <div className="pl-4 pr-3 pt-3 pb-3">
                    <div className="flex items-baseline justify-between gap-2 mb-2.5">
                      <Link href="/liabilities" className="group flex items-center gap-1.5 min-w-0">
                        <TrendingDown className="h-3.5 w-3.5 shrink-0 text-destructive" />
                        <span className="text-xs font-bold text-foreground group-hover:text-destructive transition-colors">
                          Liabilities
                        </span>
                      </Link>
                      <span className="font-mono font-bold text-xl text-destructive">
                        {maskValue(formatCurrency(totalLiabilities, currency))}
                      </span>
                    </div>

                    {liabilities.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1.5">No debts tracked</p>
                        <button
                          onClick={() => setIsAddLiabilityOpen(true)}
                          className="text-xs font-medium text-primary hover:underline cursor-pointer"
                        >
                          Add liability →
                        </button>
                      </div>
                    ) : (
                      <ul className="space-y-1.5 pt-1">
                        {liabilities.map((l) => (
                          <li key={l.id} className="flex justify-between items-center text-xs">
                            <span className="text-foreground font-medium truncate">{l.name}</span>
                            <span className="font-mono text-destructive">
                              {maskValue(
                                formatCurrency(
                                  convertAmount(l.outstandingAmount, l.currency, currency),
                                  currency
                                )
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Links */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <Link href="/accounts" className="hover:text-foreground transition-colors font-medium">
                  Accounts →
                </Link>
                <Link href="/assets" className="hover:text-foreground transition-colors font-medium">
                  All assets →
                </Link>
                <Link href="/liabilities" className="hover:text-foreground transition-colors font-medium">
                  All liabilities →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            COLLAPSIBLE ACCORDION 2: INVESTMENTS
            Matches FinBoom's Investments Accordion Section
           ========================================================================= */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setInvestmentsOpen(!investmentsOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 sm:py-3.5 text-left min-h-[52px] hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
          >
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                investmentsOpen ? 'rotate-180' : ''
              }`}
            />
            <span className="shrink-0">
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </span>
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground truncate">Investments</span>
            </div>
          </button>

          {investmentsOpen && (
            <div className="border-t border-border bg-background p-4 sm:p-5 space-y-4">
              {/* Purchase Price Prompt Card */}
              <div className="rounded-xl border border-dashed border-border bg-card px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Add purchase prices to your assets to track gain/loss here.
                </p>
                <Link
                  href="/assets"
                  className="inline-block mt-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2"
                >
                  Update assets →
                </Link>
              </div>

              {/* Top Holdings Card */}
              <div className="relative overflow-hidden border border-border bg-card rounded-xl">
                <span className="absolute inset-y-0 left-0 w-[3px] bg-amber-500" aria-hidden="true" />
                <div className="pl-4 pr-3 pt-3 pb-2 flex items-baseline justify-between gap-2 border-b border-border/40">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-500">
                      <Coins className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-bold text-foreground">Top holdings</span>
                  </div>
                  <Link
                    href="/assets"
                    className="text-xs font-medium text-primary hover:underline underline-offset-2"
                  >
                    All assets →
                  </Link>
                </div>

                <div>
                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap gap-2 px-3 pt-3 pb-2">
                    {(['ALL', 'EQUITY', 'CASH', 'COMMODITIES'] as const).map((filter) => {
                      const label =
                        filter === 'ALL'
                          ? 'All'
                          : filter === 'EQUITY'
                          ? 'Equity'
                          : filter === 'CASH'
                          ? 'Cash & Savings'
                          : 'Commodities';
                      const isSelected = holdingsFilter === filter;
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setHoldingsFilter(filter)}
                          className={`relative inline-flex items-center min-h-8 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Holdings 2-Column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-3 pb-3">
                    {filteredHoldings.length === 0 ? (
                      <div className="col-span-2 py-4 text-center text-xs text-muted-foreground">
                        No holdings found in this category.
                      </div>
                    ) : (
                      filteredHoldings.map((item) => {
                        const categoryPillClass =
                          item.subClass === 'Savings Account' || item.category === 'CASH'
                            ? 'bg-muted text-foreground'
                            : item.subClass === 'ULIP'
                            ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                            : item.subClass === 'Direct Stock' || item.category === 'EQUITY'
                            ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400'
                            : (item.category as string) === 'COMMODITY' || (item.category as string) === 'COMMODITIES'
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400'
                            : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400';

                        return (
                          <div
                            key={item.id}
                            className="rounded-lg bg-muted/40 hover:bg-muted/60 p-3 space-y-1 transition-colors border border-transparent hover:border-border/60"
                          >
                            <div className="text-xs text-muted-foreground truncate font-medium" title={item.name}>
                              {item.name}
                            </div>
                            <div className="text-sm font-semibold font-mono tabular-nums text-foreground">
                              {maskValue(
                                formatCurrency(
                                  convertAmount(item.currentValue, item.currentCurrency, currency),
                                  currency
                                )
                              )}
                            </div>
                            <span
                              className={`inline-block max-w-full truncate px-1.5 py-0.5 rounded text-[10px] font-medium ${categoryPillClass}`}
                            >
                              {item.subClass || item.category}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            COLLAPSIBLE ACCORDION 3: GOALS
            Matches FinBoom's Goals Accordion Section
           ========================================================================= */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setGoalsOpen(!goalsOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 sm:py-3.5 text-left min-h-[52px] hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
          >
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                goalsOpen ? 'rotate-180' : ''
              }`}
            />
            <span className="shrink-0">
              <Target className="h-4 w-4 text-amber-500" />
            </span>
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground truncate">Goals</span>
              <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {activeGoalList.length}
              </span>
            </div>
            <div className="font-semibold text-xs sm:text-sm text-foreground shrink-0 font-mono">
              +{primaryGoalPct}%
            </div>
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
              1 OFF-TRACK
            </span>
          </button>

          {goalsOpen && (
            <div className="border-t border-border bg-background">
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-medium text-foreground">
                    {primaryGoal.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {maskValue(formatCurrency(primaryGoal.targetAmount, currency))} by {primaryGoalYear}
                  </span>
                </div>

                <div className="h-[5px] bg-border rounded-[3px] overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-primary rounded-[3px] transition-all duration-500"
                    style={{ width: `${Math.min(primaryGoalPct, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>{primaryGoalPct}% complete</span>
                  <span>
                    invest {maskValue(formatCurrency(primaryGoal.monthlyContribution || 50000, currency))}/mo
                  </span>
                </div>
              </div>

              <div className="px-4 py-3 flex justify-end border-t border-border/40">
                <Link
                  href="/goals"
                  className="text-xs font-medium text-primary hover:underline underline-offset-2"
                >
                  Manage →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            ROW 5: WEALTH TRAJECTORY CHART & DONUT ALLOCATION
           ========================================================================= */}
        <div className="pt-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-foreground">
              Consolidated Growth & Exposure
            </h2>
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
