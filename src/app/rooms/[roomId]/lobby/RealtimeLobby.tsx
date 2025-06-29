// src/app/rooms/[roomId]/lobby/RealtimeLobby.tsx
"use client";

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Info, Users, Settings, Play, UserCog, Zap, Crown, Clock } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import RealtimeNotifications from '@/components/game/RealtimeNotifications';
import { GameService } from '@/services/gameService';
import { useToast } from '@/hooks/use-toast';

interface RealtimeLobbyProps {
  roomId: string;
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
    endRoundOnFirstSubmitLabelShort: "Quick Finish:",
    yes: "Yes",
    no: "No",
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
    gameStarted: "Game started! Redirecting to play area...",
  },
  es: {
    lobbyTitle: "ID de Sala: ",
    lobbyDescription: "¡Prepárense para el duelo! Esperando que el admin inicie.",
    gameSettingsTitle: "Ajustes del Juego",
    rounds: "Rondas:",
    timePerRound: "Tiempo/Ronda:",
    language: "Idioma:",
    categories: "Categorías:",
    endRoundOnFirstSubmitLabelShort: "Final Rápido:",
    yes: "Sí",
    no: "No",
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
    gameStarted: "¡Juego iniciado! Redirigiendo al área de juego...",
  }
};

export default function RealtimeLobby({ roomId }: RealtimeLobbyProps) {
  console.log('🏠 RealtimeLobby - Component rendering', { roomId });
  
  const { username, language: uiLanguage } = useUser();
  const router = useRouter();
  const T = translations[uiLanguage as keyof typeof translations] || translations.en;
  const hasJoined = useRef(false);
  const hasRedirected = useRef(false);
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  console.log('👤 RealtimeLobby - User context', { username, uiLanguage });
  const {
    room,
    loading,
    error,
    isAdmin: isAdminValue,
    joinRoom,
    startRound,
    leaveRoom
  } = useGameRoom(roomId);

  console.log('🎯 RealtimeLobby - Hook state', { 
    hasRoom: !!room, 
    loading, 
    error, 
    gameStatus: room?.settings?.gameStatus,
    isAdmin: isAdminValue,
    hasJoined: hasJoined.current,
    hasRedirected: hasRedirected.current
  });
  // Auto-join cuando se monta el componente (solo una vez)
  useEffect(() => {
    console.log('🚪 RealtimeLobby - Effect 1: Auto-join check', { 
      roomId, 
      username, 
      hasJoined: hasJoined.current, 
      loading 
    });
    
    if (roomId && username && !hasJoined.current && !loading) {
      console.log('🎯 RealtimeLobby - Executing joinRoom');
      hasJoined.current = true;
      joinRoom();
    }
  }, [roomId, username, loading]); // Sin joinRoom en dependencias

  // Redirigir cuando el juego comience (solo una vez)
  useEffect(() => {
    console.log('🎮 RealtimeLobby - Effect 2: Game status check', { 
      gameStatus: room?.settings.gameStatus, 
      hasRedirected: hasRedirected.current,
      roomId 
    });
    
    if (room?.settings.gameStatus === 'playing' && !hasRedirected.current) {
      console.log('🔄 RealtimeLobby - Redirecting to play');
      hasRedirected.current = true;
      router.push(`/rooms/${roomId}/play`);
    }
  }, [room?.settings.gameStatus, roomId, router]);
  // Redirigir si el usuario ya no está en la lista de jugadores
  useEffect(() => {
    if (room && username && !room.players.some(p => p.name === username)) {
      toast({ variant: 'destructive', title: T.leaveLobbyButton, description: T.roomNotFoundToast });
      router.push('/');
    }
  }, [room, username, router, toast]);

  // Advertencia si hay nombres duplicados
  const duplicateNames = room?.players?.map(p => p.name).filter((name, idx, arr) => arr.indexOf(name) !== idx && arr.lastIndexOf(name) === idx) || [];

  const handleStartGame = async () => {
    if (!isAdminValue || !room || isStarting) return;
    setIsStarting(true);
    try {
      // Generar letra aleatoria para la primera ronda
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      const durationSeconds = room.settings.timePerRound || 60;
      // 1. Crear la ronda y actualizar estado de la sala
      await startRound(1, randomLetter);
      // 2. Ahora sí, actualizar el timer en el documento de la ronda
      await GameService.startRoundWithTimer(roomId, 1, durationSeconds);
      toast({ variant: 'success', title: T.gameStarted });
    } catch (error: any) {
      toast({ variant: 'destructive', title: T.errorUpdatingAdmin, description: error?.message || String(error) });
    }
    setIsStarting(false);
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      router.push('/');
    } catch (error) {
      console.error('Error leaving room:', error);
      // Fallback: navegar de todas formas
      router.push('/');
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center h-full pt-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">{T.loadingRoomDetails}</span>
        </div>
      </PageWrapper>
    );
  }

  if (error || !room) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center h-full pt-10 text-red-500">
          {error || T.roomNotFoundToast}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Notificaciones en tiempo real */}
      <RealtimeNotifications roomId={roomId} />
      
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-headline text-primary flex items-center justify-center">
              {T.lobbyTitle}{roomId}
              <Badge 
                variant={room.settings.gameStatus === 'waiting' ? 'secondary' : 'default'}
                className="ml-4"
              >
                {room.settings.gameStatus}
              </Badge>
            </CardTitle>
            <CardDescription>{T.lobbyDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="grid md:grid-cols-2 gap-6">
              {/* Configuración del juego */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-headline flex items-center">
                    <Settings className="mr-2 h-5 w-5 text-primary"/>
                    {T.gameSettingsTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>{T.rounds}</strong> {room.settings.numberOfRounds}</p>
                  <p><strong>{T.timePerRound}</strong> {room.settings.timePerRound}{T.secondsSuffix}</p>
                  <p><strong>{T.language}</strong> {room.settings.language}</p>
                  <p><strong>{T.categories}</strong> {room.settings.categories.join(', ')}</p>
                  <p className="flex items-center">
                    <Zap className="mr-1 h-4 w-4 text-muted-foreground"/>
                    <strong>{T.endRoundOnFirstSubmitLabelShort}</strong> 
                    <span className={`ml-1 px-2 py-0.5 rounded text-xs ${room.settings.endRoundOnFirstSubmit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {room.settings.endRoundOnFirstSubmit ? T.yes : T.no}
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* Lista de jugadores en tiempo real */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-headline flex items-center">
                    <Users className="mr-2 h-5 w-5 text-primary"/>
                    {T.playersTitle} {T.playerCount(room.players.length)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm max-h-48 overflow-y-auto">
                    {room.players.sort((a,b) => b.score - a.score).map(player => (
                      <li key={player.id} className={`p-2 rounded flex justify-between items-center ${player.name === username ? 'bg-accent/30 font-semibold' : ''}`}>
                        <span className="flex items-center">
                          {player.name} 
                          {player.name === room.settings.admin && (
                            <Crown className="ml-2 h-4 w-4 text-yellow-500" />
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {player.score} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>            {/* Controles de juego */}
            {isAdminValue && room.settings.gameStatus === 'waiting' && (
              <Card className="border-primary border-2">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Play className="mr-2 text-primary"/>
                    Admin Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleStartGame} 
                    className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
                    disabled={room.players.length < 2 || isStarting}
                  >
                    {isStarting ? <span className="animate-spin mr-2 h-6 w-6 border-b-2 border-white rounded-full inline-block"/> : <Play className="mr-2 h-6 w-6"/>}
                    {T.startGameButton}
                  </Button>
                </CardContent>
              </Card>
            )}            {/* Mensaje para jugadores no-admin */}
            {!isAdminValue && room.settings.gameStatus === 'waiting' && (
              <div className="text-center text-muted-foreground p-4 bg-muted rounded-md">
                {T.waitingForAdmin(room.settings.admin)}
              </div>
            )}

            {/* Advertencia de nombres duplicados */}
            {duplicateNames.length > 0 && (
              <div className="text-center text-yellow-700 bg-yellow-100 rounded-md p-2 my-2">
                {T.errorUpdatingAdmin}: {duplicateNames.join(', ')}
              </div>
            )}

            {/* Botón salir */}
            <Button 
              variant="outline" 
              onClick={handleLeaveRoom} 
              className="w-full"
            >
              {T.leaveLobbyButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
