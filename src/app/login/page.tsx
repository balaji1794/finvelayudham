'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, Mail, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, RefreshCw, KeyRound } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegisterParam = searchParams.get('mode') === 'register';
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  // Screen modes: 'login' | 'register' | 'verify'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'verify'>(
    isRegisterParam ? 'register' : 'login'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sandboxCode, setSandboxCode] = useState<string | null>(null);
  const [deliveredTo, setDeliveredTo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const { login, requestVerification, confirmVerification, loginWithGoogle } = useAuth();

  // Handle Initial Registration -> Triggers Email with 6-Digit Confirmation Code
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setFeedback(null);

    try {
      const res = await requestVerification(email, name);

      if (res.success) {
        setSandboxCode(res.sandboxCode || null);
        setDeliveredTo(res.deliveredTo || email);
        setAuthMode('verify');
        setFeedback({
          type: 'info',
          message: `Confirmation code dispatched! Please check your email to activate your account.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Failed to dispatch confirmation code. Please try again.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Verification service unreachable.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Entering 6-Digit Code -> Activates Account and Logs In
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;

    setLoading(true);
    setFeedback(null);

    try {
      const res = await confirmVerification(email, otpCode, password, name);

      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Email confirmed successfully! Unlocking your private wealth vault...',
        });

        setTimeout(() => {
          router.push(redirectUrl);
        }, 900);
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Invalid or expired confirmation code. Please try again.',
        });
        setLoading(false);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to confirm email.',
      });
      setLoading(false);
    }
  };

  // Handle Standard Sign-in for Already Registered Users
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setFeedback(null);

    try {
      const result = await login(email, name, password);

      if (result.success) {
        setFeedback({
          type: 'success',
          message: `Welcome back, ${email}! Loading your encrypted vault...`,
        });

        setTimeout(() => {
          router.push(redirectUrl);
        }, 700);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to authenticate.',
      });
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const targetEmail = email && email.includes('@') ? email : 'balajibuddy1794@gmail.com';
      const targetName = name || 'Balaji';
      await loginWithGoogle(targetEmail, targetName);

      setFeedback({
        type: 'success',
        message: `Signed in with Google as ${targetEmail}! Unlocking secure vault...`,
      });

      setTimeout(() => {
        router.push(redirectUrl);
      }, 700);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Google authentication could not be completed.',
      });
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const res = await requestVerification(email, name);
      if (res.success) {
        setSandboxCode(res.sandboxCode || null);
        setDeliveredTo(res.deliveredTo || email);
        setFeedback({
          type: 'info',
          message: `New confirmation code dispatched to ${res.deliveredTo || email}!`,
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Could not resend code.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl">
      <div className="text-center mb-6">
        <Link href="/" className="inline-block font-serif text-3xl font-bold text-foreground">
          FinVelayudham<span className="text-primary font-sans">.</span>
        </Link>
        <h2 className="text-xl font-bold text-foreground mt-3">
          {authMode === 'verify'
            ? 'Confirm Your Email'
            : authMode === 'register'
            ? 'Create Your Free Account'
            : 'Welcome Back'}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {authMode === 'verify'
            ? `We sent a 6-digit confirmation code to activate your account.`
            : 'Know your true wealth at a glance. 100% Free & Unlimited.'}
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

      {/* ========================================================= */}
      {/* SCREEN 1: VERIFICATION CODE CONFIRMATION SCREEN           */}
      {/* ========================================================= */}
      {authMode === 'verify' ? (
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div className="p-4 bg-muted/50 border border-border rounded-xl text-center">
            <Mail className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-xs text-muted-foreground">Confirmation code sent to:</div>
            <div className="text-sm font-bold text-foreground mt-0.5">{email}</div>
          </div>

          {/* Sandbox helper banner for Resend testing mode */}
          {sandboxCode && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Sandbox Test Code:</span>
                <button
                  type="button"
                  onClick={() => setOtpCode(sandboxCode)}
                  className="text-[11px] font-bold text-primary underline hover:opacity-80"
                >
                  Auto-fill ({sandboxCode})
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Relayed to verified account ({deliveredTo}). Use code{' '}
                <strong className="text-foreground">{sandboxCode}</strong> to confirm immediately.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Enter 6-Digit Confirmation Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="e.g. 742918"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-[8px] font-mono text-xl font-bold bg-muted/50 border border-border rounded-lg px-3 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length < 6}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:bg-primary/90 transition-all text-xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <span>Verifying code...</span> : <span>Confirm & Open Wealth Vault</span>}
          </button>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleResendCode}
              className="hover:text-primary underline"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setFeedback(null);
              }}
              className="hover:text-foreground underline"
            >
              Change email address
            </button>
          </div>
        </form>
      ) : (
        /* ========================================================= */
        /* SCREEN 2: LOGIN / REGISTER FORMS                          */
        /* ========================================================= */
        <>
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

          <form
            onSubmit={authMode === 'register' ? handleRegisterSubmit : handleLoginSubmit}
            className="space-y-4"
          >
            {authMode === 'register' && (
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
                {authMode === 'login' && (
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
              ) : authMode === 'register' ? (
                <span>Send Confirmation Code</span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            {authMode === 'register' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
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
                    setAuthMode('register');
                    setFeedback(null);
                  }}
                  className="font-bold text-primary hover:underline"
                >
                  Create one
                </button>
              </>
            )}
          </div>
        </>
      )}

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
