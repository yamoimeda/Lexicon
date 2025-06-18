// src/components/game/RealtimeNotifications.tsx
"use client";

import React, { useEffect } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useUser } from '@/contexts/UserContext';

interface RealtimeNotificationsProps {
  roomId: string;
}

export default function RealtimeNotifications({ roomId }: RealtimeNotificationsProps) {
  const { room, currentRound } = useGameRoom(roomId);
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

    // Lógica para detectar cuando los jugadores se unen/salen
    // Los toasts han sido eliminados para evitar bucles infinitos
    const playerCount = room.players.length;
    console.log('👥 Player count changed:', playerCount);
    
  }, [room?.players]);

  // Monitorear cambios en el estado del juego
  useEffect(() => {
    if (!room) return;

    switch (room.settings.gameStatus) {
      case 'playing':
        if (room.settings.currentRound > 0) {
          console.log('🎮 New round started:', room.settings.currentRound, 'Letter:', room.settings.currentLetter);
        }
        break;
      case 'finished':
        console.log('🏁 Game finished!');
        break;
    }
  }, [room?.settings.gameStatus, room?.settings.currentRound]);

  // Monitorear cambios en las submissions de la ronda
  useEffect(() => {
    if (!currentRound || !username) return;

    // Notificar cuando otros jugadores envían sus palabras
    const otherPlayerSubmissions = currentRound.submissions.filter(
      s => s.playerId !== username
    );

    const uniquePlayers = new Set(otherPlayerSubmissions.map(s => s.playerId));
    console.log('📝 Other players submissions:', uniquePlayers.size);
    
  }, [currentRound?.submissions, username]);

  // Este componente no renderiza nada visible, solo maneja logging
  return null;
}
