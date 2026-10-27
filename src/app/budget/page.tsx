'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  PieChart,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  X,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import MoneySubNav from '@/components/MoneySubNav';
import { formatCurrency } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { loadUserPortfolio } from '@/lib/portfolio-vault';
import { Transaction } from '@/lib/types';

interface BudgetCategory {
  id: string;
  category: string;
  monthlyLimit: number;
}

const DEFAULT_BUDGETS: BudgetCategory[] = [
  { id: 'b_1', category: 'Food & Dining', monthlyLimit: 15000 },
  { id: 'b_2', category: 'Groceries', monthlyLimit: 12000 },
  { id: 'b_3', category: 'Housing & Rent', monthlyLimit: 25000 },
  { id: 'b_4', category: 'Utilities', monthlyLimit: 6000 },
  { id: 'b_5', category: 'Shopping', monthlyLimit: 10000 },
  { id: 'b_6', category: 'Transportation', monthlyLimit: 8000 },
];

export default function BudgetPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [budgets, setBudgets] = useState<BudgetCategory[]>(DEFAULT_BUDGETS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form
  const [catName, setCatName] = useState('');
  const [limit, setLimit] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/budget');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('finboom_user_budgets');
      if (stored) {
        setBudgets(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not parse budgets:', e);
    }
  }, []);

  useEffect(() => {
    async function initVault() {
      if (!user) return;
      try {
        const vault = await loadUserPortfolio(user.id, user.email);
        setTransactions(vault.transactions || []);
        setCurrency(vault.currency || 'INR');
      } catch (err) {
        console.error('Failed to load transactions for budget:', err);
      }
    }
    if (user) initVault();
  }, [user]);

  const saveBudgets = (newBudgets: BudgetCategory[]) => {
    setBudgets(newBudgets);
    try {
      localStorage.setItem('finboom_user_budgets', JSON.stringify(newBudgets));
    } catch (e) {
      console.warn('Could not persist budgets:', e);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(limit);
    if (isNaN(num) || num <= 0 || !catName.trim()) return;

    const newB: BudgetCategory = {
      id: 'b_' + Math.random().toString(36).substring(2, 9),
      category: catName.trim(),
      monthlyLimit: num,
    };

    saveBudgets([...budgets, newB]);
    setIsAddOpen(false);
    setCatName('');
    setLimit('');
  };

  const handleDelete = (id: string) => {
    saveBudgets(budgets.filter((b) => b.id !== id));
  };

  const currentMonthStr = new Date().toISOString().slice(0, 7);

  // Calculate actual spend per category for this month
  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'EXPENSE' && (t.date || '').startsWith(currentMonthStr))
      .forEach((t) => {
        const cat = t.category || 'General';
        map[cat] = (map[cat] || 0) + (t.amountBase || 0);
      });
    return map;
  }, [transactions, currentMonthStr]);

  const totalBudget = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  }, [budgets]);

  const totalSpent = useMemo(() => {
    return Object.values(categorySpend).reduce((sum, v) => sum + v, 0);
  }, [categorySpend]);

  return (
    <AppLayout currency={currency} onCurrencyChange={setCurrency} title="Budget">
      <div className="space-y-4">
        {/* Money Subnav */}
        <MoneySubNav />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Monthly Budget
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Set spending limits and avoid end-of-month lifestyle inflation
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Category</span>
          </button>
        </div>

        {/* Monthly Summary Bar */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Overall Monthly Spend
              </div>
              <div className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">
                {maskValue(formatCurrency(totalSpent, currency))}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  / {maskValue(formatCurrency(totalBudget, currency))} limit
                </span>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  totalSpent > totalBudget
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}
              >
                {totalSpent > totalBudget
                  ? `Over Budget by ${formatCurrency(totalSpent - totalBudget, currency)}`
                  : `${formatCurrency(totalBudget - totalSpent, currency)} Remaining`}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalSpent > totalBudget ? 'bg-red-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min((totalSpent / (totalBudget || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Categories Budget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {budgets.map((b) => {
            const spent = categorySpend[b.category] || 0;
            const pct = Math.round((spent / b.monthlyLimit) * 100);
            const isExceeded = spent > b.monthlyLimit;

            return (
              <div
                key={b.id}
                className="bg-card border border-border rounded-lg p-4 shadow-xs space-y-2.5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm text-foreground">{b.category}</div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        isExceeded ? 'text-red-500' : pct > 80 ? 'text-amber-500' : 'text-primary'
                      }`}
                    >
                      {pct}%
                    </span>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                  <span>Spent: {maskValue(formatCurrency(spent, currency))}</span>
                  <span>Limit: {maskValue(formatCurrency(b.monthlyLimit, currency))}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Budget Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-semibold text-base text-foreground">Add Spending Budget</h3>
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
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Travel, Entertainment, Coffee"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Monthly Limit ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
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
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
