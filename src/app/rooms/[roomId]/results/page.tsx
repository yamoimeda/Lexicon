// src/app/rooms/[roomId]/results/page.tsx
"use client";

import React, { useEffect } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, ListOrdered, RotateCcw, Home } from 'lucide-react';

// Mock data, replace with actual context/API data later
interface PlayerResult {
  id: string;
  name: string;
  score: number;
  rank: number;
}

export default function ResultsPage() {
  const { isAuthenticated, username } = useUser();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  // Mocked results data
  const results: PlayerResult[] = [
    { id: "1", name: username || "You", score: 150, rank: 1 },
    { id: "2", name: "Player2", score: 120, rank: 2 },
    { id: "3", name: "Player3", score: 90, rank: 3 },
  ].sort((a, b) => a.rank - b.rank);

  const winner = results[0];

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
        <Card className="shadow-xl text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Trophy className="h-20 w-20 text-accent" />
            </div>
            <CardTitle className="text-4xl font-headline text-primary">Game Over!</CardTitle>
            {winner && (
              <CardDescription className="text-xl mt-2">
                Congratulations <span className="font-bold text-accent">{winner.name}</span>, you are the WordDuel Champion!
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-primary flex items-center justify-center">
                <ListOrdered className="mr-2" /> Final Scores:
              </h3>
              <ul className="space-y-2">
                {results.map((player) => (
                  <li 
                    key={player.id} 
                    className={`flex justify-between items-center p-3 rounded-md text-left
                                ${player.rank === 1 ? 'bg-accent/30 border-2 border-accent' : 
                                 player.name === username ? 'bg-primary/10' : 'bg-muted/50'}`}
                  >
                    <div className="flex items-center">
                      <span className={`font-bold text-lg w-8 text-center ${player.rank === 1 ? 'text-accent-foreground' : 'text-primary'}`}>
                        {player.rank}.
                      </span>
                      <span className={`text-lg ${player.rank === 1 ? 'font-bold text-accent-foreground' : ''}`}>
                        {player.name}
                      </span>
                    </div>
                    <span className={`text-xl font-bold ${player.rank === 1 ? 'text-accent-foreground' : 'text-primary'}`}>
                      {player.score} pts
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button onClick={() => router.push(`/rooms/${roomId}/lobby`)} variant="outline" className="w-full sm:w-auto">
                <RotateCcw className="mr-2 h-5 w-5" /> Play Again in this Room
              </Button>
              <Button onClick={() => router.push('/')} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                <Home className="mr-2 h-5 w-5" /> Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
