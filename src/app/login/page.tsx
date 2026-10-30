'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Laptop,
  Lock,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isDeviceTrusted, setDeviceTrusted, getDeviceLabel } from '@/lib/trusted-device';

type Step = 'credentials' | 'verify-code' | 'trust-device';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegisterParam = searchParams ? searchParams.get('mode') === 'register' : false;
  const redirectUrl = (searchParams && searchParams.get('redirect')) || '/dashboard';

  const [mode, setMode] = useState<'login' | 'register'>(
    isRegisterParam ? 'register' : 'login'
  );
  const [step, setStep] = useState<Step>('credentials');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA verification code state
  const [verificationCode, setVerificationCode] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [pendingSandboxCode, setPendingSandboxCode] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [deviceLabel, setDeviceLabel] = useState('This Browser');

  const {
    login,
    verifyCredentialsOnly,
    register,
    requestVerification,
    confirmVerification,
    completeVerifiedLogin,
    loginWithGoogle,
  } = useAuth();

  // Detect friendly device name on mount
  useEffect(() => {
    setDeviceLabel(getDeviceLabel());
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // -------------------------------------------------------------
  // STEP 1: CREDENTIALS SUBMISSION (Email + Password)
  // -------------------------------------------------------------
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

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

        // Send registration confirmation code
        const codeRes = await requestVerification(cleanEmail, name.trim(), 'register');
        if (!codeRes.success) {
          setError(codeRes.message || 'Could not dispatch verification code. Please try again.');
          setLoading(false);
          return;
        }

        setVerifiedName(name.trim());
        if (codeRes.sandboxCode) {
          setPendingSandboxCode(codeRes.sandboxCode);
        }
        setResendCooldown(30);
        setStep('verify-code');
        setLoading(false);
        return;
      }

      // Mode is 'login':
      // 1. Strictly verify that the password matches first
      const credResult = await verifyCredentialsOnly(cleanEmail, password);
      if (!credResult.success) {
        setError(credResult.message || 'Incorrect password. Please try again.');
        setLoading(false);
        return;
      }

      const memberName = credResult.name || name || 'Member';
      setVerifiedName(memberName);

      // 2. Check if this browser is already trusted for this user
      const trusted = isDeviceTrusted(cleanEmail);
      if (trusted) {
        // Trusted device: bypass 2FA email code completely!
        const loginRes = await completeVerifiedLogin(cleanEmail, memberName, password, true);
        if (loginRes.success) {
          router.push(redirectUrl);
          return;
        }
      }

      // 3. Untrusted device: dispatch email verification code
      const codeRes = await requestVerification(cleanEmail, memberName, 'login');
      if (codeRes.sandboxCode) {
        setPendingSandboxCode(codeRes.sandboxCode);
      }
      setResendCooldown(30);
      setStep('verify-code');
      setLoading(false);
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2: CODE VERIFICATION (6-digit OTP confirmation)
  // -------------------------------------------------------------
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanCode = verificationCode.trim();
    if (cleanCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const confirmRes = await confirmVerification(
        cleanEmail,
        cleanCode,
        password,
        verifiedName || name
      );

      if (!confirmRes.success) {
        setError(
          confirmRes.error ||
            'Incorrect or expired confirmation code. Please check your email and try again.'
        );
        setLoading(false);
        return;
      }

      // Code matched! Move to Step 3: Ask if this is a trusted device
      setStep('trust-device');
      setLoading(false);
    } catch {
      setError('Could not verify code. Please try again.');
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // RESEND CODE ACTION
  // -------------------------------------------------------------
  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const codeRes = await requestVerification(
        cleanEmail,
        verifiedName || name || 'Member',
        mode === 'register' ? 'register' : 'login'
      );

      if (codeRes.sandboxCode) {
        setPendingSandboxCode(codeRes.sandboxCode);
      }
      setResendCooldown(30);
    } catch {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 3: TRUSTED DEVICE CONFIRMATION
  // -------------------------------------------------------------
  const handleTrustDeviceDecision = async (trusted: boolean) => {
    setLoading(true);
    setError('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const loginRes = await completeVerifiedLogin(
        cleanEmail,
        verifiedName || name,
        password,
        trusted
      );

      if (loginRes.success) {
        router.push(redirectUrl);
      } else {
        setError(loginRes.message || 'Could not complete session setup.');
        setLoading(false);
      }
    } catch {
      setError('Failed to finish login. Please try again.');
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // GOOGLE SIGN IN
  // -------------------------------------------------------------
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

  // =============================================================
  // RENDER: STEP 2 - ENTER VERIFICATION CODE
  // =============================================================
  if (step === 'verify-code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
                FinVelayudham<span className="text-primary font-sans">.</span>
              </h1>
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto text-primary">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="font-serif text-xl font-bold text-foreground">
                Two-Step Verification
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We sent a 6-digit security code to{' '}
                <span className="font-semibold text-foreground break-all">{email}</span>.
                Enter it below to confirm your identity.
              </p>
            </div>

            {/* Sandbox / Testing Helper Pill (Shown when running in dev/sandbox mode) */}
            {pendingSandboxCode && (
              <div
                onClick={() => setVerificationCode(pendingSandboxCode)}
                className="cursor-pointer bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg p-2.5 text-center transition-all group"
                title="Click to auto-fill development code"
              >
                <div className="text-[11px] font-medium text-primary flex items-center justify-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Testing Code: <span className="font-mono font-bold tracking-wider">{pendingSandboxCode}</span>
                  <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                    (Click to paste)
                  </span>
                </div>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="verificationCode"
                  className="block text-xs font-medium text-muted-foreground mb-1.5 text-center"
                >
                  Enter 6-Digit Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  autoFocus
                  value={verificationCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(val);
                  }}
                  placeholder="000000"
                  className="w-full h-12 px-3 text-center font-mono text-2xl font-bold tracking-[0.4em] rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Resend and Navigation */}
            <div className="space-y-2 pt-2 border-t border-border/80 text-center text-xs">
              <div>
                {resendCooldown > 0 ? (
                  <span className="text-muted-foreground">
                    Resend code in <strong className="text-foreground">{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    Didn&apos;t receive code? Resend
                  </button>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setVerificationCode('');
                    setError('');
                  }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to credentials
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================
  // RENDER: STEP 3 - ASK IF THIS IS A TRUSTED DEVICE
  // =============================================================
  if (step === 'trust-device') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
                FinVelayudham<span className="text-primary font-sans">.</span>
              </h1>
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 mx-auto text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-serif text-xl font-bold text-foreground">
                Trust this device?
              </h2>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-[11px] font-mono text-muted-foreground">
                <Laptop className="w-3 h-3" />
                {deviceLabel}
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              If you trust this browser, you won&apos;t be asked for a verification code when signing in
              in the future. Only choose this on your private, personal computer or phone.
            </p>

            {error && (
              <div className="flex items-start gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-lg text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              {/* Option 1: Yes, trust this device */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleTrustDeviceDecision(true)}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Yes, trust this device
                  </>
                )}
              </button>

              {/* Option 2: Don't trust (Public / shared device) */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleTrustDeviceDecision(false)}
                className="w-full h-10 rounded-lg border border-border bg-background text-foreground hover:bg-muted font-medium transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                Don&apos;t trust (Public or shared computer)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================
  // RENDER: STEP 1 - CREDENTIALS (FinBoom Design Matched)
  // =============================================================
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
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-10 rounded-md px-6 w-full cursor-pointer"
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
        <form onSubmit={handleCredentialsSubmit} className="space-y-3">
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
                className="text-xs text-muted-foreground hover:text-primary hover:underline cursor-pointer"
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
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md px-6 w-full shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {mode === 'register' ? 'Creating account...' : 'Verifying...'}
              </>
            ) : mode === 'register' ? (
              'Create account'
            ) : (
              'Sign in'
            )}
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
                className="text-primary hover:underline font-medium cursor-pointer"
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
                className="text-primary hover:underline font-medium cursor-pointer"
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
