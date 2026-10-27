'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  ShieldAlert,
  ShieldCheck,
  Building,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import InteractiveAreaChart from '@/components/InteractiveAreaChart';
import AssetBreakdownDonut from '@/components/AssetBreakdownDonut';
import AddAssetModal from '@/components/AddAssetModal';
import AddLiabilityModal from '@/components/AddLiabilityModal';
import {
  INITIAL_ASSETS,
  INITIAL_LIABILITIES,
  INITIAL_SNAPSHOTS,
  INITIAL_TRANSACTIONS,
  Asset,
  Liability,
  Transaction
} from '@/lib/mock-data';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';

const ZERODHA_SAMPLE_HOLDINGS: Asset[] = [
  {
    id: 'z-hdfc',
    name: 'HDFC Bank Ltd',
    productType: 'Stock (Equity)',
    category: 'EQUITY',
    subClass: 'Large Cap Banking',
    currentValue: 175000,
    investedAmount: 145000,
    currentCurrency: 'INR',
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'z-ril',
    name: 'Reliance Industries Ltd',
    productType: 'Stock (Equity)',
    category: 'EQUITY',
    subClass: 'Energy & Conglomerate',
    currentValue: 240000,
    investedAmount: 200000,
    currentCurrency: 'INR',
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'z-tcs',
    name: 'Tata Consultancy Services',
    productType: 'Stock (Equity)',
    category: 'EQUITY',
    subClass: 'IT & Software',
    currentValue: 160000,
    investedAmount: 130000,
    currentCurrency: 'INR',
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'z-infy',
    name: 'Infosys Ltd',
    productType: 'Stock (Equity)',
    category: 'EQUITY',
    subClass: 'IT & Software',
    currentValue: 120000,
    investedAmount: 105000,
    currentCurrency: 'INR',
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'z-tatamotors',
    name: 'Tata Motors Ltd',
    productType: 'Stock (Equity)',
    category: 'EQUITY',
    subClass: 'Auto & EV',
    currentValue: 95000,
    investedAmount: 70000,
    currentCurrency: 'INR',
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'z-itc',
    name: 'ITC Ltd',
    productType: 'Stock (Equity)',
    category: 'EQUITY',
    subClass: 'FMCG & Dividends',
    currentValue: 85000,
    investedAmount: 65000,
    currentCurrency: 'INR',
    geographyTag: 'DOMESTIC',
  },
];

export default function DemoPage() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState('INR');
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'liabilities' | 'cashflow' | 'essentials'>('overview');

  // State with ability to add/remove assets and liabilities dynamically
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [liabilities, setLiabilities] = useState<Liability[]>(INITIAL_LIABILITIES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Search & Filter state
  const [assetSearch, setAssetSearch] = useState('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('ALL');

  // Modal open states
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAddLiabilityOpen, setIsAddLiabilityOpen] = useState(false);

  // Interactive Demo Controls State
  const [toastMessage, setToastMessage] = useState('');
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [inlineName, setInlineName] = useState('');
  const [inlineValue, setInlineValue] = useState('');
  const [inlineType, setInlineType] = useState('Mutual Fund');

  const handleImportZerodha = () => {
    const existingIds = new Set(assets.map((a) => a.id));
    const newItems = ZERODHA_SAMPLE_HOLDINGS.filter((h) => !existingIds.has(h.id));
    if (newItems.length === 0) {
      setToastMessage('Zerodha sample holdings are already imported into the demo.');
    } else {
      setAssets((prev) => [...newItems, ...prev]);
      setToastMessage(`✓ Imported ${newItems.length} equity holdings from Zerodha Console into your live demo.`);
    }
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleResetDemo = () => {
    setAssets(INITIAL_ASSETS);
    setLiabilities(INITIAL_LIABILITIES);
    setTransactions(INITIAL_TRANSACTIONS);
    setToastMessage('✓ Demo portfolio reset to baseline sample data.');
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleInlineAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineName.trim() || !inlineValue) return;

    let category: 'EQUITY' | 'DEBT' | 'COMMODITY' | 'REAL_ESTATE' | 'CASH' | 'CRYPTO' = 'EQUITY';
    if (inlineType === 'Gold') category = 'COMMODITY';
    else if (inlineType === 'Fixed Deposit') category = 'DEBT';
    else if (inlineType === 'Real Estate') category = 'REAL_ESTATE';
    else if (inlineType === 'Crypto') category = 'CRYPTO';

    const numVal = Math.max(0, parseFloat(inlineValue) || 0);

    const newAsset: Asset = {
      id: `inline-${Date.now()}`,
      name: inlineName.trim(),
      productType: inlineType,
      category,
      subClass: inlineType,
      currentValue: numVal,
      investedAmount: numVal,
      currentCurrency: currency,
      geographyTag: 'DOMESTIC',
    };

    setAssets((prev) => [newAsset, ...prev]);
    setInlineName('');
    setInlineValue('');
    setShowInlineAdd(false);
    setToastMessage(`✓ Added "${newAsset.name}" to your demo holdings.`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Calculations
  const totalAssets = useMemo(() => {
    return assets.reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
  }, [assets, currency]);

  const totalInvested = useMemo(() => {
    return assets.reduce((sum, a) => sum + convertAmount(a.investedAmount, a.currentCurrency, currency), 0);
  }, [assets, currency]);

  const totalLiabilities = useMemo(() => {
    return liabilities.reduce((sum, l) => sum + convertAmount(l.outstandingAmount, l.currency, currency), 0);
  }, [liabilities, currency]);

  const netWorth = totalAssets - totalLiabilities;
  const overallGain = totalAssets - totalInvested;
  const overallGainPercent = totalInvested > 0 ? (overallGain / totalInvested) * 100 : 0;

  // Monthly Cashflow calculations
  const monthlyIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + convertAmount(t.amountBase, 'INR', currency), 0);
  }, [transactions, currency]);

  const monthlyExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + convertAmount(t.amountBase, 'INR', currency), 0);
  }, [transactions, currency]);

  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  // Emergency fund check
  const liquidCash = useMemo(() => {
    return assets
      .filter((a) => a.category === 'CASH')
      .reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
  }, [assets, currency]);

  const emergencyMonthsCovered = monthlyExpenses > 0 ? liquidCash / monthlyExpenses : 0;

  // Filtered Assets list
  const filteredAssets = assets.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
      (a.subClass && a.subClass.toLowerCase().includes(assetSearch.toLowerCase()));
    const matchesCategory = assetCategoryFilter === 'ALL' || a.category === assetCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddAsset = (newAsset: Asset) => {
    setAssets((prev) => [newAsset, ...prev]);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddLiability = (newLiab: Liability) => {
    setLiabilities((prev) => [newLiab, ...prev]);
  };

  const handleDeleteLiability = (id: string) => {
    setLiabilities((prev) => prev.filter((l) => l.id !== id));
  };

  // Export JSON
  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      netWorth,
      currency,
      assets,
      liabilities,
      transactions,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finvelayudham-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar currentCurrency={currency} onCurrencyChange={setCurrency} />

      {/* Demo Top Banner */}
      <div className="bg-primary/10 border-b border-primary/20 py-2.5 px-4 text-center text-xs font-medium text-foreground flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        {user ? (
          <span>
            Logged in as <strong>{user.name}</strong> ({user.email}) · <strong>100% Free & Unlimited</strong> Portfolio Active.
          </span>
        ) : (
          <>
            <span>
              <strong>Live Interactive Demo:</strong> All calculations, conversions, and add/delete actions work in real-time in your browser.
            </span>
            <Link href="/login?mode=register" className="ml-2 font-semibold text-primary underline hover:text-primary/80">
              Save my portfolio →
            </Link>
          </>
        )}
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header / KPI Stats */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              {user ? `${user.name}'s Wealth Dashboard` : 'Portfolio Overview'}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Consolidated wealth dashboard across 20+ asset classes · Zero bank logins required
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportData}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border border-border rounded-md bg-card hover:bg-muted text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Portfolio
            </button>
            <button
              onClick={() => setIsAddAssetOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-primary text-primary-foreground rounded-md shadow hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Asset
            </button>
          </div>
        </div>

        {/* FinBoom-style Interactive Demo Action Bar */}
        <div className="bg-card border border-border rounded-xl p-3.5 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleImportZerodha}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Import from Zerodha
            </button>

            <button
              onClick={() => setShowInlineAdd(!showInlineAdd)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              Add asset
            </button>

            <button
              onClick={handleResetDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <strong className="text-foreground">{assets.length}</strong> holdings · sample data (100% Free)
          </div>
        </div>

        {/* Toast Feedback Banner */}
        {toastMessage && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage('')} className="text-xs opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Inline Asset Add Drawer (Identical to FinBoom) */}
        {showInlineAdd && (
          <form
            onSubmit={handleInlineAddSubmit}
            className="bg-card border border-primary/30 rounded-xl p-4 mb-6 shadow-md grid grid-cols-1 sm:grid-cols-4 gap-3 items-end animate-in fade-in"
          >
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SBI Bluechip"
                value={inlineName}
                onChange={(e) => setInlineName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Value ({currency})
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="100000"
                value={inlineValue}
                onChange={(e) => setInlineValue(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Type
              </label>
              <select
                value={inlineType}
                onChange={(e) => setInlineType(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="Mutual Fund">Mutual Fund</option>
                <option value="Stock">Stock</option>
                <option value="Gold">Gold</option>
                <option value="Fixed Deposit">Fixed Deposit</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Crypto">Crypto</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowInlineAdd(false)}
                className="h-9 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Net Worth */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Total Net Worth
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-2">
              {formatCurrency(netWorth, currency)}
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-2 text-primary font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{overallGainPercent.toFixed(1)}% ({formatCurrency(overallGain, currency, true)})</span>
            </div>
          </div>

          {/* Assets */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Total Assets
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-2">
              {formatCurrency(totalAssets, currency)}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {assets.length} tracked investments
            </div>
          </div>

          {/* Liabilities */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Total Liabilities
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-destructive mt-2">
              {formatCurrency(totalLiabilities, currency)}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {liabilities.length} active loans
            </div>
          </div>

          {/* Emergency Fund */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Emergency Runway
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-2">
              {emergencyMonthsCovered.toFixed(1)} <span className="text-base font-normal font-sans text-muted-foreground">months</span>
            </div>
            <div className="flex items-center gap-1 text-xs mt-2 font-medium text-primary">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{formatCurrency(liquidCash, currency, true)} liquid savings</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border mb-8 overflow-x-auto pb-1 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview & Growth
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'assets'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Assets ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('liabilities')}
            className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'liabilities'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Liabilities ({liabilities.length})
          </button>
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'cashflow'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Cashflow & Burn
          </button>
          <button
            onClick={() => setActiveTab('essentials')}
            className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'essentials'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Essentials Check
          </button>
        </div>

        {/* Tab Content: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <InteractiveAreaChart snapshots={INITIAL_SNAPSHOTS} currency={currency} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AssetBreakdownDonut assets={assets} currency={currency} />
              </div>

              {/* Geography Split */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-4">
                    Geography Exposure
                  </h3>
                  
                  {(() => {
                    const domestic = assets
                      .filter((a) => a.geographyTag === 'DOMESTIC')
                      .reduce((s, a) => s + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
                    const international = assets
                      .filter((a) => a.geographyTag === 'INTERNATIONAL')
                      .reduce((s, a) => s + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
                    const total = domestic + international || 1;
                    const domPct = (domestic / total) * 100;
                    const intPct = (international / total) * 100;

                    return (
                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
                          <div style={{ width: `${domPct}%` }} className="bg-blue-600" title="Domestic" />
                          <div style={{ width: `${intPct}%` }} className="bg-amber-600" title="International" />
                        </div>

                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                              <span className="font-semibold text-foreground">Domestic (India)</span>
                            </span>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(domestic, currency, true)} ({domPct.toFixed(1)}%)
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                              <span className="font-semibold text-foreground">International (US & Global)</span>
                            </span>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(international, currency, true)} ({intPct.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground leading-relaxed">
                  Tip: A healthy portfolio typically holds 10% to 25% international equity to hedge against single-country currency depreciation.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: ASSETS */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search assets or funds..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  className="w-full text-xs bg-card border border-border rounded-md pl-9 pr-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={assetCategoryFilter}
                  onChange={(e) => setAssetCategoryFilter(e.target.value)}
                  className="text-xs bg-card border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="EQUITY">Stocks & Equity</option>
                  <option value="DEBT">Debt & Fixed Income</option>
                  <option value="REAL_ESTATE">Real Estate</option>
                  <option value="COMMODITY">Gold & Commodities</option>
                  <option value="CASH">Cash & Liquid</option>
                  <option value="CRYPTO">Crypto</option>
                </select>

                <button
                  onClick={() => setIsAddAssetOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 bg-primary text-primary-foreground rounded-md shadow hover:bg-primary/90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>

            {/* Assets Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Asset Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Current Value</th>
                      <th className="py-3 px-4 text-right">Invested</th>
                      <th className="py-3 px-4 text-right">Gain / Loss</th>
                      <th className="py-3 px-4 text-center">Geography</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredAssets.map((asset) => {
                      const curVal = convertAmount(asset.currentValue, asset.currentCurrency, currency);
                      const invVal = convertAmount(asset.investedAmount, asset.currentCurrency, currency);
                      const gain = curVal - invVal;
                      const gainPct = invVal > 0 ? (gain / invVal) * 100 : 0;

                      return (
                        <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-foreground">
                            <div>{asset.name}</div>
                            {asset.subClass && (
                              <div className="text-[11px] text-muted-foreground font-normal">{asset.subClass}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground/80">
                              {asset.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-foreground">
                            {formatCurrency(curVal, currency)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-muted-foreground">
                            {formatCurrency(invVal, currency)}
                          </td>
                          <td className={`py-3.5 px-4 text-right font-semibold ${gain >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            {gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                            <div className="text-[10px] text-muted-foreground font-normal">
                              ({gain >= 0 ? '+' : ''}{formatCurrency(gain, currency, true)})
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              asset.geographyTag === 'DOMESTIC' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {asset.geographyTag === 'DOMESTIC' ? 'IN' : 'GLOBAL'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleDeleteAsset(asset.id)}
                              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                              title="Delete asset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: LIABILITIES */}
        {activeTab === 'liabilities' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">Active Liabilities & Loans</h3>
                <p className="text-xs text-muted-foreground">Track principal remaining, interest rates, and monthly EMI commitments.</p>
              </div>
              <button
                onClick={() => setIsAddLiabilityOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-destructive text-destructive-foreground rounded-md shadow hover:bg-destructive/90"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Liability
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Loan / Liability Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Lender</th>
                      <th className="py-3 px-4 text-right">Outstanding Principal</th>
                      <th className="py-3 px-4 text-right">Interest Rate</th>
                      <th className="py-3 px-4 text-right">Monthly EMI</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {liabilities.map((l) => {
                      const outAmt = convertAmount(l.outstandingAmount, l.currency, currency);
                      const emiAmt = convertAmount(l.monthlyEmi, l.currency, currency);

                      return (
                        <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-foreground">{l.name}</td>
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-foreground/80">
                              {l.liabilityType.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">{l.lender}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-destructive">
                            {formatCurrency(outAmt, currency)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-foreground">
                            {l.interestRate}% p.a.
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-foreground">
                            {formatCurrency(emiAmt, currency)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleDeleteLiability(l.id)}
                              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                              title="Delete liability"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: CASHFLOW */}
        {activeTab === 'cashflow' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Monthly Inflow
                </div>
                <div className="text-2xl font-serif font-bold text-primary mt-1">
                  +{formatCurrency(monthlyIncome, currency)}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Monthly Outflow
                </div>
                <div className="text-2xl font-serif font-bold text-destructive mt-1">
                  -{formatCurrency(monthlyExpenses, currency)}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Savings & Investment Rate
                </div>
                <div className="text-2xl font-serif font-bold text-foreground mt-1">
                  {savingsRate.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Transactions table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border font-serif text-base font-bold text-foreground">
                Recent Cashflow Entries
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {transactions.map((t) => {
                      const amt = convertAmount(t.amountBase, 'INR', currency);
                      const isIncome = t.type === 'INCOME';

                      return (
                        <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 text-muted-foreground">{t.date}</td>
                          <td className="py-3 px-4 font-semibold text-foreground">{t.description}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-muted font-medium text-foreground/80">
                              {t.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isIncome ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${isIncome ? 'text-primary' : 'text-destructive'}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(amt, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: ESSENTIALS CHECK */}
        {activeTab === 'essentials' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                Financial Health Diagnostic
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Evaluating emergency runway, debt ratio, and insurance adequacy.
              </p>

              <div className="space-y-6">
                {/* 1. Emergency Fund */}
                <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/30">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm">Emergency Fund Buffer</span>
                      <span className="text-xs font-bold text-primary">Healthy ({emergencyMonthsCovered.toFixed(1)} Months)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You hold {formatCurrency(liquidCash, currency, true)} in liquid savings against monthly expenses of {formatCurrency(monthlyExpenses, currency, true)}. Financial planners recommend maintaining 6 months of living expenses.
                    </p>
                  </div>
                </div>

                {/* 2. Debt Service Ratio */}
                <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/30">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm">Debt to Asset Ratio</span>
                      <span className="text-xs font-bold text-foreground">
                        {totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your total liabilities represent {totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0}% of your total assets. A ratio under 50% indicates sound leverage with healthy solvency.
                    </p>
                  </div>
                </div>

                {/* 3. Equity Diversification */}
                <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/30">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm">Asset Class Diversification</span>
                      <span className="text-xs font-bold text-amber-600">Balanced (6 Classes)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your portfolio is diversified across Equity, Debt, Real Estate, Commodities, and Liquid Cash.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onAdd={handleAddAsset}
        defaultCurrency={currency}
      />

      {/* Add Liability Modal */}
      <AddLiabilityModal
        isOpen={isAddLiabilityOpen}
        onClose={() => setIsAddLiabilityOpen(false)}
        onAdd={handleAddLiability}
        defaultCurrency={currency}
      />

      <Footer />
    </div>
  );
}
