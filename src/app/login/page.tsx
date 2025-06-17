// src/app/login/page.tsx
"use client";

import React, { useEffect } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  const { isAuthenticated } = useUser();
  const router = useRouter();

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
            <CardTitle className="text-3xl font-headline text-primary">Welcome to WordDuel!</CardTitle>
            <CardDescription>Enter your username to play.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
