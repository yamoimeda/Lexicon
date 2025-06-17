// src/contexts/UserContext.tsx
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useRouter } from 'next/navigation';

interface UserContextType {
  username: string | null;
  login: (name: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useLocalStorage<string | null>('wordduel-username', null);
  const router = useRouter();

  const login = useCallback((name: string) => {
    setUsername(name);
    router.push('/');
  }, [setUsername, router]);

  const logout = useCallback(() => {
    setUsername(null);
    // Potentially clear other game-related localStorage items here
    router.push('/login');
  }, [setUsername, router]);

  const isAuthenticated = !!username;

  return (
    <UserContext.Provider value={{ username, login, logout, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
