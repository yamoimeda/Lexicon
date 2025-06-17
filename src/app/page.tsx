// src/app/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, PlusCircle, Users } from 'lucide-react';

const translations = {
  en: {
    loading: "Loading...",
    welcome: "Welcome, ",
    readyToDuel: "Ready to duel with words?",
    createRoomTitle: "Create a New Room",
    createRoomDescription: "Set up your own game and invite friends.",
    createRoomContent: "Customize rounds, categories, time limits, and more. Be the master of your WordDuel arena!",
    createRoomButton: "Create Room",
    joinRoomTitle: "Join a Room",
    joinRoomDescription: "Enter a Room ID to join an existing game.",
    roomIdLabel: "Room ID",
    roomIdPlaceholder: "Enter Room ID",
    joinRoomButton: "Join Room",
  },
  es: {
    loading: "Cargando...",
    welcome: "¡Bienvenido, ",
    readyToDuel: "¿Listo para un duelo de palabras?",
    createRoomTitle: "Crear Nueva Sala",
    createRoomDescription: "Configura tu propio juego e invita amigos.",
    createRoomContent: "Personaliza rondas, categorías, límites de tiempo y más. ¡Sé el maestro de tu arena WordDuel!",
    createRoomButton: "Crear Sala",
    joinRoomTitle: "Unirse a una Sala",
    joinRoomDescription: "Ingresa un ID de sala para unirte a un juego existente.",
    roomIdLabel: "ID de Sala",
    roomIdPlaceholder: "Ingresa el ID de la Sala",
    joinRoomButton: "Unirse a Sala",
  }
};

export default function HomePage() {
  const { username, isAuthenticated, language } = useUser();
  const router = useRouter();
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const T = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center h-full">
          <p>{T.loading}</p>
        </div>
      </PageWrapper>
    );
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomIdToJoin.trim()) {
      router.push(`/rooms/${roomIdToJoin.trim()}/lobby`);
    }
  };

  return (
    <PageWrapper>
      <div className="text-center mb-12">
        <h1 className="text-5xl font-headline font-bold text-primary mb-4">
          {T.welcome}<span className="text-accent">{username}!</span>
        </h1>
        <p className="text-xl text-foreground/80">{T.readyToDuel}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <PlusCircle className="mr-2 text-primary" />
              {T.createRoomTitle}
            </CardTitle>
            <CardDescription>{T.createRoomDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{T.createRoomContent}</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/rooms/create">
                {T.createRoomButton}
                <ArrowRight className="ml-2" size={18} />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <Users className="mr-2 text-primary" />
              {T.joinRoomTitle}
            </CardTitle>
            <CardDescription>{T.joinRoomDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <Label htmlFor="roomId" className="text-foreground/80">{T.roomIdLabel}</Label>
                <Input
                  id="roomId"
                  type="text"
                  value={roomIdToJoin}
                  onChange={(e) => setRoomIdToJoin(e.target.value)}
                  placeholder={T.roomIdPlaceholder}
                  className="bg-input border-border focus:ring-primary"
                />
              </div>
              <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={!roomIdToJoin.trim()}>
                {T.joinRoomButton}
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
