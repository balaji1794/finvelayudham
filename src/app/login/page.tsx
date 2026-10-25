'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, Mail, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegisterParam = searchParams.get('mode') === 'register';

  const [isRegister, setIsRegister] = useState(isRegisterParam);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Simulate instant demo sign-in
    setTimeout(() => {
      setLoading(false);
      router.push('/demo');
    }, 600);
  };

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <Link href="/" className="inline-block font-serif text-3xl font-bold text-foreground">
          FinVelayudham<span className="text-primary font-sans">.</span>
        </Link>
        <h2 className="text-xl font-bold text-foreground mt-3">
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Know your true wealth at a glance. No bank logins needed.
        </p>
      </div>

      {/* Google Sign In Button */}
      <button
        type="button"
        onClick={() => router.push('/demo')}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-border rounded-lg bg-card hover:bg-muted text-sm font-semibold text-foreground transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase">
          <span className="bg-card px-3 text-muted-foreground font-semibold">Or use email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Velayudham"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
          <input
            type="email"
            required
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-xs bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-foreground">Password</label>
            {!isRegister && (
              <span className="text-[11px] text-muted-foreground hover:text-primary cursor-pointer">
                Forgot password?
              </span>
            )}
          </div>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-xs bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:bg-primary/90 transition-all text-xs"
        >
          {loading ? 'Signing in...' : isRegister ? 'Create Free Account' : 'Sign In'}
        </button>
      </form>

      {/* Toggle Register/Login */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        {isRegister ? (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className="font-bold text-primary hover:underline"
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            No account yet?{' '}
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className="font-bold text-primary hover:underline"
            >
              Create one
            </button>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-[10px] text-muted-foreground leading-relaxed">
        By continuing, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Suspense fallback={<div className="text-xs text-muted-foreground">Loading portal...</div>}>
          <LoginForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
