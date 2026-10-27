'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Target,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  Compass,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Goal, Asset } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import {
  loadUserPortfolio,
  saveUserPortfolio,
  STARTER_GOALS,
} from '@/lib/portfolio-vault';

export default function GoalsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Form State
  const [goalName, setGoalName] = useState('');
  const [goalCategory, setGoalCategory] = useState<Goal['category']>('WEALTH');
  const [goalTargetAmount, setGoalTargetAmount] = useState<number>(1000000);
  const [goalCurrentAmount, setGoalCurrentAmount] = useState<number>(150000);
  const [goalTargetDate, setGoalTargetDate] = useState('2030-12-31');
  const [goalMonthly, setGoalMonthly] = useState<number>(20000);

  // Redirect to login if user is not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/goals');
    }
  }, [user, authLoading, router]);

  // Load user's private encrypted vault
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
    initVault();
  }, [user]);

  // Save changes to encrypted vault
  const persistChanges = async (updatedGoals: Goal[]) => {
    if (!user) return;
    setGoals(updatedGoals);
    setSaveStatus('Encrypting & Saving...');
    try {
      const currentVault = await loadUserPortfolio(user.id, user.email);
      await saveUserPortfolio({
        ...currentVault,
        currency,
        goals: updatedGoals,
      });
      setSaveStatus('Encrypted & Synced');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch (err) {
      console.error('Error saving goals:', err);
      setSaveStatus('Save Failed');
    }
  };

  const handleAddGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal: Goal = {
      id: 'goal_' + Math.random().toString(36).substring(2, 9),
      name: goalName,
      category: goalCategory,
      targetAmount: Number(goalTargetAmount),
      currentAmount: Number(goalCurrentAmount),
      targetDate: goalTargetDate,
      monthlyContribution: Number(goalMonthly),
      currency,
    };
    await persistChanges([...goals, newGoal]);
    setIsAddOpen(false);
    setGoalName('');
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      const filtered = goals.filter((g) => g.id !== id);
      await persistChanges(filtered);
    }
  };

  // Computations
  const totalTarget = useMemo(() => {
    return goals.reduce((sum, g) => sum + convertAmount(g.targetAmount, g.currency || 'INR', currency), 0);
  }, [goals, currency]);

  const totalSaved = useMemo(() => {
    return goals.reduce((sum, g) => sum + convertAmount(g.currentAmount, g.currency || 'INR', currency), 0);
  }, [goals, currency]);

  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const totalMonthlySavingsRequired = useMemo(() => {
    return goals.reduce((sum, g) => sum + convertAmount(g.monthlyContribution || 0, g.currency || 'INR', currency), 0);
  }, [goals, currency]);

  const getDaysRemaining = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Target Achieved!';
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    if (years > 0) return `${years}y ${months}m remaining`;
    return `${months} months remaining`;
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
                Goals & Milestones
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Private Tracker
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Track your retirement corpus, emergency funds, home downpayment, and life milestones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className="text-xs font-medium text-primary animate-pulse">
                {saveStatus}
              </span>
            )}
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:bg-primary/90 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Create New Goal
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Total Target Corpus
            </div>
            <div className="font-serif text-2xl font-bold text-foreground">
              {formatCurrency(totalTarget, currency)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Across {goals.length} tracked milestones</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Total Saved So Far
            </div>
            <div className="font-serif text-2xl font-bold text-primary">
              {formatCurrency(totalSaved, currency)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Funded by linked investments</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Overall Progress
            </div>
            <div className="font-serif text-2xl font-bold text-foreground">
              {overallProgress.toFixed(1)}%
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Target Monthly SIP
            </div>
            <div className="font-serif text-2xl font-bold text-foreground">
              {formatCurrency(totalMonthlySavingsRequired, currency)}/mo
            </div>
            <div className="text-xs text-muted-foreground mt-1">Required savings to hit milestones</div>
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const convTarget = convertAmount(goal.targetAmount, goal.currency || 'INR', currency);
            const convCurrent = convertAmount(goal.currentAmount, goal.currency || 'INR', currency);
            const pct = convTarget > 0 ? (convCurrent / convTarget) * 100 : 0;
            const remaining = Math.max(0, convTarget - convCurrent);

            return (
              <div
                key={goal.id}
                className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 mb-2">
                        {goal.category.replace('_', ' ')}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-foreground">{goal.name}</h3>
                      {goal.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{goal.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Numbers */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">Current: </span>
                      <span className="font-mono text-base font-bold text-foreground">
                        {formatCurrency(convCurrent, currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Target: </span>
                      <span className="font-mono text-base font-bold text-foreground">
                        {formatCurrency(convTarget, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2.5 mt-2 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 ${
                        pct >= 100 ? 'bg-emerald-500' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground font-mono">
                    <span>{pct.toFixed(1)}% funded</span>
                    <span>{formatCurrency(remaining, currency)} to go</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>{getDaysRemaining(goal.targetDate)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Goal Calculator Link */}
        <div className="bg-muted/40 border border-border rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Need help sizing your corpus?</h4>
              <p className="text-xs text-muted-foreground">
                Use our inflation and retirement calculators to compute your exact required future value.
              </p>
            </div>
          </div>
          <Link
            href="/calculators/retirement"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline whitespace-nowrap"
          >
            Retirement Calculator <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      {/* Add Goal Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif text-xl font-bold text-foreground">Create Financial Goal</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddGoalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Children Higher Education"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full text-xs bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                <select
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value as any)}
                  className="w-full text-xs bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="RETIREMENT">Retirement / FIRE</option>
                  <option value="EMERGENCY_FUND">Emergency Fund</option>
                  <option value="HOME">Home Downpayment</option>
                  <option value="EDUCATION">Education</option>
                  <option value="VEHICLE">Vehicle Purchase</option>
                  <option value="VACATION">Vacation / Travel</option>
                  <option value="WEALTH">Wealth Creation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Target Amount ({currency})
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(Number(e.target.value))}
                    className="w-full text-xs bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Current Saved ({currency})
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={goalCurrentAmount}
                    onChange={(e) => setGoalCurrentAmount(Number(e.target.value))}
                    className="w-full text-xs bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full text-xs bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Monthly Contribution ({currency})
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={goalMonthly}
                    onChange={(e) => setGoalMonthly(Number(e.target.value))}
                    className="w-full text-xs bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/90"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
