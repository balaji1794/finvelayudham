'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, Mail, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegisterParam = searchParams.get('mode') === 'register';

  const [isRegister, setIsRegister] = useState(isRegisterParam);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const { login, register, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setFeedback(null);

    try {
      let result;
      if (isRegister) {
        result = await register(email, name, password);
      } else {
        result = await login(email, name, password);
      }

      if (result.success) {
        if (result.emailSent) {
          setFeedback({
            type: 'success',
            message: `Account active! Confirmation email dispatched to ${email}.`,
          });
        } else {
          setFeedback({
            type: 'info',
            message: `Signed in as ${email}! (Note: To deliver emails to your Gmail inbox, configure RESEND_API_KEY in Vercel).`,
          });
        }

        setTimeout(() => {
          router.push('/demo');
        }, 800);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to authenticate. Please check your credentials.',
      });
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      // Pick existing email or prompt fallback
      const targetEmail = email && email.includes('@') ? email : 'sharmashreedx333@gmail.com';
      const targetName = name || 'Sharma Shreedx';
      const result = await loginWithGoogle(targetEmail, targetName);

      setFeedback({
        type: 'success',
        message: `Signed in with Google as ${targetEmail}! Redirecting to dashboard...`,
      });

      setTimeout(() => {
        router.push('/demo');
      }, 700);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Google authentication could not be completed.',
      });
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <Link href="/" className="inline-block font-serif text-3xl font-bold text-foreground">
          FinVelayudham<span className="text-primary font-sans">.</span>
        </Link>
        <h2 className="text-xl font-bold text-foreground mt-3">
          {isRegister ? 'Create your free account' : 'Welcome back'}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Know your true wealth at a glance. 100% Free & Unlimited.
        </p>
      </div>

      {feedback && (
        <div
          className={`mb-6 p-3 rounded-lg text-xs flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-primary/10 border border-primary/30 text-foreground'
              : feedback.type === 'info'
              ? 'bg-amber-500/10 border border-amber-500/30 text-foreground'
              : 'bg-destructive/10 border border-destructive/30 text-destructive'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Google Sign In Button */}
      <button
        type="button"
        disabled={loading}
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-border rounded-lg bg-card hover:bg-muted text-sm font-semibold text-foreground transition-colors shadow-sm disabled:opacity-60"
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
              placeholder="e.g. Sharma Shreedx"
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
            placeholder="sharmashreedx333@gmail.com"
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
          className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:bg-primary/90 transition-all text-xs disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Processing...</span>
          ) : isRegister ? (
            <span>Create Free Account</span>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Toggle Register/Login */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        {isRegister ? (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setFeedback(null);
              }}
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
              onClick={() => {
                setIsRegister(true);
                setFeedback(null);
              }}
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
