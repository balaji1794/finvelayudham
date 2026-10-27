'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  RefreshCw,
  BarChart3,
  Calculator,
  Sparkles,
  ChevronDown,
  LogOut,
  CheckCircle2,
  PieChart,
  CreditCard,
  Target,
  Camera,
  Sliders,
  Settings as SettingsIcon,
  Upload,
  Coins,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import CurrencySelector from './CurrencySelector';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  currentCurrency?: string;
  onCurrencyChange?: (code: string) => void;
}

export default function Navbar({
  currentCurrency = 'INR',
  onCurrencyChange = () => {},
}: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute user initials (e.g. "SS" for Sharma Shreedx)
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0] ? parts[0].slice(0, 2) : 'U').toUpperCase();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground transition-transform group-hover:scale-105">
              FinVelayudham<span className="text-primary font-sans">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-foreground/80">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isActive('/dashboard') ? 'text-primary font-bold' : 'hover:text-primary'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Dashboard
                </Link>

                <Link
                  href="/assets"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isActive('/assets') ? 'text-primary font-bold' : 'hover:text-primary'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  Assets
                </Link>

                <Link
                  href="/liabilities"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isActive('/liabilities') ? 'text-primary font-bold' : 'hover:text-primary'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Liabilities
                </Link>

                <Link
                  href="/goals"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isActive('/goals') ? 'text-primary font-bold' : 'hover:text-primary'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  Goals
                </Link>

                <Link
                  href="/snapshots"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isActive('/snapshots') ? 'text-primary font-bold' : 'hover:text-primary'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Snapshots
                </Link>

                <Link
                  href="/allocation"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isActive('/allocation') ? 'text-primary font-bold' : 'hover:text-primary'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Allocation
                </Link>
              </>
            ) : (
              <Link
                href="/demo"
                className="flex items-center gap-1.5 hover:text-primary transition-colors font-semibold text-primary"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Live Demo
              </Link>
            )}

            <Link
              href="/calculators"
              className={`flex items-center gap-1.5 transition-colors ${
                pathname?.startsWith('/calculators') ? 'text-primary font-bold' : 'hover:text-primary'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Calculators
            </Link>
          </nav>
        </div>

        {/* Action Controls & Auth */}
        <div className="hidden md:flex items-center gap-3">
          <CurrencySelector
            currentCurrency={currentCurrency}
            onCurrencyChange={onCurrencyChange}
          />
          <ThemeToggle />

          <div className="h-4 w-px bg-border mx-1" />

          {user ? (
            /* Logged-in User Profile Dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:border-primary/50 bg-card hover:bg-muted/60 transition-all text-sm font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-expanded={userDropdownOpen}
              >
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center text-xs shadow-inner">
                  {getInitials(user.name)}
                </div>
                <span className="max-w-[120px] truncate text-foreground font-semibold text-xs">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5 border-b border-border">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>{user.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {user.email}
                    </div>
                    <span className="inline-block mt-1.5 text-[10px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                      100% Free & Unlimited
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-muted transition-colors font-medium"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-primary" />
                      <span>Net Worth Dashboard</span>
                    </Link>

                    <Link
                      href="/assets"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Coins className="w-3.5 h-3.5 text-primary" />
                      <span>Assets Portfolio</span>
                    </Link>

                    <Link
                      href="/liabilities"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-destructive" />
                      <span>Liabilities & Loans</span>
                    </Link>

                    <Link
                      href="/goals"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Target className="w-3.5 h-3.5 text-amber-500" />
                      <span>Goals & Milestones</span>
                    </Link>

                    <Link
                      href="/snapshots"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-500" />
                      <span>Historical Snapshots</span>
                    </Link>

                    <Link
                      href="/allocation"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5 text-purple-500" />
                      <span>Allocation & Rebalance</span>
                    </Link>

                    <Link
                      href="/import"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      <span>Import & Export Hub</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Settings & Preferences</span>
                    </Link>
                  </div>

                  <div className="border-t border-border pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged-out State */
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-foreground/90 hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/login?mode=register"
                className="inline-flex items-center justify-center text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md shadow-sm transition-all hover:shadow"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-foreground/80 hover:text-foreground focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 pt-3 pb-6 space-y-4">
          {user && (
            <div className="p-3 bg-muted/60 rounded-xl border border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center text-xs">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-1.5 text-sm font-medium">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-foreground hover:text-primary py-2 px-3 rounded-md hover:bg-muted"
                >
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Dashboard
                </Link>

                <Link
                  href="/assets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-foreground hover:text-primary py-2 px-3 rounded-md hover:bg-muted"
                >
                  <Coins className="w-4 h-4 text-primary" />
                  Assets
                </Link>

                <Link
                  href="/liabilities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-foreground hover:text-primary py-2 px-3 rounded-md hover:bg-muted"
                >
                  <CreditCard className="w-4 h-4 text-destructive" />
                  Liabilities
                </Link>

                <Link
                  href="/goals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-foreground hover:text-primary py-2 px-3 rounded-md hover:bg-muted"
                >
                  <Target className="w-4 h-4 text-amber-500" />
                  Goals
                </Link>

                <Link
                  href="/snapshots"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-foreground hover:text-primary py-2 px-3 rounded-md hover:bg-muted"
                >
                  <Camera className="w-4 h-4 text-blue-500" />
                  Snapshots
                </Link>

                <Link
                  href="/allocation"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-foreground hover:text-primary py-2 px-3 rounded-md hover:bg-muted"
                >
                  <Sliders className="w-4 h-4 text-purple-500" />
                  Allocation
                </Link>

                <Link
                  href="/import"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-foreground hover:text-primary py-2 px-3 rounded-md hover:bg-muted"
                >
                  <Upload className="w-4 h-4 text-primary" />
                  Import & Export
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-foreground hover:text-primary py-2 px-3 rounded-md hover:bg-muted"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-500" />
                  Settings
                </Link>
              </>
            ) : (
              <Link
                href="/demo"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-primary font-semibold py-2 px-3 rounded-md bg-primary/10"
              >
                <BarChart3 className="w-4 h-4" />
                Live Demo
              </Link>
            )}

            <Link
              href="/calculators"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-foreground/90 hover:text-primary py-2 px-3 rounded-md hover:bg-muted"
            >
              <Calculator className="w-4 h-4" />
              Calculators
            </Link>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Currency</span>
            <CurrencySelector
              currentCurrency={currentCurrency}
              onCurrencyChange={onCurrencyChange}
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-center py-2.5 font-medium border border-destructive text-destructive rounded-md hover:bg-destructive/10 flex items-center justify-center gap-2 text-xs"
              >
                <LogOut className="w-4 h-4" />
                Sign Out ({user.name})
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 font-medium border border-border rounded-md text-foreground hover:bg-muted text-xs"
                >
                  Sign in
                </Link>
                <Link
                  href="/login?mode=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 font-medium bg-primary text-primary-foreground rounded-md shadow text-xs"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
