import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Terms of Service
        </h1>
        <p className="text-xs text-muted-foreground mb-8">
          Effective date: October 2026
        </p>

        <div className="prose prose-sm dark:prose-invert space-y-6 text-xs sm:text-sm text-foreground/80 leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using FinVelayudham.app, you agree to be bound by these Terms of Service. If you disagree with any part, you may not access or use the application.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">2. Not Financial Advice</h2>
            <p>
              FinVelayudham is a wealth tracking, calculation, and organization tool. We do not provide licensed financial advisory, accounting, investment advisory (SEBI registered), or tax consulting services. Calculations and projections are mathematical models based on inputs you provide.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">3. User Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and for ensuring the accuracy of values you input into the system.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">4. 100% Free Service & Zero Subscriptions</h2>
            <p>
              FinVelayudham is provided completely free of charge with unlimited access to all features, asset tracking, calculators, and analytical tools for all users. There are no subscription fees, paid tiers, paywalls, or recurring charges.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
