// src/app/rooms/create/page.tsx
"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import CreateRoomForm from '@/components/room/CreateRoomForm';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const translations = {
  en: {
    pageTitle: "Create New Game Room",
    backToHome: "Back to Home",
  },
  es: {
    pageTitle: "Crear Nueva Sala de Juego",
    backToHome: "Volver al Inicio",
  }
};

export default function CreateRoomPage() {
  const { isAuthenticated, language } = useUser();
  const router = useRouter();
  const T = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Or loading spinner
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-headline font-bold text-primary mb-8 text-center">{T.pageTitle}</h1>
        <CreateRoomForm />
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              {T.backToHome}
            </Link>
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
