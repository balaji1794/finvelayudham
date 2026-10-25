import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Refund Policy
        </h1>
        <p className="text-xs text-muted-foreground mb-8">
          Last updated: October 2026
        </p>

        <div className="prose prose-sm dark:prose-invert space-y-6 text-xs sm:text-sm text-foreground/80 leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">1. 100% Free Platform Policy</h2>
            <p>
              FinVelayudham is completely free for all users with unlimited access to all features, asset tracking, calculators, and tools. Because we do not charge subscription fees, sell paid upgrades, or collect payment details, no monetary transactions occur on the platform.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">2. Zero Hidden Charges</h2>
            <p>
              We do not ask for credit cards, bank account debits, or recurring payment mandates. Every single feature—including unlimited asset tracking, live FX currency conversions, and automated sync tools—is available without cost.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">3. Questions or Inquiries</h2>
            <p>
              If you have any questions regarding our free platform policy or data handling practices, please contact our support team at <a href="mailto:support@finvelayudham.app" className="text-primary underline">support@finvelayudham.app</a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
