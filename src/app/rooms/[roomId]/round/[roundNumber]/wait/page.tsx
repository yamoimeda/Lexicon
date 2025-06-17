
// src/app/rooms/[roomId]/round/[roundNumber]/wait/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Play, Trophy, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  admin: string;
  currentRound: number;
}

const translations = {
  en: {
    pageTitle: (round: number) => `End of Round ${round}`,
    pageDescription: "Waiting for the admin to proceed.",
    adminControls: "Admin Controls",
    nextRoundButton: "Start Next Round",
    finishGameButton: "Finish Game & View Results",
    waitingForAdmin: (adminName: string) => `Waiting for admin (${adminName}) to start the next round or finish the game...`,
    scoreboardTitle: "Current Scores",
    roundScoreLabel: "Your score this round:",
    totalScoreLabel: "Your total score:",
    loadingData: "Loading round data...",
    errorLoadingData: "Error loading data. Please try returning to the lobby.",
    pointsSuffix: "pts",
  },
  es: {
    pageTitle: (round: number) => `Fin de Ronda ${round}`,
    pageDescription: "Esperando que el admin continúe.",
    adminControls: "Controles de Admin",
    nextRoundButton: "Iniciar Siguiente Ronda",
    finishGameButton: "Finalizar Juego y Ver Resultados",
    waitingForAdmin: (adminName: string) => `Esperando que el admin (${adminName}) inicie la siguiente ronda o finalice el juego...`,
    scoreboardTitle: "Puntuaciones Actuales",
    roundScoreLabel: "Tu puntuación esta ronda:",
    totalScoreLabel: "Tu puntuación total:",
    loadingData: "Cargando datos de la ronda...",
    errorLoadingData: "Error al cargar datos. Por favor, intenta volver a la sala de espera.",
    pointsSuffix: "pts",
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

  const [roomSettings, setRoomSettings] = useState<StoredRoomSettings | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerRoundScore, setCurrentPlayerRoundScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !username) {
      router.replace('/login');
      return;
    }
    if (!roomId || isNaN(roundNumber)) {
      router.replace('/');
      return;
    }

    setIsLoading(true);
    const settingsRaw = localStorage.getItem(`room-${roomId}-settings`);
    if (settingsRaw) {
      setRoomSettings(JSON.parse(settingsRaw));
    } else {
      toast({ variant: "destructive", title: T.errorLoadingData });
      router.push(`/rooms/${roomId}/lobby`);
      return;
    }

    const playersRaw = localStorage.getItem(`room-${roomId}-players`);
    if (playersRaw) {
      setPlayers(JSON.parse(playersRaw).sort((a: Player, b: Player) => b.score - a.score));
    }

    const roundScoreRaw = localStorage.getItem(`room-${roomId}-round-${roundNumber}-player-${username}-roundScore`);
    if (roundScoreRaw) {
      setCurrentPlayerRoundScore(JSON.parse(roundScoreRaw));
    }
    setIsLoading(false);
  }, [roomId, roundNumber, username, isAuthenticated, router, toast, T]);

  const handleNextRound = () => {
    if (!roomSettings) return;
    const nextRoundNumber = roomSettings.currentRound + 1;
    const updatedSettings = { ...roomSettings, currentRound: nextRoundNumber };
    localStorage.setItem(`room-${roomId}-settings`, JSON.stringify(updatedSettings));
    router.push(`/rooms/${roomId}/play`);
  };

  const handleFinishGame = () => {
    router.push(`/rooms/${roomId}/results`);
  };

  if (isLoading || !roomSettings) {
    return <PageWrapper><div className="text-center pt-10">{T.loadingData}</div></PageWrapper>;
  }

  const isCurrentUserAdmin = username === roomSettings.admin;
  const isLastRound = roomSettings.currentRound >= roomSettings.numberOfRounds;

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline text-primary">{T.pageTitle(roomSettings.currentRound)}</CardTitle>
            <CardDescription>{T.pageDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentPlayerRoundScore !== null && (
              <Card className="bg-muted/50 p-4 text-center">
                <p className="text-lg ">{T.roundScoreLabel} <span className="font-bold text-accent">{currentPlayerRoundScore} {T.pointsSuffix}</span></p>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>{T.scoreboardTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {players.map((player, idx) => (
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
                    <Button onClick={handleNextRound} className="w-full bg-primary hover:bg-primary/90 text-lg py-3">
                      <Play className="mr-2 h-5 w-5"/>{T.nextRoundButton}
                    </Button>
                  ) : (
                    <Button onClick={handleFinishGame} className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3">
                      <Trophy className="mr-2 h-5 w-5"/>{T.finishGameButton}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <p className="text-center text-muted-foreground p-4 bg-muted rounded-md">
                {T.waitingForAdmin(roomSettings.admin)}
              </p>
            )}
             <Button variant="outline" onClick={() => router.push(`/rooms/${roomId}/lobby`)} className="w-full">
                Back to Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

