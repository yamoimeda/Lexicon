// src/components/examples/RealtimeLobbyExample.tsx
"use client";

import React, { useEffect } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Play, Settings, Crown } from 'lucide-react';
import RealtimeNotifications from '@/components/game/RealtimeNotifications';

interface RealtimeLobbyExampleProps {
  roomId: string;
}

export default function RealtimeLobbyExample({ roomId }: RealtimeLobbyExampleProps) {
  const {
    room,
    loading,
    error,
    isAdmin,
    joinRoom,
    startRound
  } = useGameRoom(roomId);

  // Auto-join room when component mounts
  useEffect(() => {
    if (roomId) {
      joinRoom();
    }
  }, [roomId, joinRoom]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center text-red-500 p-8">
          Error: {error}
        </CardContent>
      </Card>
    );
  }

  if (!room) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          Room not found
        </CardContent>
      </Card>
    );
  }

  const handleStartGame = () => {
    if (isAdmin) {
      // Generate random letter for first round
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      startRound(1, randomLetter);
    }
  };

  return (
    <>
      {/* Notificaciones en tiempo real */}
      <RealtimeNotifications roomId={roomId} />
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header de la sala */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{room.settings.roomName}</span>
              <Badge variant={room.settings.gameStatus === 'waiting' ? 'secondary' : 'default'}>
                {room.settings.gameStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Configuración del juego */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Game Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>Rounds:</strong> {room.settings.numberOfRounds}</div>
              <div><strong>Time per Round:</strong> {room.settings.timePerRound}s</div>
              <div><strong>Language:</strong> {room.settings.language}</div>
              <div><strong>Categories:</strong> {room.settings.categories.join(', ')}</div>
            </CardContent>
          </Card>

          {/* Lista de jugadores en tiempo real */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Players ({room.players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {room.players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 rounded border">
                    <span className="flex items-center">
                      {player.name}
                      {room.settings.admin === player.id && (
                        <Crown className="ml-2 h-4 w-4 text-yellow-500" />
                      )}
                    </span>
                    <Badge variant="outline">{player.score} pts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles de admin */}
        {isAdmin && room.settings.gameStatus === 'waiting' && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Admin Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleStartGame} className="w-full" size="lg">
                <Play className="mr-2 h-5 w-5" />
                Start Game
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Mensaje para jugadores no-admin */}
        {!isAdmin && room.settings.gameStatus === 'waiting' && (
          <Card>
            <CardContent className="text-center p-6">
              <div className="text-muted-foreground">
                Waiting for {room.settings.admin} to start the game...
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

/* 
EJEMPLO DE USO:

// En tu página de lobby
import RealtimeLobbyExample from '@/components/examples/RealtimeLobbyExample';

export default function LobbyPage({ params }: { params: { roomId: string } }) {
  return (
    <PageWrapper>
      <RealtimeLobbyExample roomId={params.roomId} />
    </PageWrapper>
  );
}

// Para migrar componentes existentes:
// 1. Reemplaza localStorage con useGameRoom hook
// 2. Remove manual state management 
// 3. Add RealtimeNotifications component
// 4. Use room data directly from the hook
*/
