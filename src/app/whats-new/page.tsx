import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Sparkles, Calendar, Tag, CheckCircle2 } from 'lucide-react';

export default function WhatsNewPage() {
  const updates = [
    {
      date: '24 Oct 2026',
      badge: 'New Feature',
      title: 'Import Wint Wealth Bonds and Catch Up on Old Statements',
      content:
        'You can now import your fixed return bonds directly from Wint Wealth. Go to Import, select Wint Wealth and upload your Master Report (.xlsx). Each bond automatically shows what you still have invested and upcoming interest maturities.',
    },
    {
      date: '18 Oct 2026',
      badge: 'Improvement',
      title: 'Real-time Foreign Exchange Sync for 45+ Fiat Currencies',
      content:
        'FX rates for USD, EUR, GBP, AED, SGD, and more now refresh automatically every 6 hours through direct integrations, keeping cross-border net worth calculations pin-sharp.',
    },
    {
      date: '02 Oct 2026',
      badge: 'New Feature',
      title: 'Automated Frontend Parity & Drift Detection Engine',
      content:
        'Introduced the continuous synchronization pipeline that checks upstream financial models, calculator routines, and user experience patterns, alerting administrators to any schema or visual drift.',
    },
    {
      date: '15 Sep 2026',
      badge: 'Improvement',
      title: 'Comprehensive 10 Financial Planning Calculators Suite',
      content:
        'Launched the full suite of client-side calculators including XIRR with Newton-Raphson cashflow solver, SIP step-up, loan EMI with affordability diagnostics, and retirement corpus planning.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Product Changelog</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-foreground">
            What's New
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The latest updates, features, and platform improvements in FinVelayudham.
          </p>
        </div>

        <div className="space-y-8">
          {updates.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/40 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                  {item.badge}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {item.date}
                </span>
              </div>
              <h2 className="font-serif text-xl font-bold text-foreground mb-2">
                {item.title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
