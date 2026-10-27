'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Trash2,
  PieChart,
  ArrowUpRight,
  ShieldCheck,
  Building,
  Coins,
  Wallet,
  Landmark,
  CircleDollarSign,
  Globe,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AddAssetModal from '@/components/AddAssetModal';
import { Asset } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import {
  loadUserPortfolio,
  saveUserPortfolio,
  loadStarterTemplate,
} from '@/lib/portfolio-vault';

export default function AssetsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [geographyFilter, setGeographyFilter] = useState<'ALL' | 'DOMESTIC' | 'INTERNATIONAL'>('ALL');
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Redirect to login if user is not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/assets');
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
        console.error('Failed to load user assets:', err);
      } finally {
        setLoading(false);
      }
    }
    initVault();
  }, [user]);

  // Save changes to encrypted vault
  const persistChanges = async (updatedAssets: Asset[]) => {
    if (!user) return;
    setAssets(updatedAssets);
    setSaveStatus('Encrypting & Saving...');
    try {
      const currentVault = await loadUserPortfolio(user.id, user.email);
      await saveUserPortfolio({
        ...currentVault,
        currency,
        assets: updatedAssets,
      });
      setSaveStatus('Encrypted & Synced');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch (err) {
      console.error('Error saving assets:', err);
      setSaveStatus('Save Failed');
    }
  };

  const handleAddAsset = async (newAsset: Asset) => {
    await persistChanges([...assets, newAsset]);
    setIsAddAssetOpen(false);
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      const filtered = assets.filter((a) => a.id !== id);
      await persistChanges(filtered);
    }
  };

  // Convert asset value to current chosen currency
  const getConvertedValue = (val: number, assetCurr: string) => {
    return convertAmount(val, assetCurr, currency);
  };

  // Computations
  const totalValue = useMemo(() => {
    return assets.reduce((sum, a) => sum + getConvertedValue(a.currentValue, a.currentCurrency), 0);
  }, [assets, currency]);

  const totalInvested = useMemo(() => {
    return assets.reduce((sum, a) => sum + getConvertedValue(a.investedAmount, a.currentCurrency), 0);
  }, [assets, currency]);

  const totalGain = totalValue - totalInvested;
  const gainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.subClass && asset.subClass.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (asset.ticker && asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === 'ALL' || asset.category === categoryFilter;
      const matchesGeo = geographyFilter === 'ALL' || asset.geographyTag === geographyFilter;

      return matchesSearch && matchesCategory && matchesGeo;
    });
  }, [assets, searchQuery, categoryFilter, geographyFilter]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'EQUITY':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'DEBT':
        return <Landmark className="w-4 h-4 text-blue-500" />;
      case 'REAL_ESTATE':
        return <Building className="w-4 h-4 text-amber-500" />;
      case 'COMMODITY':
        return <Coins className="w-4 h-4 text-yellow-500" />;
      case 'CRYPTO':
        return <CircleDollarSign className="w-4 h-4 text-purple-500" />;
      default:
        return <Wallet className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar currentCurrency={currency} onCurrencyChange={setCurrency} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
                Assets Portfolio
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                AES-256 Encrypted
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Track mutual funds, Indian & US stocks, EPF, PPF, real estate, gold, and cash.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className="text-xs font-medium text-primary animate-pulse">
                {saveStatus}
              </span>
            )}
            <button
              onClick={() => setIsAddAssetOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:bg-primary/90 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Asset
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Total Assets Value
            </div>
            <div className="font-serif text-2xl font-bold text-foreground">
              {formatCurrency(totalValue, currency)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Across {assets.length} tracked assets
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Total Invested Capital
            </div>
            <div className="font-serif text-2xl font-bold text-foreground">
              {formatCurrency(totalInvested, currency)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Cost basis across holdings</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Absolute Gains / Profit
            </div>
            <div
              className={`font-serif text-2xl font-bold flex items-center gap-1.5 ${
                totalGain >= 0 ? 'text-primary' : 'text-destructive'
              }`}
            >
              {totalGain >= 0 ? '+' : ''}
              {formatCurrency(totalGain, currency)}
            </div>
            <div
              className={`text-xs font-semibold mt-1 flex items-center gap-1 ${
                gainPercentage >= 0 ? 'text-primary' : 'text-destructive'
              }`}
            >
              {gainPercentage >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {gainPercentage.toFixed(2)}% Return
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Global Diversification
            </div>
            <div className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <span>
                {(
                  (assets
                    .filter((a) => a.geographyTag === 'INTERNATIONAL')
                    .reduce((sum, a) => sum + getConvertedValue(a.currentValue, a.currentCurrency), 0) /
                    (totalValue || 1)) *
                  100
                ).toFixed(1)}
                % Global
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">US Stocks & Global ETFs</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-card border border-border rounded-xl p-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search assets by name, ticker, or subclass..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'EQUITY', 'DEBT', 'REAL_ESTATE', 'COMMODITY', 'CASH', 'CRYPTO'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  categoryFilter === cat
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat === 'COMMODITY' ? 'GOLD / COMMODITY' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border-l border-border pl-3">
            {(['ALL', 'DOMESTIC', 'INTERNATIONAL'] as const).map((geo) => (
              <button
                key={geo}
                onClick={() => setGeographyFilter(geo)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  geographyFilter === geo
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {geo === 'ALL' ? 'All Geo' : geo === 'DOMESTIC' ? 'India' : 'US / Global'}
              </button>
            ))}
          </div>
        </div>

        {/* Asset Table / List */}
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Assets Breakdown ({filteredAssets.length})
            </h2>
            <div className="text-xs text-muted-foreground">Values shown in {currency}</div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="text-center py-16 px-4">
              <PieChart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">No assets found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchQuery || categoryFilter !== 'ALL'
                  ? 'No holdings match your current search and category filters.'
                  : 'Start tracking your wealth by adding your first mutual fund, stock, or savings account.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsAddAssetOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  Add Asset Now
                </button>
                <button
                  onClick={async () => {
                    if (!user) return;
                    setLoading(true);
                    const starter = await loadStarterTemplate(user.id, user.email);
                    setAssets(starter.assets);
                    setLoading(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card text-foreground font-semibold rounded-lg text-xs hover:bg-muted"
                >
                  Load Sample Assets
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Asset Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Geography</th>
                    <th className="py-3 px-4 text-right">Invested</th>
                    <th className="py-3 px-4 text-right">Current Value</th>
                    <th className="py-3 px-4 text-right">Return</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAssets.map((asset) => {
                    const convCurr = getConvertedValue(asset.currentValue, asset.currentCurrency);
                    const convInv = getConvertedValue(asset.investedAmount, asset.currentCurrency);
                    const gain = convCurr - convInv;
                    const gainPct = convInv > 0 ? (gain / convInv) * 100 : 0;

                    return (
                      <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted border border-border">
                              {getCategoryIcon(asset.category)}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{asset.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {asset.productType}
                                {asset.subClass ? ` · ${asset.subClass}` : ''}
                                {asset.ticker ? ` (${asset.ticker})` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-foreground">
                            {asset.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                              asset.geographyTag === 'INTERNATIONAL'
                                ? 'text-blue-500'
                                : 'text-emerald-500'
                            }`}
                          >
                            <Globe className="w-3 h-3" />
                            {asset.geographyTag === 'INTERNATIONAL' ? 'Global / US' : 'India'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-muted-foreground text-xs">
                          {formatCurrency(convInv, currency)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                          {formatCurrency(convCurr, currency)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-xs">
                          <div
                            className={`font-semibold ${
                              gain >= 0 ? 'text-primary' : 'text-destructive'
                            }`}
                          >
                            {gain >= 0 ? '+' : ''}
                            {formatCurrency(gain, currency)}
                          </div>
                          <div
                            className={`text-[10px] ${
                              gainPct >= 0 ? 'text-primary' : 'text-destructive'
                            }`}
                          >
                            {gainPct >= 0 ? '+' : ''}
                            {gainPct.toFixed(2)}%
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onAdd={handleAddAsset}
        defaultCurrency={currency}
      />

      <Footer />
    </div>
  );
}
