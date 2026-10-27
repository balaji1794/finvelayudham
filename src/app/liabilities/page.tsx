'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  TrendingDown,
  Percent,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import WealthSubNav from '@/components/WealthSubNav';
import AddLiabilityModal from '@/components/AddLiabilityModal';
import { Liability, Asset } from '@/lib/types';
import { formatCurrency, convertAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { loadUserPortfolio, saveUserPortfolio } from '@/lib/portfolio-vault';

export default function LiabilitiesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/liabilities');
    }
  }, [user, authLoading, router]);

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

  const persistChanges = async (updatedLiabilities: Liability[]) => {
    if (!user) return;
    setLiabilities(updatedLiabilities);
    try {
      const currentVault = await loadUserPortfolio(user.id, user.email);
      await saveUserPortfolio({
        ...currentVault,
        liabilities: updatedLiabilities,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to save liabilities:', err);
    }
  };

  const handleAddLiability = async (newLiability: Liability) => {
    const updated = [newLiability, ...liabilities];
    await persistChanges(updated);
  };

  const handleDeleteLiability = async (id: string) => {
    const updated = liabilities.filter((l) => l.id !== id);
    await persistChanges(updated);
  };

  const totalLiabilities = useMemo(() => {
    return liabilities.reduce(
      (sum, l) => sum + convertAmount(l.outstandingAmount, l.currency, currency),
      0
    );
  }, [liabilities, currency]);

  const totalAssets = useMemo(() => {
    return assets.reduce(
      (sum, a) => sum + convertAmount(a.currentValue, a.currentCurrency, currency),
      0
    );
  }, [assets, currency]);

  const totalMonthlyEmi = useMemo(() => {
    return liabilities.reduce(
      (sum, l) => sum + convertAmount(l.monthlyEmi, l.currency, currency),
      0
    );
  }, [liabilities, currency]);

  const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  return (
    <AppLayout
      currency={currency}
      onCurrencyChange={setCurrency}
      title="Liabilities"
      onAddLiability={handleAddLiability}
    >
      <div className="space-y-6">
        {/* Wealth Sub-Navigation */}
        <WealthSubNav />

        {/* Top Header: Title, Description & Add Liability Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Liabilities</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track your debt, mortgages, car loans, and credit cards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#134e35] hover:bg-[#0f3d2a] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Liability</span>
            </button>
          </div>
        </div>

        {/* Empty State Matching FinBoom (Image 3) */}
        {liabilities.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl py-20 px-6 text-center max-w-2xl mx-auto my-12 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">No Liabilities</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
              Debt-free is a great place to be! Add loans or credit card balances here if you have any.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#134e35] hover:bg-[#0f3d2a] text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Liability</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-1">
                  Total Outstanding Debt
                </span>
                <div className="text-2xl font-serif font-bold text-destructive">
                  {maskValue(formatCurrency(totalLiabilities, currency))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-1">
                  Monthly Outflow (EMI)
                </span>
                <div className="text-2xl font-serif font-bold text-foreground">
                  {maskValue(formatCurrency(totalMonthlyEmi, currency))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-1">
                  Debt-to-Asset Ratio
                </span>
                <div className="text-2xl font-serif font-bold text-foreground">
                  {debtRatio.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Liabilities Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border uppercase tracking-wider text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-4">Liability</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Lender</th>
                      <th className="p-4 text-right">Interest Rate</th>
                      <th className="p-4 text-right">Monthly EMI</th>
                      <th className="p-4 text-right">Outstanding Balance</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {liabilities.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-semibold text-foreground">{item.name}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                            {item.liabilityType}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">{item.lender || '—'}</td>
                        <td className="p-4 text-right font-mono text-muted-foreground">
                          {item.interestRate}%
                        </td>
                        <td className="p-4 text-right font-mono font-medium text-foreground">
                          {maskValue(
                            formatCurrency(
                              convertAmount(item.monthlyEmi, item.currency, currency),
                              currency
                            )
                          )}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-destructive">
                          {maskValue(
                            formatCurrency(
                              convertAmount(item.outstandingAmount, item.currency, currency),
                              currency
                            )
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteLiability(item.id)}
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
            </div>
          </div>
        )}
      </div>

      <AddLiabilityModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={(liability) => {
          handleAddLiability(liability);
          setIsAddOpen(false);
        }}
        defaultCurrency={currency}
      />
    </AppLayout>
  );
}
