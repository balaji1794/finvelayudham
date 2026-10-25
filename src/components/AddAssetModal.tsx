'use client';

import { useState } from 'react';
import { X, Plus, DollarSign, Tag, Globe } from 'lucide-react';
import { Asset } from '@/lib/mock-data';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (asset: Asset) => void;
  defaultCurrency?: string;
}

export default function AddAssetModal({
  isOpen,
  onClose,
  onAdd,
  defaultCurrency = 'INR',
}: AddAssetModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Asset['category']>('EQUITY');
  const [subClass, setSubClass] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [geographyTag, setGeographyTag] = useState<'DOMESTIC' | 'INTERNATIONAL'>('DOMESTIC');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !currentValue) return;

    const val = parseFloat(currentValue) || 0;
    const inv = parseFloat(investedAmount) || val;

    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      name,
      productType: category,
      category,
      subClass: subClass || null,
      currentValue: val,
      currentCurrency: currency,
      investedAmount: inv,
      geographyTag,
    };

    onAdd(newAsset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-serif text-lg font-bold text-foreground">
            Add New Investment / Asset
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
              Asset or Fund Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Parag Parikh Flexi Cap or Tata Motors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm bg-muted/60 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Asset Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-sm bg-muted/60 border border-border rounded-md px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="EQUITY">Stocks & Equity</option>
                <option value="DEBT">Debt & Fixed Income</option>
                <option value="REAL_ESTATE">Real Estate</option>
                <option value="COMMODITY">Gold & Commodities</option>
                <option value="CASH">Cash & Savings</option>
                <option value="CRYPTO">Crypto</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Sub-Class (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Flexi Cap, Index, SGB"
                value={subClass}
                onChange={(e) => setSubClass(e.target.value)}
                className="w-full text-sm bg-muted/60 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Current Value *
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="500000"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full text-sm bg-muted/60 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Invested Amount
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="400000"
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
                className="w-full text-sm bg-muted/60 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Geography
              </label>
              <select
                value={geographyTag}
                onChange={(e) => setGeographyTag(e.target.value as any)}
                className="w-full text-sm bg-muted/60 border border-border rounded-md px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="DOMESTIC">Domestic (India)</option>
                <option value="INTERNATIONAL">International (Global)</option>
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
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow hover:bg-primary/90"
            >
              Add Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
