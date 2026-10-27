'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Plus,
  Trash2,
  Calendar,
  BarChart3,
  CheckCircle2,
  X,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import WealthSubNav from '@/components/WealthSubNav';
import InteractiveAreaChart from '@/components/InteractiveAreaChart';
import { Snapshot, Asset, Liability } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { loadUserPortfolio, saveUserPortfolio } from '@/lib/portfolio-vault';

export default function SnapshotsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [filterView, setFilterView] = useState<'networth' | 'assets' | 'liabilities'>('networth');

  // Manual past entry modal
  const [isPastModalOpen, setIsPastModalOpen] = useState(false);
  const [pastDate, setPastDate] = useState(() => new Date().toISOString().slice(0, 7));
  const [pastNetWorth, setPastNetWorth] = useState('');
  const [pastLabel, setPastLabel] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/snapshots');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function initVault() {
      if (!user) return;
      setLoading(true);
      try {
        const portfolio = await loadUserPortfolio(user.id, user.email);
        setSnapshots(portfolio.snapshots || []);
        setAssets(portfolio.assets || []);
        setLiabilities(portfolio.liabilities || []);
        setCurrency(portfolio.currency || 'INR');
      } catch (err) {
        console.error('Failed to load user snapshots:', err);
      } finally {
        setLoading(false);
      }
    }
    initVault();
  }, [user]);

  const persistChanges = async (updatedSnapshots: Snapshot[]) => {
    if (!user) return;
    setSnapshots(updatedSnapshots);
    try {
      const currentVault = await loadUserPortfolio(user.id, user.email);
      await saveUserPortfolio({
        ...currentVault,
        currency,
        snapshots: updatedSnapshots,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error saving snapshots:', err);
    }
  };

  const currentTotalAssets = useMemo(() => {
    return assets.reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
  }, [assets, currency]);

  const currentTotalLiab = useMemo(() => {
    return liabilities.reduce((sum, l) => sum + convertAmount(l.outstandingAmount, l.currency, currency), 0);
  }, [liabilities, currency]);

  const currentNetWorth = currentTotalAssets - currentTotalLiab;

  const handleRecordSnapshot = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const newSnapshot: Snapshot = {
      id: `snap_${Date.now()}`,
      takenAt: currentMonth,
      label: `Checkpoint ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
      totalAssetsBase: Math.round(currentTotalAssets),
      totalLiabilitiesBase: Math.round(currentTotalLiab),
      netWorthBase: Math.round(currentNetWorth),
      baseCurrency: currency,
    };

    const updated = [newSnapshot, ...snapshots.filter((s) => s.takenAt !== newSnapshot.takenAt)];
    await persistChanges(updated);
  };

  const handleAddPastEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(pastNetWorth);
    if (!val || isNaN(val)) return;

    const newSnap: Snapshot = {
      id: `snap_past_${Date.now()}`,
      takenAt: pastDate,
      label: pastLabel.trim() || `Historical Entry (${pastDate})`,
      totalAssetsBase: Math.round(val),
      totalLiabilitiesBase: 0,
      netWorthBase: Math.round(val),
      baseCurrency: currency,
    };

    const updated = [...snapshots.filter((s) => s.takenAt !== pastDate), newSnap].sort((a, b) =>
      b.takenAt.localeCompare(a.takenAt)
    );
    await persistChanges(updated);
    setIsPastModalOpen(false);
    setPastNetWorth('');
    setPastLabel('');
  };

  const handleDeleteSnapshot = async (id: string) => {
    const filtered = snapshots.filter((s) => s.id !== id);
    await persistChanges(filtered);
  };

  return (
    <AppLayout
      currency={currency}
      onCurrencyChange={setCurrency}
      title="Snapshots"
      onTakeSnapshot={handleRecordSnapshot}
    >
      <div className="space-y-6">
        {/* Wealth Sub-Navigation */}
        <WealthSubNav />

        {/* Top Header: Title, Subtitle & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-foreground">Snapshots</h1>
              <span className="text-xs text-muted-foreground font-mono">
                {snapshots.length} {snapshots.length === 1 ? 'checkpoint' : 'checkpoints'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record periodic checkpoints to measure compounding returns and debt reduction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPastModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Add Historical
            </button>
            <button
              onClick={handleRecordSnapshot}
              className="px-4 py-2 rounded-xl bg-[#134e35] hover:bg-[#0f3d2a] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Take New Snapshot</span>
            </button>
          </div>
        </div>

        {/* Secondary View Toggle: Net Worth | Assets | Liabilities */}
        <div className="flex items-center gap-1.5 border-b border-border/80 pb-2">
          <button
            onClick={() => setFilterView('networth')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              filterView === 'networth'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Net Worth
          </button>
          <button
            onClick={() => setFilterView('assets')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              filterView === 'assets'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Assets
          </button>
          <button
            onClick={() => setFilterView('liabilities')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              filterView === 'liabilities'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Liabilities
          </button>
        </div>

        {/* Your Current Net Worth Card matching Image 4 */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            Your Current Net Worth
          </span>
          <div className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-3">
            {maskValue(formatCurrency(currentNetWorth, currency))}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div>
              Assets: <span className="font-semibold text-foreground">{maskValue(formatCurrency(currentTotalAssets, currency))}</span>
            </div>
            <div>
              Liabilities: <span className="font-semibold text-destructive">{maskValue(formatCurrency(currentTotalLiab, currency))}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed mb-4">
            Snapshots record your net worth at a point in time so you can track growth over months.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRecordSnapshot}
              className="px-4 py-2 rounded-xl bg-[#134e35] hover:bg-[#0f3d2a] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Take Your First Snapshot
            </button>
            <button
              onClick={() => setIsPastModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Add Past Entry
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground/80 mt-3">
            Tracked your net worth somewhere else before this? Add past entries so your chart starts with full history.
          </p>
        </div>

        {/* Interactive Growth Curve */}
        {snapshots.length > 0 && (
          <InteractiveAreaChart
            snapshots={snapshots}
            currency={currency}
            title="Net Worth Growth Curve"
          />
        )}

        {/* Historical Snapshots Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Historical Checkpoints ({snapshots.length})
            </h2>
            <div className="text-xs text-muted-foreground">Base Currency: {currency}</div>
          </div>

          {snapshots.length === 0 ? (
            <div className="text-center py-12 px-4">
              <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-foreground">No checkpoints recorded yet</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Take New Snapshot" to capture your current net worth checkpoint.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-4">Checkpoint Date</th>
                    <th className="p-4">Label</th>
                    <th className="p-4 text-right">Assets</th>
                    <th className="p-4 text-right">Liabilities</th>
                    <th className="p-4 text-right">Net Worth</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {snapshots.map((snap) => (
                    <tr key={snap.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-mono font-medium text-foreground">{snap.takenAt}</td>
                      <td className="p-4 text-muted-foreground">{snap.label || 'Monthly Checkpoint'}</td>
                      <td className="p-4 text-right font-mono text-muted-foreground">
                        {maskValue(formatCurrency(snap.totalAssetsBase, currency))}
                      </td>
                      <td className="p-4 text-right font-mono text-destructive">
                        {maskValue(formatCurrency(snap.totalLiabilitiesBase, currency))}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-primary">
                        {maskValue(formatCurrency(snap.netWorthBase, currency))}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteSnapshot(snap.id)}
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
      </div>

      {/* Modal for adding historical / past entry */}
      {isPastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif text-lg font-bold text-foreground">Add Past Checkpoint</h3>
              <button
                onClick={() => setIsPastModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPastEntry} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Month / Year *
                </label>
                <input
                  type="month"
                  required
                  value={pastDate}
                  onChange={(e) => setPastDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Net Worth Value ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 2500000"
                  value={pastNetWorth}
                  onChange={(e) => setPastNetWorth(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Checkpoint Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Year End 2025"
                  value={pastLabel}
                  onChange={(e) => setPastLabel(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPastModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Add Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
