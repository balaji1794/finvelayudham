'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Bell,
  ChevronDown,
  User as UserIcon,
  Settings,
  Download,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePrivacy } from '@/context/PrivacyContext';
import ThemeToggle from './ThemeToggle';
import CurrencySelector from './CurrencySelector';
import SyncFinboomModal from './SyncFinboomModal';

interface HeaderBarProps {
  onToggleMobileSidebar?: () => void;
  currency?: string;
  onCurrencyChange?: (curr: string) => void;
  title?: string;
}

export default function HeaderBar({
  onToggleMobileSidebar,
  currency = 'INR',
  onCurrencyChange = () => {},
  title,
}: HeaderBarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isPrivacyMasked, togglePrivacyMask } = usePrivacy();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute initials (e.g. "BV" or "B")
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  };

  const displayName = user?.name || 'Balaji Velayudham';
  const displayEmail = user?.email || 'sharmashreedx333@gmail.com';

  return (
    <header className="sticky top-0 z-30 h-12 w-full border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Sidebar Trigger + Optional Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-base font-serif font-bold text-foreground hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      {/* Right: Actions matching FinBoom */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync with FinBoom Button */}
        <button
          onClick={() => setSyncModalOpen(true)}
          title="Synchronize design, content, style & portfolio with FinBoom reference"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold transition-all cursor-pointer shadow-xs group"
          aria-label="Sync with FinBoom"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:rotate-180 transition-transform duration-500" />
          <span className="hidden sm:inline">Sync FinBoom</span>
          <span className="sm:hidden">Sync</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </button>

        {/* Currency Switcher */}
        <div className="hidden sm:block">
          <CurrencySelector currentCurrency={currency} onCurrencyChange={onCurrencyChange} />
        </div>

        {/* Theme Toggle (Dark/Light) */}
        <ThemeToggle />

        {/* Privacy Mask Toggle (The Eye Icon) */}
        <button
          onClick={togglePrivacyMask}
          title={isPrivacyMasked ? 'Reveal financial numbers' : 'Hide financial numbers (Privacy Mode)'}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isPrivacyMasked
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          aria-label="Toggle privacy mask"
        >
          {isPrivacyMasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
              4
            </span>
          </button>

          {/* Notifications Popover */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Notifications & Insights
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  4 Active
                </span>
              </div>

              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                <div className="p-2.5 rounded-xl bg-muted/60 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Emergency Fund Intact
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Your liquid cash reserves cover 6+ months of living expenses.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/60 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Monthly Snapshot Checkpoint
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    October 2026 snapshot ready to record your net worth compounding.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/60 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    Zero-Knowledge Secrecy
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Your portfolio is encrypted with AES-256 GCM on this device.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/60 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    All Pro Features Unlocked
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Unlimited assets, liabilities, and imports free forever.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-border hover:bg-muted/70 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
              {getInitials(displayName)}
            </div>
            <span className="text-xs font-semibold text-foreground max-w-[120px] truncate hidden md:inline">
              {displayName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {/* Profile Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                  Account & Settings
                </Link>

                <Link
                  href="/settings#export"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                  Export Encrypted Backup
                </Link>
              </div>

              <div className="pt-1 border-t border-border">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                    router.push('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out / Lock Vault
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FinBoom Parity & Sync Modal */}
      <SyncFinboomModal isOpen={syncModalOpen} onClose={() => setSyncModalOpen(false)} />
    </header>
  );
}
