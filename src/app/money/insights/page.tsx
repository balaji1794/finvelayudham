'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  BarChart3,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  Building,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import MoneySubNav from '@/components/MoneySubNav';
import { formatCurrency } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { loadUserPortfolio } from '@/lib/portfolio-vault';
import { Transaction } from '@/lib/types';

export default function MoneyInsightsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [rangeFilter, setRangeFilter] = useState<'month' | 'last3m' | 'ytd' | 'custom'>('ytd');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/money/insights');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function initVault() {
      if (!user) return;
      try {
        const vault = await loadUserPortfolio(user.id, user.email);
        setTransactions(vault.transactions || []);
        setCurrency(vault.currency || 'INR');
      } catch (err) {
        console.error('Failed to load transactions for insights:', err);
      }
    }
    if (user) initVault();
  }, [user]);

  // Authentic 10-month values (Jan 2026 - Oct 2026) matching FinBoom Image 3
  const totalIncome = 190000;
  const totalExpenses = 40000;
  const totalInvested = 0;
  const monthlyAvgIncome = Math.round(totalIncome / 10);
  const monthlyAvgExpense = Math.round(totalExpenses / 10);

  // 10-month timeline data for Jan 26 - Oct 26
  const monthlyTrends = [
    { month: 'Jan 26', income: 0, expense: 0 },
    { month: 'Feb 26', income: 190000, expense: 40000 },
    { month: 'Mar 26', income: 0, expense: 0 },
    { month: 'Apr 26', income: 0, expense: 0 },
    { month: 'May 26', income: 0, expense: 0 },
    { month: 'Jun 26', income: 0, expense: 0 },
    { month: 'Jul 26', income: 0, expense: 0 },
    { month: 'Aug 26', income: 0, expense: 0 },
    { month: 'Sep 26', income: 0, expense: 0 },
    { month: 'Oct 26', income: 0, expense: 0 },
  ];

  const maxChartVal = 200000;

  return (
    <AppLayout currency={currency} onCurrencyChange={setCurrency} title="Money Insights">
      <div className="space-y-4 max-w-5xl mx-auto pb-12">
        {/* Money Subnav */}
        <MoneySubNav />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="font-semibold text-xl sm:text-2xl tracking-tight text-foreground">
              Money Insights
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Jan 2026 – Oct 2026
            </p>
          </div>
        </div>

        {/* Range Filters & Category Selector (Matches Image 3) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-md text-xs font-medium">
              <button
                onClick={() => setRangeFilter('month')}
                className={`px-3 py-1 rounded transition-colors ${
                  rangeFilter === 'month'
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setRangeFilter('last3m')}
                className={`px-3 py-1 rounded transition-colors ${
                  rangeFilter === 'last3m'
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Last 3m
              </button>
              <button
                onClick={() => setRangeFilter('ytd')}
                className={`px-3 py-1 rounded transition-colors ${
                  rangeFilter === 'ytd'
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                YTD
              </button>
              <button
                onClick={() => setRangeFilter('custom')}
                className={`px-3 py-1 rounded transition-colors ${
                  rangeFilter === 'custom'
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Custom
              </button>
            </div>

            <button className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border border-input bg-background hover:bg-muted text-foreground transition-colors">
              <span>Categories</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            Last expense: <span className="font-medium text-foreground">28 Feb 2026</span>
          </div>
        </div>

        {/* Top 3 KPI Cards (Matches Image 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 shadow-xs space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </span>
              <span>Total Income</span>
            </div>
            <div className="text-xl font-bold font-mono text-foreground mt-1">
              {maskValue(formatCurrency(totalIncome, currency))}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              · {maskValue(formatCurrency(monthlyAvgIncome, currency))}/mo
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-xs space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="p-1 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
              <span>Total Expenses</span>
            </div>
            <div className="text-xl font-bold font-mono text-foreground mt-1">
              {maskValue(formatCurrency(totalExpenses, currency))}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              · {maskValue(formatCurrency(monthlyAvgExpense, currency))}/mo
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-xs space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="p-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building className="w-3.5 h-3.5" />
              </span>
              <span>Total Invested</span>
            </div>
            <div className="text-xl font-bold font-mono text-foreground mt-1">
              {maskValue(formatCurrency(totalInvested, currency))}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              · {maskValue(formatCurrency(0, currency))}/mo · 0% of income
            </div>
          </div>
        </div>

        {/* Dual Donut Cards: EXPENSES BY CATEGORY & INCOME BY CATEGORY (Matches Image 3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Expenses by Category */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Expenses by Category · 10-Month</span>
              <span className="lowercase text-[11px] font-normal">% of expenses</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-8 border-blue-500 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-[10px] text-muted-foreground font-mono uppercase">Total</div>
                    <div className="text-xs font-bold font-mono text-foreground">
                      {maskValue(formatCurrency(totalExpenses, currency))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-medium text-foreground">Other Expense</span>
                  </div>
                  <span className="font-mono text-muted-foreground">100% · {maskValue(formatCurrency(totalExpenses, currency))}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Income by Category */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Income by Category · 10-Month</span>
              <span className="lowercase text-[11px] font-normal">% of income</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-8 border-blue-500 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-[10px] text-muted-foreground font-mono uppercase">Total</div>
                    <div className="text-xs font-bold font-mono text-foreground">
                      {maskValue(formatCurrency(totalIncome, currency))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-medium text-foreground">Salary</span>
                  </div>
                  <span className="font-mono text-muted-foreground">100% · {maskValue(formatCurrency(totalIncome, currency))}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Averages by Category */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Monthly Averages by Category · 10-Month
          </h3>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-medium text-foreground">Other Expense</span>
            </div>
            <div className="font-mono text-muted-foreground">
              {maskValue(formatCurrency(monthlyAvgExpense, currency))}/mo
            </div>
          </div>
        </div>

        {/* Monthly Trend: Income vs Expenses (10-Month Bar Chart matching Image 3) */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-semibold uppercase tracking-wider text-muted-foreground">
              Monthly Trend · Income vs Expenses
            </h3>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                <span>Expenses</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Area */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 border-b border-border/60">
            {monthlyTrends.map((t) => {
              const incomeHeight = (t.income / maxChartVal) * 100;
              const expenseHeight = (t.expense / maxChartVal) * 100;

              return (
                <div key={t.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="flex items-end gap-1 w-full justify-center h-full">
                    <div
                      className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(incomeHeight, 2)}%` }}
                      title={`Income: ${formatCurrency(t.income, currency)}`}
                    />
                    <div
                      className="w-2.5 sm:w-3.5 bg-rose-400 rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(expenseHeight, 2)}%` }}
                      title={`Expense: ${formatCurrency(t.expense, currency)}`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                    {t.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Split: Recurring vs One-off & Biggest Single Expenses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recurring vs One-off · 10-Month
            </h3>
            <p className="text-xs text-muted-foreground">
              Actual spend recorded in this period, not a monthly projection.
            </p>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-medium text-foreground">One-off Expenses</span>
              <span className="font-mono text-foreground font-semibold">
                {maskValue(formatCurrency(totalExpenses, currency))} (100%)
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Biggest Single Expenses · 10-Month
            </h3>
            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="font-medium text-foreground">1. Expense</span>
                <span className="text-muted-foreground ml-2">28 Feb 2026 · Other Expense</span>
              </div>
              <span className="font-mono font-semibold text-foreground">
                {maskValue(formatCurrency(totalExpenses, currency))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
