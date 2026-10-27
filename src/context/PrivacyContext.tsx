'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PrivacyContextType {
  isPrivacyMasked: boolean;
  togglePrivacyMask: () => void;
  setPrivacyMask: (masked: boolean) => void;
  maskValue: (formattedValue: string) => string;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

const PRIVACY_STORAGE_KEY = 'finvelayudham_privacy_mask';

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivacyMasked, setIsPrivacyMasked] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRIVACY_STORAGE_KEY);
      if (stored !== null) {
        setIsPrivacyMasked(stored === 'true');
      }
    } catch {
      // Ignore localStorage errors in SSR or restricted environments
    }
  }, []);

  const togglePrivacyMask = () => {
    setIsPrivacyMasked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PRIVACY_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const setPrivacyMask = (masked: boolean) => {
    setIsPrivacyMasked(masked);
    try {
      localStorage.setItem(PRIVACY_STORAGE_KEY, String(masked));
    } catch {
      // Ignore
    }
  };

  const maskValue = (formattedValue: string): string => {
    if (!isPrivacyMasked) return formattedValue;
    return '● ● ● ● ● ●';
  };

  return (
    <PrivacyContext.Provider
      value={{
        isPrivacyMasked,
        togglePrivacyMask,
        setPrivacyMask,
        maskValue,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy(): PrivacyContextType {
  const context = useContext(PrivacyContext);
  if (!context) {
    return {
      isPrivacyMasked: false,
      togglePrivacyMask: () => {},
      setPrivacyMask: () => {},
      maskValue: (v: string) => v,
    };
  }
  return context;
}
