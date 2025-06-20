// src/app/rooms/[roomId]/results/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, ListOrdered, RotateCcw, Home } from 'lucide-react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PlayerResult {
  id: string;
  name: string;
  score: number;
  rank?: number; // Rank will be calculated
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
  }
};

export default function ResultsPage() {
  const { isAuthenticated, username, language: uiLanguage } = useUser();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const T = translations[uiLanguage as keyof typeof translations] || translations.en;

  const [results, setResults] = useState<PlayerResult[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!roomId) {
      router.push('/');
      return;
    }
    setIsLoading(true);
    // Sincronización reactiva desde Firestore
    const unsub = onSnapshot(doc(db, 'rooms', roomId), (snap) => {
      const data = snap.data();
      if (!data || !data.players) {
        setResults([]);
        setRounds([]);
        setIsLoading(false);
        return;
      }
      // Redirigir si el usuario ya no está en la lista de jugadores
      if (username && !data.players.some((p: any) => p.name === username)) {
        toast({ variant: 'destructive', title: T.errorLoadingResults });
        router.push('/');
        return;
      }
      // Advertencia si hay nombres duplicados
      const duplicateNames = data.players.map((p: any) => p.name).filter((name: string, idx: number, arr: string[]) => arr.indexOf(name) !== idx && arr.lastIndexOf(name) === idx);
      if (duplicateNames.length > 0) {
        toast({ variant: 'warning', title: T.errorLoadingResults, description: duplicateNames.join(', ') });
      }
      // Ordenar y rankear
      const sortedPlayers = [...data.players].sort((a: any, b: any) => b.score - a.score);
      const rankedPlayers = sortedPlayers.map((player: any, index: number) => ({
        ...player,
        rank: index + 1,
      }));
      setResults(rankedPlayers);
      setRounds(Array.isArray(data.rounds) ? data.rounds : []);
      setIsLoading(false);
    });
    return () => unsub();
  }, [isAuthenticated, router, roomId, T, username, toast]);


  if (isLoading) {
    return <PageWrapper><div className="flex justify-center items-center h-full pt-10">{T.loadingResults}</div></PageWrapper>;
  }

  if (results.length === 0 && !isLoading) {
     return <PageWrapper><div className="flex justify-center items-center h-full pt-10">{T.errorLoadingResults}</div></PageWrapper>;
  }

  const winner = results.length > 0 && results[0].score > 0 ? results[0] : null; // Check if score > 0 for a winner

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
            {/* Desglose por ronda para el jugador actual */}
            {username && rounds.length > 0 && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-2 text-primary">Desglose por ronda</h4>
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 border">Ronda</th>
                      <th className="p-2 border">Letra</th>
                      <th className="p-2 border">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rounds.map((round, idx) => {
                      const score = round.playerScores && round.playerScores[username] ? round.playerScores[username] : 0;
                      return (
                        <tr key={idx} className="border-b">
                          <td className="p-2 border text-center">{round.roundNumber}</td>
                          <td className="p-2 border text-center">{round.letter}</td>
                          <td className="p-2 border text-center font-bold">{score} {T.pointsSuffix}</td>
                        </tr>
                      );
                    })}
                    {/* Total row */}
                    <tr className="font-bold bg-muted/30">
                      <td className="p-2 border text-center" colSpan={2}>Total</td>
                      <td className="p-2 border text-center font-bold">
                        {rounds.reduce((acc, round) => acc + (round.playerScores && round.playerScores[username] ? round.playerScores[username] : 0), 0)} {T.pointsSuffix}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button onClick={() => router.push(`/rooms/${roomId}/lobby`)} variant="outline" className="w-full sm:w-auto">
                <RotateCcw className="mr-2 h-5 w-5" /> {T.playAgainButton}
              </Button>
              <Button onClick={() => router.push('/')} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                <Home className="mr-2 h-5 w-5" /> {T.backToHomeButton}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

