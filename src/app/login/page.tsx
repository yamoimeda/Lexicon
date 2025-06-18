// src/app/login/page.tsx
"use client";

import React, { useEffect } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const translations = {
  en: {
    pageTitle: "Welcome to Lexicon!",
    pageDescription: "Enter your username to play.",
  },
  es: {
    pageTitle: "¡Bienvenido a Lexicon!",
    pageDescription: "Ingresa tu nombre de usuario para jugar.",
  }
};

export default function LoginPage() {
  const { isAuthenticated, language } = useUser();
  const router = useRouter();
  const T = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/'); // Redirect to home if already authenticated
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <PageWrapper>
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline text-primary">{T.pageTitle}</CardTitle>
            <CardDescription>{T.pageDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
