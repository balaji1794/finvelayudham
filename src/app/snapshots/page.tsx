'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Plus,
  Trash2,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  BarChart3,
  Clock,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import InteractiveAreaChart from '@/components/InteractiveAreaChart';
import { Snapshot, Asset, Liability } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import {
  loadUserPortfolio,
  saveUserPortfolio,
} from '@/lib/portfolio-vault';

export default function SnapshotsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [customLabel, setCustomLabel] = useState('');

  // Redirect to login if user is not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/snapshots');
    }
  }, [user, authLoading, router]);

  // Load user's private encrypted vault
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

  // Save changes to encrypted vault
  const persistChanges = async (updatedSnapshots: Snapshot[]) => {
    if (!user) return;
    setSnapshots(updatedSnapshots);
    setSaveStatus('Encrypting & Saving...');
    try {
      const currentVault = await loadUserPortfolio(user.id, user.email);
      await saveUserPortfolio({
        ...currentVault,
        currency,
        snapshots: updatedSnapshots,
      });
      setSaveStatus('Encrypted & Synced');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch (err) {
      console.error('Error saving snapshots:', err);
      setSaveStatus('Save Failed');
    }
  };

  // Record a new snapshot from current live portfolio
  const handleRecordSnapshot = async () => {
    const totalAssets = assets.reduce(
      (sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency),
      0
    );
    const totalLiab = liabilities.reduce(
      (sum, l) => sum + convertAmount(l.outstandingAmount, l.currency, currency),
      0
    );
    const netWorth = totalAssets - totalLiab;

    const newSnapshot: Snapshot = {
      id: 'snap_' + Math.random().toString(36).substring(2, 9),
      takenAt: new Date().toISOString().slice(0, 7), // YYYY-MM
      label: customLabel.trim() || `Snapshot ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
      totalAssetsBase: Math.round(totalAssets),
      totalLiabilitiesBase: Math.round(totalLiab),
      netWorthBase: Math.round(netWorth),
      baseCurrency: currency,
    };

    // Replace if same month exists or prepend
    const updated = [newSnapshot, ...snapshots.filter((s) => s.takenAt !== newSnapshot.takenAt)];
    await persistChanges(updated);
    setCustomLabel('');
  };

  const handleDeleteSnapshot = async (id: string) => {
    if (confirm('Delete this historical checkpoint?')) {
      const filtered = snapshots.filter((s) => s.id !== id);
      await persistChanges(filtered);
    }
  };

  // Export snapshots to CSV
  const handleExportCSV = () => {
    if (snapshots.length === 0) return;
    const headers = ['Month', 'Label', 'Total Assets', 'Total Liabilities', 'Net Worth', 'Currency'];
    const rows = snapshots.map((s) => [
      s.takenAt,
      `"${s.label || ''}"`,
      s.totalAssetsBase,
      s.totalLiabilitiesBase,
      s.netWorthBase,
      s.baseCurrency,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finvelayudham_snapshots_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Computations
  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  }, [snapshots]);

  const latestNetWorth = sortedSnapshots[0]?.netWorthBase || 0;
  const oldestNetWorth = sortedSnapshots[sortedSnapshots.length - 1]?.netWorthBase || 0;
  const overallGrowth = latestNetWorth - oldestNetWorth;
  const overallGrowthPct = oldestNetWorth > 0 ? (overallGrowth / oldestNetWorth) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar currentCurrency={currency} onCurrencyChange={setCurrency} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
                Net Worth Snapshots
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Historical Timeline
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Monthly checkpoints of your assets, liabilities, and true wealth progression.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className="text-xs font-medium text-primary animate-pulse">
                {saveStatus}
              </span>
            )}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-muted shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Snapshot Recording Bar */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Snapshot label (optional, e.g. Year-end appraisal, Bonus credited)"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              className="w-full text-xs bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleRecordSnapshot}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs shadow hover:bg-primary/90 transition-all whitespace-nowrap"
          >
            <Camera className="w-4 h-4" />
            Record Snapshot Today
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Latest Recorded Net Worth
            </div>
            <div className="font-serif text-2xl font-bold text-foreground">
              {formatCurrency(latestNetWorth, currency)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {sortedSnapshots[0]?.takenAt || 'No snapshots yet'}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Total Wealth Growth
            </div>
            <div
              className={`font-serif text-2xl font-bold ${
                overallGrowth >= 0 ? 'text-primary' : 'text-destructive'
              }`}
            >
              {overallGrowth >= 0 ? '+' : ''}
              {formatCurrency(overallGrowth, currency)}
            </div>
            <div
              className={`text-xs font-semibold mt-1 flex items-center gap-1 ${
                overallGrowthPct >= 0 ? 'text-primary' : 'text-destructive'
              }`}
            >
              {overallGrowthPct >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {overallGrowthPct.toFixed(1)}% since inception
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Checkpoints Logged
            </div>
            <div className="font-serif text-2xl font-bold text-foreground">
              {snapshots.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Recorded monthly logs</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Tracking Consistency
            </div>
            <div className="font-serif text-2xl font-bold text-foreground">
              {snapshots.length >= 6 ? 'Excellent' : 'Getting Started'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {snapshots.length >= 6 ? 'Rich trend history' : 'Add 1 snapshot per month'}
            </div>
          </div>
        </div>

        {/* Historical Interactive Chart */}
        {snapshots.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Net Worth Growth Curve
                </h3>
                <p className="text-xs text-muted-foreground">
                  Track compounding returns and debt reduction over time
                </p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Base: {currency}
              </span>
            </div>
            <div className="h-72 w-full">
              <InteractiveAreaChart snapshots={snapshots} currency={currency} />
            </div>
          </div>
        )}

        {/* Snapshots Table */}
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Historical Log Table ({snapshots.length})
            </h2>
            <div className="text-xs text-muted-foreground">Values shown in {currency}</div>
          </div>

          {snapshots.length === 0 ? (
            <div className="text-center py-16 px-4">
              <BarChart3 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">No checkpoints recorded</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Record your first snapshot above to start tracking your net worth trajectory.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Checkpoint Label</th>
                    <th className="py-3 px-4 text-right">Total Assets</th>
                    <th className="py-3 px-4 text-right">Liabilities</th>
                    <th className="py-3 px-4 text-right">Net Worth</th>
                    <th className="py-3 px-4 text-right">MoM Change</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedSnapshots.map((snap, idx) => {
                    const prev = sortedSnapshots[idx + 1];
                    const momChange = prev ? snap.netWorthBase - prev.netWorthBase : 0;
                    const momPct = prev && prev.netWorthBase > 0 ? (momChange / prev.netWorthBase) * 100 : 0;

                    return (
                      <tr key={snap.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>{snap.takenAt}</span>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {snap.label || 'Monthly Snapshot'}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-xs text-muted-foreground">
                          {formatCurrency(snap.totalAssetsBase, currency)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-xs text-destructive">
                          {snap.totalLiabilitiesBase > 0
                            ? formatCurrency(snap.totalLiabilitiesBase, currency)
                            : '₹0'}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                          {formatCurrency(snap.netWorthBase, currency)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-xs">
                          {prev ? (
                            <span
                              className={`font-semibold ${
                                momChange >= 0 ? 'text-primary' : 'text-destructive'
                              }`}
                            >
                              {momChange >= 0 ? '+' : ''}
                              {formatCurrency(momChange, currency)} ({momPct >= 0 ? '+' : ''}
                              {momPct.toFixed(1)}%)
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteSnapshot(snap.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            title="Delete Snapshot"
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

      <Footer />
    </div>
  );
}
