'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Plus,
  Coins,
  CreditCard,
  PieChart,
  Camera,
  Search,
  Trash2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import InteractiveAreaChart from '@/components/InteractiveAreaChart';
import AssetBreakdownDonut from '@/components/AssetBreakdownDonut';
import { Asset, Liability, Snapshot, Transaction } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import {
  loadUserPortfolio,
  saveUserPortfolio,
  UserPortfolio,
} from '@/lib/portfolio-vault';

export default function WealthPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [activeTab, setActiveTab] = useState<'holdings' | 'allocation' | 'liabilities' | 'snapshots'>('holdings');
  const [vaultLoading, setVaultLoading] = useState(true);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/wealth');
    }
  }, [user, authLoading, router]);

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
      } catch (err) {
        console.error('Failed to load vault in wealth page:', err);
      } finally {
        setVaultLoading(false);
      }
    }
    if (user) {
      initVault();
    }
  }, [user]);

  const persist = async (newAssets: Asset[], newLiabilities: Liability[], newSnapshots?: Snapshot[]) => {
    if (!user) return;
    const finalSnapshots = newSnapshots || snapshots;
    const portfolio: UserPortfolio = {
      userId: user.id,
      email: user.email,
      currency,
      assets: newAssets,
      liabilities: newLiabilities,
      snapshots: finalSnapshots,
      transactions,
      updatedAt: new Date().toISOString(),
      isEncrypted: true,
    };
    await saveUserPortfolio(portfolio);
  };

  const handleAddAsset = async (newAsset: Asset) => {
    const updated = [newAsset, ...assets];
    setAssets(updated);
    await persist(updated, liabilities);
  };

  const handleDeleteAsset = async (id: string) => {
    const updated = assets.filter((a) => a.id !== id);
    setAssets(updated);
    await persist(updated, liabilities);
  };

  const handleAddLiability = async (newLiability: Liability) => {
    const updated = [newLiability, ...liabilities];
    setLiabilities(updated);
    await persist(assets, updated);
  };

  const handleDeleteLiability = async (id: string) => {
    const updated = liabilities.filter((l) => l.id !== id);
    setLiabilities(updated);
    await persist(assets, updated);
  };

  const handleTakeSnapshot = async () => {
    const totalA = assets.reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
    const totalL = liabilities.reduce((sum, l) => sum + convertAmount(l.outstandingAmount, l.currency, currency), 0);
    const newSnap: Snapshot = {
      id: `snap-${Date.now()}`,
      takenAt: new Date().toISOString().slice(0, 7),
      label: 'Manual Checkpoint',
      netWorthBase: totalA - totalL,
      totalAssetsBase: totalA,
      totalLiabilitiesBase: totalL,
      baseCurrency: currency,
    };
    const updated = [...snapshots, newSnap];
    setSnapshots(updated);
    await persist(assets, liabilities, updated);
  };

  const totalAssets = assets.reduce(
    (sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency),
    0
  );
  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + convertAmount(l.outstandingAmount, l.currency, currency),
    0
  );
  const netWorth = totalAssets - totalLiabilities;

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.subClass && a.subClass.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout
      currency={currency}
      onCurrencyChange={setCurrency}
      title="Wealth Hub"
      onAddAsset={handleAddAsset}
      onAddLiability={handleAddLiability}
      onTakeSnapshot={handleTakeSnapshot}
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                Consolidated Wealth Trajectory
              </span>
              <div className="text-3xl sm:text-4xl font-serif font-bold text-foreground mt-1">
                {maskValue(formatCurrency(netWorth, currency))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {assets.length} Assets · {liabilities.length} Liabilities · Private encrypted storage
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                100% Free · Pro Unlocked
              </span>
            </div>
          </div>
        </div>

        {/* Wealth Tabs */}
        <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('holdings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'holdings'
                ? 'border-b-2 border-primary text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Holdings ({assets.length})
          </button>

          <button
            onClick={() => setActiveTab('allocation')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'allocation'
                ? 'border-b-2 border-primary text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Asset Allocation
          </button>

          <button
            onClick={() => setActiveTab('liabilities')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'liabilities'
                ? 'border-b-2 border-primary text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Liabilities ({liabilities.length})
          </button>

          <button
            onClick={() => setActiveTab('snapshots')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'snapshots'
                ? 'border-b-2 border-primary text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Snapshots & Growth
          </button>
        </div>

        {/* Tab 1: Holdings */}
        {activeTab === 'holdings' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter holdings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ALL">All Asset Classes</option>
                  <option value="EQUITY">Equity & Stocks</option>
                  <option value="MUTUAL_FUNDS">Mutual Funds</option>
                  <option value="FIXED_INCOME">Fixed Income (EPF/PPF/FD)</option>
                  <option value="REAL_ESTATE">Real Estate</option>
                  <option value="COMMODITIES">Gold & Commodities</option>
                  <option value="CASH">Cash & Bank</option>
                </select>
              </div>
            </div>

            {filteredAssets.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-2xl p-6">
                <Coins className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">No assets found</p>
                <p className="text-xs text-muted-foreground mt-1">Use the "+ Add" button on the sidebar to log an asset.</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border uppercase tracking-wider text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3 sm:p-4">Asset Name</th>
                      <th className="p-3 sm:p-4">Category</th>
                      <th className="p-3 sm:p-4 text-right">Current Value</th>
                      <th className="p-3 sm:p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 sm:p-4 font-semibold text-foreground">
                          {asset.name}
                          {asset.subClass && (
                            <span className="block text-[11px] font-normal text-muted-foreground">
                              {asset.subClass}
                            </span>
                          )}
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                            {asset.category}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-right font-bold text-foreground">
                          {maskValue(
                            formatCurrency(
                              convertAmount(asset.currentValue, asset.currentCurrency, currency),
                              currency
                            )
                          )}
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Delete asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Allocation */}
        {activeTab === 'allocation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs uppercase font-semibold tracking-wider text-muted-foreground mb-4">
                Asset Allocation by Class
              </h3>
              <AssetBreakdownDonut assets={assets} currency={currency} />
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                Target Allocation Health
              </h3>
              <p className="text-xs text-muted-foreground">
                FinVelayudham recommends keeping 60-70% in growth assets (Equity & Mutual Funds) and 30-40% in stable assets (Debt, EPF, Gold, Cash).
              </p>
              <div className="p-4 rounded-xl bg-muted/60 border border-border/80">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Growth Assets</span>
                  <span>70% Target</span>
                </div>
                <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Liabilities */}
        {activeTab === 'liabilities' && (
          <div className="space-y-4">
            {liabilities.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-2xl p-6">
                <CreditCard className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">Zero liabilities recorded</p>
                <p className="text-xs text-muted-foreground mt-1">Debt-free! Or click "+ Add" on sidebar to add a loan.</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border uppercase tracking-wider text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-4">Liability</th>
                      <th className="p-4">Type</th>
                      <th className="p-4 text-right">Outstanding</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {liabilities.map((l) => (
                      <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-semibold text-foreground">{l.name}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[10px] font-bold">
                            {l.liabilityType || 'LOAN'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-destructive">
                          {maskValue(
                            formatCurrency(
                              convertAmount(l.outstandingAmount, l.currency, currency),
                              currency
                            )
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteLiability(l.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Snapshots */}
        {activeTab === 'snapshots' && (
          <div className="space-y-6">
            <InteractiveAreaChart
              snapshots={
                snapshots.length > 0
                  ? snapshots
                  : [
                      {
                        id: 's-curr',
                        takenAt: new Date().toISOString().slice(0, 7),
                        label: 'Current Checkpoint',
                        netWorthBase: netWorth,
                        totalAssetsBase: totalAssets,
                        totalLiabilitiesBase: totalLiabilities,
                        baseCurrency: currency,
                      },
                    ]
              }
              currency={currency}
              title="Net Worth Growth Trajectory"
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
