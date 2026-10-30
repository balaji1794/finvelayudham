'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Settings,
  ShieldCheck,
  Moon,
  Sun,
  Coins,
  Download,
  Trash2,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Laptop,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { isDeviceTrusted, setDeviceTrusted, getDeviceLabel } from '@/lib/trusted-device';
import {
  loadUserPortfolio,
  saveUserPortfolio,
  loadStarterTemplate,
  purgeUserPortfolio,
} from '@/lib/portfolio-vault';
import { formatCurrency } from '@/lib/currencies';

export default function SettingsPage() {
  const router = useRouter();

  const { user, isLoading: authLoading, logout, updateProfile } = useAuth();
  const { isPrivacyMasked, togglePrivacyMask } = usePrivacy();

  const [activeTab, setActiveTab] = useState<'account' | 'preferences' | 'profiles' | 'data'>('account');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['account', 'preferences', 'profiles', 'data'].includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, []);

  // Edit Account
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [deviceTrusted, setDeviceTrustedState] = useState(false);
  const [currentDevice, setCurrentDevice] = useState('');

  useEffect(() => {
    if (user?.email) {
      setDeviceTrustedState(isDeviceTrusted(user.email));
      setCurrentDevice(getDeviceLabel());
    }
  }, [user]);

  const handleToggleDeviceTrust = () => {
    if (!user?.email) return;
    const nextState = !deviceTrusted;
    setDeviceTrusted(user.email, nextState);
    setDeviceTrustedState(nextState);
    setFeedback({
      type: 'success',
      message: nextState
        ? 'This browser has been marked as a trusted device. Login verification code will be bypassed.'
        : 'Device trust revoked. Email verification code will be required on your next login.',
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/settings');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    async function initSettings() {
      if (!user) return;
      try {
        const vault = await loadUserPortfolio(user.id, user.email);
        setCurrency(vault.currency || 'INR');
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    if (user) initSettings();
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
      setFeedback({ type: 'success', message: `Primary currency updated to ${newCurr}` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update currency' });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setFeedback({ type: 'error', message: 'Name cannot be empty.' });
      return;
    }
    setSavingProfile(true);
    try {
      if (updateProfile) {
        await updateProfile({
          name: editName.trim(),
          newPassword: editPassword || undefined,
        });
      }
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: 'error', message: 'Could not update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExportJSON = async () => {
    if (!user) return;
    try {
      const vault = await loadUserPortfolio(user.id, user.email);
      const jsonStr = JSON.stringify(vault, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finvelayudham_vault_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleExportCSVs = async () => {
    if (!user) return;
    try {
      const vault = await loadUserPortfolio(user.id, user.email);
      const headers = ['Type', 'Name', 'Category', 'Current Value', 'Invested', 'Currency'];
      const rows = (vault.assets || []).map((a) => [
        'Asset',
        `"${a.name.replace(/"/g, '""')}"`,
        a.category,
        a.currentValue,
        a.investedAmount || a.currentValue,
        a.currentCurrency,
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `finvelayudham_assets_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  };

  const handleResetAllData = async () => {
    if (!user) return;
    if (
      confirm(
        '⚠️ Are you sure you want to RESET ALL DATA?\n\nThis will permanently delete all your assets, liabilities, snapshots, goals, and transactions.\n\nYour account credentials and login will be preserved.'
      )
    ) {
      setLoading(true);
      try {
        await purgeUserPortfolio(user.id, user.email);
        setFeedback({ type: 'success', message: 'All portfolio data has been reset.' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Failed to reset data.' });
        setLoading(false);
      }
    }
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        'Permanently delete your account and all associated encrypted data? This action CANNOT be undone.'
      )
    ) {
      if (user) {
        purgeUserPortfolio(user.id, user.email);
      }
      logout();
      router.push('/login');
    }
  };

  return (
    <AppLayout currency={currency} onCurrencyChange={setCurrency} title="Settings">
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Account, preferences & privacy
          </p>
        </div>

        {/* Settings Tab Navigation */}
        <div className="border-b border-border">
          <nav className="flex gap-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'account', label: 'Account' },
              { id: 'preferences', label: 'Preferences' },
              { id: 'profiles', label: 'Profiles' },
              { id: 'data', label: 'Data' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    active
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab 1: Account */}
        {activeTab === 'account' && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Profile & Account Details
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-3.5 max-w-md">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={editEmail}
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-muted text-muted-foreground cursor-not-allowed"
                />
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Email is locked to your zero-knowledge encryption key.
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  New Password (optional)
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>

            {/* Trusted Device & 2FA Security */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Trusted Browsers & Two-Step Verification
              </h3>
              <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">{currentDevice || 'Current Browser'}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        deviceTrusted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {deviceTrusted ? 'Trusted Device' : 'Untrusted Device'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {deviceTrusted
                      ? 'Email verification code is skipped on this browser during sign-in.'
                      : 'You will be asked for a 6-digit email verification code when signing in.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleDeviceTrust}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors shrink-0 cursor-pointer ${
                    deviceTrusted
                      ? 'border-border bg-background hover:bg-muted text-foreground'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary'
                  }`}
                >
                  {deviceTrusted ? 'Revoke Device Trust' : 'Trust This Device'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Preferences */}
        {activeTab === 'preferences' && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Application Preferences
            </h2>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Base Display Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="SGD">SGD (S$) - Singapore Dollar</option>
                  <option value="AED">AED (د.إ) - UAE Dirham</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Privacy Mode (Mask Numbers)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePrivacyMask}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                      isPrivacyMasked
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-input bg-card text-foreground hover:bg-muted'
                    }`}
                  >
                    {isPrivacyMasked ? 'Privacy Mask Enabled (••••)' : 'Privacy Mask Disabled'}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Blur balances when sharing screens
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Profiles */}
        {activeTab === 'profiles' && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Multi-Entity Profiles
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage multiple portfolios (e.g. Personal, Family, HUF, Corporate) within one login.
            </p>

            <div className="p-4 rounded-lg border border-border bg-muted/30 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">Primary Personal Vault</div>
                <div className="text-xs text-muted-foreground mt-0.5">Active default profile</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                Active
              </span>
            </div>
          </div>
        )}

        {/* Tab 4: Data */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            {/* Export Data */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Export Data</h3>
              <p className="text-xs text-muted-foreground">
                Export all your data (assets, liabilities, snapshots, goals, transactions) at any time. Your data is yours and always will be.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleExportCSVs}
                  className="px-3.5 py-1.5 rounded-md border border-input bg-card hover:bg-muted text-xs font-medium transition-colors"
                >
                  Export CSVs
                </button>
                <button
                  onClick={handleExportJSON}
                  className="px-3.5 py-1.5 rounded-md border border-input bg-card hover:bg-muted text-xs font-medium transition-colors"
                >
                  Export JSON
                </button>
              </div>
            </div>

            {/* Reset All Data */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Reset All Data</h3>
              <p className="text-xs text-muted-foreground">
                This will permanently delete all your assets, liabilities, snapshots, goals, transactions, recurring items, bank and credit-card accounts, budgets, and allocation targets.
              </p>
              <p className="text-xs text-muted-foreground">
                Your login, profile, and settings will be preserved. Consider exporting your data first.
              </p>
              <div className="pt-1">
                <button
                  onClick={handleResetAllData}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-md border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-colors"
                >
                  {loading ? 'Resetting...' : 'Reset All Data'}
                </button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-semibold text-red-500">Delete Account</h3>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <div className="pt-1">
                <button
                  onClick={handleDeleteAccount}
                  className="px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
