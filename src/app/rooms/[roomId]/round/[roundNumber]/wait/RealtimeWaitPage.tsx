// src/app/rooms/[roomId]/round/[roundNumber]/wait/RealtimeWaitPage.tsx
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
import { GameService, Player } from '@/services/gameService';

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
    roundFinalized: "Round scores finalized!",
    loading: "Loading...",
    roomNotFound: "Room not found.",
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
    roundFinalized: "¡Puntuaciones de ronda finalizadas!",
    loading: "Cargando...",
    roomNotFound: "Sala no encontrada.",
  }
};

export default function RealtimeWaitPage() {
  const { isAuthenticated, username, language: uiLanguage } = useUser();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const roundNumber = parseInt(params.roundNumber as string, 10);
  const { toast } = useToast();
  const T = translations[uiLanguage as keyof typeof translations] || translations.en;

  const { room, currentRound, loading, error } = useGameRoom(roomId);
  const [currentPlayerRoundScore, setCurrentPlayerRoundScore] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !username) {
      router.replace('/login');
      return;
    }
    if (!roomId || isNaN(roundNumber)) {
      router.replace('/');
      return;
    }
  }, [isAuthenticated, username, roomId, roundNumber, router]);

  // Load round score when round data is available
  useEffect(() => {
    if (!currentRound || !username) return;

    const playerScore = currentRound.playerScores[username];
    if (playerScore !== undefined) {
      setCurrentPlayerRoundScore(playerScore);
    }
  }, [currentRound, username]);

  const handleNextRound = async () => {
    if (!room) return;
    
    try {
      const nextRoundNumber = room.settings.currentRound + 1;
      
      // Update room settings to next round
      await GameService.updateRoom(roomId, {
        'settings.currentRound': nextRoundNumber,
        'settings.gameStatus': 'playing'
      });
      
      toast({ title: `Starting Round ${nextRoundNumber}` });
      router.push(`/rooms/${roomId}/play`);
    } catch (error) {
      console.error('Error starting next round:', error);
      toast({ variant: "destructive", title: "Error starting next round" });
    }
  };

  const handleFinishGame = async () => {
    try {
      await GameService.finishGame(roomId);
      toast({ title: "Game finished!" });
      router.push(`/rooms/${roomId}/results`);
    } catch (error) {
      console.error('Error finishing game:', error);
      toast({ variant: "destructive", title: "Error finishing game" });
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="text-center pt-10">{T.loading}</div>
      </PageWrapper>
    );
  }

  if (error || !room) {
    return (
      <PageWrapper>
        <div className="text-center pt-10">{T.roomNotFound}</div>
      </PageWrapper>
    );
  }

  const isCurrentUserAdmin = username === room.settings.admin;
  const isLastRound = roundNumber >= room.settings.numberOfRounds;

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
                <p className="text-lg ">
                  {T.yourScoreThisRound} 
                  <span className="font-bold text-accent ml-2">
                    {currentPlayerRoundScore} {T.pointsSuffix}
                  </span>
                </p>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary"/>{T.scoreboardTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {room.players
                    .sort((a: Player, b: Player) => b.score - a.score)
                    .map((player: Player, idx: number) => (
                    <li 
                      key={player.id} 
                      className={`flex justify-between items-center p-2 rounded-md ${
                        player.name === username ? 'bg-accent/20' : ''
                      }`}
                    >
                      <span className="font-semibold">{idx + 1}. {player.name}</span>
                      <span className="text-md font-bold text-primary">
                        {player.score} {T.pointsSuffix}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {isCurrentUserAdmin ? (
              <Card className="border-primary border-2">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <ListChecks className="mr-2 text-primary"/>{T.adminControls}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col space-y-3">
                  {!isLastRound ? (
                    <Button 
                      onClick={handleNextRound} 
                      className="w-full bg-primary hover:bg-primary/90 text-lg py-3"
                    >
                      <Play className="mr-2 h-5 w-5"/>
                      {T.nextRoundButton} (Round {roundNumber + 1})
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleFinishGame} 
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3"
                    >
                      <Trophy className="mr-2 h-5 w-5"/>{T.finishGameButton}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <p className="text-center text-muted-foreground p-4 bg-muted rounded-md">
                {T.waitingForAdmin(room.settings.admin)}
              </p>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => router.push(`/rooms/${roomId}/lobby`)} 
              className="w-full"
            >
              <ArrowLeftToLine className="mr-2 h-4 w-4"/>{T.backToLobby}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
