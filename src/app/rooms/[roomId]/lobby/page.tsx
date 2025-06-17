
// src/app/rooms/[roomId]/lobby/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowRight, Info, Users, Settings, Play, UserCog } from 'lucide-react';
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
  categories: string; // Comma-separated string
  language: string; // Game content language, e.g., "English"
  admin: string; // Admin's username
}

interface DisplayRoomDetails {
  name: string;
  adminUsername: string;
  settings: {
    rounds: number;
    timePerRound: number;
    categories: string[];
    language: string;
  };
  players: Player[];
}

const translations = {
  en: {
    lobbyTitle: "Lobby ID: ",
    lobbyDescription: "Get ready for the duel! Waiting for the admin to start.",
    gameSettingsTitle: "Game Settings",
    rounds: "Rounds:",
    timePerRound: "Time/Round:",
    language: "Language:",
    categories: "Categories:",
    playersTitle: "Players",
    adminTag: "(Admin)",
    adminToolsTitle: "Admin Tools",
    assignNewAdminLabel: "Assign New Admin:",
    makeAdminButton: "Make Admin",
    adminChangedToastTitle: "Admin Changed",
    adminChangedToastDescription: (newAdmin: string) => `${newAdmin} is now the room admin.`,
    startGameButton: "Start Game",
    waitingForAdmin: (adminName: string) => `Waiting for the admin (${adminName}) to start the game...`,
    leaveLobbyButton: "Leave Lobby",
    loadingRoomDetails: "Loading room details...",
    roomNotFoundToast: "Room not found or settings are missing.",
    secondsSuffix: "s",
    playerCount: (count: number) => `(${count})`,
    errorUpdatingAdmin: "Failed to update admin.",
  },
  es: {
    lobbyTitle: "ID de Sala: ",
    lobbyDescription: "¡Prepárense para el duelo! Esperando que el admin inicie.",
    gameSettingsTitle: "Ajustes del Juego",
    rounds: "Rondas:",
    timePerRound: "Tiempo/Ronda:",
    language: "Idioma:",
    categories: "Categorías:",
    playersTitle: "Jugadores",
    adminTag: "(Admin)",
    adminToolsTitle: "Herramientas de Admin",
    assignNewAdminLabel: "Asignar Nuevo Admin:",
    makeAdminButton: "Hacer Admin",
    adminChangedToastTitle: "Admin Cambiado",
    adminChangedToastDescription: (newAdmin: string) => `${newAdmin} es ahora el admin de la sala.`,
    startGameButton: "Iniciar Juego",
    waitingForAdmin: (adminName: string) => `Esperando que el admin (${adminName}) inicie el juego...`,
    leaveLobbyButton: "Salir de la Sala",
    loadingRoomDetails: "Cargando detalles de la sala...",
    roomNotFoundToast: "Sala no encontrada o ajustes faltantes.",
    secondsSuffix: "s",
    playerCount: (count: number) => `(${count})`,
    errorUpdatingAdmin: "Error al actualizar el admin.",
  }
};


export default function RoomLobbyPage() {
  const { isAuthenticated, username, language: uiLanguage } = useUser();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { toast } = useToast();

  const [roomData, setRoomData] = useState<DisplayRoomDetails | null>(null);
  const [selectedNewAdminUsername, setSelectedNewAdminUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const T = translations[uiLanguage as keyof typeof translations] || translations.en;

  useEffect(() => {
    setIsLoading(true);

    if (!isAuthenticated) {
      router.replace('/login');
      setIsLoading(false);
      return;
    }

    if (!roomId || !username) {
      // Still waiting for roomId or username to be available
      // isLoading remains true, so "Loading room details..." will be shown
      return;
    }

    const storedSettingsRaw = localStorage.getItem(`room-${roomId}-settings`);
    
    if (storedSettingsRaw) {
      try {
        const parsedSettings: StoredRoomSettings = JSON.parse(storedSettingsRaw);
        
        let playersList: Player[] = [];
        const storedPlayersRaw = localStorage.getItem(`room-${roomId}-players`);
        if (storedPlayersRaw) {
            try {
                playersList = JSON.parse(storedPlayersRaw);
            } catch (e) {
                console.error("Error parsing players list from localStorage", e);
                playersList = []; 
            }
        }

        if (username && !playersList.find(p => p.name === username)) {
            playersList.push({ id: username, name: username, score: 0 }); 
            localStorage.setItem(`room-${roomId}-players`, JSON.stringify(playersList));
        }
        
        if (parsedSettings.admin && !playersList.find(p => p.name === parsedSettings.admin)) {
             playersList.push({ id: parsedSettings.admin, name: parsedSettings.admin, score: 0 });
             localStorage.setItem(`room-${roomId}-players`, JSON.stringify(playersList));
        }

        setRoomData({
          name: parsedSettings.roomName,
          adminUsername: parsedSettings.admin,
          settings: {
            rounds: parsedSettings.numberOfRounds,
            timePerRound: parsedSettings.timePerRound,
            categories: parsedSettings.categories.split(',').map(c => c.trim()),
            language: parsedSettings.language,
          },
          players: playersList,
        });
        if (parsedSettings.admin) {
          setSelectedNewAdminUsername(parsedSettings.admin); 
        }

      } catch (error) {
        console.error("Error parsing room data from localStorage:", error);
        toast({ variant: "destructive", title: "Error", description: T.roomNotFoundToast });
        router.replace('/');
      }
    } else {
      toast({ variant: "destructive", title: "Error", description: T.roomNotFoundToast });
      router.replace('/');
    }
    setIsLoading(false);
  }, [roomId, isAuthenticated, router, username, toast, T]); // T is included as its content depends on uiLanguage

  const isCurrentUserAdmin = roomData?.adminUsername === username;

  const handleAdminChange = () => {
    if (!roomData || !selectedNewAdminUsername || selectedNewAdminUsername === roomData.adminUsername || !roomId) return;

    const storedSettingsRaw = localStorage.getItem(`room-${roomId}-settings`);
    if (storedSettingsRaw) {
      try {
        const parsedSettings: StoredRoomSettings = JSON.parse(storedSettingsRaw);
        const updatedSettings = { ...parsedSettings, admin: selectedNewAdminUsername };
        localStorage.setItem(`room-${roomId}-settings`, JSON.stringify(updatedSettings));
        
        setRoomData(prev => prev ? { ...prev, adminUsername: selectedNewAdminUsername } : null);
        toast({ title: T.adminChangedToastTitle, description: T.adminChangedToastDescription(selectedNewAdminUsername) });
      } catch (error) {
        console.error("Error updating admin in localStorage:", error);
        toast({ variant: "destructive", title: "Error", description: T.errorUpdatingAdmin });
      }
    }
  };
  
  const handleStartGame = () => {
    router.push(`/rooms/${roomId}/play`);
  };

  if (isLoading) {
    return <PageWrapper><div className="flex justify-center items-center h-full pt-10">{T.loadingRoomDetails}</div></PageWrapper>;
  }

  if (!roomData) {
    // This case should ideally be handled by the redirect if settings are not found,
    // but as a fallback:
    return <PageWrapper><div className="flex justify-center items-center h-full pt-10">{T.roomNotFoundToast}</div></PageWrapper>;
  }
  
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-headline text-primary">
              {T.lobbyTitle}{roomId}
            </CardTitle>
            <CardDescription>{T.lobbyDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-headline flex items-center"><Settings className="mr-2 h-5 w-5 text-primary"/>{T.gameSettingsTitle}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>{T.rounds}</strong> {roomData.settings.rounds}</p>
                  <p><strong>{T.timePerRound}</strong> {roomData.settings.timePerRound}{T.secondsSuffix}</p>
                  <p><strong>{T.language}</strong> {roomData.settings.language}</p>
                  <p><strong>{T.categories}</strong> {roomData.settings.categories.join(', ')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-headline flex items-center">
                    <Users className="mr-2 h-5 w-5 text-primary"/>{T.playersTitle} {T.playerCount(roomData.players.length)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm max-h-48 overflow-y-auto">
                    {roomData.players.map(player => (
                      <li key={player.id || player.name} className={`p-2 rounded ${player.name === username ? 'bg-accent/30 font-semibold' : ''}`}>
                        {player.name} {player.name === roomData.adminUsername ? <span className="text-xs text-primary font-bold">{T.adminTag}</span> : ''}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {isCurrentUserAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-headline flex items-center">
                    <UserCog className="mr-2 h-5 w-5 text-primary"/>{T.adminToolsTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="admin-select" className="text-sm font-medium">{T.assignNewAdminLabel}</Label>
                    <Select 
                      value={selectedNewAdminUsername} 
                      onValueChange={setSelectedNewAdminUsername}
                    >
                      <SelectTrigger id="admin-select" className="w-full mt-1">
                        <SelectValue placeholder="Select a player" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomData.players.map(player => (
                          <SelectItem key={player.id || player.name} value={player.name}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleAdminChange} 
                    className="w-full"
                    disabled={!selectedNewAdminUsername || selectedNewAdminUsername === roomData.adminUsername || roomData.players.length <=1}
                  >
                    {T.makeAdminButton}
                  </Button>
                </CardContent>
              </Card>
            )}

            {isCurrentUserAdmin && (
              <Button onClick={handleStartGame} className="w-full text-lg py-6 bg-primary hover:bg-primary/90">
                <Play className="mr-2 h-6 w-6"/>
                {T.startGameButton}
              </Button>
            )}
            {!isCurrentUserAdmin && roomData.adminUsername && (
              <p className="text-center text-muted-foreground p-4 bg-muted rounded-md">
                {T.waitingForAdmin(roomData.adminUsername)}
              </p>
            )}
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              {T.leaveLobbyButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

