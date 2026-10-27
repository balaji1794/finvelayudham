'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { PrivacyProvider } from '@/context/PrivacyContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PrivacyProvider>{children}</PrivacyProvider>
    </AuthProvider>
  );
}
