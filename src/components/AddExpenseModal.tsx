'use client';

import { useState } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Tag, Calendar, FileText } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Transaction) => void;
  defaultType?: 'EXPENSE' | 'INCOME';
  defaultCurrency?: string;
}

const EXPENSE_CATEGORIES = [
  'Housing & Rent',
  'Food & Groceries',
  'Dining Out',
  'Transportation & Fuel',
  'Utilities & Bills',
  'Shopping',
  'Entertainment',
  'Health & Medical',
  'Travel & Vacation',
  'Investment & SIP',
  'Other Expense',
];

const INCOME_CATEGORIES = [
  'Primary Salary',
  'Freelance & Consulting',
  'Business Profit',
  'Dividends & Interest',
  'Rental Income',
  'Bonus & Incentives',
  'Capital Gains',
  'Other Income',
];

export default function AddExpenseModal({
  isOpen,
  onClose,
  onAdd,
  defaultType = 'EXPENSE',
  defaultCurrency = 'INR',
}: AddExpenseModalProps) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>(defaultType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(defaultType === 'EXPENSE' ? 'Food & Groceries' : 'Primary Salary');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isRecurring, setIsRecurring] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      category: category || (type === 'EXPENSE' ? 'General Expense' : 'General Income'),
      amountBase: parsedAmount,
      date: date || new Date().toISOString().slice(0, 10),
      isRecurring,
      description: description.trim() || category,
    };

    onAdd(newTx);
    onClose();
    // Reset form
    setAmount('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span
              className={`p-2 rounded-lg ${
                type === 'EXPENSE' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              }`}
            >
              {type === 'EXPENSE' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </span>
            <h2 className="font-serif text-xl font-bold text-foreground">
              {type === 'EXPENSE' ? 'Log an Expense' : 'Log Income'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                setCategory('Food & Groceries');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'EXPENSE'
                  ? 'bg-card text-destructive shadow-xs border border-destructive/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                setCategory('Primary Salary');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'INCOME'
                  ? 'bg-card text-primary shadow-xs border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Amount ({defaultCurrency}) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {(type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Description / Merchant (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'EXPENSE' ? 'e.g., Grocery run, Swiggy, Petrol' : 'e.g., Monthly salary credit'}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Date & Recurring */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground font-medium select-none">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                />
                Recurring monthly
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-sm font-bold rounded-xl text-white transition-all shadow-sm ${
                type === 'EXPENSE' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'
              }`}
            >
              Save {type === 'EXPENSE' ? 'Expense' : 'Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
