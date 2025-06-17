// src/components/Providers.tsx
"use client";

import React, { type ReactNode } from 'react';
import { UserProvider } from '@/contexts/UserContext';
import { Toaster } from '@/components/ui/toaster';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <UserProvider>
      {children}
      <Toaster />
    </UserProvider>
  );
}
