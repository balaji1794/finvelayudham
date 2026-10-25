'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  PieChart,
  Lock,
  Layers,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Download,
  Users,
  Check,
  Zap,
  Globe2,
  FileSpreadsheet,
  Wallet
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import InteractiveAreaChart from '@/components/InteractiveAreaChart';
import { INITIAL_SNAPSHOTS } from '@/lib/mock-data';

export default function HomePage() {
  const [currency, setCurrency] = useState('INR');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'Does FinVelayudham connect to my bank or broker accounts?',
      a: 'No. FinVelayudham is intentionally manual-first. You add assets yourself or import via spreadsheet exports from Zerodha, Groww, or any standard CSV. We never ask for your broker credentials and never connect to your bank. Your financial data stays in your control.'
    },
    {
      q: 'Is FinVelayudham really free?',
      a: 'Yes. Free forever for up to 25 assets, with no credit card required. If you hold more assets, there is a Pro plan that unlocks unlimited tracking, family profiles, and advanced auto-refresh features.'
    },
    {
      q: 'What Indian assets does FinVelayudham support?',
      a: 'FinVelayudham understands Indian finances deeply. You can track EPF, PPF, NPS, SSY, Sovereign Gold Bonds, ULIPs, Indian equity, mutual funds, fixed deposits, real estate, physical gold, crypto, and more. 20+ asset classes covering everything on a typical investor balance sheet.'
    },
    {
      q: 'Can NRIs use FinVelayudham with assets in multiple currencies?',
      a: 'Yes. Add assets in any of 45+ currencies (USD, EUR, SGD, GBP, AED and more). Live FX rates refresh automatically so your consolidated net worth in INR, or any base currency you choose, stays accurate.'
    },
    {
      q: 'How is my data secured?',
      a: 'Your data is encrypted in transit (TLS 1.3) and at rest (AES-256), and every request is authenticated against your account. Passwords are securely hashed with bcrypt. You can export all your data as CSV or JSON anytime, or delete your account with one click from Settings.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar currentCurrency={currency} onCurrencyChange={setCurrency} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personal finance, simplified</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
            All your money. <br className="hidden sm:inline" />
            <span className="text-primary italic">In one place.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Track every account, asset, expense, and goal in one dashboard. Net worth, cashflow, and growth across 20+ asset classes. No bank or broker logins, no ad trackers.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login?mode=register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3.5 rounded-md shadow-md hover:bg-primary/90 transition-all text-base"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border bg-card hover:bg-muted font-semibold px-6 py-3.5 rounded-md shadow-sm transition-all text-base text-foreground"
            >
              Try the live demo
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> Free forever for 25 assets
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> No credit card required
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> No bank passwords
            </span>
          </div>

          {/* Interactive Hero Preview Component */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="relative rounded-2xl border border-border/80 bg-card/60 p-2 sm:p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 font-mono font-medium text-foreground/70">finvelayudham.app/dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-primary font-semibold">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    Live Portfolio
                  </span>
                </div>
              </div>

              {/* Chart embed */}
              <InteractiveAreaChart snapshots={INITIAL_SNAPSHOTS} currency={currency} />
            </div>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-16 pt-10 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-foreground">10,000+</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Active Investors</div>
            </div>
            <div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-foreground">₹500 Cr+</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Tracked Assets</div>
            </div>
            <div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-foreground">45+</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Currencies Supported</div>
            </div>
            <div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-foreground">100%</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Private & Secure</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Onboarding */}
      <section className="py-20 bg-muted/40 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
              Get your net worth in under 5 minutes
            </h2>
            <p className="mt-3 text-muted-foreground">
              No long setups, no third-party credential aggregators. Fast and painless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm relative">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                Sign up in 10 seconds
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Create an account with just your email or Google OAuth. No KYC, no phone numbers, no intrusive paperwork.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border shadow-sm relative">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                Add your assets
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Add mutual funds, EPF, PPF, gold, real estate, stocks, or import statements from Zerodha, Groww, or Wint Wealth with one click.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border shadow-sm relative">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                See your complete picture
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Watch your net worth update, view allocation splits across asset classes, monitor emergency funds, and project your retirement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid: Built for how Indians actually invest */}
      <section className="py-20 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-primary">Purpose-Built</span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-foreground mt-2">
              Built for how Indians actually invest
            </h2>
            <p className="mt-3 text-muted-foreground">
              Most Western personal finance apps fail at EPF, PPF, gold bonds, and Indian tax nuances. FinVelayudham is built from the ground up for you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-border bg-card/60 hover:border-primary/50 transition-all">
              <Layers className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-serif text-lg font-bold text-foreground mb-1">20+ Asset Classes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track EPF, PPF, NPS, Sovereign Gold Bonds, Mutual Funds, Indian Stocks, US Stocks, FDs, and Real Estate.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/60 hover:border-primary/50 transition-all">
              <FileSpreadsheet className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-serif text-lg font-bold text-foreground mb-1">Import from Zerodha & Groww</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload your Excel / CSV statement exports anytime to bulk update your holdings in seconds.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/60 hover:border-primary/50 transition-all">
              <ShieldCheck className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-serif text-lg font-bold text-foreground mb-1">Financial Essentials Check</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Automated diagnostics to ensure you have 6+ months of emergency expenses and adequate term and health insurance.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/60 hover:border-primary/50 transition-all">
              <TrendingUp className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-serif text-lg font-bold text-foreground mb-1">Net Worth Snapshots</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Save historical checkpoints of your balance sheet to trace your journey from first job to financial freedom.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/60 hover:border-primary/50 transition-all">
              <Globe2 className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-serif text-lg font-bold text-foreground mb-1">Multi-Currency Support</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Hold investments in USD, EUR, GBP, AED, SGD while viewing everything consolidated in INR with real FX updates.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/60 hover:border-primary/50 transition-all">
              <Users className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-serif text-lg font-bold text-foreground mb-1">Family & Business Profiles</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Segment assets across spouses, parents, HUF, or small businesses with independent and combined balance sheets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Guarantees */}
      <section className="py-20 bg-muted/40 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
              Your finances, without handing over your logins.
            </h2>
            <p className="mt-3 text-muted-foreground">
              We never ask for bank net banking credentials, OTPs, or broker passwords. Period.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="font-bold text-foreground mb-1 text-base">No Broker Access</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We cannot make trades, transfer funds, or see your banking passwords.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="font-bold text-foreground mb-1 text-base">No Data Selling</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We never monetize your net worth by serving predatory loan ads or selling your records.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="font-bold text-foreground mb-1 text-base">Full Data Export</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Export all your assets, transactions, and snapshots as standard CSV or JSON anytime.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="font-bold text-foreground mb-1 text-base">Delete Any Time</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Delete your account and all associated data permanently with a single click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 border-b border-border/50" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-primary">Transparent Pricing</span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-foreground mt-2">
              Start free. Upgrade when you need more.
            </h2>
            <p className="mt-3 text-muted-foreground">
              A generous free tier for getting started. Pro for serious wealth tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-2xl font-bold text-foreground">Free</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="font-serif text-4xl font-bold text-foreground">₹0</span>
                  <span className="text-muted-foreground ml-1">/ forever</span>
                </div>
                <p className="text-xs text-primary font-semibold mt-1">+ 14-day Pro trial available</p>

                <ul className="mt-8 space-y-3 text-sm text-foreground/90">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Track up to 25 investments</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>5 liabilities & 3 financial goals</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>2 net worth snapshots / month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Basic income & expense tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Financial health check & essentials check</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/login?mode=register"
                className="mt-8 w-full block text-center py-3 border border-border bg-muted/60 hover:bg-muted text-foreground font-semibold rounded-md transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-card border-2 border-primary rounded-2xl p-8 shadow-xl flex flex-col justify-between relative">
              <div className="absolute -top-3 right-6 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular · Save 37%
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-foreground">Pro</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="font-serif text-4xl font-bold text-foreground">₹749</span>
                  <span className="text-muted-foreground ml-1">/ year</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">About ₹2/day, cheaper than a cup of tea</p>
                <p className="text-xs text-foreground/80 mt-1 font-medium">Also available: 6 months at ₹599 · Lifetime at ₹3,499</p>

                <ul className="mt-8 space-y-3 text-sm text-foreground/90">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="font-semibold">Track every investment without limits</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Unlimited liabilities & custom goals</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Track your net worth growth anytime</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Full income & expense cashflow insights</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Import from any broker or custom CSV</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Auto-refresh live asset prices & FX rates</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Family & multi-profile segmentation</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/login?mode=register"
                className="mt-8 w-full block text-center py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow hover:bg-primary/90 transition-all"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-border rounded-xl bg-card overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-5 flex items-center justify-between text-base font-semibold text-foreground hover:bg-muted/40"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                      openFaq === idx ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border/40 mt-1">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-primary/10 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-foreground">
            Start tracking your wealth today
          </h2>
          <p className="mt-4 text-muted-foreground text-base max-w-xl mx-auto">
            Free forever for up to 25 assets. No credit card required. Takes less than 10 seconds to sign up.
          </p>
          <div className="mt-8">
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-md shadow-lg hover:bg-primary/90 transition-all text-base"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
