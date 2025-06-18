// src/components/room/PublicRooms.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { GameService, Room } from '@/services/gameService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Globe, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

interface PublicRoomsProps {
  onRoomJoin?: (roomId: string) => void;
}

export default function PublicRooms({ onRoomJoin }: PublicRoomsProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { language } = useUser();

  const translations = {
    en: {
      title: "Public Rooms",
      description: "Join an existing game room",
      noRooms: "No public rooms available",
      createRoom: "Create your own room",
      joinRoom: "Join Room",
      refresh: "Refresh",
      players: "players",
      rounds: "rounds",
      timePerRound: "sec/round",
      language: "Language",
      categories: "Categories",
      waitingForPlayers: "Waiting for players",
    },
    es: {
      title: "Salas Públicas",
      description: "Únete a una sala de juego existente",
      noRooms: "No hay salas públicas disponibles",
      createRoom: "Crea tu propia sala",
      joinRoom: "Unirse",
      refresh: "Actualizar",
      players: "jugadores",
      rounds: "rondas",
      timePerRound: "seg/ronda",
      language: "Idioma",
      categories: "Categorías",
      waitingForPlayers: "Esperando jugadores",
    }
  };

  const T = translations[language as keyof typeof translations] || translations.en;

  const loadRooms = async () => {
    try {
      setLoading(true);
      const publicRooms = await GameService.getPublicRooms();
      setRooms(publicRooms);
    } catch (error) {
      console.error('Error loading public rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  };

  const handleJoinRoom = async (roomId: string) => {
    if (onRoomJoin) {
      onRoomJoin(roomId);
    } else {
      router.push(`/rooms/${roomId}/lobby`);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5" />
            {T.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Globe className="mr-2 h-5 w-5" />
              {T.title}
            </CardTitle>
            <CardDescription>{T.description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {T.refresh}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rooms.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>{T.noRooms}</p>
            <p className="text-sm">{T.createRoom}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => (
              <Card key={room.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{room.settings.roomName}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{room.players.length} {T.players}</span>
                        <Badge variant="secondary">
                          {T.waitingForPlayers}
                        </Badge>
                      </div>
                    </div>
                    <Button onClick={() => handleJoinRoom(room.id)}>
                      {T.joinRoom}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{T.rounds}</div>
                      <div className="text-muted-foreground">{room.settings.numberOfRounds}</div>
                    </div>
                    <div>
                      <div className="font-medium">{T.timePerRound}</div>
                      <div className="text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {room.settings.timePerRound}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">{T.language}</div>
                      <div className="text-muted-foreground">{room.settings.language}</div>
                    </div>
                    <div>
                      <div className="font-medium">{T.categories}</div>
                      <div className="text-muted-foreground">
                        {room.settings.categories.length} categorías
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
