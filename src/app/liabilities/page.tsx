'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Plus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Home,
  Car,
  DollarSign,
  TrendingDown,
  Percent,
  Calendar,
  Layers,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AddLiabilityModal from '@/components/AddLiabilityModal';
import { Liability, Asset } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import {
  loadUserPortfolio,
  saveUserPortfolio,
} from '@/lib/portfolio-vault';

export default function LiabilitiesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Redirect to login if user is not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/liabilities');
    }
  }, [user, authLoading, router]);

  // Load user's private encrypted vault
  useEffect(() => {
    async function initVault() {
      if (!user) return;
      setLoading(true);
      try {
        const portfolio = await loadUserPortfolio(user.id, user.email);
        setLiabilities(portfolio.liabilities || []);
        setAssets(portfolio.assets || []);
        setCurrency(portfolio.currency || 'INR');
      } catch (err) {
        console.error('Failed to load user liabilities:', err);
      } finally {
        setLoading(false);
      }
    }
    initVault();
  }, [user]);

  // Save changes to encrypted vault
  const persistChanges = async (updatedLiabilities: Liability[]) => {
    if (!user) return;
    setLiabilities(updatedLiabilities);
    setSaveStatus('Encrypting & Saving...');
    try {
      const currentVault = await loadUserPortfolio(user.id, user.email);
      await saveUserPortfolio({
        ...currentVault,
        currency,
        liabilities: updatedLiabilities,
      });
      setSaveStatus('Encrypted & Synced');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch (err) {
      console.error('Error saving liabilities:', err);
      setSaveStatus('Save Failed');
    }
  };

  const handleAddLiability = async (newLiability: Liability) => {
    await persistChanges([...liabilities, newLiability]);
    setIsAddOpen(false);
  };

  const handleDeleteLiability = async (id: string) => {
    if (confirm('Are you sure you want to delete this liability?')) {
      const filtered = liabilities.filter((l) => l.id !== id);
      await persistChanges(filtered);
    }
  };

  const getConvertedAmount = (amount: number, fromCurr: string) => {
    return convertAmount(amount, fromCurr, currency);
  };

  // Computations
  const totalDebt = useMemo(() => {
    return liabilities.reduce((sum, l) => sum + getConvertedAmount(l.outstandingAmount, l.currency), 0);
  }, [liabilities, currency]);

  const totalMonthlyEmi = useMemo(() => {
    return liabilities.reduce((sum, l) => sum + getConvertedAmount(l.monthlyEmi, l.currency), 0);
  }, [liabilities, currency]);

  const totalAssetValue = useMemo(() => {
    return assets.reduce((sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency), 0);
  }, [assets, currency]);

  const debtToAssetRatio = totalAssetValue > 0 ? (totalDebt / totalAssetValue) * 100 : 0;

  const weightedInterestRate = useMemo(() => {
    if (totalDebt === 0) return 0;
    const totalInterestWeighted = liabilities.reduce(
      (sum, l) => sum + getConvertedAmount(l.outstandingAmount, l.currency) * l.interestRate,
      0
    );
    return totalInterestWeighted / totalDebt;
  }, [liabilities, totalDebt, currency]);

  const getLiabilityIcon = (type: string) => {
    switch (type) {
      case 'HOME_LOAN':
        return <Home className="w-4 h-4 text-emerald-500" />;
      case 'AUTO_LOAN':
        return <Car className="w-4 h-4 text-blue-500" />;
      case 'CREDIT_CARD':
        return <CreditCard className="w-4 h-4 text-rose-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-amber-500" />;
    }
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
                Liabilities & Debt
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Private Vault
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Track home loans, car loans, education debt, and credit card balances with EMI projections.
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground font-semibold rounded-lg shadow hover:opacity-90 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Liability
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Total Outstanding Debt
            </div>
            <div className="font-serif text-2xl font-bold text-destructive">
              {formatCurrency(totalDebt, currency)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Across {liabilities.length} active loans</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Total Monthly EMI
            </div>
            <div className="font-serif text-2xl font-bold text-foreground">
              {formatCurrency(totalMonthlyEmi, currency)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Monthly cashflow obligation</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Avg Interest Rate
            </div>
            <div className="font-serif text-2xl font-bold text-foreground">
              {weightedInterestRate.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Weighted by loan balance</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mb-1">
              Debt-to-Asset Ratio
            </div>
            <div
              className={`font-serif text-2xl font-bold ${
                debtToAssetRatio < 30
                  ? 'text-primary'
                  : debtToAssetRatio < 50
                  ? 'text-amber-500'
                  : 'text-destructive'
              }`}
            >
              {debtToAssetRatio.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {debtToAssetRatio < 30 ? 'Healthy Financial Buffer' : 'Moderate Debt Exposure'}
            </div>
          </div>
        </div>

        {/* Debt Payoff Strategy Tip */}
        <div className="bg-muted/40 border border-border rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Debt Avalanche vs. Snowball Payoff Strategy
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                Pay the minimum on all loans, then direct extra surplus to the loan with the highest
                interest rate (Avalanche: saves max interest) or lowest balance (Snowball: fast psychological wins).
              </p>
            </div>
          </div>
          <Link
            href="/calculators/emi"
            className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
          >
            Open Loan EMI Calculator →
          </Link>
        </div>

        {/* Liabilities Table */}
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Active Liabilities ({liabilities.length})
            </h2>
            <div className="text-xs text-muted-foreground">Values shown in {currency}</div>
          </div>

          {liabilities.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CreditCard className="w-12 h-12 text-primary/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">Zero Debt Recorded!</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                You have no outstanding liabilities or loans recorded. 100% of your assets contribute directly to your net worth.
              </p>
              <button
                onClick={() => setIsAddOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted"
              >
                <Plus className="w-4 h-4" />
                Add a Loan or Credit Card
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Liability Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Lender</th>
                    <th className="py-3 px-4 text-right">Interest Rate</th>
                    <th className="py-3 px-4 text-right">Monthly EMI</th>
                    <th className="py-3 px-4 text-right">Outstanding Balance</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {liabilities.map((liab) => {
                    const convBalance = getConvertedAmount(liab.outstandingAmount, liab.currency);
                    const convEmi = getConvertedAmount(liab.monthlyEmi, liab.currency);

                    return (
                      <tr key={liab.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2.5">
                          <div className="p-1.5 rounded-md bg-muted border border-border">
                            {getLiabilityIcon(liab.liabilityType)}
                          </div>
                          <span>{liab.name}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-foreground">
                            {liab.liabilityType.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {liab.lender || 'Direct Provider'}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-foreground">
                          {liab.interestRate}%
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-foreground">
                          {formatCurrency(convEmi, currency)}/mo
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-destructive">
                          {formatCurrency(convBalance, currency)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteLiability(liab.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            title="Delete Liability"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Liability Modal */}
      <AddLiabilityModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddLiability}
        defaultCurrency={currency}
      />

      <Footer />
    </div>
  );
}
