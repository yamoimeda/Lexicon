// src/components/game/RealtimeNotifications.tsx
"use client";

import React, { useEffect } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useUser } from '@/contexts/UserContext';

interface RealtimeNotificationsProps {
  roomId: string;
}

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

/**
 * RealtimeNotifications
 * Componente que detecta eventos en la sala y ronda y permite disparar toasts/notificaciones.
 * Actualmente no renderiza nada visible, pero puede integrarse con un sistema de toasts.
 */
export default function RealtimeNotifications({ roomId }: RealtimeNotificationsProps) {
  const { room, currentRound } = useGameRoom(roomId);
  const { username, language } = useUser();

  const T = translations[language as keyof typeof translations] || translations.en;

  // Monitorear cambios en los jugadores
  useEffect(() => {
    if (!room) return;
    // Aquí se puede disparar un toast real si se desea
    // Ejemplo: toast({ title: T.playerJoined('...') })
  }, [room?.players]);

  // Monitorear cambios en el estado del juego
  useEffect(() => {
    if (!room) return;
    // Aquí se puede disparar un toast real si se desea
  }, [room?.settings.gameStatus, room?.settings.currentRound]);

  // Monitorear cambios en las submissions de la ronda
  useEffect(() => {
    if (!currentRound || !username) return;
    // Aquí se puede disparar un toast real si se desea
  }, [currentRound?.submissions, username]);

  // Este componente no renderiza nada visible, solo maneja eventos
  return null;
}
