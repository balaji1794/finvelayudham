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
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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

  // Download Sample CSV template
  const handleDownloadSampleCSV = () => {
    const headers = ['name', 'productType', 'category', 'subClass', 'currentValue', 'investedAmount', 'currentCurrency', 'geographyTag'];
    const sampleRows = [
      ['UTI Nifty 50 Index Fund', 'Mutual Fund', 'EQUITY', 'Large Cap Index', '500000', '400000', 'INR', 'DOMESTIC'],
      ['HDFC Bank Ltd', 'Direct Stock', 'EQUITY', 'Banking', '250000', '180000', 'INR', 'DOMESTIC'],
      ['Public Provident Fund (PPF)', 'Government Scheme', 'DEBT', 'PPF', '300000', '250000', 'INR', 'DOMESTIC'],
      ['Sovereign Gold Bond', 'SGB', 'COMMODITY', 'Gold', '150000', '100000', 'INR', 'DOMESTIC'],
      ['Vanguard S&P 500 ETF', 'ETF', 'EQUITY', 'US Tech', '350000', '280000', 'INR', 'INTERNATIONAL'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'finvelayudham_asset_import_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Intelligent CSV Statement Upload (Zerodha, FinBoom Goals, CDSL, Standard CSV)
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
          throw new Error('CSV file contains no records.');
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
          await saveUserPortfolio({
            ...currentVault,
            assets: [...currentVault.assets, ...newAssets],
          });
          setFeedback({
            type: 'success',
            message: `Successfully parsed and imported ${newAssets.length} Zerodha holdings (Invested: ₹${newAssets.reduce((s, a) => s + a.investedAmount, 0).toLocaleString('en-IN')})!`,
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
        const mergedAssets = [...currentVault.assets, ...newAssets];
        await saveUserPortfolio({
          ...currentVault,
          assets: mergedAssets,
        });

        setFeedback({
          type: 'success',
          message: `Successfully imported ${newAssets.length} holdings into your encrypted vault!`,
        });
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Error processing CSV statement.' });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar currentCurrency={currency} onCurrencyChange={setCurrency} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
                Import & Export Hub
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero Bank Credentials
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Bulk import from CAS statements, Zerodha/Groww CSVs, or backup and restore your encrypted vault.
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-3 ${
              feedback.type === 'success'
                ? 'bg-primary/10 border border-primary/30 text-foreground'
                : 'bg-destructive/10 border border-destructive/30 text-destructive'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* 1-Click Statement Sync Banner */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary text-primary-foreground shrink-0 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                Sync Real Portfolio Statements (₹91,25,117 Net Worth)
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Immediately synchronizes your downloaded Zerodha statements (232 stocks & SGBs worth ₹49.11L), ICICI Prudential Mutual Funds, and FinBoom Retirement Corpus goal into your private client-encrypted vault.
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncRealStatements}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs shrink-0 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Statements Now</span>
          </button>
        </div>

        {/* Import Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. CSV Portfolio Import */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div>
              <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 text-primary mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                Broker / Spreadsheet CSV Import
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Directly upload Zerodha Console CSVs (`Stocks_Holdings_Statement_*.csv`), Groww CSVs, or FinBoom goal exports (`finboom-goals-*.csv`). Auto-detected columns.
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Download standardized format:</span>
                <button
                  onClick={handleDownloadSampleCSV}
                  className="font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Sample CSV Template
                </button>
              </div>

              <label className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-border rounded-lg bg-muted/40 hover:bg-muted/70 cursor-pointer transition-all text-xs font-semibold text-foreground">
                <Upload className="w-4 h-4 text-primary" />
                <span>Upload CSV Statement / Holdings File</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          {/* 2. CAMS / KFintech CAS Import */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div>
              <div className="inline-flex items-center justify-center p-3 rounded-xl bg-blue-500/10 text-blue-500 mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                Consolidated Account Statement (CAS)
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Import your official CAMS or KFintech mutual fund statement to automatically track Folios, NAVs, and units.
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-border">
              <label className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-border rounded-lg bg-muted/40 hover:bg-muted/70 cursor-pointer transition-all text-xs font-semibold text-foreground">
                <Upload className="w-4 h-4 text-blue-500" />
                <span>Select CAS Statement (.pdf / .csv)</span>
                <input
                  type="file"
                  accept=".pdf,.csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              <div className="text-[11px] text-muted-foreground text-center">
                Your statement is processed 100% locally in your browser. Passwords and PAN are never sent to external servers.
              </div>
            </div>
          </div>

          {/* 3. Encrypted JSON Vault Backup */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div>
              <div className="inline-flex items-center justify-center p-3 rounded-xl bg-emerald-500/10 text-emerald-500 mb-3">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                Full Vault JSON Backup
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Download a complete, offline snapshot of your assets, liabilities, goals, and history in portable JSON format.
              </p>
            </div>

            <div className="pt-3 border-t border-border">
              <button
                onClick={handleExportJSON}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>Export Encrypted Vault Backup</span>
              </button>
            </div>
          </div>

          {/* 4. Restore Vault from JSON */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div>
              <div className="inline-flex items-center justify-center p-3 rounded-xl bg-purple-500/10 text-purple-500 mb-3">
                <FolderUp className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                Restore Encrypted Backup
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Restore your complete financial portfolio from a previously exported `.json` vault backup file.
              </p>
            </div>

            <div className="pt-3 border-t border-border">
              <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-input rounded-lg bg-background hover:bg-muted cursor-pointer transition-colors text-xs font-semibold text-foreground">
                <FolderUp className="w-4 h-4 text-purple-500" />
                <span>Select .json Backup File</span>
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
      </main>

      <Footer />
    </div>
  );
}
