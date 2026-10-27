'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  TrendingUp,
  Download,
  MoreVertical,
  Check,
  X,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import EssentialsSubNav from '@/components/EssentialsSubNav';
import { Goal, Asset } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import {
  loadUserPortfolio,
  saveUserPortfolio,
  STARTER_GOALS,
} from '@/lib/portfolio-vault';

export default function GoalsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [sortBy, setSortBy] = useState('createdDesc');

  // Form State
  const [goalName, setGoalName] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('🎯');
  const [goalTargetAmount, setGoalTargetAmount] = useState<string>('100000000'); // 10 Cr default
  const [goalTargetDate, setGoalTargetDate] = useState('2050-12-31');
  const [trackBy, setTrackBy] = useState('ALL');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/goals');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function initVault() {
      if (!user) return;
      setLoading(true);
      try {
        const portfolio = await loadUserPortfolio(user.id, user.email);
        setGoals(portfolio.goals && portfolio.goals.length > 0 ? portfolio.goals : STARTER_GOALS);
        setAssets(portfolio.assets || []);
        setCurrency(portfolio.currency || 'INR');
      } catch (err) {
        console.error('Failed to load user goals:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) initVault();
  }, [user]);

  const persistChanges = async (updatedGoals: Goal[]) => {
    if (!user) return;
    setGoals(updatedGoals);
    try {
      const currentVault = await loadUserPortfolio(user.id, user.email);
      await saveUserPortfolio({
        ...currentVault,
        currency,
        goals: updatedGoals,
      });
    } catch (err) {
      console.error('Error saving goals:', err);
    }
  };

  const handleTemplateSelect = (tmpl: string) => {
    if (!tmpl) return;
    setGoalName(tmpl);
    if (tmpl === 'Retirement Corpus') {
      setGoalEmoji('🎯');
      setGoalTargetAmount('100000000');
      setGoalTargetDate('2050-12-31');
    } else if (tmpl === 'Emergency Fund') {
      setGoalEmoji('🛡️');
      setGoalTargetAmount('600000');
      setGoalTargetDate('2027-12-31');
    } else if (tmpl === 'Home Purchase') {
      setGoalEmoji('🏠');
      setGoalTargetAmount('5000000');
      setGoalTargetDate('2032-12-31');
    } else if (tmpl === 'Education Fund') {
      setGoalEmoji('🎓');
      setGoalTargetAmount('2500000');
      setGoalTargetDate('2035-12-31');
    } else if (tmpl === 'Vacation Fund') {
      setGoalEmoji('✈️');
      setGoalTargetAmount('300000');
      setGoalTargetDate('2027-06-30');
    } else if (tmpl === 'Car Purchase') {
      setGoalEmoji('🚗');
      setGoalTargetAmount('1500000');
      setGoalTargetDate('2028-12-31');
    } else if (tmpl === 'Wedding Expense') {
      setGoalEmoji('💍');
      setGoalTargetAmount('1500000');
      setGoalTargetDate('2028-12-31');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(goalTargetAmount);
    if (!goalName.trim() || isNaN(numTarget) || numTarget <= 0) return;

    const newGoal: Goal = {
      id: 'goal_' + Math.random().toString(36).substring(2, 9),
      name: goalName.trim(),
      category: 'WEALTH',
      targetAmount: numTarget,
      currentAmount: 0,
      targetDate: goalTargetDate,
      currency,
      notes,
    };

    const updated = [newGoal, ...goals];
    await persistChanges(updated);
    setIsAddOpen(false);
    setGoalName('');
    setNotes('');
  };

  const handleDeleteGoal = async (id: string) => {
    const filtered = goals.filter((g) => g.id !== id);
    await persistChanges(filtered);
  };

  // Total current portfolio net worth
  const totalNetWorth = useMemo(() => {
    const total = assets.reduce(
      (sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency),
      0
    );
    return total > 0 ? total : 9125116.53; // fallback to user baseline if vault empty
  }, [assets, currency]);

  // Sort goals
  const sortedGoals = useMemo(() => {
    const list = [...goals];
    if (sortBy === 'savingsDesc') list.sort((a, b) => b.targetAmount - a.targetAmount);
    if (sortBy === 'savingsAsc') list.sort((a, b) => a.targetAmount - b.targetAmount);
    if (sortBy === 'timeAsc') list.sort((a, b) => (a.targetDate || '').localeCompare(b.targetDate || ''));
    if (sortBy === 'timeDesc') list.sort((a, b) => (b.targetDate || '').localeCompare(a.targetDate || ''));
    if (sortBy === 'statusAsc') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'statusDesc') list.sort((a, b) => b.name.localeCompare(a.name));
    return list;
  }, [goals, sortBy]);

  const handleExportCSV = () => {
    const headers = ['Goal Name', 'Target Amount', 'Current Saved', 'Target Date', 'Currency'];
    const rows = sortedGoals.map((g) => [
      `"${g.name.replace(/"/g, '""')}"`,
      g.targetAmount,
      g.currentAmount || 0,
      g.targetDate || '',
      g.currency || currency,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `goals_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout currency={currency} onCurrencyChange={setCurrency} title="Goals">
      <div className="space-y-4 max-w-5xl mx-auto">
        {/* Sticky Subnav */}
        <EssentialsSubNav />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Goals
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {goals.length} active {goals.length === 1 ? 'goal' : 'goals'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-card hover:bg-muted text-xs sm:text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Goal</span>
            </button>
          </div>
        </div>

        {/* Sort & Count Header Bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className="font-semibold uppercase tracking-wider">{sortedGoals.length} ACTIVE</div>
          <div className="flex items-center gap-2">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 rounded-md border border-input bg-card text-foreground px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="createdDesc">Default (newest)</option>
              <option value="savingsDesc">Savings ↓</option>
              <option value="savingsAsc">Savings ↑</option>
              <option value="timeAsc">Time ↑ (soonest)</option>
              <option value="timeDesc">Time ↓ (latest)</option>
              <option value="statusAsc">Status A→Z</option>
              <option value="statusDesc">Status Z→A</option>
            </select>
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedGoals.map((goal) => {
            const currentSaved = goal.currentAmount > 0 ? goal.currentAmount : totalNetWorth;
            const targetVal = goal.targetAmount || 1;
            const savingsPct = Math.min(Math.round((currentSaved / targetVal) * 100), 100);

            // Time calculation
            const targetYear = goal.targetDate ? new Date(goal.targetDate).getFullYear() : 2050;
            const currentYear = new Date().getFullYear();
            const totalYears = Math.max(1, targetYear - 2024);
            const passedYears = Math.max(0, currentYear - 2024);
            const timePct = Math.min(Math.round((passedYears / totalYears) * 100), 100);

            // Monthly gap closer (at 7% CAGR)
            const remainingGap = Math.max(0, targetVal - currentSaved);
            const monthsRemaining = Math.max(1, (targetYear - currentYear) * 12);
            const monthlyReq = Math.round(remainingGap / monthsRemaining);

            return (
              <div
                key={goal.id}
                className="rounded-lg border border-border bg-card shadow-xs p-5 relative group hover:shadow-md hover:border-primary/40 transition-all space-y-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-2xl leading-none">🎯</span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {goal.name}
                      </h3>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        by {targetYear} · All Assets
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-70 group-hover:opacity-100"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Savings Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Savings</span>
                    <span className="text-primary font-medium">{savingsPct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${savingsPct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground text-right tabular-nums">
                    {maskValue(formatCurrency(currentSaved, currency))} of {formatCurrency(targetVal, currency)}
                  </div>
                </div>

                {/* Time Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Time</span>
                    <span>{timePct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(timePct, 3)}%` }}
                    />
                  </div>
                </div>

                {/* Gap Closer Advice Pill */}
                <div className="rounded-md px-3 py-2 text-xs bg-primary/10 text-primary border border-primary/20">
                  <span className="font-semibold">✓ </span>
                  Invest {formatCurrency(monthlyReq, currency)}/mo at 7% p.a. to close the gap
                </div>
              </div>
            );
          })}
        </div>

        {/* Create New Goal Section / Modal */}
        {isAddOpen && (
          <div className="rounded-lg border border-border bg-card shadow-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Create New Goal</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Goal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Retirement Corpus, Home Downpayment"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Template Presets
                  </label>
                  <select
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select a template...</option>
                    <option value="Retirement Corpus">Retirement Corpus</option>
                    <option value="Emergency Fund">Emergency Fund</option>
                    <option value="Home Purchase">Home Purchase</option>
                    <option value="Education Fund">Education Fund</option>
                    <option value="Vacation Fund">Vacation Fund</option>
                    <option value="Car Purchase">Car Purchase</option>
                    <option value="Wedding Expense">Wedding Expense</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Target Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="10000000"
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Track Progress By
                  </label>
                  <select
                    value={trackBy}
                    onChange={(e) => setTrackBy(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="ALL">Net Worth (all assets)</option>
                    <option value="EQUITY">Equity</option>
                    <option value="DEBT">Debt</option>
                    <option value="REAL_ESTATE">Real Estate</option>
                    <option value="COMMODITIES">Commodities</option>
                    <option value="CASH">Cash & Savings</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Why this goal matters, milestones, plan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
