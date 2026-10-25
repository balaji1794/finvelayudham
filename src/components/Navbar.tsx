'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShieldCheck, RefreshCw, BarChart3, Calculator, Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import CurrencySelector from './CurrencySelector';

interface NavbarProps {
  currentCurrency?: string;
  onCurrencyChange?: (code: string) => void;
}

export default function Navbar({
  currentCurrency = 'INR',
  onCurrencyChange = () => {},
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground transition-transform group-hover:scale-105">
              FinVelayudham<span className="text-primary font-sans">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground/80">
            <Link
              href="/demo"
              className="flex items-center gap-1.5 hover:text-primary transition-colors font-semibold text-primary"
            >
              <BarChart3 className="w-4 h-4" />
              Live Demo
            </Link>
            <Link
              href="/calculators"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Calculator className="w-4 h-4" />
              Calculators
            </Link>
            <Link
              href="/whats-new"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              What's New
            </Link>
            <Link
              href="/admin/sync"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors bg-muted/60 px-2 py-1 rounded-md"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              Sync Status
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
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-md text-foreground/80 hover:text-foreground hover:bg-muted"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 pt-3 pb-6 space-y-4">
          <div className="flex flex-col space-y-3 text-base font-medium">
            <Link
              href="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-primary font-semibold py-2 px-3 rounded-md bg-primary/10"
            >
              <BarChart3 className="w-5 h-5" />
              Live Demo
            </Link>
            <Link
              href="/calculators"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-foreground/90 hover:text-primary py-2 px-3 rounded-md hover:bg-muted"
            >
              <Calculator className="w-5 h-5" />
              Calculators
            </Link>
            <Link
              href="/whats-new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-foreground/90 hover:text-primary py-2 px-3 rounded-md hover:bg-muted"
            >
              <Sparkles className="w-5 h-5" />
              What's New
            </Link>
            <Link
              href="/admin/sync"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-foreground/90 hover:text-primary py-2 px-3 rounded-md hover:bg-muted"
            >
              <RefreshCw className="w-5 h-5 text-primary" />
              Sync Pipeline Monitor
            </Link>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Currency</span>
            <CurrencySelector
              currentCurrency={currentCurrency}
              onCurrencyChange={onCurrencyChange}
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 font-medium border border-border rounded-md text-foreground hover:bg-muted"
            >
              Sign in
            </Link>
            <Link
              href="/login?mode=register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 font-medium bg-primary text-primary-foreground rounded-md shadow"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
