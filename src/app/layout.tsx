import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinVelayudham · All your money, in one place',
  description:
    'Track every account, asset, expense, and goal in one dashboard. Net worth, cashflow, and growth across 45+ currencies. No bank logins. Free for 25 assets.',
  metadataBase: new URL('https://www.finvelayudham.app'),
  keywords: [
    'personal finance',
    'net worth tracker',
    'portfolio tracker',
    'india wealth management',
    'asset allocation',
    'mutual funds xirr',
    'epf ppf tracker',
    'financial independence'
  ],
  authors: [{ name: 'FinVelayudham Team' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'FinVelayudham · All your money, in one place',
    description:
      'Track every account, asset, expense, and goal in one dashboard. Net worth, cashflow, and growth across 45+ currencies. No bank logins.',
    url: 'https://www.finvelayudham.app',
    siteName: 'FinVelayudham',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#2c6e49" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
