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
  // score: number; // Score might not be relevant in lobby or always 0 initially
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
    lobbyTitle: "Lobby: ",
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
  },
  es: {
    lobbyTitle: "Sala de Espera: ",
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
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!roomId || !username) return; // Ensure username is available for admin checks

    setIsLoading(true);
    const storedSettingsRaw = localStorage.getItem(`room-${roomId}-settings`);
    const storedPlayersRaw = localStorage.getItem(`room-${roomId}-players`);

    if (storedSettingsRaw) {
      try {
        const parsedSettings: StoredRoomSettings = JSON.parse(storedSettingsRaw);
        // Ensure players are loaded, default to an array with the admin if not found (basic safeguard)
        let playersList: Player[] = storedPlayersRaw ? JSON.parse(storedPlayersRaw) : [];
        
        // Ensure the admin is in the player list if not already
        if (parsedSettings.admin && !playersList.find(p => p.name === parsedSettings.admin)) {
           // This is a fallback; ideally, player list is managed robustly.
           // For now, if admin is not in players list, we add them with a generic ID.
           // This situation should be rare if room creation/joining logic is correct.
           // playersList.push({ id: `admin-${Date.now()}`, name: parsedSettings.admin });
        }
         if (playersList.length === 0 && parsedSettings.admin) {
          // If players list is empty but admin exists in settings, add admin to players list
           playersList.push({ id: 'creator', name: parsedSettings.admin });
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
        setSelectedNewAdminUsername(parsedSettings.admin);
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
  }, [roomId, isAuthenticated, router, username, toast, T.roomNotFoundToast]);

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
        toast({ variant: "destructive", title: "Error", description: "Failed to update admin." });
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
    // This case should ideally be handled by redirecting in useEffect, but as a fallback:
    return <PageWrapper><div className="flex justify-center items-center h-full pt-10">{T.roomNotFoundToast}</div></PageWrapper>;
  }
  
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-headline text-primary">
              {T.lobbyTitle}{roomData.name}
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
                    disabled={selectedNewAdminUsername === roomData.adminUsername || roomData.players.length <=1}
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
            {!isCurrentUserAdmin && (
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
