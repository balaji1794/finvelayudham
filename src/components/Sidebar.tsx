'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  TrendingUp,
  Wallet,
  ShieldCheck,
  UploadCloud,
  Calculator,
  Sparkles,
  Sliders,
  Smartphone,
  MessageSquarePlus,
  Plus,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  CreditCard,
  Camera,
  Check,
} from 'lucide-react';

interface SidebarProps {
  onOpenAddExpense?: () => void;
  onOpenAddIncome?: () => void;
  onOpenAddAsset?: () => void;
  onOpenAddLiability?: () => void;
  onTakeSnapshot?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenAddAsset,
  onOpenAddLiability,
  onTakeSnapshot,
  mobileOpen = false,
  onCloseMobile = () => {},
}: SidebarProps) {
  const pathname = usePathname();
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const addDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target as Node)) {
        setAddDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === '/dashboard') return pathname === '/dashboard';
    if (path === '/assets') {
      return (
        pathname === '/assets' ||
        pathname === '/wealth' ||
        pathname === '/allocation' ||
        pathname === '/liabilities' ||
        pathname === '/snapshots'
      );
    }
    if (path === '/transactions') {
      return (
        pathname === '/transactions' ||
        pathname === '/money' ||
        pathname === '/accounts' ||
        pathname === '/budget' ||
        pathname.startsWith('/money/')
      );
    }
    if (path === '/essentials') return pathname === '/essentials' || pathname === '/goals';
    return typeof pathname.startsWith === 'function' ? pathname.startsWith(path) : false;
  };

  const handleInstallApp = () => {
    if (typeof window !== 'undefined') {
      const promptEvent = (window as any).deferredPrompt;
      if (promptEvent) {
        promptEvent.prompt();
      } else {
        alert('To install FinVelayudham:\n\n• On Chrome/Edge: Click the install icon in the URL bar.\n• On iOS/Safari: Tap Share -> Add to Home Screen.');
      }
    }
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackOpen(false);
      setFeedbackSent(false);
      setFeedbackText('');
    }, 1800);
  };

  const navClasses = (path: string) => `
    flex items-center gap-3 px-3 min-h-11 rounded-lg text-sm font-medium transition-colors select-none
    ${
      isActive(path)
        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs'
        : 'text-foreground/70 hover:bg-muted hover:text-foreground active:bg-muted'
    }
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-[220px] shrink-0 border-r border-border bg-card flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Logo */}
          <div className="p-5 pb-4">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <span className="font-serif text-xl tracking-tight text-foreground transition-transform group-hover:scale-[1.02]">
                FinVelayudham<span className="text-primary font-sans">.</span>
              </span>
            </Link>
          </div>

          {/* "+ Add" Dropdown CTA */}
          <div className="px-3 pb-3 relative" ref={addDropdownRef}>
            <button
              onClick={() => setAddDropdownOpen(!addDropdownOpen)}
              className="flex w-full items-center gap-2 rounded-lg bg-primary px-3 min-h-11 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
            >
              <Plus className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">Add</span>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200 ${addDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {addDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 z-50 bg-popover border border-border rounded-xl shadow-xl py-1.5 divide-y divide-border/60 animate-in fade-in zoom-in-95">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setAddDropdownOpen(false);
                      onOpenAddExpense?.();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <span className="p-1 rounded-md bg-destructive/10 text-destructive">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <div className="font-bold">Add Expense</div>
                      <div className="text-[10px] text-muted-foreground font-normal">Log daily spending</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setAddDropdownOpen(false);
                      onOpenAddIncome?.();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <span className="p-1 rounded-md bg-primary/10 text-primary">
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <div className="font-bold">Add Income</div>
                      <div className="text-[10px] text-muted-foreground font-normal">Salary, bonus, freelance</div>
                    </div>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setAddDropdownOpen(false);
                      onOpenAddAsset?.();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <span className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                      <Coins className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <div className="font-bold">Add Asset</div>
                      <div className="text-[10px] text-muted-foreground font-normal">MF, stocks, EPF, real estate</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setAddDropdownOpen(false);
                      onOpenAddLiability?.();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <span className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                      <CreditCard className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <div className="font-bold">Add Liability</div>
                      <div className="text-[10px] text-muted-foreground font-normal">Home loan, car loan, cards</div>
                    </div>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setAddDropdownOpen(false);
                      onTakeSnapshot?.();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                      <Camera className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <div className="font-bold">Take Snapshot</div>
                      <div className="text-[10px] text-muted-foreground font-normal">Capture monthly checkpoint</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary Navigation */}
          <nav className="space-y-1">
            <Link href="/dashboard" className={navClasses('/dashboard')}>
              <LayoutGrid className="w-4 h-4" />
              <span>Overview</span>
            </Link>

            <Link href="/assets" className={navClasses('/assets')}>
              <TrendingUp className="w-4 h-4" />
              <span>Wealth</span>
            </Link>

            <Link href="/transactions" className={navClasses('/transactions')}>
              <Wallet className="w-4 h-4" />
              <span>Money</span>
            </Link>

            <Link href="/essentials" className={navClasses('/essentials')}>
              <ShieldCheck className="w-4 h-4" />
              <span>Essentials</span>
            </Link>
          </nav>

          {/* TOOLS Section */}
          <div className="pt-2 space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tools
            </div>

            <Link href="/import" className={navClasses('/import')}>
              <UploadCloud className="w-4 h-4" />
              <span>Import</span>
            </Link>

            <Link href="/calculators" className={navClasses('/calculators')}>
              <Calculator className="w-4 h-4" />
              <span>Calculators</span>
            </Link>

            <Link href="/whats-new" className={navClasses('/whats-new')}>
              <Sparkles className="w-4 h-4" />
              <span>What's New</span>
            </Link>

            <Link href="/settings" className={navClasses('/settings')}>
              <Sliders className="w-4 h-4" />
              <span>Settings</span>
            </Link>

            <button
              onClick={handleInstallApp}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all text-left"
            >
              <Smartphone className="w-4 h-4" />
              <span>Install App</span>
            </button>

            <button
              onClick={() => setFeedbackOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all text-left"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Feedback</span>
            </button>
          </div>
        </div>

        {/* Bottom Unlocked Badge (Replaces FinBoom's Paywall) */}
        <div className="p-4 border-t border-border">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-foreground">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                100% Free & Unlimited
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              All Pro features unlocked forever. Client-encrypted zero-knowledge vault.
            </p>
          </div>
        </div>
      </aside>

      {/* Feedback Dialog Modal */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6">
            <h3 className="font-serif text-lg font-bold text-foreground mb-2">Share Feedback</h3>
            <p className="text-xs text-muted-foreground mb-4">
              FinVelayudham is built for you. Tell us what feature you'd like added or improved!
            </p>

            {feedbackSent ? (
              <div className="py-8 text-center text-emerald-600 dark:text-emerald-400">
                <Check className="w-10 h-10 mx-auto mb-2" />
                <p className="font-bold text-sm">Thank you for your feedback!</p>
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="space-y-4">
                <textarea
                  rows={4}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What would make FinVelayudham even better for your financial journey?"
                  className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Send Feedback
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
