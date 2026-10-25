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
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">1. 14-Day Money-Back Guarantee</h2>
            <p>
              We want you to be completely delighted with FinVelayudham Pro. If you upgrade to an annual or lifetime Pro subscription and find it does not meet your expectations, you are entitled to a full, no-questions-asked refund within 14 days of purchase.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">2. How to Request a Refund</h2>
            <p>
              To claim your refund within the 14-day window, simply send an email to <a href="mailto:support@finvelayudham.app" className="text-primary underline">support@finvelayudham.app</a> with your registered account email and payment reference ID. Refunds are processed back to your original payment method within 5–7 business days.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">3. Subscription Cancellations</h2>
            <p>
              You may cancel recurring subscription auto-renewals anytime from your Account Settings. Upon cancellation, your Pro features remain active until the end of your prepaid billing period.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
