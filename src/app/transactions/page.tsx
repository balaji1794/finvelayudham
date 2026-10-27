'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Search,
  Plus,
  Trash2,
  Download,
  Calendar,
  CreditCard,
  Building,
  Coins,
  X,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import MoneySubNav from '@/components/MoneySubNav';
import { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { loadUserPortfolio, saveUserPortfolio, UserPortfolio } from '@/lib/portfolio-vault';

export default function TransactionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { maskValue } = usePrivacy();

  const [currency, setCurrency] = useState('INR');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('ALL');
  const [timeframe, setTimeframe] = useState<'ALL' | 'THIS_MONTH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General');
  const [account, setAccount] = useState('Main Bank');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/transactions');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function initVault() {
      if (!user) return;
      try {
        const portfolio = await loadUserPortfolio(user.id, user.email);
        setTransactions(portfolio.transactions || []);
        setCurrency(portfolio.currency || 'INR');
      } catch (err) {
        console.error('Failed to load transactions:', err);
      }
    }
    if (user) {
      initVault();
    }
  }, [user]);

  const persist = async (newTx: Transaction[]) => {
    if (!user) return;
    const portfolio = await loadUserPortfolio(user.id, user.email);
    const updated: UserPortfolio = {
      ...portfolio,
      transactions: newTx,
      updatedAt: new Date().toISOString(),
    };
    await saveUserPortfolio(updated);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !description.trim()) return;

    const newTx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      type: txType === 'TRANSFER' ? 'EXPENSE' : txType,
      amountBase: numAmount,
      currency,
      category,
      account,
      date: txDate,
      merchant: description.trim(),
      description: description.trim(),
      isRecurring: false,
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    await persist(updated);
    setIsAddOpen(false);
    setDescription('');
    setAmount('');
  };

  const handleDelete = async (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    await persist(updated);
  };

  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'ALL' && t.type !== filterType) return false;
      if (timeframe === 'THIS_MONTH' && !(t.date || '').startsWith(currentMonthStr)) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = (t.merchant || '').toLowerCase().includes(query);
        const catMatch = (t.category || '').toLowerCase().includes(query);
        const accMatch = (t.account || '').toLowerCase().includes(query);
        if (!descMatch && !catMatch && !accMatch) return false;
      }
      return true;
    });
  }, [transactions, filterType, timeframe, currentMonthStr, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Category', 'Account', 'Amount', 'Currency'];
    const rows = filteredTransactions.map((t) => [
      t.date || '',
      t.type,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.account || '').replace(/"/g, '""')}"`,
      t.amountBase,
      t.currency || currency,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout currency={currency} onCurrencyChange={setCurrency} title="Transactions">
      <div className="space-y-4">
        {/* Money Subnav */}
        <MoneySubNav />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Transactions
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'entry' : 'entries'} tracked
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-card hover:bg-muted text-xs sm:text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-card border border-border rounded-lg p-2.5">
          {/* Type Filters */}
          <div className="flex items-center gap-1">
            {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Timeframe & Search */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-input rounded-md overflow-hidden text-xs">
              <button
                onClick={() => setTimeframe('ALL')}
                className={`px-2.5 py-1 ${timeframe === 'ALL' ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                All
              </button>
              <button
                onClick={() => setTimeframe('THIS_MONTH')}
                className={`px-2.5 py-1 ${timeframe === 'THIS_MONTH' ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                This Month
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs rounded-md border border-input bg-background w-36 sm:w-48 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table / List */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xs">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Wallet className="w-10 h-10 mx-auto stroke-1 mb-2 opacity-50" />
              <p className="text-sm font-medium">No transactions found</p>
              <p className="text-xs mt-1">Log expenses, income, or transfers using the "+ Add" button.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTransactions.map((tx) => {
                const isExpense = tx.type === 'EXPENSE';
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isExpense ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}
                      >
                        {isExpense ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {tx.merchant || 'Transaction'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{tx.date || 'Recent'}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-muted text-[10px] uppercase font-medium">
                            {tx.category || 'General'}
                          </span>
                          {tx.account && (
                            <>
                              <span>•</span>
                              <span>{tx.account}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div
                        className={`text-sm sm:text-base font-semibold tabular-nums text-right ${
                          isExpense ? 'text-foreground' : 'text-emerald-500'
                        }`}
                      >
                        {isExpense ? '− ' : '+ '}
                        {maskValue(formatCurrency(tx.amountBase, currency))}
                      </div>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-semibold text-base text-foreground">Add Transaction</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg text-xs font-medium">
                {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTxType(t)}
                    className={`py-1.5 rounded-md transition-colors ${
                      txType === t ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t === 'EXPENSE' ? 'Expense' : t === 'INCOME' ? 'Income' : 'Transfer'}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Description / Payee *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiggy, Salary, Grocery"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                    Date
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Housing & Rent">Housing & Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Salary">Salary</option>
                    <option value="Investment">Investment</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Account
                  </label>
                  <select
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Main Bank">Main Bank Account</option>
                    <option value="Salary Account">Salary Account</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash Wallet">Cash Wallet</option>
                  </select>
                </div>
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
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
