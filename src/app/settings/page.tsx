'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Settings,
  ShieldCheck,
  User,
  Moon,
  Sun,
  Laptop,
  Coins,
  Lock,
  Trash2,
  RefreshCw,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Download,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import {
  loadUserPortfolio,
  saveUserPortfolio,
  loadStarterTemplate,
  purgeUserPortfolio,
} from '@/lib/portfolio-vault';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();

  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Redirect to login if user is not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/settings');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function initSettings() {
      if (!user) return;
      try {
        const vault = await loadUserPortfolio(user.id, user.email);
        setCurrency(vault.currency || 'INR');
      } catch (err) {
        console.error('Failed to load user settings:', err);
      }
    }
    initSettings();
  }, [user]);

  const handleCurrencyChange = async (newCurr: string) => {
    setCurrency(newCurr);
    if (!user) return;
    try {
      const vault = await loadUserPortfolio(user.id, user.email);
      await saveUserPortfolio({
        ...vault,
        currency: newCurr,
      });
      setFeedback({ type: 'success', message: `Primary display currency updated to ${newCurr}` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update currency setting' });
    }
  };

  const handleResetToStarter = async () => {
    if (!user) return;
    if (confirm('Reset your vault with clean starter assets? Your current holdings will be replaced.')) {
      setLoading(true);
      try {
        await loadStarterTemplate(user.id, user.email);
        setFeedback({ type: 'success', message: 'Vault reset to starter portfolio template.' });
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Failed to reset portfolio.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePurgeData = async () => {
    if (!user) return;
    if (
      confirm(
        'PERMANENT DATA WIPE WARNING: Are you sure you want to permanently erase your encrypted portfolio vault? This action is irreversible.'
      )
    ) {
      setLoading(true);
      try {
        await purgeUserPortfolio(user.id);
        logout();
        router.push('/');
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Failed to wipe data.' });
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar currentCurrency={currency} onCurrencyChange={handleCurrencyChange} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
              Settings & Preferences
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              User Control
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your display currency, session settings, and encrypted vault storage.
          </p>
        </div>

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
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* 1. Profile Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Account Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Name</label>
              <div className="font-semibold text-foreground text-sm">{user?.name || 'User'}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Email Address</label>
              <div className="font-mono text-foreground text-xs">{user?.email || '—'}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">User Identifier</label>
              <div className="font-mono text-muted-foreground text-xs">{user?.id || '—'}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Account Tier</label>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                100% Free & Unlimited
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
              Sign Out
            </button>
          </div>
        </div>

        {/* 2. Currency Preferences */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Display Currency & Regional Settings
          </h3>
          <p className="text-xs text-muted-foreground">
            All your domestic and international assets will be converted in real-time to this primary currency.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { code: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
              { code: 'USD', label: 'US Dollar ($)', symbol: '$' },
              { code: 'EUR', label: 'Euro (€)', symbol: '€' },
              { code: 'GBP', label: 'British Pound (£)', symbol: '£' },
              { code: 'AED', label: 'UAE Dirham (د.إ)', symbol: 'AED' },
              { code: 'SGD', label: 'Singapore Dollar (S$)', symbol: 'S$' },
              { code: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
              { code: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
            ].map((c) => (
              <button
                key={c.code}
                onClick={() => handleCurrencyChange(c.code)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  currency === c.code
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border bg-muted/40 hover:bg-muted'
                }`}
              >
                <div className="font-mono text-base font-bold text-foreground">{c.symbol}</div>
                <div className="text-xs font-semibold text-foreground mt-0.5">{c.code}</div>
                <div className="text-[10px] text-muted-foreground truncate">{c.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Privacy & Security Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Zero-Trust Vault Security
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            FinVelayudham uses <strong>AES-GCM 256-bit client-side encryption</strong> with PBKDF2 key derivation.
            Your holdings, balances, and net worth figures are encrypted directly inside your browser before touching any network storage.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 bg-muted/40 border border-border rounded-lg">
              <div className="text-xs font-semibold text-foreground">Zero Broker Credentials</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                We never ask for your Zerodha, Groww, bank logins, or net banking passwords.
              </div>
            </div>

            <div className="p-3.5 bg-muted/40 border border-border rounded-lg">
              <div className="text-xs font-semibold text-foreground">Stateless Key Isolation</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                User A cannot decrypt User B’s data. Every user has an independent AES key namespace.
              </div>
            </div>
          </div>
        </div>

        {/* 4. Danger Zone */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Data Management & Danger Zone
          </h3>
          <p className="text-xs text-muted-foreground">
            Reset your vault or execute a permanent GDPR-compliant erasure of all your financial records.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleResetToStarter}
              disabled={loading}
              className="px-4 py-2 bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground rounded-lg transition-colors"
            >
              Reset to Starter Portfolio
            </button>

            <button
              onClick={handlePurgeData}
              disabled={loading}
              className="px-4 py-2 bg-destructive text-destructive-foreground hover:opacity-90 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Permanently Wipe All Data (GDPR)
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
