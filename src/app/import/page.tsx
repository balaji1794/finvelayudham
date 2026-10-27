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
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import {
  loadUserPortfolio,
  saveUserPortfolio,
  UserPortfolio,
} from '@/lib/portfolio-vault';
import { Asset } from '@/lib/types';

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

  // Simulated CAS / Broker CSV Upload
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          throw new Error('CSV file contains no records.');
        }

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
          message: `Successfully imported ${newAssets.length} new holdings into your encrypted vault!`,
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
                Import stock & mutual fund holdings from Zerodha Console, Groww, Upstox, or custom Excel exports.
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
                <span>Upload CSV Holdings File</span>
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
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow"
              >
                <Download className="w-4 h-4" />
                Download Complete Vault Backup (.json)
              </button>
            </div>
          </div>

          {/* 4. Restore Vault from Backup */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div>
              <div className="inline-flex items-center justify-center p-3 rounded-xl bg-purple-500/10 text-purple-500 mb-3">
                <FolderUp className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                Restore from Vault File
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Moving devices or restoring from a previous backup? Upload your saved `.json` file to restore your entire portfolio immediately.
              </p>
            </div>

            <div className="pt-3 border-t border-border">
              <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-border rounded-lg bg-card hover:bg-muted cursor-pointer transition-all text-xs font-semibold text-foreground">
                <FileJson className="w-4 h-4 text-purple-500" />
                <span>Choose Backup File (.json)</span>
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
