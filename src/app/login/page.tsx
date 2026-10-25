'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegisterParam = searchParams.get('mode') === 'register';
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [mode, setMode] = useState<'login' | 'register'>(
    isRegisterParam ? 'register' : 'login'
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState<{ email: string } | null>(null);

  const { login, register, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setError('Password must be at least 8 characters.');
          setLoading(false);
          return;
        }

        const res = await register(email, name, password);
        if (res.success) {
          setRegistrationSuccess({ email: email.trim().toLowerCase() });
        } else {
          setError('Registration could not be completed. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Mode is 'login'
      const res = await login(email, name, password);
      if (res.success) {
        router.push(redirectUrl);
      } else {
        setError('Invalid email or password.');
        setLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const targetEmail = email && email.includes('@') ? email : 'balajibuddy1794@gmail.com';
      const targetName = name || 'Balaji';
      await loginWithGoogle(targetEmail, targetName);
      router.push(redirectUrl);
    } catch {
      setError('Google authentication could not be completed.');
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // SCREEN 1: REGISTRATION SUCCESS ("Check your inbox")
  // -------------------------------------------------------------
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
                FinVelayudham<span className="text-primary font-sans">.</span>
              </h1>
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-3 mx-auto">
              <Mail className="h-6 w-6 text-primary" />
            </div>

            <h2 className="font-serif text-2xl font-bold mb-1.5 text-foreground">
              Check your inbox
            </h2>

            <p className="text-xs text-muted-foreground leading-relaxed">
              We sent a link to{' '}
              <span className="font-semibold text-foreground break-all">
                {registrationSuccess.email}
              </span>
              . Open it to verify your address, then you can add and edit your data.
            </p>

            <button
              type="button"
              onClick={() => router.push(redirectUrl)}
              className="w-full mt-5 h-10 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              Continue to setup
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setRegistrationSuccess(null);
                setMode('login');
                setPassword('');
                setError('');
              }}
              className="text-primary hover:underline font-medium"
            >
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SCREEN 2: LOGIN / REGISTER FORMS (Matched directly to FinBoom)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
              FinVelayudham<span className="text-primary font-sans">.</span>
            </h1>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Know your true wealth at a glance
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-10 rounded-md px-6 w-full"
        >
          <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground">
              or use email
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-muted-foreground mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={mode === 'register' ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setError('Password reset instructions will be sent to your email.')}
                className="text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md px-6 w-full shadow-sm disabled:opacity-50"
          >
            {loading
              ? mode === 'register'
                ? 'Creating account...'
                : 'Signing in...'
              : mode === 'register'
              ? 'Create account'
              : 'Sign in'}
          </button>
        </form>

        {/* Toggle Mode */}
        <p className="text-center text-xs text-muted-foreground">
          {mode === 'login' ? (
            <>
              No account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className="text-primary hover:underline font-medium"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        {/* Footer Policy Links */}
        <p className="text-center text-xs text-muted-foreground">
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
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
