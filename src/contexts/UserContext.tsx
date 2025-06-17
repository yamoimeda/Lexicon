// src/contexts/UserContext.tsx
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useRouter } from 'next/navigation';

interface UserContextType {
  username: string | null;
  login: (name: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  language: string;
  setLanguage: (lang: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useLocalStorage<string | null>('wordduel-username', null);
  const [language, setLanguageState] = useLocalStorage<string>('wordduel-language', 'en');
  const router = useRouter();

  const login = useCallback((name: string) => {
    setUsername(name);
    router.push('/');
  }, [setUsername, router]);

  const logout = useCallback(() => {
    setUsername(null);
    router.push('/login');
  }, [setUsername, router]);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
  }, [setLanguageState]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const isAuthenticated = !!username;

  return (
    <UserContext.Provider value={{ username, login, logout, isAuthenticated, language, setLanguage }}>
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
