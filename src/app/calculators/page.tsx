'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Calculator,
  ArrowRight,
  PiggyBank,
  BadgePercent,
  Home,
  Hourglass,
  Calendar,
  Sparkles,
  ShieldCheck,
  Search
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CalculatorsHubPage() {
  const [currency, setCurrency] = useState('INR');
  const [search, setSearch] = useState('');

  const calculators = [
    {
      category: 'Returns',
      items: [
        {
          slug: 'sip',
          title: 'SIP Calculator',
          desc: 'Project the future value of a monthly SIP, with optional annual step-up.',
          icon: TrendingUp,
          popular: true,
        },
        {
          slug: 'xirr',
          title: 'XIRR Calculator',
          desc: 'Annualized return on SIPs, lump sums, and irregular investments using real cashflow dates.',
          icon: Calculator,
          popular: true,
        },
        {
          slug: 'lumpsum',
          title: 'Lumpsum Calculator',
          desc: 'Growth of a one-time investment compounded over time.',
          icon: PiggyBank,
        },
        {
          slug: 'cagr',
          title: 'CAGR Calculator',
          desc: 'Compound annual growth rate between initial and ending portfolio values.',
          icon: BadgePercent,
        },
      ],
    },
    {
      category: 'Loans',
      items: [
        {
          slug: 'emi',
          title: 'EMI Calculator',
          desc: 'Monthly instalment, total interest, principal breakup, and salary affordability check.',
          icon: Home,
          popular: true,
        },
      ],
    },
    {
      category: 'Planning',
      items: [
        {
          slug: 'retirement',
          title: 'Retirement Calculator',
          desc: 'The corpus you need to retire comfortably and the monthly SIP to reach it.',
          icon: Calendar,
          popular: true,
        },
        {
          slug: 'future-cost',
          title: 'Future Cost Calculator',
          desc: 'What a milestone goal will cost after inflation, and the SIP to fund it.',
          icon: Hourglass,
        },
        {
          slug: 'swp',
          title: 'SWP with Inflation',
          desc: 'How long your retirement corpus will last with inflation-linked monthly withdrawals.',
          icon: Sparkles,
        },
        {
          slug: 'inflation',
          title: 'Inflation Calculator',
          desc: 'How fast the prices you pay really rose each year, and lost purchasing power.',
          icon: BadgePercent,
        },
        {
          slug: 'fd',
          title: 'FD Calculator',
          desc: 'Maturity value of a fixed deposit with quarterly or monthly compounding.',
          icon: ShieldCheck,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar currentCurrency={currency} onCurrencyChange={setCurrency} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-3">
            <Calculator className="w-3.5 h-3.5" />
            <span>Financial Planning Suite</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-foreground">
            Calculators
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Free, browser-based financial tools. No logins required, no tracking. Calculated instantly on your device.
          </p>

          <div className="mt-6 relative max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search calculator (e.g. SIP, EMI, Retirement)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-12">
          {calculators.map((group) => {
            const filteredItems = group.items.filter(
              (item) =>
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.desc.toLowerCase().includes(search.toLowerCase())
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.category}>
                <h2 className="font-serif text-xl font-bold text-foreground border-b border-border pb-3 mb-6">
                  {group.category}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((c) => {
                    const IconComponent = c.icon;
                    return (
                      <Link
                        key={c.slug}
                        href={`/calculators/${c.slug}`}
                        className="group relative bg-card border border-border hover:border-primary/50 rounded-xl p-6 shadow-sm hover:shadow transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                              <IconComponent className="w-5 h-5" />
                            </div>
                            {c.popular && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                                Popular
                              </span>
                            )}
                          </div>
                          <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                            {c.title}
                          </h3>
                          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                            {c.desc}
                          </p>
                        </div>

                        <div className="mt-6 flex items-center text-xs font-semibold text-primary">
                          <span>Calculate now</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
