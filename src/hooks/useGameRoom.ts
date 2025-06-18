// src/hooks/useGameRoom.ts
import { useState, useEffect, useCallback } from 'react';
import { GameService, Room, RoundData, Player } from '@/services/gameService';
import { useUser } from '@/contexts/UserContext';

export const useGameRoom = (roomId: string) => {
  const { username } = useUser();
  const [room, setRoom] = useState<Room | null>(null);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Suscribirse a cambios en la sala
  useEffect(() => {
    if (!roomId) return;

    setLoading(true);
    const unsubscribe = GameService.subscribeToRoom(roomId, (roomData) => {
      setRoom(roomData);
      setLoading(false);
      if (!roomData) {
        setError('Room not found');
      }
    });

    return unsubscribe;
  }, [roomId]);

  // Suscribirse a cambios en la ronda actual
  useEffect(() => {
    if (!room || !room.settings.currentRound) return;

    const unsubscribe = GameService.subscribeToRound(
      roomId, 
      room.settings.currentRound, 
      (roundData) => {
        setCurrentRound(roundData);
      }
    );

    return unsubscribe;
  }, [roomId, room?.settings.currentRound]);

  // Verificar si el usuario actual es admin
  const isAdmin = useCallback(() => {
    if (!room || !username) return false;
    return room.settings.admin === username;
  }, [room, username]);

  // Unirse a la sala
  const joinRoom = useCallback(async () => {
    if (!username || !roomId) return;

    try {
      const player: Player = {
        id: username,
        name: username,
        score: 0,
        joinedAt: new Date()
      };
      await GameService.joinRoom(roomId, player);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    }
  }, [roomId, username]);

  // Salir de la sala
  const leaveRoom = useCallback(async () => {
    if (!username || !roomId) return;

    try {
      await GameService.leaveRoom(roomId, username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave room');
    }
  }, [roomId, username]);

  // Iniciar una nueva ronda
  const startRound = useCallback(async (roundNumber: number, letter: string) => {
    if (!isAdmin()) return;

    try {
      await GameService.startRound(roomId, roundNumber, letter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start round');
    }
  }, [roomId, isAdmin]);

  // Enviar palabras del jugador
  const submitWords = useCallback(async (words: Array<{category: string, word: string}>) => {
    if (!username || !room || !currentRound) return;

    try {
      const submissions = words.map(w => ({
        playerId: username,
        playerName: username,
        category: w.category,
        word: w.word,
        submittedAt: new Date()
      }));

      await GameService.submitWords(roomId, room.settings.currentRound, submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit words');
    }
  }, [roomId, username, room, currentRound]);

  // Finalizar ronda
  const finalizeRound = useCallback(async (playerScores: Record<string, number>) => {
    if (!isAdmin() || !room) return;

    try {
      await GameService.finalizeRound(roomId, room.settings.currentRound, playerScores);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize round');
    }
  }, [roomId, room, isAdmin]);

  // Terminar juego
  const finishGame = useCallback(async () => {
    if (!isAdmin()) return;

    try {
      await GameService.finishGame(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finish game');
    }
  }, [roomId, isAdmin]);

  return {
    room,
    currentRound,
    loading,
    error,
    isAdmin: isAdmin(),
    joinRoom,
    leaveRoom,
    startRound,
    submitWords,
    finalizeRound,
    finishGame
  };
};
