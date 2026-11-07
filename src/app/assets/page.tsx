'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Trash2,
  PieChart,
  Coins,
  Wallet,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import WealthSubNav from '@/components/WealthSubNav';
import AddAssetModal from '@/components/AddAssetModal';
import { Asset } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { loadUserPortfolio, saveUserPortfolio, loadStarterTemplate } from '@/lib/portfolio-vault';

export default function AssetsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/assets');
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
        console.error('Failed to load user assets:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      initVault();
    }

    const handleSynced = () => {
      if (user) initVault();
    };
    window.addEventListener('finvelayudham_vault_synced', handleSynced);
    return () => window.removeEventListener('finvelayudham_vault_synced', handleSynced);
  }, [user]);

  const persistChanges = async (updatedAssets: Asset[]) => {
    if (!user) return;
    setAssets(updatedAssets);
    try {
      const currentVault = await loadUserPortfolio(user.id, user.email);
      await saveUserPortfolio({
        ...currentVault,
        assets: updatedAssets,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to save assets:', err);
    }
  };

  const handleAddAsset = async (newAsset: Asset) => {
    const updated = [newAsset, ...assets];
    await persistChanges(updated);
  };

  const handleDeleteAsset = async (id: string) => {
    const updated = assets.filter((a) => a.id !== id);
    await persistChanges(updated);
  };

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Metrics
  const totalValue = useMemo(() => {
    return assets.reduce(
      (sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency),
      0
    );
  }, [assets, currency]);

  const totalInvested = useMemo(() => {
    return assets.reduce(
      (sum, a) => sum + convertAmount(a.investedAmount || a.currentValue, a.currentCurrency, currency),
      0
    );
  }, [assets, currency]);

  const totalGain = totalValue - totalInvested;
  const gainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // Group assets by category
  const groupedAssets = useMemo(() => {
    const groups: Record<string, Asset[]> = {};
    assets
      .filter((a) => {
        const matchesSearch =
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.subClass && a.subClass.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory =
          activeCategoryFilter === 'ALL' || a.category === activeCategoryFilter;
        return matchesSearch && matchesCategory;
      })
      .forEach((asset) => {
        const cat = asset.category || 'OTHER';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(asset);
      });
    return groups;
  }, [assets, searchQuery, activeCategoryFilter]);

  const categoryNames = useMemo(() => {
    const set = new Set(assets.map((a) => a.category));
    return Array.from(set);
  }, [assets]);

  return (
    <AppLayout
      currency={currency}
      onCurrencyChange={setCurrency}
      title="Assets"
      onAddAsset={handleAddAsset}
    >
      <div className="space-y-6">
        {/* Wealth Sub-Navigation Bar */}
        <WealthSubNav />

        {/* Top Header: Title, Count & Add Asset Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-foreground">Assets</h1>
              <span className="text-xs text-muted-foreground font-mono">
                {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Encrypted holdings across stocks, mutual funds, gold, fixed deposits, and cash.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddAssetOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#134e35] hover:bg-[#0f3d2a] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Asset</span>
            </button>
          </div>
        </div>

        {/* Top Metrics Row matching Image 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-1">
              Total Assets
            </span>
            <div className="text-xl sm:text-2xl font-serif font-bold text-foreground">
              {maskValue(formatCurrency(totalValue, currency))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-1">
              Invested Capital
            </span>
            <div className="text-xl sm:text-2xl font-serif font-bold text-foreground">
              {maskValue(formatCurrency(totalInvested, currency))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-1">
              Current Value
            </span>
            <div className="text-xl sm:text-2xl font-serif font-bold text-foreground">
              {maskValue(formatCurrency(totalValue, currency))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-1">
              Total P&L
            </span>
            <div
              className={`text-xl sm:text-2xl font-serif font-bold ${
                totalGain >= 0 ? 'text-primary' : 'text-destructive'
              }`}
            >
              {totalGain >= 0 ? '+' : ''}
              {maskValue(formatCurrency(totalGain, currency))}
              <span className="text-xs font-sans ml-1.5 font-normal">
                ({gainPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategoryFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeCategoryFilter === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              All Assets ({assets.length})
            </button>
            {categoryNames.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap capitalize ${
                  activeCategoryFilter === cat
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.toLowerCase().replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Grouped Accordions matching Image 2 */}
        {Object.keys(groupedAssets).length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Coins className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold text-base text-foreground">No assets found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Add your mutual funds, EPF, PPF, or stocks using the "+ Add Asset" button above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedAssets).map(([category, items]) => {
              const groupTotal = items.reduce(
                (sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency),
                0
              );
              const groupInvested = items.reduce(
                (sum, a) => sum + convertAmount(a.investedAmount || a.currentValue, a.currentCurrency, currency),
                0
              );
              const isCollapsed = collapsedGroups[category];

              return (
                <div key={category} className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                  {/* Category Header */}
                  <div
                    onClick={() => toggleGroupCollapse(category)}
                    className="p-4 bg-muted/30 border-b border-border/80 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <h3 className="font-bold text-sm text-foreground capitalize">
                        {category.toLowerCase().replace(/_/g, ' ')}
                      </h3>
                      <span className="text-xs text-muted-foreground font-mono font-medium">
                        ({items.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-foreground font-mono">
                        {maskValue(formatCurrency(groupTotal, currency))}
                      </span>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Category Table */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/20 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                          <tr>
                            <th className="p-3 sm:p-4">Asset Name</th>
                            <th className="p-3 sm:p-4 text-right">Invested</th>
                            <th className="p-3 sm:p-4 text-right">Current Value</th>
                            <th className="p-3 sm:p-4 text-right">P&L</th>
                            <th className="p-3 sm:p-4 text-right">Weight</th>
                            <th className="p-3 sm:p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {items.map((asset) => {
                            const val = convertAmount(asset.currentValue, asset.currentCurrency, currency);
                            const inv = convertAmount(asset.investedAmount || asset.currentValue, asset.currentCurrency, currency);
                            const gain = val - inv;
                            const gainPct = inv > 0 ? (gain / inv) * 100 : 0;
                            const weight = totalValue > 0 ? (val / totalValue) * 100 : 0;

                            return (
                              <tr key={asset.id} className="hover:bg-muted/20 transition-colors">
                                <td className="p-3 sm:p-4 font-semibold text-foreground">
                                  <div>{asset.name}</div>
                                  {asset.subClass && (
                                    <div className="text-[11px] font-normal text-muted-foreground mt-0.5">
                                      {asset.subClass}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 sm:p-4 text-right text-muted-foreground font-mono">
                                  {maskValue(formatCurrency(inv, currency))}
                                </td>
                                <td className="p-3 sm:p-4 text-right font-bold text-foreground font-mono">
                                  {maskValue(formatCurrency(val, currency))}
                                </td>
                                <td
                                  className={`p-3 sm:p-4 text-right font-mono font-semibold ${
                                    gain >= 0 ? 'text-primary' : 'text-destructive'
                                  }`}
                                >
                                  {gain >= 0 ? '+' : ''}
                                  {maskValue(formatCurrency(gain, currency))}
                                  <span className="block text-[10px]">
                                    ({gainPct.toFixed(1)}%)
                                  </span>
                                </td>
                                <td className="p-3 sm:p-4 text-right font-mono text-muted-foreground">
                                  {weight.toFixed(1)}%
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
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onAdd={(asset) => {
          handleAddAsset(asset);
          setIsAddAssetOpen(false);
        }}
        defaultCurrency={currency}
      />
    </AppLayout>
  );
}
