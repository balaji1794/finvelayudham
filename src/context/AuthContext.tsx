'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { deriveUserIdFromEmail, loadUserPortfolio, saveUserPortfolio, UserPortfolio } from '@/lib/portfolio-vault';
import { hashCredentials } from '@/lib/crypto';
import { isDeviceTrusted, setDeviceTrusted } from '@/lib/trusted-device';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, name?: string, password?: string) => Promise<{ success: boolean; emailSent?: boolean; message?: string }>;
  verifyCredentialsOnly: (email: string, password?: string) => Promise<{ success: boolean; name?: string; message?: string }>;
  register: (email: string, name: string, password?: string) => Promise<{ success: boolean; emailSent?: boolean; message?: string }>;
  requestVerification: (email: string, name: string, type?: 'register' | 'login') => Promise<{ success: boolean; delivered?: boolean; deliveredTo?: string; sandboxCode?: string; message?: string }>;
  confirmVerification: (email: string, code: string, password?: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  completeVerifiedLogin: (email: string, name?: string, password?: string, trustDevice?: boolean) => Promise<{ success: boolean; emailSent?: boolean; message?: string }>;
  loginWithGoogle: (email?: string, name?: string) => Promise<{ success: boolean; emailSent?: boolean; message?: string }>;
  updateProfile: (updates: { name?: string; email?: string; newPassword?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'finvelayudham_user_session';
const ACCOUNTS_STORAGE_KEY = 'finvelayudham_registered_accounts';

// Helper to format clean display name from email (e.g. sharmashreedx333@gmail.com -> Sharma Shreedx)
function deriveNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] || 'User';
  // Strip trailing numbers
  const cleaned = localPart.replace(/\d+$/, '');
  // Capitalize words or camelCase parts
  const words = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[._\-\s]+/);
  const capitalized = words
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return capitalized || 'Valued Member';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVerifyToken, setActiveVerifyToken] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          const cleanEmail = parsed.email.trim().toLowerCase();
          const expectedId = deriveUserIdFromEmail(cleanEmail);
          if (parsed.id !== expectedId) {
            parsed.id = expectedId;
            parsed.email = cleanEmail;
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            } catch {}
          }
          setUser(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to parse stored user session:', err);
    } finally {
      setIsLoading(false);
    }

    // Listen for cross-tab or external storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const dispatchWelcomeEmail = async (email: string, name: string, type: 'welcome' | 'login') => {
    try {
      const res = await fetch('/api/auth/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, type }),
      });
      return await res.json();
    } catch (err) {
      console.warn('Error calling send-welcome API:', err);
      return { success: false, simulated: true };
    }
  };

  const requestVerification = async (email: string, name: string, type: 'register' | 'login' = 'register') => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-code', email, name, type }),
      });
      const data = await res.json();
      if (data.token) {
        setActiveVerifyToken(data.token);
      }
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to dispatch code' };
    }
  };

  const verifyCredentialsOnly = async (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }

    // 1. Check client-side account store
    let localChecked = false;
    try {
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (stored) {
        const accounts = JSON.parse(stored);
        if (accounts && accounts[cleanEmail]) {
          localChecked = true;
          const inputHash = await hashCredentials(password, cleanEmail);
          if (accounts[cleanEmail].passwordHash === inputHash) {
            return {
              success: true,
              name: accounts[cleanEmail].name || deriveNameFromEmail(cleanEmail),
            };
          } else {
            return {
              success: false,
              message: 'Incorrect password. Please try again.',
            };
          }
        }
      }
    } catch {}

    // 2. Check server API store (/api/auth/login with checkOnly: true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, checkOnly: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          name: data.user?.name || deriveNameFromEmail(cleanEmail),
        };
      }
      if (data.error === 'Incorrect password. Please try again.') {
        return {
          success: false,
          message: 'Incorrect password. Please try again.',
        };
      }
      if (data.error) {
        return {
          success: false,
          message: data.error,
        };
      }
    } catch {
      // offline fallback
    }

    if (localChecked) {
      return {
        success: false,
        message: 'Incorrect password. Please try again.',
      };
    }

    return {
      success: false,
      message: 'No account found with this email. Please check your email or create an account.',
    };
  };

  const completeVerifiedLogin = async (
    email: string,
    customName?: string,
    password?: string,
    trustDevice?: boolean
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const displayName = customName && customName.trim() ? customName.trim() : deriveNameFromEmail(cleanEmail);

    // Save or clear trusted device token
    if (typeof trustDevice === 'boolean') {
      setDeviceTrusted(cleanEmail, trustDevice);
    }

    // Hash and store credentials in local client store if provided
    if (password) {
      try {
        const pHash = await hashCredentials(password, cleanEmail);
        const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
        const accounts = stored ? JSON.parse(stored) : {};
        accounts[cleanEmail] = {
          email: cleanEmail,
          name: displayName,
          passwordHash: pHash,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
      } catch {}
    }

    const sessionUser: User = {
      id: deriveUserIdFromEmail(cleanEmail),
      email: cleanEmail,
      name: displayName,
      createdAt: new Date().toISOString(),
      isVerified: true,
    };

    setUser(sessionUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      document.cookie = `finvelayudham_session=${encodeURIComponent(sessionUser.email)}; path=/; max-age=2592000; SameSite=Lax`;
    } catch (err) {
      console.warn('Could not persist session:', err);
    }

    // Call server to establish server session cookie
    if (password) {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      }).catch(() => {});
    }

    // Automated background parity check against FinBoom reference site on every login
    fetch('/api/sync/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceUrl: 'https://www.finboom.app' }),
    }).catch(() => {});

    const emailResult = await dispatchWelcomeEmail(cleanEmail, displayName, 'login');
    return {
      success: true,
      emailSent: emailResult.delivered,
      message: emailResult.message,
    };
  };

  const confirmVerification = async (email: string, code: string, password?: string, customName?: string) => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm-code', email, code, verifyToken: activeVerifyToken }),
      });
      const data = await res.json();

      if (!res.ok || !data.verified) {
        return { success: false, error: data.error || 'Invalid confirmation code' };
      }

      // Validated! Activate account and create session
      const cleanEmail = email.trim().toLowerCase();
      const displayName = customName && customName.trim() ? customName.trim() : deriveNameFromEmail(cleanEmail);

      if (password) {
        try {
          const pHash = await hashCredentials(password, cleanEmail);
          const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
          const accounts = stored ? JSON.parse(stored) : {};
          accounts[cleanEmail] = {
            email: cleanEmail,
            name: displayName,
            passwordHash: pHash,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));

          // Also register on backend
          fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, name: displayName, password }),
          }).catch(() => {});
        } catch {}
      }

      const sessionUser: User = {
        id: deriveUserIdFromEmail(cleanEmail),
        email: cleanEmail,
        name: displayName,
        createdAt: new Date().toISOString(),
        isVerified: true,
      };

      setUser(sessionUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
        document.cookie = `finvelayudham_session=${encodeURIComponent(sessionUser.email)}; path=/; max-age=2592000; SameSite=Lax`;
      } catch (err) {
        console.warn('Could not persist session:', err);
      }

      // Trigger welcome email
      dispatchWelcomeEmail(cleanEmail, displayName, 'welcome').catch(() => {});

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verification service error' };
    }
  };

  const login = async (email: string, customName?: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const displayName = customName && customName.trim() ? customName.trim() : deriveNameFromEmail(cleanEmail);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }

    // 1. Verify against client-side account store
    let localFound = false;
    let localValid = false;
    try {
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (stored) {
        const accounts = JSON.parse(stored);
        if (accounts && accounts[cleanEmail]) {
          localFound = true;
          const inputHash = await hashCredentials(password, cleanEmail);
          if (accounts[cleanEmail].passwordHash === inputHash) {
            localValid = true;
          }
        }
      }
    } catch {}

    // If local account was found and password did not match: REJECT IMMEDIATELY!
    if (localFound && !localValid) {
      return {
        success: false,
        message: 'Incorrect password. Please try again.',
      };
    }

    // 2. Verify against server API (/api/auth/login)
    let serverValid = false;
    let serverError: string | undefined;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        serverValid = true;
      } else {
        serverError = data.error;
      }
    } catch (err) {
      // offline fallback
    }

    // If server specifically rejected the password:
    if (!localValid && serverError === 'Incorrect password. Please try again.') {
      return {
        success: false,
        message: 'Incorrect password. Please try again.',
      };
    }

    // If neither local nor server validated the password:
    if (!localValid && !serverValid) {
      if (serverError) {
        return {
          success: false,
          message: serverError,
        };
      }
      return {
        success: false,
        message: 'No account found with this email. Please check your email or create an account.',
      };
    }

    // Credentials strictly valid! Create authenticated session
    const sessionUser: User = {
      id: deriveUserIdFromEmail(cleanEmail),
      email: cleanEmail,
      name: displayName,
      createdAt: new Date().toISOString(),
      isVerified: true,
    };

    setUser(sessionUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      document.cookie = `finvelayudham_session=${encodeURIComponent(sessionUser.email)}; path=/; max-age=2592000; SameSite=Lax`;
    } catch (err) {
      console.warn('Could not persist session:', err);
    }

    const emailResult = await dispatchWelcomeEmail(cleanEmail, displayName, 'login');
    return {
      success: true,
      emailSent: emailResult.delivered,
      message: emailResult.message,
    };
  };

  const register = async (email: string, name: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const displayName = name && name.trim() ? name.trim() : deriveNameFromEmail(cleanEmail);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (!password || password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long.' };
    }

    // 1. Call server API
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, name: displayName, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.error && data.error.includes('already exists')) {
          return { success: false, message: data.error };
        }
      }
    } catch {}

    // 2. Hash and store locally in ACCOUNTS_STORAGE_KEY
    try {
      const pHash = await hashCredentials(password, cleanEmail);
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      const accounts = stored ? JSON.parse(stored) : {};
      accounts[cleanEmail] = {
        email: cleanEmail,
        name: displayName,
        passwordHash: pHash,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch {}

    const sessionUser: User = {
      id: deriveUserIdFromEmail(cleanEmail),
      email: cleanEmail,
      name: displayName,
      createdAt: new Date().toISOString(),
      isVerified: true,
    };

    setUser(sessionUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      document.cookie = `finvelayudham_session=${encodeURIComponent(sessionUser.email)}; path=/; max-age=2592000; SameSite=Lax`;
    } catch (err) {
      console.warn('Could not persist session:', err);
    }

    // Trigger confirmation / welcome email dispatch in the background
    requestVerification(cleanEmail, displayName).catch(() => {});
    dispatchWelcomeEmail(cleanEmail, displayName, 'welcome').catch(() => {});

    return {
      success: true,
      emailSent: true,
      user: sessionUser,
    };
  };

  const loginWithGoogle = async (customEmail?: string, customName?: string) => {
    const cleanEmail = (customEmail || 'balajibuddy1794@gmail.com').trim().toLowerCase();
    const name = customName || deriveNameFromEmail(cleanEmail);
    const sessionUser: User = {
      id: deriveUserIdFromEmail(cleanEmail),
      email: cleanEmail,
      name,
      createdAt: new Date().toISOString(),
      isVerified: true,
    };

    setUser(sessionUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      document.cookie = `finvelayudham_session=${encodeURIComponent(sessionUser.email)}; path=/; max-age=2592000; SameSite=Lax`;
    } catch (err) {
      console.warn('Could not persist session:', err);
    }

    const emailResult = await dispatchWelcomeEmail(cleanEmail, name, 'login');
    return {
      success: true,
      emailSent: emailResult.delivered,
      message: emailResult.message,
    };
  };

  const updateProfile = async (updates: { name?: string; email?: string; newPassword?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User session not found. Please log in again.' };
    }

    const currentEmail = user.email.trim().toLowerCase();
    const targetEmail = updates.email ? updates.email.trim().toLowerCase() : currentEmail;
    const targetName = updates.name && updates.name.trim() ? updates.name.trim() : user.name;

    if (updates.email && (!targetEmail.includes('@') || targetEmail.length < 5)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (updates.newPassword && updates.newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    // 1. Update on backend API
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEmail,
          name: targetName,
          newEmail: targetEmail !== currentEmail ? targetEmail : undefined,
          newPassword: updates.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Server rejected profile update' };
      }
    } catch (err) {
      console.warn('Backend profile update offline fallback:', err);
    }

    // 2. Update local credentials store
    try {
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      const accounts = stored ? JSON.parse(stored) : {};
      const existingAccount = accounts[currentEmail] || {};
      let updatedHash = existingAccount.passwordHash;

      if (updates.newPassword) {
        updatedHash = await hashCredentials(updates.newPassword, targetEmail);
      }

      if (targetEmail !== currentEmail) {
        delete accounts[currentEmail];
      }

      accounts[targetEmail] = {
        ...existingAccount,
        email: targetEmail,
        name: targetName,
        passwordHash: updatedHash,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch {}

    // 3. If email changed, migrate user's private encrypted vault!
    const newUserId = deriveUserIdFromEmail(targetEmail);
    if (targetEmail !== currentEmail && typeof window !== 'undefined') {
      try {
        const currentPortfolio = await loadUserPortfolio(user.id, currentEmail);
        if (currentPortfolio) {
          const migratedPortfolio: UserPortfolio = {
            ...currentPortfolio,
            userId: newUserId,
            email: targetEmail,
            updatedAt: new Date().toISOString(),
          };
          await saveUserPortfolio(migratedPortfolio, newUserId);
        }
      } catch (err) {
        console.warn('Vault migration on email change error:', err);
      }
    }

    // 4. Update session user state
    const updatedUser: User = {
      ...user,
      id: newUserId,
      email: targetEmail,
      name: targetName,
    };

    setUser(updatedUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      document.cookie = `finvelayudham_session=${encodeURIComponent(updatedUser.email)}; path=/; max-age=2592000; SameSite=Lax`;
    } catch (err) {
      console.warn('Could not persist updated session:', err);
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      document.cookie = 'finvelayudham_session=; path=/; max-age=0';
    } catch (err) {
      console.warn('Could not clear session:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        verifyCredentialsOnly,
        register,
        requestVerification,
        confirmVerification,
        completeVerifiedLogin,
        loginWithGoogle,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
