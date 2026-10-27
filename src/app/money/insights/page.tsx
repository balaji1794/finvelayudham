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
  const [timeframe, setTimeframe] = useState<'MONTH' | 'LAST_MO' | '12M' | 'YTD'>('MONTH');
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

  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const filteredTx = useMemo(() => {
    if (timeframe === 'MONTH') {
      return transactions.filter((t) => (t.date || '').startsWith(currentMonthStr));
    }
    return transactions;
  }, [transactions, timeframe, currentMonthStr]);

  const totalIncome = useMemo(() => {
    return filteredTx
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + (t.amountBase || 0), 0);
  }, [filteredTx]);

  const totalExpense = useMemo(() => {
    return filteredTx
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + (t.amountBase || 0), 0);
  }, [filteredTx]);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Expenses by Category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTx
      .filter((t) => t.type === 'EXPENSE')
      .forEach((t) => {
        const cat = t.category || 'General';
        map[cat] = (map[cat] || 0) + (t.amountBase || 0);
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredTx]);

  return (
    <AppLayout currency={currency} onCurrencyChange={setCurrency} title="Money Insights">
      <div className="space-y-4">
        {/* Money Subnav */}
        <MoneySubNav />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Cashflow & Spending Insights
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Analyze your burn rate, savings percentage, and expenditure patterns
            </p>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs font-medium self-start sm:self-auto">
            {(['MONTH', 'LAST_MO', '12M', 'YTD'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded transition-colors ${
                  timeframe === t
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'MONTH' ? 'Month' : t === 'LAST_MO' ? 'Last Mo' : t}
              </button>
            ))}
          </div>
        </div>

        {/* High-level KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Inflow
            </div>
            <div className="text-xl font-bold text-emerald-500 mt-1 tabular-nums">
              {maskValue(formatCurrency(totalIncome, currency))}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Salary & investments</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Outflow
            </div>
            <div className="text-xl font-bold text-foreground mt-1 tabular-nums">
              {maskValue(formatCurrency(totalExpense, currency))}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Expenses & bills</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Net Capital Saved
            </div>
            <div className="text-xl font-bold text-primary mt-1 tabular-nums">
              {maskValue(formatCurrency(netSavings, currency))}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Retained for wealth building</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Savings Rate
            </div>
            <div className="text-xl font-bold text-foreground mt-1 tabular-nums">
              {savingsRate}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Target: 40%+ for rapid FI</div>
          </div>
        </div>

        {/* Category Breakdown List & Visuals */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Expenses By Category
          </h2>

          {categoryBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No expenses recorded for this timeframe.
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map(([cat, amount]) => {
                const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{cat}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {maskValue(formatCurrency(amount, currency))} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
