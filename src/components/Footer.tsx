import Link from 'next/link';
import { ShieldCheck, Lock, Globe, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 text-foreground/80 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand column */}
        <div className="space-y-4">
          <Link href="/" className="inline-block">
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
              FinVelayudham<span className="text-primary font-sans">.</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All your money, in one place. Net worth, cashflow, and growth tracking across 20+ asset classes and 45+ currencies without bank or broker logins.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Privacy-first · Zero credentials stored</span>
          </div>
        </div>

        {/* Product & Hubs */}
        <div>
          <h4 className="font-serif text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Product
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/demo" className="hover:text-primary transition-colors">
                Live Interactive Demo
              </Link>
            </li>
            <li>
              <Link href="/whats-new" className="hover:text-primary transition-colors">
                What's New & Updates
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-primary transition-colors">
                Sign In / Register
              </Link>
            </li>
            <li>
              <Link href="/admin/sync" className="hover:text-primary transition-colors">
                Sync Pipeline Monitor
              </Link>
            </li>
          </ul>
        </div>

        {/* Financial Calculators */}
        <div>
          <h4 className="font-serif text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Free Calculators
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/calculators/sip" className="hover:text-primary transition-colors">
                SIP Calculator
              </Link>
            </li>
            <li>
              <Link href="/calculators/emi" className="hover:text-primary transition-colors">
                Loan EMI Calculator
              </Link>
            </li>
            <li>
              <Link href="/calculators/retirement" className="hover:text-primary transition-colors">
                Retirement Corpus Planner
              </Link>
            </li>
            <li>
              <Link href="/calculators/xirr" className="hover:text-primary transition-colors">
                XIRR Returns Calculator
              </Link>
            </li>
            <li>
              <Link href="/calculators/future-cost" className="hover:text-primary transition-colors">
                Future Cost & Goal SIP
              </Link>
            </li>
            <li>
              <Link href="/calculators" className="text-primary font-medium hover:underline">
                View all 10 calculators →
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Trust */}
        <div>
          <h4 className="font-serif text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Trust & Security
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-primary transition-colors">
                Refund Policy
              </Link>
            </li>
            <li>
              <a href="mailto:support@finvelayudham.app" className="hover:text-primary transition-colors">
                Support & Inquiries
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <div>
          © 2026 FinVelayudham.app · Designed with financial clarity for Indian & Global investors.
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-primary" />
            256-bit SSL Encrypted
          </span>
          <span className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-primary" />
            45+ Currencies Supported
          </span>
        </div>
      </div>
    </footer>
  );
}
