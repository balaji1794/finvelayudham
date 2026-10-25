'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Download,
  ShieldCheck,
  Lock,
  KeyRound,
  Trash2,
  Sparkles,
  CheckCircle2,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Mail,
  Send,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import InteractiveAreaChart from '@/components/InteractiveAreaChart';
import AssetBreakdownDonut from '@/components/AssetBreakdownDonut';
import AddAssetModal from '@/components/AddAssetModal';
import AddLiabilityModal from '@/components/AddLiabilityModal';
import { Asset, Liability, Snapshot, Transaction } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import {
  UserPortfolio,
  loadUserPortfolio,
  saveUserPortfolio,
  loadStarterTemplate,
  purgeUserPortfolio,
} from '@/lib/portfolio-vault';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [currency, setCurrency] = useState('INR');
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'liabilities' | 'cashflow' | 'security'>('overview');
  const [vaultLoading, setVaultLoading] = useState(true);

  // User's private portfolio state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastSaved, setLastSaved] = useState<string>('');

  // Modals & Filters
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAddLiabilityOpen, setIsAddLiabilityOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Email Diagnostic State
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; delivered?: boolean; simulated?: boolean; message: string; previewHtml?: string } | null>(null);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);

  const handleSendTestEmail = async () => {
    if (!user) return;
    setEmailSending(true);
    setEmailStatus(null);
    try {
      const res = await fetch('/api/auth/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.name, type: 'welcome' }),
      });
      const data = await res.json();
      setEmailStatus(data);
    } catch (err: any) {
      setEmailStatus({
        success: false,
        delivered: false,
        message: err.message || 'Failed to dispatch email request',
      });
    } finally {
      setEmailSending(false);
    }
  };

  // Redirect to login if user is not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, authLoading, router]);

  // Load user's private encrypted vault
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

  // Save portfolio helper
  const persistChanges = async (
    newAssets: Asset[],
    newLiabilities: Liability[],
    newSnapshots?: Snapshot[],
    newTransactions?: Transaction[]
  ) => {
    if (!user) return;
    setSaveStatus('Encrypting & saving...');

    const nowIso = new Date().toISOString();
    const updatedSnapshots = newSnapshots || snapshots;
    const updatedTransactions = newTransactions || transactions;

    // Calculate current snapshot
    const totalA = newAssets.reduce((sum, a) => sum + a.currentValue, 0);
    const totalL = newLiabilities.reduce((sum, l) => sum + l.outstandingAmount, 0);
    const currentSnap: Snapshot = {
      id: `snap-${Date.now()}`,
      takenAt: new Date().toISOString().slice(0, 7),
      label: 'Monthly Snapshot',
      netWorthBase: totalA - totalL,
      totalAssetsBase: totalA,
      totalLiabilitiesBase: totalL,
      baseCurrency: 'INR',
    };

    const finalSnapshots =
      updatedSnapshots.length > 0 &&
      updatedSnapshots[updatedSnapshots.length - 1].takenAt === currentSnap.takenAt
        ? [...updatedSnapshots.slice(0, -1), currentSnap]
        : [...updatedSnapshots, currentSnap];

    setSnapshots(finalSnapshots);

    const portfolio: UserPortfolio = {
      userId: user.id,
      email: user.email,
      currency,
      assets: newAssets,
      liabilities: newLiabilities,
      snapshots: finalSnapshots,
      transactions: updatedTransactions,
      updatedAt: nowIso,
      isEncrypted: true,
    };

    const result = await saveUserPortfolio(portfolio);
    if (result.success) {
      setLastSaved(nowIso);
      setSaveStatus('Encrypted & Saved');
      setTimeout(() => setSaveStatus(''), 2500);
    } else {
      setSaveStatus('Error saving');
    }
  };

  // Add Asset Handler
  const handleAddAsset = async (newAsset: Asset) => {
    const updated = [newAsset, ...assets];
    setAssets(updated);
    await persistChanges(updated, liabilities);
  };

  // Delete Asset Handler
  const handleDeleteAsset = async (id: string) => {
    const updated = assets.filter((a) => a.id !== id);
    setAssets(updated);
    await persistChanges(updated, liabilities);
  };

  // Add Liability Handler
  const handleAddLiability = async (newLiability: Liability) => {
    const updated = [newLiability, ...liabilities];
    setLiabilities(updated);
    await persistChanges(assets, updated);
  };

  // Delete Liability Handler
  const handleDeleteLiability = async (id: string) => {
    const updated = liabilities.filter((l) => l.id !== id);
    setLiabilities(updated);
    await persistChanges(assets, updated);
  };

  // Load Starter Template
  const handleLoadStarter = async () => {
    if (!user) return;
    setVaultLoading(true);
    const starter = await loadStarterTemplate(user.id, user.email);
    setAssets(starter.assets);
    setLiabilities(starter.liabilities);
    setSnapshots(starter.snapshots);
    setLastSaved(starter.updatedAt);
    setVaultLoading(false);
  };

  // Purge Vault Handler
  const handlePurgeVault = async () => {
    if (!user) return;
    if (confirm('Are you absolutely sure you want to wipe all your portfolio data? This action is permanent and irreversible.')) {
      await purgeUserPortfolio(user.id);
      setAssets([]);
      setLiabilities([]);
      setSnapshots([]);
      setTransactions([]);
      alert('Your private vault has been completely wiped.');
    }
  };

  // Financial Calculations
  const totalAssets = useMemo(() => {
    return assets.reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
  }, [assets, currency]);

  const totalLiabilities = useMemo(() => {
    return liabilities.reduce((sum, l) => sum + convertAmount(l.outstandingAmount, l.currency, currency), 0);
  }, [liabilities, currency]);

  const netWorth = totalAssets - totalLiabilities;

  const totalInvested = useMemo(() => {
    return assets.reduce((sum, a) => sum + convertAmount(a.investedAmount || a.currentValue, a.currentCurrency, currency), 0);
  }, [assets, currency]);

  const unrealizedGains = totalAssets - totalInvested;
  const returnsPercentage = totalInvested > 0 ? (unrealizedGains / totalInvested) * 100 : 0;

  // Emergency runway calculation
  const liquidAssets = useMemo(() => {
    return assets
      .filter((a) => a.category === 'CASH')
      .reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
  }, [assets, currency]);

  const monthlyLiabilities = useMemo(() => {
    return liabilities.reduce((sum, l) => sum + convertAmount(l.monthlyEmi, l.currency, currency), 0);
  }, [liabilities, currency]);

  const emergencyRunwayMonths = monthlyLiabilities > 0 ? (liquidAssets / (monthlyLiabilities * 1.5)).toFixed(1) : '∞';

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.subClass && asset.subClass.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'ALL' || asset.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [assets, searchQuery, categoryFilter]);

  // Export Data JSON
  const handleExportData = () => {
    const exportObject = {
      appName: 'FinVelayudham',
      owner: user?.email,
      exportedAt: new Date().toISOString(),
      currency,
      netWorth,
      totalAssets,
      totalLiabilities,
      assets,
      liabilities,
      snapshots,
    };
    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finvelayudham-vault-${user?.email || 'backup'}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || (vaultLoading && user)) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar currentCurrency={currency} onCurrencyChange={setCurrency} />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
          <h2 className="text-lg font-bold text-foreground">Unlocking Your Private Encrypted Vault</h2>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" />
            256-bit AES encryption active · Authenticating session
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null; // Handled by redirect
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar currentCurrency={currency} onCurrencyChange={setCurrency} />

      {/* Security Banner */}
      <div className="bg-primary/10 border-b border-primary/20 py-2 px-4 text-center text-xs font-medium text-foreground flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <span>
          <strong>Private Vault Active:</strong> Encrypted for <strong>{user.name}</strong> ({user.email}). No bank passwords requested.
        </span>
        {saveStatus && (
          <span className="ml-3 text-[11px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold animate-pulse">
            {saveStatus}
          </span>
        )}
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header / KPI Stats */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl font-bold text-foreground">
                {user.name}&apos;s Wealth Vault
              </h1>
              <span className="text-[11px] bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" /> AES-256
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Private, zero-trust portfolio tracking across 20+ asset classes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportData}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border border-border rounded-md bg-card hover:bg-muted text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Vault
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

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Net Worth
            </span>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(netWorth, currency)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {returnsPercentage >= 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <span className="text-primary font-medium">
                    +{returnsPercentage.toFixed(1)}% ({formatCurrency(unrealizedGains, currency)})
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-destructive font-medium">
                    {returnsPercentage.toFixed(1)}% ({formatCurrency(unrealizedGains, currency)})
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Assets
            </span>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(totalAssets, currency)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {assets.length} tracked asset{assets.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Liabilities
            </span>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(totalLiabilities, currency)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {liabilities.length} active obligation{liabilities.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Emergency Runway
            </span>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {emergencyRunwayMonths} months
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {formatCurrency(liquidAssets, currency)} liquid cash
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Growth' },
            { id: 'assets', label: `Assets (${assets.length})` },
            { id: 'liabilities', label: `Liabilities (${liabilities.length})` },
            { id: 'cashflow', label: 'Cashflow & Runway' },
            { id: 'security', label: 'Security & Privacy' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* EMPTY STATE FOR BRAND NEW USERS */}
        {assets.length === 0 && activeTab !== 'security' && (
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-foreground">
              Welcome to Your Private Wealth Tracker
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-2 leading-relaxed">
              Your account is 100% private and protected by 256-bit encryption. You have zero bank credentials linked.
              Get started by adding your first asset or load a starter template:
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setIsAddAssetOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow text-xs hover:bg-primary/90 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Your First Asset
              </button>
              <button
                onClick={handleLoadStarter}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-border bg-muted/60 text-foreground font-semibold rounded-lg text-xs hover:bg-muted transition-all"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                Load Starter Template (3 Assets)
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW & GROWTH */}
        {activeTab === 'overview' && assets.length > 0 && (
          <div className="space-y-8">
            {/* Net Worth Chart */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Consolidated Net Worth Trend
                  </h3>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatCurrency(netWorth, currency)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Private Vault</div>
              </div>

              <div className="h-[280px] w-full">
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
                />
              </div>
            </div>

            {/* Asset Breakdown & Geography */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Asset Allocation by Class
                </h3>
                <AssetBreakdownDonut assets={assets} currency={currency} />
              </div>

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Geographic Exposure
                </h3>
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span>Domestic Investments</span>
                      <span className="font-bold">
                        {totalAssets > 0
                          ? (
                              (assets
                                .filter((a) => a.geographyTag === 'DOMESTIC')
                                .reduce((s, a) => s + convertAmount(a.currentValue, a.currentCurrency, currency), 0) /
                                totalAssets) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            totalAssets > 0
                              ? (assets
                                  .filter((a) => a.geographyTag === 'DOMESTIC')
                                  .reduce((s, a) => s + convertAmount(a.currentValue, a.currentCurrency, currency), 0) /
                                  totalAssets) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span>International Exposure</span>
                      <span className="font-bold">
                        {totalAssets > 0
                          ? (
                              (assets
                                .filter((a) => a.geographyTag === 'INTERNATIONAL')
                                .reduce((s, a) => s + convertAmount(a.currentValue, a.currentCurrency, currency), 0) /
                                totalAssets) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            totalAssets > 0
                              ? (assets
                                  .filter((a) => a.geographyTag === 'INTERNATIONAL')
                                  .reduce((s, a) => s + convertAmount(a.currentValue, a.currentCurrency, currency), 0) /
                                  totalAssets) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground mt-4 leading-relaxed">
                    Financial advisors typically recommend keeping 10-20% of your liquid wealth in international assets to hedge against domestic currency inflation.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ASSETS TABLE */}
        {activeTab === 'assets' && (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-muted/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="EQUITY">Equity</option>
                  <option value="DEBT">Fixed Income / Debt</option>
                  <option value="CASH">Cash & Bank</option>
                  <option value="REAL_ESTATE">Real Estate</option>
                  <option value="COMMODITY">Gold & Commodities</option>
                  <option value="CRYPTO">Crypto</option>
                </select>

                <button
                  onClick={() => setIsAddAssetOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow hover:bg-primary/90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Asset Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Current Value</th>
                    <th className="py-3 px-4 text-right">Invested</th>
                    <th className="py-3 px-4 text-right">Gain / Loss</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No assets found. Click &quot;Add Asset&quot; to track an investment.
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => {
                      const curVal = convertAmount(asset.currentValue, asset.currentCurrency, currency);
                      const invVal = convertAmount(asset.investedAmount || asset.currentValue, asset.currentCurrency, currency);
                      const gain = curVal - invVal;
                      const gainPct = invVal > 0 ? (gain / invVal) * 100 : 0;

                      return (
                        <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground">
                            <div>{asset.name}</div>
                            {asset.subClass && <div className="text-[10px] text-muted-foreground">{asset.subClass}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block text-[10px] font-semibold bg-muted px-2 py-0.5 rounded">
                              {asset.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-foreground">
                            {formatCurrency(curVal, currency)}
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground">
                            {formatCurrency(invVal, currency)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={gain >= 0 ? 'text-primary font-semibold' : 'text-destructive font-semibold'}>
                              {gain >= 0 ? '+' : ''}
                              {gainPct.toFixed(1)}% ({formatCurrency(gain, currency)})
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteAsset(asset.id)}
                              title="Delete asset"
                              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LIABILITIES TABLE */}
        {activeTab === 'liabilities' && (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                  Debts & Obligations
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Home loans, personal loans, vehicle loans, and credit balances
                </p>
              </div>
              <button
                onClick={() => setIsAddLiabilityOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow hover:bg-primary/90"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Liability
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Loan / Obligation</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Outstanding Balance</th>
                    <th className="py-3 px-4 text-right">Interest Rate</th>
                    <th className="py-3 px-4 text-right">Monthly EMI</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {liabilities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Zero liabilities recorded! You are debt-free.
                      </td>
                    </tr>
                  ) : (
                    liabilities.map((liab) => {
                      const outVal = convertAmount(liab.outstandingAmount, liab.currency, currency);
                      const emiVal = convertAmount(liab.monthlyEmi, liab.currency, currency);

                      return (
                        <tr key={liab.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground">
                            <div>{liab.name}</div>
                            {liab.lender && <div className="text-[10px] text-muted-foreground">Lender: {liab.lender}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block text-[10px] font-semibold bg-muted px-2 py-0.5 rounded">
                              {liab.liabilityType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-destructive">
                            {formatCurrency(outVal, currency)}
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground">
                            {liab.interestRate}% p.a.
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-foreground">
                            {formatCurrency(emiVal, currency)}/mo
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteLiability(liab.id)}
                              title="Delete liability"
                              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CASHFLOW & RUNWAY */}
        {activeTab === 'cashflow' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Emergency Runway Analysis
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-muted/40 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Liquid Emergency Funds</span>
                    <div className="text-xl font-bold text-foreground mt-0.5">
                      {formatCurrency(liquidAssets, currency)}
                    </div>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>

                <div className="p-4 bg-muted/40 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Monthly Debt Servicing (EMIs)</span>
                    <div className="text-xl font-bold text-destructive mt-0.5">
                      {formatCurrency(monthlyLiabilities, currency)}/mo
                    </div>
                  </div>
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>

                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                  <div className="text-xs font-semibold text-primary">Runway Projection</div>
                  <p className="text-xs text-foreground mt-1">
                    Based on your liquid savings, you have{' '}
                    <strong>{emergencyRunwayMonths} months</strong> of debt obligations covered without needing new income.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Recent Transactions
              </h3>
              <div className="divide-y divide-border">
                {transactions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    No transactions recorded yet. Transactions appear automatically when you record inflows or asset sales.
                  </div>
                ) : (
                  transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                          {tx.type === 'INCOME' ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-foreground">{tx.description}</div>
                          <div className="text-[10px] text-muted-foreground">{tx.date} · {tx.category}</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-foreground">
                        {formatCurrency(convertAmount(tx.amountBase, 'INR', currency), currency)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY & PRIVACY SETTINGS */}
        {activeTab === 'security' && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Cryptographic Security Specification</h3>
                  <p className="text-xs text-muted-foreground">How FinVelayudham protects your financial data</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-muted/40 rounded-lg border border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Vault Encryption</span>
                  <div className="text-xs font-bold text-foreground mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    AES-GCM-256 (NIST Standard)
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Payloads are encrypted in your browser using PBKDF2 (100,000 iterations).
                  </p>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg border border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Credential Exposure</span>
                  <div className="text-xs font-bold text-foreground mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    Zero Bank Credentials
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    No netbanking passwords, broker API keys, or OTPs ever leave your device.
                  </p>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg border border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Storage Isolation</span>
                  <div className="text-xs font-bold text-foreground mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    User-Scoped Enclave
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Data key is scoped strictly to user ID: <code className="text-[9px]">{user.id}</code>.
                  </p>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg border border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Last Encrypted Save</span>
                  <div className="text-xs font-bold text-foreground mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    {lastSaved ? new Date(lastSaved).toLocaleString() : 'Never'}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Auto-saved on every change with cryptographic timestamp.
                  </p>
                </div>
              </div>
            </div>

            {/* Email Verification & Dispatch Diagnostics */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Transactional Email Delivery Status</h3>
                    <p className="text-xs text-muted-foreground">Registered recipient: <strong>{user.email}</strong></p>
                  </div>
                </div>

                <button
                  onClick={handleSendTestEmail}
                  disabled={emailSending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {emailSending ? 'Dispatching...' : 'Send Test Email'}
                </button>
              </div>

              {emailStatus && (
                <div
                  className={`p-3.5 rounded-lg text-xs border ${
                    emailStatus.delivered
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {emailStatus.delivered ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-semibold">
                        {emailStatus.delivered ? 'Live Email Dispatched!' : 'Email Generated in Simulation Mode'}
                      </div>
                      <p className="text-[11px] leading-relaxed">{emailStatus.message}</p>
                      {emailStatus.previewHtml && (
                        <button
                          onClick={() => setShowEmailPreviewModal(true)}
                          className="mt-1 text-primary font-bold underline hover:opacity-80 block"
                        >
                          Preview Generated Email Template →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step-by-step Setup Guide */}
              <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-3">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>How to connect real-world delivery to your Gmail inbox (2 Steps)</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Google Mail and spam filters block unauthenticated web servers from sending mail directly to Gmail addresses.
                  To have welcome emails land directly in <strong>{user.email}</strong>, connect a free transactional relay:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-card border border-border rounded-lg text-xs space-y-1.5">
                    <div className="font-semibold text-foreground flex items-center justify-between">
                      <span>Option A: Resend (Recommended)</span>
                      <span className="text-[10px] text-primary font-bold">3,000 Free/Mo</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      1. Sign up at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">resend.com</a><br/>
                      2. Add <code className="bg-muted px-1 py-0.5 rounded">RESEND_API_KEY</code> to your Vercel Project Environment Variables.
                    </p>
                  </div>

                  <div className="p-3 bg-card border border-border rounded-lg text-xs space-y-1.5">
                    <div className="font-semibold text-foreground flex items-center justify-between">
                      <span>Option B: Gmail SMTP</span>
                      <span className="text-[10px] text-primary font-bold">Your Gmail</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      1. Generate Google App Password in Google Account Security.<br/>
                      2. Add <code className="bg-muted px-1 py-0.5 rounded">SMTP_USER</code> and <code className="bg-muted px-1 py-0.5 rounded">SMTP_PASS</code> in Vercel.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Management Actions */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Data Export & Deletion Rights</h3>
              <p className="text-xs text-muted-foreground">
                In compliance with privacy standards and GDPR Right to Erasure, you have complete sovereignty over your data.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleExportData}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Backup (JSON)
                </button>

                <button
                  onClick={handlePurgeVault}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-destructive/40 text-destructive rounded-lg text-xs font-semibold hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Permanently Wipe My Vault
                </button>
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

      {/* Email Preview Modal */}
      {showEmailPreviewModal && emailStatus?.previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
              <div>
                <h3 className="font-semibold text-sm text-foreground">Generated Email Template Preview</h3>
                <p className="text-[11px] text-muted-foreground">Recipient: {user.email}</p>
              </div>
              <button
                onClick={() => setShowEmailPreviewModal(false)}
                className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg border border-border font-medium"
              >
                Close Preview
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-zinc-900">
              <iframe
                title="Email Preview"
                srcDoc={emailStatus.previewHtml}
                className="w-full h-[500px] border-0 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
