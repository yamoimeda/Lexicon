// src/app/rooms/create/page.tsx
"use client";

import React, { useEffect } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import CreateRoomForm from '@/components/room/CreateRoomForm';

const translations = {
  en: {
    pageTitle: "Create New Game Room",
  },
  es: {
    pageTitle: "Crear Nueva Sala de Juego",
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
      </div>
    </PageWrapper>
  );
}
