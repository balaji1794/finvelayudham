'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Plus,
  Trash2,
  Repeat,
  Tag,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import MoneySubNav from '@/components/MoneySubNav';
import { formatCurrency } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';

interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  frequency: 'MONTHLY' | 'YEARLY';
  category: string;
}

const DEFAULT_RECURRING: RecurringItem[] = [
  { id: 'rec_1', name: 'Netflix Premium', amount: 649, frequency: 'MONTHLY', category: 'Entertainment' },
  { id: 'rec_2', name: 'Broadband / WiFi', amount: 1199, frequency: 'MONTHLY', category: 'Utilities' },
  { id: 'rec_3', name: 'Health Insurance Annual Premium', amount: 18000, frequency: 'YEARLY', category: 'Insurance' },
];

export default function MoneySettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [currency, setCurrency] = useState('INR');
  const [recurring, setRecurring] = useState<RecurringItem[]>(DEFAULT_RECURRING);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [category, setCategory] = useState('Utilities');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/money/settings');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('finboom_money_recurring');
      if (stored) {
        setRecurring(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not load recurring items:', e);
    }
  }, []);

  const saveRecurring = (items: RecurringItem[]) => {
    setRecurring(items);
    try {
      localStorage.setItem('finboom_money_recurring', JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save recurring items:', e);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || !name.trim()) return;

    const newItem: RecurringItem = {
      id: 'rec_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      amount: num,
      frequency,
      category,
    };

    saveRecurring([...recurring, newItem]);
    setIsAddOpen(false);
    setName('');
    setAmount('');
  };

  const handleDelete = (id: string) => {
    saveRecurring(recurring.filter((r) => r.id !== id));
  };

  return (
    <AppLayout currency={currency} onCurrencyChange={setCurrency} title="Money Settings">
      <div className="space-y-4">
        {/* Money Subnav */}
        <MoneySubNav />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Money Settings & Recurring Payments
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage subscriptions, recurring bills, and auto-categorization preferences
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Recurring Bill</span>
          </button>
        </div>

        {/* Recurring List */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-xs space-y-4" id="recurring">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Tracked Subscriptions & Fixed Bills
            </h2>
            <span className="text-xs text-muted-foreground">{recurring.length} active bills</span>
          </div>

          <div className="divide-y divide-border">
            {recurring.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {item.category} • {item.frequency.toLowerCase()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(item.amount, currency)}
                    <span className="text-xs font-normal text-muted-foreground">
                      /{item.frequency === 'MONTHLY' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categorization & Exemption Rules */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Exempt Categories & Automation
          </h2>
          <p className="text-xs text-muted-foreground">
            Categories marked as exempt are excluded from discretionary expense totals to avoid double counting.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
              <Check className="w-3.5 h-3.5 text-primary" /> Credit Card Bill Payment (Transfer)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
              <Check className="w-3.5 h-3.5 text-primary" /> Mutual Fund SIP / Investment (Equity)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
              <Check className="w-3.5 h-3.5 text-primary" /> Inter-Account Self Transfer
            </span>
          </div>
        </div>
      </div>

      {/* Add Recurring Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-semibold text-base text-foreground">Add Recurring Payment</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Bill / Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hotstar, Gym Membership, House Maid"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Housing">Housing</option>
                  <option value="Fitness">Fitness</option>
                  <option value="General">General</option>
                </select>
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
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
