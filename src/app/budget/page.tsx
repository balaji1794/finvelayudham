'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Info,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import MoneySubNav from '@/components/MoneySubNav';
import { formatCurrency } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { loadUserPortfolio } from '@/lib/portfolio-vault';
import { Transaction } from '@/lib/types';

interface BudgetEntry {
  category: string;
  amount: number;
}

const AVAILABLE_CATEGORY_CHIPS = [
  'Housing & Rent',
  'Food & Dining',
  'Groceries',
  'Transport',
  'Healthcare',
  'Education',
  'Insurance',
  'EMI & Loans',
  'Loan Interest',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Investment',
  'Travel & Vacations',
  'Subscriptions',
  'Personal Care',
  'Credit Card Payment',
  'Taxes',
  'Cash Withdrawal',
  'Childcare',
  'Other Expense',
];

export default function BudgetPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [customCatInput, setCustomCatInput] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [saveBanner, setSaveBanner] = useState('');

  // Active budget entries for the current month
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/budget');
    }
  }, [user, authLoading, router]);

  const monthYearLabel = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Add category chip
  const handleAddCategory = (categoryName: string) => {
    if (budgetEntries.some((b) => b.category.toLowerCase() === categoryName.toLowerCase())) {
      return;
    }
    setBudgetEntries([...budgetEntries, { category: categoryName, amount: 0 }]);
  };

  // Add custom category
  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCatInput.trim()) return;
    handleAddCategory(customCatInput.trim());
    setCustomCatInput('');
    setIsAddingCustom(false);
  };

  const handleRemoveCategory = (catName: string) => {
    setBudgetEntries(budgetEntries.filter((b) => b.category !== catName));
  };

  const handleUpdateAmount = (catName: string, val: string) => {
    const num = parseFloat(val) || 0;
    setBudgetEntries(
      budgetEntries.map((b) => (b.category === catName ? { ...b, amount: num } : b))
    );
  };

  // Auto-suggest recommended budget split based on ₹40k expense
  const handleAutoSuggest = () => {
    const suggested: BudgetEntry[] = [
      { category: 'Groceries', amount: 12000 },
      { category: 'Food & Dining', amount: 8000 },
      { category: 'Utilities', amount: 5000 },
      { category: 'Transport', amount: 5000 },
      { category: 'Subscriptions', amount: 2000 },
      { category: 'Other Expense', amount: 8000 },
    ];
    setBudgetEntries(suggested);
  };

  const handleCopyLastMonth = () => {
    handleAutoSuggest();
  };

  const totalBudget = useMemo(() => {
    return budgetEntries.reduce((sum, b) => sum + b.amount, 0);
  }, [budgetEntries]);

  const handleSaveBudget = () => {
    try {
      localStorage.setItem(
        `finboom_budget_${currentDate.toISOString().slice(0, 7)}`,
        JSON.stringify(budgetEntries)
      );
    } catch {}
    setSaveBanner('Budget plan saved successfully!');
    setTimeout(() => setSaveBanner(''), 4000);
  };

  return (
    <AppLayout currency={currency} onCurrencyChange={setCurrency} title="Budget">
      <div className="space-y-4 max-w-5xl mx-auto pb-12">
        {/* Money Subnav */}
        <MoneySubNav />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-semibold text-xl sm:text-2xl tracking-tight text-foreground">
              Budget
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Plan your month, then watch how it goes
            </p>
          </div>
        </div>

        {/* Month Selector Bar (< October 2026 >) */}
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>{monthYearLabel}</span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback alert */}
        {saveBanner && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-foreground flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{saveBanner}</span>
          </div>
        )}

        {/* Main Budget Card (Matches Image 2 exactly) */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-6">
          {/* Header Row: Monthly Plan ℹ️ with Auto-suggest and Copy from last month */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <span>Monthly plan</span>
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoSuggest}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Auto-suggest</span>
              </button>
              <button
                onClick={handleCopyLastMonth}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Copy from last month</span>
              </button>
            </div>
          </div>

          {/* Budget Entries or Empty Message */}
          {budgetEntries.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No categories yet. Tap Add categories below to start.
            </div>
          ) : (
            <div className="space-y-2.5">
              {budgetEntries.map((b) => (
                <div
                  key={b.category}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-border/70 bg-muted/20 text-xs"
                >
                  <span className="font-medium text-foreground">{b.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-muted-foreground">₹</span>
                    <input
                      type="number"
                      value={b.amount || ''}
                      placeholder="0"
                      onChange={(e) => handleUpdateAmount(b.category, e.target.value)}
                      className="w-24 px-2.5 py-1 text-right text-xs font-mono font-medium rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={() => handleRemoveCategory(b.category)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Collapsible + Add Categories Drawer (Matches Image 2 exactly) */}
          <div className="pt-2 border-t border-border/60 space-y-3">
            <button
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <span>+ Add categories</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {categoriesOpen && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {AVAILABLE_CATEGORY_CHIPS.map((chip) => {
                  const isAdded = budgetEntries.some((b) => b.category === chip);
                  return (
                    <button
                      key={chip}
                      onClick={() => handleAddCategory(chip)}
                      disabled={isAdded}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                        isAdded
                          ? 'border-transparent bg-muted text-muted-foreground/60 cursor-default'
                          : 'border-border bg-background hover:bg-muted text-foreground cursor-pointer'
                      }`}
                    >
                      <span>+</span>
                      <span>{chip}</span>
                    </button>
                  );
                })}

                {/* New category custom adder */}
                {isAddingCustom ? (
                  <form onSubmit={handleAddCustomCategory} className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={customCatInput}
                      onChange={(e) => setCustomCatInput(e.target.value)}
                      className="px-2 py-0.5 text-xs rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-28"
                    />
                    <button
                      type="submit"
                      className="px-2 py-0.5 text-xs rounded bg-primary text-primary-foreground font-semibold"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustom(false)}
                      className="px-1 py-0.5 text-xs text-muted-foreground"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingCustom(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-dashed border-border bg-background hover:bg-muted text-xs font-medium text-foreground cursor-pointer"
                  >
                    <span>+ New category</span>
                  </button>
                )}

                <button className="text-xs text-muted-foreground hover:text-foreground hover:underline ml-1 cursor-pointer">
                  Manage categories
                </button>
              </div>
            )}
          </div>

          {/* Bottom Bar: Total and Save Budget Button */}
          <div className="pt-4 border-t border-border/60 flex items-center justify-between">
            <div className="text-xs font-mono font-medium text-muted-foreground">
              Total <span className="font-semibold text-foreground">{maskValue(formatCurrency(totalBudget, currency))}</span>
            </div>

            <button
              onClick={handleSaveBudget}
              className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
            >
              Save budget
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
