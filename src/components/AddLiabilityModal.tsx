'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Liability } from '@/lib/mock-data';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';

interface AddLiabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (liability: Liability) => void;
  defaultCurrency?: string;
}

export default function AddLiabilityModal({
  isOpen,
  onClose,
  onAdd,
  defaultCurrency = 'INR',
}: AddLiabilityModalProps) {
  const [name, setName] = useState('');
  const [liabilityType, setLiabilityType] = useState<Liability['liabilityType']>('HOME_LOAN');
  const [outstandingAmount, setOutstandingAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyEmi, setMonthlyEmi] = useState('');
  const [lender, setLender] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !outstandingAmount) return;

    const newLiability: Liability = {
      id: `liab-${Date.now()}`,
      name,
      liabilityType,
      outstandingAmount: parseFloat(outstandingAmount) || 0,
      currency,
      interestRate: parseFloat(interestRate) || 0,
      monthlyEmi: parseFloat(monthlyEmi) || 0,
      lender: lender || 'Bank',
    };

    onAdd(newLiability);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-serif text-lg font-bold text-foreground">
            Add Liability / Loan
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1">
              Loan or Liability Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HDFC Home Loan or SBI Car Loan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm bg-muted/60 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Type *
              </label>
              <select
                value={liabilityType}
                onChange={(e) => setLiabilityType(e.target.value as any)}
                className="w-full text-sm bg-muted/60 border border-border rounded-md px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="HOME_LOAN">Home Loan</option>
                <option value="AUTO_LOAN">Auto Loan</option>
                <option value="PERSONAL_LOAN">Personal Loan</option>
                <option value="CREDIT_CARD">Credit Card / Line</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Lender / Bank
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC, ICICI, SBI"
                value={lender}
                onChange={(e) => setLender(e.target.value)}
                className="w-full text-sm bg-muted/60 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Outstanding Principal *
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="4000000"
                value={outstandingAmount}
                onChange={(e) => setOutstandingAmount(e.target.value)}
                className="w-full text-sm bg-muted/60 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Interest Rate (p.a. %)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="8.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full text-sm bg-muted/60 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Monthly EMI
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="35000"
                value={monthlyEmi}
                onChange={(e) => setMonthlyEmi(e.target.value)}
                className="w-full text-sm bg-muted/60 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-sm bg-muted/60 border border-border rounded-md px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Object.keys(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border border-border rounded-md text-foreground/80 hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-md shadow hover:bg-destructive/90"
            >
              Add Liability
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
