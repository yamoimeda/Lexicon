// src/app/rooms/[roomId]/results/page-new.tsx
"use client";

import React, { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, ListOrdered, RotateCcw, Home } from 'lucide-react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { Player } from '@/services/gameService';

interface PlayerResult {
  id: string;
  name: string;
  score: number;
  rank?: number;
}

const translations = {
  en: {
    pageTitle: "Game Over!",
    congratulations: (winnerName: string) => `Congratulations ${winnerName}, you are the WordDuel Champion!`,
    noWinner: "Well played everyone!",
    finalScores: "Final Scores:",
    playAgainButton: "Play Again in this Room",
    backToHomeButton: "Back to Home",
    loadingResults: "Loading results...",
    errorLoadingResults: "Could not load player results.",
    pointsSuffix: "pts",
    loading: "Loading...",
    roomNotFound: "Room not found.",
  },
  es: {
    pageTitle: "¡Juego Terminado!",
    congratulations: (winnerName: string) => `¡Felicidades ${winnerName}, eres el Campeón de WordDuel!`,
    noWinner: "¡Bien jugado todos!",
    finalScores: "Puntuaciones Finales:",
    playAgainButton: "Jugar de Nuevo en esta Sala",
    backToHomeButton: "Volver al Inicio",
    loadingResults: "Cargando resultados...",
    errorLoadingResults: "No se pudieron cargar los resultados de los jugadores.",
    pointsSuffix: "pts",
    loading: "Cargando...",
    roomNotFound: "Sala no encontrada.",
  }
};

export default function RealtimeResultsPage() {
  const { isAuthenticated, username, language: uiLanguage } = useUser();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const T = translations[uiLanguage as keyof typeof translations] || translations.en;

  const { room, loading, error } = useGameRoom(roomId);
  const [results, setResults] = useState<PlayerResult[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!roomId) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, roomId, router]);

  useEffect(() => {
    if (!room || loading) return;

    try {
      // Sort players by score to determine rank
      const sortedPlayers = [...room.players].sort((a: Player, b: Player) => b.score - a.score);
      const rankedPlayers = sortedPlayers.map((player: Player, index: number) => ({
        id: player.id,
        name: player.name,
        score: player.score,
        rank: index + 1,
      }));
      setResults(rankedPlayers);
    } catch (e) {
      console.error("Error processing player results:", e);
      setResults([]);
    }
  }, [room, loading]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center h-full pt-10">{T.loading}</div>
      </PageWrapper>
    );
  }

  if (error || !room) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center h-full pt-10">{T.roomNotFound}</div>
      </PageWrapper>
    );
  }

  if (results.length === 0) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center h-full pt-10">{T.errorLoadingResults}</div>
      </PageWrapper>
    );
  }

  const winner = results.length > 0 && results[0].score > 0 ? results[0] : null;

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Trophy className="h-20 w-20 text-accent" />
            </div>
            <CardTitle className="text-4xl font-headline text-primary">{T.pageTitle}</CardTitle>
            {winner ? (
              <CardDescription className="text-xl mt-2">
                {T.congratulations(winner.name)}
              </CardDescription>
            ) : (
              <CardDescription className="text-xl mt-2">
                {T.noWinner}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-primary flex items-center justify-center">
                <ListOrdered className="mr-2" /> {T.finalScores}
              </h3>
              <ul className="space-y-2">
                {results.map((player) => (
                  <li
                    key={player.id}
                    className={`flex justify-between items-center p-3 rounded-md text-left
                                ${player.rank === 1 && winner ? 'bg-accent/30 border-2 border-accent' :
                                 player.name === username ? 'bg-primary/10' : 'bg-muted/50'}`}
                  >
                    <div className="flex items-center">
                      <span className={`font-bold text-lg w-8 text-center ${player.rank === 1 && winner ? 'text-accent-foreground' : 'text-primary'}`}>
                        {player.rank}.
                      </span>
                      <span className={`text-lg ${player.rank === 1 && winner ? 'font-bold text-accent-foreground' : ''}`}>
                        {player.name}
                      </span>
                    </div>
                    <span className={`text-xl font-bold ${player.rank === 1 && winner ? 'text-accent-foreground' : 'text-primary'}`}>
                      {player.score} {T.pointsSuffix}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                onClick={() => router.push(`/rooms/${roomId}/lobby`)} 
                variant="outline" 
                className="w-full sm:w-auto"
              >
                <RotateCcw className="mr-2 h-5 w-5" /> {T.playAgainButton}
              </Button>
              <Button 
                onClick={() => router.push('/')} 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              >
                <Home className="mr-2 h-5 w-5" /> {T.backToHomeButton}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
