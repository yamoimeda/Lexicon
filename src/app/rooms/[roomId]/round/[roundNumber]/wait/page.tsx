
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
      const parsedSettings: StoredRoomSettings = JSON.parse(settingsRaw);
      setRoomSettings(parsedSettings);
      
      // Ensure currentRound in settings matches the page's roundNumber
      // This is important if admin advances round, others refresh this page.
      // For now, we assume navigation is correct.
       if(parsedSettings.currentRound !== roundNumber && username === parsedSettings.admin){
        // If admin is on a wait page for a previous round but settings show a newer round,
        // perhaps auto-navigate them to the play page of the current round in settings.
        // For now, this just indicates a potential sync issue if manual refresh happens.
       }
    } else {
      toast({ variant: "destructive", title: T.errorLoadingData });
      router.push(`/rooms/${roomId}/lobby`);
      return;
    }

    const playersRaw = localStorage.getItem(`room-${roomId}-players`);
    if (playersRaw) {
      setPlayers(JSON.parse(playersRaw).sort((a: Player, b: Player) => b.score - a.score));
    }

    // This will now reflect the score finalized by admin (or player's preliminary if admin hasn't finalized yet)
    const roundScoreRaw = localStorage.getItem(`room-${roomId}-round-${roundNumber}-player-${username}-roundScore`);
    if (roundScoreRaw) {
      setCurrentPlayerRoundScore(JSON.parse(roundScoreRaw));
    }
    setIsLoading(false);
  }, [roomId, roundNumber, username, isAuthenticated, router, toast, T]);

  const handleNextRound = () => {
    if (!roomSettings) return;
    const nextRoundNumber = roomSettings.currentRound + 1; // currentRound is the one just finished
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
  // currentRound in settings should be the round that just finished or is about to start.
  // If currentRound from settings is GREATER than roundNumber from URL, it means admin already moved to next.
  // For simplicity, isLastRound check uses roundNumber from URL (which should be the completed round).
  const isLastRound = roundNumber >= roomSettings.numberOfRounds;


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
                      <Play className="mr-2 h-5 w-5"/>{T.nextRoundButton} (Round {roundNumber + 1})
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
                <ArrowLeftToLine className="mr-2 h-4 w-4"/>{T.backToLobby}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

