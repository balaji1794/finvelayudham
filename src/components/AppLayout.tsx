'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import HeaderBar from './HeaderBar';
import AddAssetModal from './AddAssetModal';
import AddLiabilityModal from './AddLiabilityModal';
import AddExpenseModal from './AddExpenseModal';
import { Asset, Liability, Transaction } from '@/lib/types';

interface AppLayoutProps {
  children: React.ReactNode;
  currency?: string;
  onCurrencyChange?: (c: string) => void;
  title?: string;
  onAddAsset?: (asset: Asset) => void;
  onAddLiability?: (liability: Liability) => void;
  onAddTransaction?: (transaction: Transaction) => void;
  onTakeSnapshot?: () => void;
}

export default function AppLayout({
  children,
  currency = 'INR',
  onCurrencyChange = () => {},
  title,
  onAddAsset = () => {},
  onAddLiability = () => {},
  onAddTransaction = () => {},
  onTakeSnapshot = () => {},
}: AppLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAddLiabilityOpen, setIsAddLiabilityOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseModalType, setExpenseModalType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Left Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onOpenAddExpense={() => {
          setExpenseModalType('EXPENSE');
          setIsAddExpenseOpen(true);
        }}
        onOpenAddIncome={() => {
          setExpenseModalType('INCOME');
          setIsAddExpenseOpen(true);
        }}
        onOpenAddAsset={() => setIsAddAssetOpen(true)}
        onOpenAddLiability={() => setIsAddLiabilityOpen(true)}
        onTakeSnapshot={onTakeSnapshot}
      />

      {/* Main Content Area (offset on desktop by sidebar width 220px) */}
      <div className="lg:pl-[220px] flex flex-col min-h-screen">
        <HeaderBar
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          currency={currency}
          onCurrencyChange={onCurrencyChange}
          title={title}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Shared Modals */}
      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onAdd={(asset) => {
          onAddAsset(asset);
          setIsAddAssetOpen(false);
        }}
        defaultCurrency={currency}
      />

      <AddLiabilityModal
        isOpen={isAddLiabilityOpen}
        onClose={() => setIsAddLiabilityOpen(false)}
        onAdd={(liability) => {
          onAddLiability(liability);
          setIsAddLiabilityOpen(false);
        }}
        defaultCurrency={currency}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onAdd={(tx) => {
          onAddTransaction(tx);
          setIsAddExpenseOpen(false);
        }}
        defaultType={expenseModalType}
        defaultCurrency={currency}
      />
    </div>
  );
}
