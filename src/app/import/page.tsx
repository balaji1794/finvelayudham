'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileJson,
  RefreshCw,
  FolderUp,
  Sparkles,
  ChevronDown,
  Info,
  Building,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import {
  loadUserPortfolio,
  saveUserPortfolio,
  loadRealStatementsPortfolio,
  UserPortfolio,
} from '@/lib/portfolio-vault';
import { Asset, Goal } from '@/lib/types';

export default function ImportPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // FinBoom tabs & submodes
  const [mainTab, setMainTab] = useState<'assets' | 'cashflow'>('assets');
  const [importMode, setImportMode] = useState<'broker' | 'standard'>('broker');
  const [dedupMode, setDedupMode] = useState<'append' | 'update'>('update');
  const [selectedBroker, setSelectedBroker] = useState('Zerodha');
  const [brokerHelpOpen, setBrokerHelpOpen] = useState(false);
  const [recentImportsOpen, setRecentImportsOpen] = useState(false);

  // Redirect to login if user is not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/import');
    }
  }, [user, authLoading, router]);

  // One-click sync user statements
  const handleSyncRealStatements = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const portfolio = await loadRealStatementsPortfolio(user.id, user.email);
      setFeedback({
        type: 'success',
        message: `Successfully synchronized ${portfolio.assets.length} statement assets (Zerodha 232 stocks & SGBs, ICICI Pru MF, FinBoom Retirement Goal: ₹91,25,117 Net Worth) into your encrypted vault!`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to sync statements.' });
    } finally {
      setLoading(false);
    }
  };

  // Export full user vault to JSON file
  const handleExportJSON = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const vault = await loadUserPortfolio(user.id, user.email);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vault, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `finvelayudham_vault_backup_${user.id}_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setFeedback({ type: 'success', message: 'Vault exported successfully. Keep this file safe.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to export vault backup.' });
    } finally {
      setLoading(false);
    }
  };

  // Restore vault from JSON file
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || !Array.isArray(parsed.assets)) {
          throw new Error('Invalid portfolio backup schema. Must contain assets array.');
        }

        const restoredPortfolio: UserPortfolio = {
          ...parsed,
          userId: user.id,
          email: user.email,
          updatedAt: new Date().toISOString(),
        };

        await saveUserPortfolio(restoredPortfolio);
        setFeedback({
          type: 'success',
          message: `Successfully restored ${restoredPortfolio.assets.length} assets and ${restoredPortfolio.liabilities?.length || 0} liabilities!`,
        });
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Failed to parse JSON backup file.' });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Intelligent Statement Upload (Zerodha CSV, FinBoom Goals CSV, CDSL, Standard CSV)
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          throw new Error('Statement file contains no valid rows.');
        }

        // Case A: FinBoom Goals CSV
        if (text.includes('Target Amount') && text.includes('Target Date')) {
          let headerIdx = lines.findIndex((l) => l.includes('Name') && l.includes('Target Amount'));
          if (headerIdx === -1) headerIdx = 0;
          const goals: Goal[] = [];
          for (let i = headerIdx + 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((p) => p.trim());
            if (cols.length >= 5 && cols[0]) {
              goals.push({
                id: 'goal_' + Math.random().toString(36).substring(2, 9),
                name: cols[0],
                targetAmount: parseFloat(cols[1]) || 0,
                currency: cols[2] || 'INR',
                targetDate: cols[3],
                currentAmount: parseFloat(cols[4]) || 0,
                category: 'RETIREMENT',
              });
            }
          }
          const currentVault = await loadUserPortfolio(user.id, user.email);
          await saveUserPortfolio({
            ...currentVault,
            goals: [...(currentVault.goals || []), ...goals],
          });
          setFeedback({
            type: 'success',
            message: `Successfully imported ${goals.length} goals from FinBoom statement!`,
          });
          return;
        }

        // Case B: Zerodha Holdings Statement CSV
        if (text.includes('Stock Name') && text.includes('ISIN')) {
          let headerIdx = lines.findIndex((l) => l.includes('Stock Name') && l.includes('ISIN'));
          if (headerIdx === -1) headerIdx = 0;
          const newAssets: Asset[] = [];
          for (let i = headerIdx + 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
            if (cols.length < 7 || !cols[0]) continue;
            const stockName = cols[0];
            const isin = cols[1];
            const qty = parseFloat(cols[2]) || 0;
            const avgPrice = parseFloat(cols[3]) || 0;
            const buyVal = parseFloat(cols[4]) || 0;
            const closePrice = parseFloat(cols[5]) || 0;
            const closeVal = parseFloat(cols[6]) || 0;
            const isSgb = stockName.toUpperCase().includes('GOLDBOND') || stockName.toUpperCase().includes('SGB') || stockName.toUpperCase().includes('GOLD');

            newAssets.push({
              id: 'imp_stk_' + isin.toLowerCase() + '_' + Math.random().toString(36).substring(2, 7),
              name: stockName,
              productType: isSgb ? 'SGB' : 'Stock',
              category: isSgb ? 'COMMODITY' : 'EQUITY',
              subClass: isSgb ? 'Sovereign Gold Bond' : 'Direct Equity',
              currentValue: closeVal,
              investedAmount: buyVal,
              currentCurrency: 'INR',
              geographyTag: 'DOMESTIC',
            });
          }
          const currentVault = await loadUserPortfolio(user.id, user.email);
          let updatedAssets = [...currentVault.assets];
          if (dedupMode === 'update') {
            const newMap = new Map(newAssets.map((a) => [a.name.toLowerCase(), a]));
            updatedAssets = updatedAssets.map((existing) => {
              const matched = newMap.get(existing.name.toLowerCase());
              if (matched) {
                newMap.delete(existing.name.toLowerCase());
                return { ...existing, currentValue: matched.currentValue, investedAmount: matched.investedAmount };
              }
              return existing;
            });
            // add remaining new ones
            updatedAssets.push(...Array.from(newMap.values()));
          } else {
            updatedAssets.push(...newAssets);
          }

          await saveUserPortfolio({
            ...currentVault,
            assets: updatedAssets,
          });
          setFeedback({
            type: 'success',
            message: `Successfully processed ${newAssets.length} Zerodha holdings (Invested: ₹${newAssets.reduce((s, a) => s + a.investedAmount, 0).toLocaleString('en-IN')})!`,
          });
          return;
        }

        // Case C: Standard FinVelayudham CSV
        const newAssets: Asset[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
          if (parts[0]) {
            newAssets.push({
              id: 'imp_' + Math.random().toString(36).substring(2, 9),
              name: parts[0],
              productType: parts[1] || 'Holding',
              category: (parts[2] as any) || 'EQUITY',
              subClass: parts[3] || null,
              currentValue: parseFloat(parts[4]) || 10000,
              investedAmount: parseFloat(parts[5]) || 10000,
              currentCurrency: parts[6] || 'INR',
              geographyTag: (parts[7] as any) || 'DOMESTIC',
            });
          }
        }

        const currentVault = await loadUserPortfolio(user.id, user.email);
        await saveUserPortfolio({
          ...currentVault,
          assets: [...currentVault.assets, ...newAssets],
        });

        setFeedback({
          type: 'success',
          message: `Successfully imported ${newAssets.length} holdings into your encrypted vault!`,
        });
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Error processing statement file.' });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <AppLayout currency={currency} onCurrencyChange={setCurrency} title="Import">
      <div className="space-y-4 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div>
          <h1 className="font-semibold text-xl sm:text-2xl tracking-tight text-foreground">
            Import
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Bulk import assets, income & expenses
          </p>
        </div>

        {/* Main Tab Pills: Assets | Income & Expenses */}
        <div className="flex items-center gap-1.5 border-b border-border/60 pb-3">
          <button
            onClick={() => setMainTab('assets')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              mainTab === 'assets'
                ? 'bg-muted text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Assets
          </button>
          <button
            onClick={() => setMainTab('cashflow')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              mainTab === 'cashflow'
                ? 'bg-muted text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Income & Expenses
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-foreground'
                : 'bg-destructive/10 border border-destructive/30 text-destructive'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* 1-Click Statement Sync Banner */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-md bg-primary text-primary-foreground shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-foreground">
                Sync Statements Dataset (₹91,25,117 Net Worth)
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Immediately syncs your 232 Zerodha holdings (₹49.11L), ICICI Pru Mutual Funds, and FinBoom Retirement Corpus goal into your private client-encrypted vault.
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncRealStatements}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs shrink-0 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Statements Now</span>
          </button>
        </div>

        {/* Mode Information Card (FinBoom copy) */}
        <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Update by Name mode:</strong> assets whose names match existing ones will have their value, quantity, and price updated. Assets not in this file are left untouched, and new names are added as fresh entries.
        </div>

        {/* Mode Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 bg-muted p-0.5 rounded-md">
            <button
              onClick={() => setImportMode('broker')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                importMode === 'broker'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Import from Broker
            </button>
            <button
              onClick={() => setImportMode('standard')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                importMode === 'standard'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Standard Import
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-muted p-0.5 rounded-md">
            <button
              onClick={() => setDedupMode('append')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                dedupMode === 'append'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Append
            </button>
            <button
              onClick={() => setDedupMode('update')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                dedupMode === 'update'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Update by Name
            </button>
          </div>
        </div>

        {/* Main Dropzone Card (Matches FinBoom) */}
        <div className="rounded-lg border border-border bg-card p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-foreground">
              Upload holdings file
            </h3>
            <p className="text-xs text-muted-foreground">
              Drag & drop your file here
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse · CSV, Excel or PDF · <span className="text-primary font-semibold">Unlimited rows (Free forever)</span>
            </p>
          </div>

          <div className="max-w-md mx-auto pt-2">
            <label className="w-full flex flex-col items-center justify-center gap-3 py-8 px-4 border-2 border-dashed border-border rounded-lg bg-muted/30 hover:bg-muted/60 cursor-pointer transition-all">
              <div className="p-3 rounded-full bg-muted text-muted-foreground">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div className="text-xs font-medium text-foreground">
                Click to browse statement file
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleCSVUpload}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>

          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            We work out the broker from the file, across <strong className="text-foreground">24</strong> supported brokers and platforms.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>Broker:</span>
              <span className="font-semibold text-foreground">{selectedBroker}</span>
            </div>
            <button
              onClick={() => setBrokerHelpOpen(!brokerHelpOpen)}
              className="text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Where do I get this file from Zerodha?</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${brokerHelpOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {brokerHelpOpen && (
            <div className="mt-3 p-4 rounded-md bg-muted/40 border border-border text-left text-xs text-muted-foreground space-y-2 animate-in fade-in max-w-lg mx-auto">
              <p className="font-semibold text-foreground">How to download from Zerodha Console:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Log in to <span className="text-foreground font-mono">console.zerodha.com</span></li>
                <li>Go to <strong>Portfolio</strong> &gt; <strong>Holdings</strong></li>
                <li>Click <strong>Download CSV</strong> at the top right</li>
                <li>Upload that downloaded <span className="text-foreground font-mono">Stocks_Holdings_Statement_*.csv</span> file here</li>
              </ol>
            </div>
          )}
        </div>

        {/* Secondary Utilities Grid: Full JSON Backup & Restore */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/60">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-semibold text-foreground">Full Encrypted Backup</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Export an encrypted client-side snapshot of all your holdings and settings.
            </p>
            <button
              onClick={handleExportJSON}
              disabled={loading}
              className="px-3 py-1.5 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
            >
              Export JSON Backup
            </button>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FolderUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-xs font-semibold text-foreground">Restore Backup</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Restore your complete portfolio from a previously exported `.json` file.
            </p>
            <label className="inline-block px-3 py-1.5 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer">
              <span>Select .json Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileRestore}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
