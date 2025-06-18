// src/app/rooms/[roomId]/play/RealtimeGamePage.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Clock, Users, Gamepad2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useGameRoom } from '@/hooks/useGameRoom';
import RealtimeNotifications from '@/components/game/RealtimeNotifications';

interface RealtimeGamePageProps {
  roomId: string;
}

interface CategoryWordSubmission {
  category: string;
  word: string;
}

const translations = {
  en: {
    round: "Round",
    timeLeft: "Time Left",
    yourLetter: "Your Letter:",
    enterCategoryWord: (category: string) => `Enter a ${category.toLowerCase()}`,
    submitWordsForRound: "Submit Words for Review",
    submitting: "Submitting...",
    gameInfo: "Game Info",
    roomIdLabel: "Room ID:",
    yourNameLabel: "Your Name:",
    scoreboard: "Scoreboard",
    pointsSuffix: "pts",
    loadingRoomSettings: "Loading game settings...",
    errorLoadingRoomSettings: "Could not load game settings. Please ensure room settings are available.",
    secondsSuffix: "s",
    timeUp: "Time's Up! Submitting your words...",
    waitingForRound: "Waiting for the round to start...",
    gameNotStarted: "Game hasn't started yet. Please wait for the admin to begin.",
    autoSubmitMode: "Auto-submit when time runs out",
    manualSubmitMode: "Submit manually when ready",
  },
  es: {
    round: "Ronda",
    timeLeft: "Tiempo Restante",
    yourLetter: "Tu Letra:",
    enterCategoryWord: (category: string) => `Ingresa ${category.toLowerCase()}`,
    submitWordsForRound: "Enviar Palabras para Revisión",
    submitting: "Enviando...",
    gameInfo: "Info del Juego",
    roomIdLabel: "ID de Sala:",
    yourNameLabel: "Tu Nombre:",
    scoreboard: "Marcador",
    pointsSuffix: "pts",
    loadingRoomSettings: "Cargando configuración del juego...",
    errorLoadingRoomSettings: "No se pudo cargar la configuración del juego. Asegúrate que la configuración de la sala esté disponible.",
    secondsSuffix: "s",
    timeUp: "¡Se acabó el tiempo! Enviando tus palabras...",
    waitingForRound: "Esperando que comience la ronda...",
    gameNotStarted: "El juego aún no ha comenzado. Espera que el admin lo inicie.",
    autoSubmitMode: "Envío automático cuando se acabe el tiempo",
    manualSubmitMode: "Enviar manualmente cuando esté listo",
  }
};

export default function RealtimeGamePage({ roomId }: RealtimeGamePageProps) {
  const { username, language: uiLanguage } = useUser();
  const router = useRouter();
  const T = translations[uiLanguage as keyof typeof translations] || translations.en;

  const {
    room,
    currentRound,
    loading,
    error,
    submitWords
  } = useGameRoom(roomId);

  const [wordSubmissions, setWordSubmissions] = useState<CategoryWordSubmission[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar submissions cuando cambien las categorías
  useEffect(() => {      if (room?.settings.categories) {
        setWordSubmissions(
          room.settings.categories.map((category: string) => ({
            category,
            word: ""
          }))
        );
      }
    }, [room?.settings.categories]);

  // Inicializar timer cuando comience la ronda
  useEffect(() => {
    if (room?.settings.gameStatus === 'playing' && room.settings.timePerRound) {
      setTimeLeft(room.settings.timePerRound);
    }
  }, [room?.settings.gameStatus, room?.settings.timePerRound]);

  // Redirigir cuando el juego termine o cambie de estado
  useEffect(() => {
    if (!room) return;

    switch (room.settings.gameStatus) {
      case 'waiting':
        router.push(`/rooms/${roomId}/lobby`);
        break;
      case 'reviewing':
        router.push(`/rooms/${roomId}/round/${room.settings.currentRound}/review`);
        break;
      case 'finished':
        router.push(`/rooms/${roomId}/results`);
        break;
    }  }, [room?.settings.gameStatus, room?.settings.currentRound, roomId, router]);

  const handleWordChange = useCallback((category: string, newWord: string) => {
    setWordSubmissions((prevWords: CategoryWordSubmission[]) =>
      prevWords.map((cw: CategoryWordSubmission) =>
        cw.category === category ? { ...cw, word: newWord } : cw
      )
    );
  }, []);
  const handleSubmitWords = useCallback(async () => {
    if (!room || !username || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Filtrar palabras vacías
      const wordsToSubmit = wordSubmissions.filter((w: CategoryWordSubmission) => w.word.trim() !== '');
      
      await submitWords(wordsToSubmit);
      
      // Removed toast notification to avoid infinite loops
      console.log('✅ Words submitted successfully!');

      // Si es modo "endRoundOnFirstSubmit", el juego cambiará automáticamente a reviewing
      // Si no, el usuario puede seguir editando hasta que se acabe el tiempo
      if (room.settings.endRoundOnFirstSubmit) {
        setIsSubmitting(false); // El useEffect manejará la redirección
      } else {
        setIsSubmitting(false);
      }
      
    } catch (error) {
      console.error('❌ Error submitting words:', error);
      // Removed toast notification to avoid infinite loops
      setIsSubmitting(false);
    }
  }, [room, username, wordSubmissions, submitWords, isSubmitting]);

  // Handle time up submission
  const handleTimeUp = useCallback(() => {
    toast({ title: T.timeUp });
    handleSubmitWords();
  }, [toast, T.timeUp, handleSubmitWords]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && room?.settings.gameStatus === 'playing' && !isSubmitting) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && room?.settings.gameStatus === 'playing' && !isSubmitting) {
      // Auto-submit cuando se acabe el tiempo
      handleTimeUp();
    }
  }, [timeLeft, room?.settings.gameStatus, isSubmitting, handleTimeUp]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center h-full pt-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">{T.loadingRoomSettings}</span>
        </div>
      </PageWrapper>
    );
  }

  if (error || !room) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center h-full pt-10 text-red-500">
          {error || T.errorLoadingRoomSettings}
        </div>
      </PageWrapper>
    );
  }

  if (room.settings.gameStatus !== 'playing') {
    return (
      <PageWrapper>
        <RealtimeNotifications roomId={roomId} />
        <div className="flex justify-center items-center h-full pt-10">
          <Card className="max-w-md text-center">
            <CardContent className="p-8">
              <div className="text-muted-foreground">
                {room.settings.gameStatus === 'waiting' 
                  ? T.gameNotStarted 
                  : T.waitingForRound
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <RealtimeNotifications roomId={roomId} />
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-3xl font-headline text-primary">
                  {T.round} {room.settings.currentRound}/{room.settings.numberOfRounds}
                </CardTitle>
                <div className="flex items-center gap-2 text-xl font-semibold text-accent">
                  <Clock size={24} />
                  <span>{Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}</span>
                </div>
              </div>
              <Progress 
                value={(timeLeft / (room.settings.timePerRound || 1)) * 100} 
                className="w-full h-2 mt-2 [&>div]:bg-accent" 
              />
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary font-medium mb-1">{T.yourLetter}</p>
                <p className="text-6xl font-headline font-bold tracking-widest text-primary">
                  {room.settings.currentLetter || '?'}
                </p>
              </div>              <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSubmitWords(); }} className="space-y-4">
                {wordSubmissions.map((cw: CategoryWordSubmission, index: number) => (
                  <Card key={index} className="p-4">
                    <Label htmlFor={`word-${index}`} className="text-lg font-semibold text-foreground/90">
                      {cw.category}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id={`word-${index}`}
                        type="text"
                        value={cw.word}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleWordChange(cw.category, e.target.value)}
                        placeholder={T.enterCategoryWord(cw.category)}
                        className="flex-grow"
                        disabled={isSubmitting || timeLeft === 0}
                        autoCapitalize="words"
                      />
                    </div>
                  </Card>
                ))}
                
                {room.settings.endRoundOnFirstSubmit && (
                  <Button 
                    type="submit" 
                    className="w-full text-lg py-3 bg-primary hover:bg-primary/90" 
                    disabled={isSubmitting || timeLeft === 0}
                  >
                    <Send className="mr-2 h-5 w-5"/> 
                    {isSubmitting ? T.submitting : T.submitWordsForRound}
                  </Button>
                )}
                
                {!room.settings.endRoundOnFirstSubmit && (
                  <div className="text-center text-sm text-muted-foreground">
                    {T.autoSubmitMode}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary flex items-center">
                <Gamepad2 className="mr-2"/>{T.gameInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><strong>{T.roomIdLabel}</strong> {roomId}</p>
              <p><strong>{T.yourNameLabel}</strong> {username}</p>
              <p><strong>{T.round}:</strong> {room.settings.currentRound}/{room.settings.numberOfRounds}</p>
              <p><strong>{T.yourLetter}</strong> {room.settings.currentLetter}</p>
              <p><strong>Time per Round:</strong> {room.settings.timePerRound}{T.secondsSuffix}</p>
              <p><strong>Language:</strong> {room.settings.language}</p>
              <p><strong>Categories:</strong> {room.settings.categories.join(', ')}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary flex items-center">
                <Users className="mr-2"/>{T.scoreboard}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {room.players.sort((a,b) => b.score - a.score).map((player, idx) => (
                  <li key={player.id} className={`flex justify-between items-center p-3 rounded-md ${player.name === username ? 'bg-accent/20' : 'bg-muted/50'}`}>
                    <span className="font-semibold">{idx + 1}. {player.name}</span>
                    <span className="text-lg font-bold text-primary">{player.score} {T.pointsSuffix}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
