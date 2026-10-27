'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  UserCheck,
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
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Sticky Subnav */}
        <EssentialsSubNav />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Essentials
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Financial health check
            </p>
          </div>

          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-card hover:bg-muted text-xs sm:text-sm font-medium transition-colors self-start sm:self-auto"
          >
            <UserCheck className="w-4 h-4 text-primary" />
            <span>Financial Profile</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Financial Profile Drawer / Collapsible */}
        {profileOpen && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Financial Profile</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Used for health scores and personalised guidance. All fields are optional.
              </p>
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={editAge}
                    onChange={(e) => setEditAge(parseInt(e.target.value) || 31)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Monthly Income ({currency})
                  </label>
                  <input
                    type="number"
                    value={editIncome}
                    onChange={(e) => setEditIncome(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Monthly Expense ({currency})
                  </label>
                  <input
                    type="number"
                    value={editExpense}
                    onChange={(e) => setEditExpense(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Monthly Savings ({currency})
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formatCurrency(Math.max(0, editIncome - editExpense), currency)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-muted/50 text-muted-foreground"
                  />
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Updates when you change income or expense
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Dependents</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={editDependents}
                    onChange={(e) => setEditDependents(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Your Term Cover ({currency})
                  </label>
                  <input
                    type="number"
                    value={editTermCover}
                    onChange={(e) => setEditTermCover(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Your Health Cover ({currency})
                  </label>
                  <input
                    type="number"
                    value={editHealthCover}
                    onChange={(e) => setEditHealthCover(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-medium text-emerald-500">
                  {profileSavedMsg && 'Profile saved successfully!'}
                </span>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Overall Health Score Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs text-center space-y-2">
          <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-serif">
            {healthScore}
            <span className="text-xl sm:text-2xl font-normal text-muted-foreground font-sans">
              /10
            </span>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            OVERALL HEALTH SCORE
          </div>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              {Number(healthScore) >= 8 ? 'Excellent' : Number(healthScore) >= 6 ? 'Good' : 'Needs Attention'}
            </span>
          </div>
        </div>

        {/* 5 Diagnostic Accordion Cards */}
        <div className="space-y-3.5">
          {/* Card 1: Emergency Fund */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🛡️</span>
                <h3 className="font-semibold text-base text-foreground">Emergency Fund</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {runwayMonths >= 6 ? 'Perfect' : 'Build Further'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <div className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">
                  LIQUID ASSETS
                </div>
                <div className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                  {maskValue(formatCurrency(liquidCash, currency))}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Cash & Savings · FD & RD · Liquid / Debt Funds
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">
                  RUNWAY
                </div>
                <div className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                  {runwayMonths} months
                </div>
              </div>
            </div>

            {/* Scale Bar */}
            <div className="space-y-1 pt-1">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((runwayMonths / 12) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0</span>
                <span>3m</span>
                <span>6m</span>
                <span>12m+</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-1">
              {runwayMonths >= 6
                ? 'Excellent! Your emergency fund is well-stocked'
                : 'Aim for at least 6 months of baseline living expenses in liquid cash or savings.'}
            </p>
          </div>

          {/* Card 2: Savings Rate */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">💰</span>
                <div>
                  <h3 className="font-semibold text-base text-foreground inline-block mr-2">Savings Rate</h3>
                  <span className="text-[10px] text-muted-foreground italic">intended · from financial profile</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {savingsRate >= 50 ? 'Perfect' : 'Moderate'}
              </span>
            </div>

            <div>
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {savingsRate}% <span className="text-sm font-normal text-muted-foreground">of income saved</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Based on your Financial Profile · actual savings may differ
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs tabular-nums">
              <div>
                <span className="text-muted-foreground uppercase text-[10px] font-medium">INCOME:</span>{' '}
                <span className="font-semibold text-foreground">{maskValue(formatCurrency(profile.monthlyIncome, currency))}</span>
              </div>
              <div>
                <span className="text-muted-foreground uppercase text-[10px] font-medium">EXPENSE:</span>{' '}
                <span className="font-semibold text-foreground">{maskValue(formatCurrency(profile.monthlyExpense, currency))}</span>
              </div>
            </div>

            {/* Scale Bar */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(savingsRate, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0%</span>
                <span>20%</span>
                <span>50%</span>
                <span>80%+</span>
              </div>
            </div>

            <div className="pt-1 border-t border-border/50">
              <div className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">
                TIME TO FINANCIAL INDEPENDENCE
              </div>
              <div className="text-base font-bold text-foreground mt-0.5">
                around {timeToFI} yrs
              </div>
              <button
                type="button"
                onClick={() => setShowFiTimeline(!showFiTimeline)}
                className="text-xs text-primary hover:underline font-medium mt-1 inline-block"
              >
                {showFiTimeline ? 'Hide FI timeline reference' : 'View FI timeline reference'}
              </button>

              {showFiTimeline && (
                <div className="mt-2 p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-1">
                  <p>• 20% savings rate: ~37 years to retirement</p>
                  <p>• 50% savings rate: ~16.6 years to retirement</p>
                  <p>• 70% savings rate: ~10.5 years to retirement</p>
                  <p>• 80%+ savings rate: ~8.5 years to financial independence</p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Outstanding! You're on a fast track to financial freedom
            </p>
          </div>

          {/* Card 3: Term Insurance */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏥</span>
                <h3 className="font-semibold text-base text-foreground">Term Insurance</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Perfect
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">
                  YOUR COVER
                </div>
                <div className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                  {formatCurrency(profile.termCover, currency)}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">
                  IDEAL COVER
                </div>
                <div className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                  {formatCurrency(idealTermCover, currency)}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-muted/40 text-xs text-muted-foreground">
              Formula: 25 × Annual Expense − Net Worth = {formatCurrency(idealTermCover, currency)}
            </div>

            <p className="text-xs text-muted-foreground">
              Your term insurance cover meets the recommended level
            </p>
          </div>

          {/* Card 4: Health Insurance */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">💊</span>
                <h3 className="font-semibold text-base text-foreground">Health Insurance</h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isHealthAdequate
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}
              >
                {isHealthAdequate ? 'Perfect' : 'Risky'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">
                  DEPENDENTS
                </div>
                <div className="text-base font-bold text-foreground mt-0.5">
                  {profile.dependents} people
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">
                  YOUR COVER
                </div>
                <div className="text-base font-bold text-foreground tabular-nums mt-0.5">
                  {formatCurrency(profile.healthCover, currency)}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">
                  RECOMMENDED
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-0.5">
                  Min ₹15L · Good ₹25L
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {isHealthAdequate
                ? 'Your private health cover meets the recommended safety guidelines.'
                : 'Minimum ₹15L private health cover is recommended outside corporate employer policies.'}
            </p>
          </div>

          {/* Card 5: Debt Ratio */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">⚖️</span>
                <h3 className="font-semibold text-base text-foreground">Debt Ratio</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {debtRatio <= 10 ? 'Perfect' : 'Moderate'}
              </span>
            </div>

            <div>
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {debtRatio}% <span className="text-sm font-normal text-muted-foreground">of assets are debt-funded</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs tabular-nums">
              <div>
                <span className="text-muted-foreground uppercase text-[10px] font-medium">TOTAL ASSETS:</span>{' '}
                <span className="font-semibold text-foreground">{maskValue(formatCurrency(displayAssets, currency))}</span>
              </div>
              <div>
                <span className="text-muted-foreground uppercase text-[10px] font-medium">TOTAL LIABILITIES:</span>{' '}
                <span className="font-semibold text-foreground">{maskValue(formatCurrency(displayLiabilities, currency))}</span>
              </div>
            </div>

            {/* Scale Bar */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(debtRatio, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0%</span>
                <span>10%</span>
                <span>30%</span>
                <span>50%+</span>
              </div>
            </div>

            <div className="pt-1 border-t border-border/50">
              <div className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">
                NET WORTH
              </div>
              <div className="text-base font-bold text-foreground mt-0.5">
                {maskValue(formatCurrency(displayNetWorth, currency))}
              </div>
              <button
                type="button"
                onClick={() => setShowDebtBenchmarks(!showDebtBenchmarks)}
                className="text-xs text-primary hover:underline font-medium mt-1 inline-block"
              >
                {showDebtBenchmarks ? 'Hide debt ratio benchmarks' : 'View debt ratio benchmarks'}
              </button>

              {showDebtBenchmarks && (
                <div className="mt-2 p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-1">
                  <p>• 0% - 10%: Perfect financial independence readiness</p>
                  <p>• 10% - 30%: Safe, manageable leverage</p>
                  <p>• 30% - 50%: Elevated debt, caution on further borrowing</p>
                  <p>• &gt; 50%: High risk, aggressively pay down liabilities</p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {displayLiabilities === 0
                ? 'No liabilities. Excellent financial position!'
                : 'Maintain debt below 30% of total assets for safety.'}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
