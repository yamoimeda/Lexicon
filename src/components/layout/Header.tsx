// src/components/layout/Header.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle, Globe, LogIn } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const translations = {
  en: {
    title: "WordDuel",
    logout: "Logout",
    login: "Login",
    language: "Language",
    english: "English",
    spanish: "Español",
  },
  es: {
    title: "WordDuel",
    logout: "Salir",
    login: "Ingresar",
    language: "Idioma",
    english: "English",
    spanish: "Español",
  }
};

export default function Header() {
  const { username, logout, isAuthenticated, language, setLanguage } = useUser();
  const T = translations[language as keyof typeof translations] || translations.en;

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <Link href="/" className="text-3xl font-headline font-bold hover:opacity-90 transition-opacity">
          {T.title}
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Select value={language} onValueChange={(value) => setLanguage(value)}>
            <SelectTrigger 
              className="w-[100px] sm:w-[120px] text-xs sm:text-sm h-9 bg-primary/80 border-primary-foreground/30 hover:bg-primary/70 focus:ring-primary-foreground text-primary-foreground"
              aria-label={T.language}
            >
              <Globe size={16} className="mr-1.5 shrink-0" />
              <SelectValue placeholder="Lang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{T.english}</SelectItem>
              <SelectItem value="es">{T.spanish}</SelectItem>
            </SelectContent>
          </Select>

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2">
                <UserCircle size={24} />
                <span className="text-sm font-medium hidden sm:inline">{username}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-primary-foreground hover:bg-primary/70 px-2 sm:px-3">
                <LogOut size={18} className="mr-0 sm:mr-2 shrink-0" />
                <span className="hidden sm:inline">{T.logout}</span>
              </Button>
            </>
          ) : (
            <Button 
              asChild 
              variant="ghost" 
              size="sm" 
              className="text-primary-foreground hover:bg-primary/70 px-2 sm:px-3"
            >
               <Link href="/login">
                  <LogIn size={18} className="mr-0 sm:mr-2 shrink-0" />
                  <span className="hidden sm:inline">{T.login}</span>
               </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
