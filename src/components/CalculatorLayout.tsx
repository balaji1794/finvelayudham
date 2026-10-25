'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

interface CalculatorLayoutProps {
  title: string;
  description: string;
  slug: string;
  children: React.ReactNode;
  educationalContent?: React.ReactNode;
  faqs?: Array<{ q: string; a: string }>;
}

export default function CalculatorLayout({
  title,
  description,
  slug,
  children,
  educationalContent,
  faqs = [],
}: CalculatorLayoutProps) {
  const [currency, setCurrency] = useState('INR');

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar currentCurrency={currency} onCurrencyChange={setCurrency} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 font-medium">
          <Link href="/calculators" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Calculators
          </Link>
          <ChevronRight className="w-3 h-3 text-border" />
          <span className="text-foreground uppercase">{slug}</span>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>

        {/* Interactive Calculator Content */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          {children}
        </div>

        {/* Educational Content */}
        {educationalContent && (
          <div className="mt-12 p-6 sm:p-8 rounded-2xl border border-border bg-muted/30">
            {educationalContent}
          </div>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <div className="mt-12 space-y-4">
            <h3 className="font-serif text-2xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h3>
            {faqs.map((f, i) => (
              <div key={i} className="p-5 rounded-xl border border-border bg-card">
                <h4 className="font-semibold text-foreground text-sm mb-2">{f.q}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
