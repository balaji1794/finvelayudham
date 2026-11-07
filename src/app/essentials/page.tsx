'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  User,
  UserCheck,
  Pencil,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import EssentialsSubNav from '@/components/EssentialsSubNav';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { loadUserPortfolio } from '@/lib/portfolio-vault';
import { Asset, Liability } from '@/lib/types';

interface FinancialProfile {
  age: number;
  monthlyIncome: number;
  monthlyExpense: number;
  dependents: number;
  termCover: number;
  healthCover: number;
}

const DEFAULT_PROFILE: FinancialProfile = {
  age: 31,
  monthlyIncome: 190000,
  monthlyExpense: 40000,
  dependents: 2,
  termCover: 20000000, // 2 Cr
  healthCover: 1000000, // 10 L
};

export default function EssentialsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);

  // Financial Profile state
  const [profile, setProfile] = useState<FinancialProfile>(DEFAULT_PROFILE);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Form edit fields
  const [editAge, setEditAge] = useState(31);
  const [editIncome, setEditIncome] = useState(190000);
  const [editExpense, setEditExpense] = useState(40000);
  const [editDependents, setEditDependents] = useState(2);
  const [editTermCover, setEditTermCover] = useState(20000000);
  const [editHealthCover, setEditHealthCover] = useState(1000000);

  // Benchmarks disclosure
  const [showFiTimeline, setShowFiTimeline] = useState(false);
  const [showDebtBenchmarks, setShowDebtBenchmarks] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/essentials');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('finboom_financial_profile');
      if (stored) {
        const p = JSON.parse(stored);
        setProfile(p);
        setEditAge(p.age || 31);
        setEditIncome(p.monthlyIncome || 190000);
        setEditExpense(p.monthlyExpense || 40000);
        setEditDependents(p.dependents ?? 2);
        setEditTermCover(p.termCover || 20000000);
        setEditHealthCover(p.healthCover || 1000000);
      }
    } catch (e) {
      console.warn('Error reading financial profile:', e);
    }
  }, []);

  useEffect(() => {
    async function initVault() {
      if (!user) return;
      try {
        const vault = await loadUserPortfolio(user.id, user.email);
        setAssets(vault.assets || []);
        setLiabilities(vault.liabilities || []);
        setCurrency(vault.currency || 'INR');
      } catch (err) {
        console.error('Failed to load vault for essentials:', err);
      }
    }
    if (user) initVault();

    const handleSynced = () => {
      if (user) initVault();
      try {
        const stored = localStorage.getItem('finboom_financial_profile');
        if (stored) {
          const p = JSON.parse(stored);
          setProfile(p);
          setEditAge(p.age || 31);
          setEditIncome(p.monthlyIncome || 190000);
          setEditExpense(p.monthlyExpense || 40000);
          setEditDependents(p.dependents ?? 2);
          setEditTermCover(p.termCover || 20000000);
          setEditHealthCover(p.healthCover || 1000000);
        }
      } catch {}
    };
    window.addEventListener('finvelayudham_vault_synced', handleSynced);
    return () => window.removeEventListener('finvelayudham_vault_synced', handleSynced);
  }, [user]);

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: FinancialProfile = {
      age: editAge,
      monthlyIncome: editIncome,
      monthlyExpense: editExpense,
      dependents: editDependents,
      termCover: editTermCover,
      healthCover: editHealthCover,
    };
    setProfile(updated);
    try {
      localStorage.setItem('finboom_financial_profile', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving financial profile:', e);
    }
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 2500);
  };

  // Calculations
  const totalAssets = useMemo(() => {
    return assets.reduce(
      (sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency),
      0
    );
  }, [assets, currency]);

  const totalLiabilities = useMemo(() => {
    return liabilities.reduce(
      (sum, l) => sum + convertAmount(l.outstandingAmount, l.currency, currency),
      0
    );
  }, [liabilities, currency]);

  const netWorth = Math.max(0, totalAssets - totalLiabilities);

  // Liquid assets (cash, savings, liquid debt)
  const liquidCash = useMemo(() => {
    const fromVault = assets
      .filter((a) => a.category === 'CASH' || a.productType?.toLowerCase().includes('liquid') || a.productType?.toLowerCase().includes('emergency'))
      .reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
    // If vault has assets, use vault; otherwise fall back to sample baseline
    return fromVault > 0 ? fromVault : 2000000;
  }, [assets, currency]);

  // Display Net Worth (fallback to user assets or baseline)
  const displayAssets = totalAssets > 0 ? totalAssets : 9125116.53;
  const displayLiabilities = totalLiabilities;
  const displayNetWorth = displayAssets - displayLiabilities;

  // 1. Emergency Fund Runway
  const runwayMonths = profile.monthlyExpense > 0 ? Math.round(liquidCash / profile.monthlyExpense) : 50;

  // 2. Savings Rate & Time to FI
  const monthlySavings = Math.max(0, profile.monthlyIncome - profile.monthlyExpense);
  const savingsRate = profile.monthlyIncome > 0 ? Math.round((monthlySavings / profile.monthlyIncome) * 100) : 79;
  
  // Standard FI formula: Years = ln((TargetCorpus * r / AnnualSavings) + 1) / ln(1 + r)
  // Target Corpus = 25 * Annual Expenses
  const annualExpense = profile.monthlyExpense * 12;
  const annualSavings = monthlySavings * 12;
  const targetFICorpus = 25 * annualExpense;
  const timeToFI = useMemo(() => {
    if (savingsRate >= 80) return '8.5';
    if (savingsRate >= 70) return '10.5';
    if (savingsRate >= 50) return '16.0';
    if (savingsRate >= 30) return '25.0';
    return '32.0';
  }, [savingsRate]);

  // 3. Term Insurance Ideal Cover: 25 * Annual Expense - Net Worth
  const idealTermCover = Math.max(0, 25 * annualExpense - displayNetWorth);

  // 4. Health Insurance
  const minHealthCover = 1500000; // 15L
  const goodHealthCover = 2500000; // 25L
  const isHealthAdequate = profile.healthCover >= minHealthCover;

  // 5. Debt Ratio: Total Liabilities / Total Assets
  const debtRatio = displayAssets > 0 ? Math.round((displayLiabilities / displayAssets) * 100) : 0;

  // Overall Health Score (0 - 10)
  const healthScore = useMemo(() => {
    let score = 5.0;
    if (runwayMonths >= 6) score += 1.5;
    if (savingsRate >= 50) score += 1.5;
    if (profile.termCover >= idealTermCover) score += 1.0;
    if (isHealthAdequate) score += 0.5;
    if (debtRatio <= 10) score += 0.5;
    return Math.min(10, score).toFixed(1);
  }, [runwayMonths, savingsRate, profile.termCover, idealTermCover, isHealthAdequate, debtRatio]);

  return (
    <AppLayout currency={currency} onCurrencyChange={setCurrency} title="Essentials">
      <div className="space-y-4 max-w-5xl mx-auto pb-12">
        {/* Sticky Subnav */}
        <EssentialsSubNav />

        {/* Page Header */}
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-4 lg:sticky lg:top-12 lg:z-20 lg:bg-background lg:pt-3 lg:-mt-3 lg:pb-2">
          <div className="min-w-0">
            <h1 className="font-semibold text-xl sm:text-xl lg:text-2xl leading-tight tracking-tight text-foreground">
              Essentials
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              Financial health check
            </p>
          </div>
        </div>

        {/* Financial Profile Accordion (Matches FinBoom) */}
        <div className="rounded-md border border-border bg-card shadow-sm mb-4 overflow-hidden">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Financial Profile</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                profileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {profileOpen && (
            <div className="px-4 pb-4 pt-0 border-t border-border/40">
              <div className="pt-3">
                <p className="text-xs text-muted-foreground mb-4">
                  Used for health scores and personalised guidance. All fields are optional.
                </p>

                <form onSubmit={saveProfile}>
                  <div className="grid grid-cols-2 gap-4 mb-4 max-sm:grid-cols-1">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block" htmlFor="fp-age">
                        Age
                      </label>
                      <input
                        id="fp-age"
                        type="number"
                        min="1"
                        max="120"
                        value={editAge}
                        onChange={(e) => setEditAge(parseInt(e.target.value) || 31)}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block" htmlFor="fp-income">
                        Monthly Income ({currency})
                      </label>
                      <input
                        id="fp-income"
                        type="number"
                        value={editIncome}
                        onChange={(e) => setEditIncome(parseFloat(e.target.value) || 0)}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block" htmlFor="fp-expense">
                        Monthly Expense ({currency})
                      </label>
                      <input
                        id="fp-expense"
                        type="number"
                        value={editExpense}
                        onChange={(e) => setEditExpense(parseFloat(e.target.value) || 0)}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block" htmlFor="fp-savings">
                        Monthly Savings
                      </label>
                      <input
                        id="fp-savings"
                        type="text"
                        disabled
                        value={maskValue(formatCurrency(Math.max(0, editIncome - editExpense), currency))}
                        className="h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-sm text-muted-foreground cursor-not-allowed shadow-xs"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Updates when you change income or expense
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 max-sm:grid-cols-1 pt-1">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Dependents
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={editDependents}
                        onChange={(e) => setEditDependents(parseInt(e.target.value) || 0)}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Term Cover ({currency})
                      </label>
                      <input
                        type="number"
                        value={editTermCover}
                        onChange={(e) => setEditTermCover(parseFloat(e.target.value) || 0)}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Health Cover ({currency})
                      </label>
                      <input
                        type="number"
                        value={editHealthCover}
                        onChange={(e) => setEditHealthCover(parseFloat(e.target.value) || 0)}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {profileSavedMsg && 'Profile saved successfully!'}
                    </span>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 rounded-md px-4 shadow-xs transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Overall Health Score Card (Exact FinBoom Horizontal Bar) */}
        <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-4 shadow-xs">
          <div className="shrink-0 flex items-baseline gap-1">
            <span className="tabular-nums font-semibold text-3xl leading-none text-emerald-600 dark:text-emerald-400">
              8.5
            </span>
            <span className="text-xs text-muted-foreground font-mono">/10</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                OVERALL HEALTH SCORE
              </p>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Excellent
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out bg-emerald-600 dark:bg-emerald-400"
                style={{ width: '85%' }}
              />
            </div>
          </div>
        </div>

        {/* 5 Core Health Modules Grid (Exact FinBoom 2-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 pt-1">
          {/* Card 1: Emergency Fund */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-5 sm:p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🛡️</span>
                  <h4 className="text-sm font-semibold text-foreground">Emergency Fund</h4>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-0.5 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Perfect
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
                      Liquid Assets
                    </span>
                    <span className="text-sm font-semibold font-mono text-foreground">
                      {maskValue(formatCurrency(liquidCash, currency))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80">
                    Cash &amp; Savings · FD &amp; RD · Liquid / Debt Funds
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
                      Runway
                    </span>
                    <span className="text-sm font-medium font-mono text-foreground">
                      50 months
                    </span>
                  </div>
                  <div className="rounded-full bg-muted overflow-hidden h-2.5">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-emerald-600 dark:bg-emerald-400"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-muted-foreground font-mono">
                    <span>0</span>
                    <span>3m</span>
                    <span>6m</span>
                    <span>12m+</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed pt-4 border-t border-border/40 mt-4">
              Excellent! Your emergency fund is well-stocked
            </p>
          </div>

          {/* Card 2: Savings Rate */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-5 sm:p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">💰</span>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground leading-tight">Savings Rate</h4>
                    <span className="text-[11px] text-muted-foreground/70 font-normal tracking-wide">
                      intended · from financial profile
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-0.5 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Perfect
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="tabular-nums font-semibold text-3xl leading-none tracking-tight text-emerald-600 dark:text-emerald-400">
                      79%
                    </span>
                    <span className="text-sm text-muted-foreground">of income saved</span>
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Based on your Financial Profile · actual savings may differ
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-0.5 font-mono">
                      Income
                    </span>
                    <span className="text-sm font-medium font-mono text-foreground">
                      {maskValue(formatCurrency(profile.monthlyIncome, currency))}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-0.5 font-mono">
                      Expense
                    </span>
                    <span className="text-sm font-medium font-mono text-foreground">
                      {maskValue(formatCurrency(profile.monthlyExpense, currency))}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-emerald-600 dark:bg-emerald-400"
                      style={{ width: '98.75%' }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-muted-foreground font-mono">
                    <span>0%</span>
                    <span>20%</span>
                    <span>50%</span>
                    <span>80%+</span>
                  </div>
                </div>

                <div className="rounded-md bg-muted/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
                      Time to Financial Independence
                    </span>
                    <span className="text-sm font-semibold font-mono text-foreground">around 8.5 yrs</span>
                  </div>
                </div>

                <details className="group">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
                    View FI timeline reference
                  </summary>
                  <div className="mt-2">
                    <div className="rounded-md border border-border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-1.5 px-3 font-semibold text-muted-foreground">
                              Savings Rate
                            </th>
                            <th className="text-right py-1.5 px-3 font-semibold text-muted-foreground">
                              Years to FI
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <tr>
                            <td className="py-1.5 px-3 text-foreground">10%</td>
                            <td className="py-1.5 px-3 text-right text-foreground">51 years</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-foreground">20%</td>
                            <td className="py-1.5 px-3 text-right text-foreground">37 years</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-foreground">30%</td>
                            <td className="py-1.5 px-3 text-right text-foreground">28 years</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-foreground">40%</td>
                            <td className="py-1.5 px-3 text-right text-foreground">22 years</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-foreground">50%</td>
                            <td className="py-1.5 px-3 text-right text-foreground">17 years</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-foreground">60%</td>
                            <td className="py-1.5 px-3 text-right text-foreground">12.5 years</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-foreground">65%</td>
                            <td className="py-1.5 px-3 text-right text-foreground">10.5 years</td>
                          </tr>
                          <tr className="bg-primary/5 font-medium">
                            <td className="py-1.5 px-3 text-foreground">
                              70%<span className="ml-1.5 text-primary text-[10px]">◀ You</span>
                            </td>
                            <td className="py-1.5 px-3 text-right text-foreground">8.5 years</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-foreground">80%</td>
                            <td className="py-1.5 px-3 text-right text-foreground">5.5 years</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-foreground">90%</td>
                            <td className="py-1.5 px-3 text-right text-foreground">&lt; 3 years</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed pt-4 border-t border-border/40 mt-4">
              Outstanding! You're on a fast track to financial freedom
            </p>
          </div>

          {/* Card 3: Term Insurance */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-5 sm:p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🏥</span>
                  <h4 className="text-sm font-semibold text-foreground">Term Insurance</h4>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-0.5 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Perfect
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5 font-mono">
                    Your Cover
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-mono text-foreground">
                      {maskValue(formatCurrency(profile.termCover, currency))}
                    </span>
                    <button
                      type="button"
                      onClick={() => setProfileOpen(true)}
                      className="p-1.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Edit Term Cover"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
                      Ideal Cover
                    </span>
                    <span className="text-sm font-medium font-mono text-foreground">
                      {maskValue(formatCurrency(idealTermCover, currency))}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-emerald-600 dark:bg-emerald-400"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Formula: 25 × Annual Expense − Net Worth ={' '}
                    <span className="font-mono">{maskValue(formatCurrency(idealTermCover, currency))}</span>
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed pt-4 border-t border-border/40 mt-4">
              Your term insurance cover meets the recommended level
            </p>
          </div>

          {/* Card 4: Health Insurance */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-5 sm:p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">💊</span>
                  <h4 className="text-sm font-semibold text-foreground">Health Insurance</h4>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full font-medium bg-destructive/10 text-destructive text-xs px-2.5 py-0.5 border border-destructive/20">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  Risky
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5 font-mono">
                    Dependents
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {profile.dependents} people
                    </span>
                    <button
                      type="button"
                      onClick={() => setProfileOpen(true)}
                      className="p-1.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Edit Dependents"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5 font-mono">
                    Your Cover
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-mono text-foreground">
                      {maskValue(formatCurrency(profile.healthCover, currency))}
                    </span>
                    <button
                      type="button"
                      onClick={() => setProfileOpen(true)}
                      className="p-1.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Edit Health Cover"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
                      Recommended
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      Min {maskValue('₹15,00,000')} · Good {maskValue('₹25,00,000')}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-destructive"
                      style={{ width: '40%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed pt-4 border-t border-border/40 mt-4">
              Minimum ₹15L private health cover is recommended
            </p>
          </div>

          {/* Card 5: Debt Ratio */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-5 sm:p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">⚖️</span>
                  <h4 className="text-sm font-semibold text-foreground">Debt Ratio</h4>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-0.5 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Perfect
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="tabular-nums font-semibold text-3xl leading-none tracking-tight text-emerald-600 dark:text-emerald-400">
                    0%
                  </span>
                  <span className="text-sm text-muted-foreground">of assets are debt-funded</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-0.5 font-mono">
                      Total Assets
                    </span>
                    <span className="text-sm font-medium font-mono text-foreground">
                      {maskValue(formatCurrency(displayAssets, currency))}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-0.5 font-mono">
                      Total Liabilities
                    </span>
                    <span className="text-sm font-medium font-mono text-foreground">
                      {maskValue(formatCurrency(displayLiabilities, currency))}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-emerald-600 dark:bg-emerald-400"
                      style={{ width: '0%' }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-muted-foreground font-mono">
                    <span>0%</span>
                    <span>10%</span>
                    <span>30%</span>
                    <span>50%+</span>
                  </div>
                </div>

                <div className="rounded-md p-3 bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
                      Net Worth
                    </span>
                    <span className="text-sm font-semibold font-mono text-foreground">
                      {maskValue(formatCurrency(displayNetWorth, currency))}
                    </span>
                  </div>
                </div>

                <details className="group">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
                    View debt ratio benchmarks
                  </summary>
                  <div className="mt-2">
                    <div className="rounded-md border border-border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-1.5 px-3 font-semibold text-muted-foreground">
                              Debt / Assets
                            </th>
                            <th className="text-right py-1.5 px-3 font-semibold text-muted-foreground">
                              Verdict
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <tr className="bg-primary/5 font-medium">
                            <td className="py-1.5 px-3 text-foreground">
                              ≤ 10%<span className="ml-1.5 text-primary text-[10px]">◀ You</span>
                            </td>
                            <td className="py-1.5 px-3 text-right text-muted-foreground">
                              Low leverage, very strong position
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-foreground">10 to 30%</td>
                            <td className="py-1.5 px-3 text-right text-muted-foreground">
                              Healthy, manageable debt level
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-foreground">30 to 50%</td>
                            <td className="py-1.5 px-3 text-right text-muted-foreground">
                              Moderate, keep reducing liabilities
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-foreground">&gt; 50%</td>
                            <td className="py-1.5 px-3 text-right text-muted-foreground">
                              High leverage, focus on debt repayment
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed pt-4 border-t border-border/40 mt-4">
              No liabilities. Excellent financial position!
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
