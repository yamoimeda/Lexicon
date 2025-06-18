// src/components/game/RealtimeNotifications.tsx
"use client";

import React, { useEffect } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';

interface RealtimeNotificationsProps {
  roomId: string;
}

export default function RealtimeNotifications({ roomId }: RealtimeNotificationsProps) {
  const { room, currentRound } = useGameRoom(roomId);
  const { toast } = useToast();
  const { username, language } = useUser();

  const translations = {
    en: {
      playerJoined: (playerName: string) => `${playerName} joined the room`,
      playerLeft: (playerName: string) => `${playerName} left the room`,
      newRoundStarted: (roundNumber: number) => `Round ${roundNumber} started!`,
      newAdminAssigned: (adminName: string) => `${adminName} is now the room admin`,
      gameStarted: "Game started!",
      gameFinished: "Game finished!",
      roundFinished: (roundNumber: number) => `Round ${roundNumber} finished`,
      wordSubmitted: (playerName: string) => `${playerName} submitted their words`,
    },
    es: {
      playerJoined: (playerName: string) => `${playerName} se unió a la sala`,
      playerLeft: (playerName: string) => `${playerName} dejó la sala`,
      newRoundStarted: (roundNumber: number) => `¡Ronda ${roundNumber} iniciada!`,
      newAdminAssigned: (adminName: string) => `${adminName} es ahora el admin de la sala`,
      gameStarted: "¡Juego iniciado!",
      gameFinished: "¡Juego terminado!",
      roundFinished: (roundNumber: number) => `Ronda ${roundNumber} terminada`,
      wordSubmitted: (playerName: string) => `${playerName} envió sus palabras`,
    }
  };

  const T = translations[language as keyof typeof translations] || translations.en;

  // Monitorear cambios en los jugadores
  useEffect(() => {
    if (!room) return;

    // Aquí podrías implementar lógica para detectar cuando los jugadores se unen/salen
    // Por simplicidad, mostramos una notificación cuando detectamos cambios
    
    const playerCount = room.players.length;
    
    // Esta lógica se podría mejorar comparando con el estado anterior
    // para detectar exactamente qué jugador se unió o salió
    
  }, [room?.players, T]);

  // Monitorear cambios en el estado del juego
  useEffect(() => {
    if (!room) return;

    switch (room.settings.gameStatus) {
      case 'playing':
        if (room.settings.currentRound > 0) {
          toast({
            title: T.newRoundStarted(room.settings.currentRound),
            description: `Letter: ${room.settings.currentLetter}`,
          });
        }
        break;
      case 'finished':
        toast({
          title: T.gameFinished,
          description: "Check the final results!",
        });
        break;
    }
  }, [room?.settings.gameStatus, room?.settings.currentRound, T, toast]);

  // Monitorear cambios en las submissions de la ronda
  useEffect(() => {
    if (!currentRound || !username) return;

    // Notificar cuando otros jugadores envían sus palabras
    const otherPlayerSubmissions = currentRound.submissions.filter(
      s => s.playerId !== username
    );

    const uniquePlayers = new Set(otherPlayerSubmissions.map(s => s.playerId));
    
    // Aquí podrías implementar lógica más sofisticada para mostrar
    // notificaciones solo cuando hay nuevas submissions
    
  }, [currentRound?.submissions, username, T]);

  // Este componente no renderiza nada visible, solo maneja notificaciones
  return null;
}
