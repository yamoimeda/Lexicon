// src/app/rooms/create/page.tsx
"use client";

import React, { useEffect } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import CreateRoomForm from '@/components/room/CreateRoomForm'; // Will be created later

export default function CreateRoomPage() {
  const { isAuthenticated } = useUser();
  const router = useRouter();

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
        <h1 className="text-4xl font-headline font-bold text-primary mb-8 text-center">Create New Game Room</h1>
        {/* CreateRoomForm will be implemented in a future step */}
        <CreateRoomForm />
      </div>
    </PageWrapper>
  );
}
