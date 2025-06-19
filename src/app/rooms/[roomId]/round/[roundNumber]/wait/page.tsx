// src/app/rooms/[roomId]/round/[roundNumber]/wait/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Play, Trophy, ListChecks, ArrowLeftToLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGameRoom } from '@/hooks/useGameRoom';
import { GameService } from '@/services/gameService';
import { onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useWaitRoundSync } from '@/hooks/useWaitRoundSync';
import { useSynchronizedTimer } from '@/hooks/useSynchronizedTimer';

interface Player {
  id: string;
  name: string;
  score: number;
}

interface StoredRoomSettings {
  roomName: string;
  numberOfRounds: number;
  timePerRound: number;
  categories: string;
  language: string;
  endRoundOnFirstSubmit: boolean;
  admin: string;
  currentRound: number;
}

const translations = {
  en: {
    pageTitle: (round: number) => `End of Round ${round}`,
    pageDescription: "Waiting for the admin to proceed or scores to be finalized.",
    adminControls: "Admin Controls",
    nextRoundButton: "Start Next Round",
    finishGameButton: "Finish Game & View Results",
    waitingForAdmin: (adminName: string) => `Waiting for admin (${adminName}) to start the next round or finish the game...`,
    scoreboardTitle: "Current Scores",
    yourScoreThisRound: "Your score this round:",
    loadingData: "Loading round data...",
    errorLoadingData: "Error loading data. Please try returning to the lobby.",
    pointsSuffix: "pts",
    backToLobby: "Back to Lobby",
  },
  es: {
    pageTitle: (round: number) => `Fin de Ronda ${round}`,
    pageDescription: "Esperando que el admin continúe o se finalicen las puntuaciones.",
    adminControls: "Controles de Admin",
    nextRoundButton: "Iniciar Siguiente Ronda",
    finishGameButton: "Finalizar Juego y Ver Resultados",
    waitingForAdmin: (adminName: string) => `Esperando que el admin (${adminName}) inicie la siguiente ronda o finalice el juego...`,
    scoreboardTitle: "Puntuaciones Actuales",
    yourScoreThisRound: "Tu puntuación esta ronda:",
    loadingData: "Cargando datos de la ronda...",
    errorLoadingData: "Error al cargar datos. Por favor, intenta volver a la sala de espera.",
    pointsSuffix: "pts",
    backToLobby: "Volver a la Sala",
  }
};

export default function WaitRoundPage() {
  const { isAuthenticated, username, language: uiLanguage } = useUser();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const roundNumber = parseInt(params.roundNumber as string, 10);
  const { toast } = useToast();
  const T = translations[uiLanguage as keyof typeof translations] || translations.en;

  const [isAdvancing, setIsAdvancing] = useState(false);

  // Sustituir los estados y useEffect por el hook personalizado
  const {
    firestoreRoomSettings,
    firestorePlayers,
    currentPlayerRoundScore,
    isLoading,
    error
  } = useWaitRoundSync(roomId, roundNumber, username);

  const timeLeft = useSynchronizedTimer(roomId, roundNumber);

  useEffect(() => {
    if (!isAuthenticated || !username) {
      router.replace('/login');
      return;
    }
    if (!roomId || isNaN(roundNumber)) {
      router.replace('/');
      return;
    }
  }, [roomId, roundNumber, username, isAuthenticated, router]);

  const handleNextRound = async () => {
    if (!firestoreRoomSettings || isAdvancing) return;
    setIsAdvancing(true);
    const nextRoundNumber = firestoreRoomSettings.currentRound + 1;
    const durationSeconds = firestoreRoomSettings.timePerRound || 60;
    try {
      // Validar estado actual en Firestore
      const roomSnap = await getDoc(doc(db, 'rooms', roomId));
      const data = roomSnap.data();
      if (data.settings.currentRound !== firestoreRoomSettings.currentRound) {
        toast({ variant: "destructive", title: "La ronda ya fue avanzada por otro admin." });
        setIsAdvancing(false);
        return;
      }
      await GameService.startRoundWithTimer(roomId, nextRoundNumber, durationSeconds);
      toast({ variant: "success", title: "Ronda iniciada" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al avanzar de ronda." });
    }
    setIsAdvancing(false);
  };

  // Efecto: Si el tiempo llega a 0 y el usuario es admin y la sala sigue en playing, pasar a revisión automáticamente
  useEffect(() => {
    if (
      isCurrentUserAdmin &&
      timeLeft === 0 &&
      firestoreRoomSettings?.gameStatus === 'playing'
    ) {
      // Lógica para finalizar ronda y pasar a revisión
      const finalize = async () => {
        try {
          // Aquí deberías calcular los puntajes reales, por ahora solo cambia el estado
          await GameService.finalizeRound(roomId, roundNumber, {});
          toast({ variant: 'success', title: 'Ronda finalizada, pasando a revisión.' });
        } catch (e) {
          toast({ variant: 'destructive', title: 'Error al finalizar la ronda.' });
        }
      };
      finalize();
    }
  }, [isCurrentUserAdmin, timeLeft, firestoreRoomSettings?.gameStatus, roomId, roundNumber, toast]);

  // Botón para forzar paso a revisión si el admin lo desea
  const handleForceFinalize = async () => {
    try {
      await GameService.finalizeRound(roomId, roundNumber, {});
      toast({ variant: 'success', title: 'Ronda finalizada, pasando a revisión.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al finalizar la ronda.' });
    }
  };

  if (isLoading) {
    return <PageWrapper><div className="text-center pt-10"><Loader2 className="animate-spin inline-block mr-2" />{T.loadingData}</div></PageWrapper>;
  }
  if (error) {
    return <PageWrapper><div className="text-center pt-10 text-red-500">{T.errorLoadingData}</div></PageWrapper>;
  }
  if (!firestoreRoomSettings) {
    return <PageWrapper><div className="text-center pt-10">{T.loadingData}</div></PageWrapper>;
  }

  const isCurrentUserAdmin = username === firestoreRoomSettings.admin;
  const isLastRound = roundNumber >= firestoreRoomSettings.numberOfRounds;

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline text-primary">{T.pageTitle(roundNumber)}</CardTitle>
            <CardDescription>{T.pageDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentPlayerRoundScore !== null && (
              <Card className="bg-muted/50 p-4 text-center">
                <p className="text-lg ">{T.yourScoreThisRound} <span className="font-bold text-accent">{currentPlayerRoundScore} {T.pointsSuffix}</span></p>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>{T.scoreboardTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {firestorePlayers.map((player: Player, idx: number) => (
                    <li key={player.id} className={`flex justify-between items-center p-2 rounded-md ${player.name === username ? 'bg-accent/20' : ''}`}>
                      <span className="font-semibold">{idx + 1}. {player.name}</span>
                      <span className="text-md font-bold text-primary">{player.score} {T.pointsSuffix}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {isCurrentUserAdmin ? (
              <Card className="border-primary border-2">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center"><ListChecks className="mr-2 text-primary"/>{T.adminControls}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col space-y-3">
                  {!isLastRound ? (
                    <Button onClick={handleNextRound} className="w-full bg-primary hover:bg-primary/90 text-lg py-3" disabled={isAdvancing}>
                      {isAdvancing ? <Loader2 className="animate-spin mr-2 h-5 w-5"/> : <Play className="mr-2 h-5 w-5"/>}
                      {T.nextRoundButton} (Round {roundNumber + 1})
                    </Button>
                  ) : (
                    <Button onClick={handleFinishGame} className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3">
                      <Trophy className="mr-2 h-5 w-5"/>{T.finishGameButton}
                    </Button>
                  )}
                  {isCurrentUserAdmin && timeLeft === 0 && firestoreRoomSettings?.gameStatus === 'playing' && (
                    <Button onClick={handleForceFinalize} className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-3">
                      Forzar paso a revisión
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <p className="text-center text-muted-foreground p-4 bg-muted rounded-md">
                {T.waitingForAdmin(firestoreRoomSettings.admin)}
              </p>
            )}
             <Button variant="outline" onClick={() => router.push(`/rooms/${roomId}/lobby`)} className="w-full">
                <ArrowLeftToLine className="mr-2 h-4 w-4"/>{T.backToLobby}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

