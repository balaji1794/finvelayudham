'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Heart,
  Umbrella,
  Zap,
  ArrowRight,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { loadUserPortfolio } from '@/lib/portfolio-vault';
import { Asset, Liability, Transaction } from '@/lib/types';

export default function EssentialsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/essentials');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function initVault() {
      if (!user) return;
      try {
        const portfolio = await loadUserPortfolio(user.id, user.email);
        setAssets(portfolio.assets || []);
        setLiabilities(portfolio.liabilities || []);
        setTransactions(portfolio.transactions || []);
      } catch (err) {
        console.error('Failed to load vault for essentials:', err);
      }
    }
    if (user) {
      initVault();
    }
  }, [user]);

  // Calculations
  const liquidCash = assets
    .filter((a) => a.category === 'CASH' || a.productType?.toLowerCase().includes('emergency'))
    .reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);

  const monthlyExpenses = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amountBase, 0) || 50000; // default 50k if not logged

  const targetEmergencyFund = monthlyExpenses * 6;
  const emergencyCoverageMonths = monthlyExpenses > 0 ? (liquidCash / monthlyExpenses).toFixed(1) : '6+';
  const isEmergencyAdequate = liquidCash >= targetEmergencyFund;

  const totalAssets = assets.reduce(
    (sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency),
    0
  );
  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + convertAmount(l.outstandingAmount, l.currency, currency),
    0
  );
  const debtRatio = totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 100) : 0;
  const isDebtHealthy = debtRatio <= 30;

  // Compute Overall Score (0-100)
  let healthScore = 50;
  if (isEmergencyAdequate) healthScore += 25;
  if (isDebtHealthy) healthScore += 15;
  if (assets.length >= 3) healthScore += 10;

  return (
    <AppLayout currency={currency} onCurrencyChange={setCurrency} title="Financial Essentials">
      <div className="space-y-6">
        {/* Header Hero Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                Financial Defense & Essentials
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-1">
                Security Diagnostics
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Before focusing on aggressive wealth creation, verify your 4 financial security layers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Overall Health Score
                </span>
                <span className="text-3xl font-serif font-bold text-primary">{healthScore}/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Emergency Fund Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Zap className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Emergency Cash Reserves</h3>
                  <p className="text-[11px] text-muted-foreground">6 Months of baseline living costs</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  isEmergencyAdequate
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {isEmergencyAdequate ? 'Fully Covered' : 'Build Further'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Current Liquid Reserves:</span>
                <span className="font-bold text-foreground">{maskValue(formatCurrency(liquidCash, currency))}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Target (6x Monthly Spend):</span>
                <span className="font-bold text-foreground">
                  {maskValue(formatCurrency(targetEmergencyFund, currency))}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-border/60">
                <span className="text-muted-foreground">Runway:</span>
                <span className="font-bold text-primary">{emergencyCoverageMonths} months</span>
              </div>
            </div>
          </div>

          {/* 2. Debt Safety Ratio */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Debt-to-Asset Safety</h3>
                  <p className="text-[11px] text-muted-foreground">Maintain debt below 30% of total assets</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  isDebtHealthy
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {isDebtHealthy ? 'Safe Ratio' : 'High Leverage'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Liabilities:</span>
                <span className="font-bold text-destructive">
                  {maskValue(formatCurrency(totalLiabilities, currency))}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Assets:</span>
                <span className="font-bold text-foreground">{maskValue(formatCurrency(totalAssets, currency))}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-border/60">
                <span className="text-muted-foreground">Leverage Ratio:</span>
                <span className="font-bold text-primary">{debtRatio}%</span>
              </div>
            </div>
          </div>

          {/* 3. Term Life Insurance */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Umbrella className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-foreground">Pure Term Insurance</h3>
                <p className="text-[11px] text-muted-foreground">Protect family from loss of income</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recommendation: Pure term plan covering 10x-15x your annual salary until retirement age. Avoid ULIPs or endowment policies.
            </p>
          </div>

          {/* 4. Health Insurance */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <Heart className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-foreground">Independent Health Insurance</h3>
                <p className="text-[11px] text-muted-foreground">Prevent medical emergencies from eroding savings</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recommendation: Separate private family floater policy of ₹10L - ₹25L outside employer corporate cover to ensure uninterrupted coverage across job transitions.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
