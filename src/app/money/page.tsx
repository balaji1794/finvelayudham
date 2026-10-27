'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Tag,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { loadUserPortfolio, saveUserPortfolio, UserPortfolio } from '@/lib/portfolio-vault';

export default function MoneyPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/money');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function initVault() {
      if (!user) return;
      try {
        const portfolio = await loadUserPortfolio(user.id, user.email);
        setTransactions(portfolio.transactions || []);
      } catch (err) {
        console.error('Failed to load transactions:', err);
      }
    }
    if (user) {
      initVault();
    }
  }, [user]);

  const persist = async (newTx: Transaction[]) => {
    if (!user) return;
    const portfolio = await loadUserPortfolio(user.id, user.email);
    const updated: UserPortfolio = {
      ...portfolio,
      transactions: newTx,
      updatedAt: new Date().toISOString(),
    };
    await saveUserPortfolio(updated);
  };

  const handleAddTransaction = async (tx: Transaction) => {
    const updated = [tx, ...transactions];
    setTransactions(updated);
    await persist(updated);
  };

  const handleDeleteTransaction = async (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    await persist(updated);
  };

  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-10"

  const monthTransactions = transactions.filter((t) => (t.date || '').startsWith(currentMonthStr));
  const totalIncome = monthTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + (t.amountBase || 0), 0);
  const totalExpenses = monthTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (t.amountBase || 0), 0);
  const netSaved = totalIncome - totalExpenses;

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  return (
    <AppLayout
      currency={currency}
      onCurrencyChange={setCurrency}
      title="Money & Cashflow"
      onAddTransaction={handleAddTransaction}
    >
      <div className="space-y-6">
        {/* Month Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <span>This Month Income</span>
              <ArrowDownLeft className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-serif font-bold text-primary">
              {maskValue(formatCurrency(totalIncome, currency))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Active earnings and inflows for {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <span>This Month Expenses</span>
              <ArrowUpRight className="w-4 h-4 text-destructive" />
            </div>
            <div className="text-2xl font-serif font-bold text-destructive">
              {maskValue(formatCurrency(totalExpenses, currency))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Total outflows & logged expenses
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <span>Net Monthly Savings</span>
              <Wallet className="w-4 h-4 text-foreground" />
            </div>
            <div
              className={`text-2xl font-serif font-bold ${
                netSaved >= 0 ? 'text-foreground' : 'text-destructive'
              }`}
            >
              {maskValue(formatCurrency(netSaved, currency))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Savings rate: {totalIncome > 0 ? Math.round((netSaved / totalIncome) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Recent Cashflow Activity ({transactions.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Use the "+ Add" button on the sidebar to log expenses or income anytime.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  filterType === 'ALL' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('EXPENSE')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  filterType === 'EXPENSE' ? 'bg-card text-destructive shadow-xs' : 'text-muted-foreground'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setFilterType('INCOME')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  filterType === 'INCOME' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No transactions logged</p>
              <p className="text-xs text-muted-foreground mt-1">
                Log an expense or income using the "+ Add" button on the sidebar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-muted-foreground">{tx.date}</td>
                      <td className="p-3 font-semibold text-foreground">
                        {tx.description || tx.category}
                        {tx.isRecurring && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            Recurring
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{tx.category}</td>
                      <td
                        className={`p-3 text-right font-bold ${
                          tx.type === 'EXPENSE' ? 'text-destructive' : 'text-primary'
                        }`}
                      >
                        {tx.type === 'EXPENSE' ? '-' : '+'}
                        {maskValue(formatCurrency(tx.amountBase, currency))}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
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
    </AppLayout>
  );
}
