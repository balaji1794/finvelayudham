'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CreditCard,
  Wallet,
  Plus,
  Trash2,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import MoneySubNav from '@/components/MoneySubNav';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { loadUserPortfolio, saveUserPortfolio, UserPortfolio } from '@/lib/portfolio-vault';

interface AccountItem {
  id: string;
  name: string;
  type: 'BANK' | 'CREDIT_CARD' | 'WALLET' | 'SAVINGS';
  institution: string;
  balance: number;
  currency: string;
}

const DEFAULT_ACCOUNTS: AccountItem[] = [
  { id: 'acc_1', name: 'Primary Salary Account', type: 'BANK', institution: 'HDFC Bank', balance: 145000, currency: 'INR' },
  { id: 'acc_2', name: 'Emergency Liquid Savings', type: 'SAVINGS', institution: 'ICICI Bank', balance: 250000, currency: 'INR' },
  { id: 'acc_3', name: 'Everyday Rewards Card', type: 'CREDIT_CARD', institution: 'Axis Bank', balance: -18500, currency: 'INR' },
  { id: 'acc_4', name: 'Physical Cash & Petty', type: 'WALLET', institution: 'Cash In Hand', balance: 12000, currency: 'INR' },
];

export default function AccountsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [accounts, setAccounts] = useState<AccountItem[]>(DEFAULT_ACCOUNTS);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [accType, setAccType] = useState<AccountItem['type']>('BANK');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/accounts');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadAccounts = () => {
      try {
        const stored = localStorage.getItem('finboom_user_accounts');
        if (stored) {
          setAccounts(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Could not parse accounts:', e);
      }
    };
    loadAccounts();

    const handleSynced = () => loadAccounts();
    window.addEventListener('finvelayudham_vault_synced', handleSynced);
    return () => window.removeEventListener('finvelayudham_vault_synced', handleSynced);
  }, []);

  const saveAccounts = (newAccounts: AccountItem[]) => {
    setAccounts(newAccounts);
    try {
      localStorage.setItem('finboom_user_accounts', JSON.stringify(newAccounts));
    } catch (e) {
      console.warn('Could not persist accounts:', e);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(balance);
    if (isNaN(num) || !name.trim()) return;

    const newAcc: AccountItem = {
      id: 'acc_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      institution: institution.trim() || 'Bank',
      type: accType,
      balance: accType === 'CREDIT_CARD' && num > 0 ? -num : num,
      currency,
    };

    saveAccounts([...accounts, newAcc]);
    setIsAddOpen(false);
    setName('');
    setInstitution('');
    setBalance('');
  };

  const handleDelete = (id: string) => {
    saveAccounts(accounts.filter((a) => a.id !== id));
  };

  const totalBankAndSavings = useMemo(() => {
    return accounts
      .filter((a) => a.type === 'BANK' || a.type === 'SAVINGS' || a.type === 'WALLET')
      .reduce((sum, a) => sum + (a.balance > 0 ? a.balance : 0), 0);
  }, [accounts]);

  const totalCardPayables = useMemo(() => {
    return accounts
      .filter((a) => a.type === 'CREDIT_CARD')
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);
  }, [accounts]);

  const netCash = totalBankAndSavings - totalCardPayables;

  return (
    <AppLayout currency={currency} onCurrencyChange={setCurrency} title="Accounts">
      <div className="space-y-4">
        {/* Money Subnav */}
        <MoneySubNav />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Accounts
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Track bank accounts, credit card balances, and cash reserves
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Account</span>
          </button>
        </div>

        {/* Account Summary KPI Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Liquid Cash & Savings
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground mt-1 tabular-nums">
              {maskValue(formatCurrency(totalBankAndSavings, currency))}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Across bank accounts & wallets</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Credit Card Outstanding
            </div>
            <div className="text-xl sm:text-2xl font-bold text-red-500 mt-1 tabular-nums">
              {maskValue(formatCurrency(totalCardPayables, currency))}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Active card bill balances</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Net Available Liquidity
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
              {maskValue(formatCurrency(netCash, currency))}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Liquid cash minus credit payables</div>
          </div>
        </div>

        {/* Accounts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {accounts.map((acc) => {
            const isCard = acc.type === 'CREDIT_CARD';
            return (
              <div
                key={acc.id}
                className="bg-card border border-border rounded-lg p-4 shadow-xs flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isCard ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {isCard ? <CreditCard className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{acc.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {acc.institution} • {acc.type.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-sm sm:text-base font-bold tabular-nums ${
                        isCard ? 'text-red-500' : 'text-foreground'
                      }`}
                    >
                      {maskValue(formatCurrency(acc.balance, currency))}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase font-medium">
                      {isCard ? 'Due' : 'Balance'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Account Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-semibold text-base text-foreground">Add Financial Account</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Salary, SBI Savings, Axis Atlas Card"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Account Type
                  </label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="BANK">Bank Account</option>
                    <option value="SAVINGS">Savings Account</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="WALLET">Cash / Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Bank / Institution
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC, ICICI, SBI"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Current Balance ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-muted text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
