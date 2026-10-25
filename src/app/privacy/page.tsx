import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Privacy Policy
        </h1>
        <p className="text-xs text-muted-foreground mb-8">
          Last updated: October 2026
        </p>

        <div className="prose prose-sm dark:prose-invert space-y-6 text-xs sm:text-sm text-foreground/80 leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">1. Fundamental Privacy Guarantee</h2>
            <p>
              FinVelayudham is built on a simple premise: your money is your business. We never request or store your bank net-banking passwords, broker login credentials, OTPs, or debit/credit card PINs. You maintain 100% control over the financial records entered into your account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">2. Information We Collect</h2>
            <p>
              We collect minimal information necessary to deliver the service:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Account identity: Email address and hashed password, or Google OAuth token identifier.</li>
              <li>Financial records you supply: Asset names, amounts, liability balances, and cashflow categories.</li>
              <li>Technical diagnostics: Anonymized crash logs and device viewport dimensions for responsive rendering.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">3. Zero Data Monetization & Advertising</h2>
            <p>
              We do not sell, rent, license, or monetize your financial data to banks, lending brokers, insurers, or advertising networks. We do not run third-party advertising tracking scripts.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">4. Data Encryption & Security</h2>
            <p>
              All network communications are encrypted in transit using Transport Layer Security (TLS 1.3/HTTPS). Records at rest are protected by AES-256 encryption. User passwords are salted and hashed using bcrypt.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">5. Data Ownership & Deletion Rights</h2>
            <p>
              You own all data you enter. You may export your entire balance sheet, transaction log, and snapshots as standard CSV or JSON anytime from Settings. You may permanently delete your account and all associated records with one click.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
