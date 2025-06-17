// src/app/rooms/[roomId]/lobby/page.tsx
"use client";

import React, { useEffect } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Info, Users, Settings, Play } from 'lucide-react';

export default function RoomLobbyPage() {
  const { isAuthenticated, username } = useUser();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  // Mocked data, replace with actual context/API data later
  const roomDetails = {
    name: `Room ${roomId}`,
    admin: "AdminUser", // This would come from room creation
    settings: {
      rounds: 3,
      timePerRound: 60,
      categories: ["Animals", "Countries", "Fruits"],
      language: "English",
      // More settings later
    },
    players: [{id: "1", name: username}, {id: "2", name: "Player2"}, {id: "3", name: "Player3"}]
  };

  const isRoomAdmin = roomDetails.admin === username || username === "AdminUser"; // Simplified admin check

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Or loading spinner
  }
  
  const handleStartGame = () => {
    router.push(`/rooms/${roomId}/play`);
  };

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-headline text-primary">
              Lobby: {roomDetails.name}
            </CardTitle>
            <CardDescription>Get ready for the duel! Waiting for the admin to start.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-headline flex items-center"><Settings className="mr-2 h-5 w-5 text-primary"/>Game Settings</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Rounds:</strong> {roomDetails.settings.rounds}</p>
                  <p><strong>Time/Round:</strong> {roomDetails.settings.timePerRound}s</p>
                  <p><strong>Language:</strong> {roomDetails.settings.language}</p>
                  <p><strong>Categories:</strong> {roomDetails.settings.categories.join(', ')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-headline flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Players ({roomDetails.players.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {roomDetails.players.map(player => (
                      <li key={player.id} className={`p-2 rounded ${player.name === username ? 'bg-accent/30 font-semibold' : ''}`}>
                        {player.name} {player.name === roomDetails.admin ? '(Admin)' : ''}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {isRoomAdmin && (
              <Button onClick={handleStartGame} className="w-full text-lg py-6 bg-primary hover:bg-primary/90">
                <Play className="mr-2 h-6 w-6"/>
                Start Game
              </Button>
            )}
            {!isRoomAdmin && (
              <p className="text-center text-muted-foreground p-4 bg-muted rounded-md">
                Waiting for the admin (<span className="font-semibold">{roomDetails.admin}</span>) to start the game...
              </p>
            )}
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              Leave Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
