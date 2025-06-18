// src/hooks/useGameRoom.ts
import { useState, useEffect, useCallback } from 'react';
import { GameService, Room, RoundData, Player } from '@/services/gameService';
import { useUser } from '@/contexts/UserContext';
import { generateUniqueUserId, generateDisplayName, extractUsernameFromId } from '@/utils/userUtils';

export const useGameRoom = (roomId: string) => {
  const { username } = useUser();
  const [room, setRoom] = useState<Room | null>(null);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Generar o recuperar ID único para el usuario
  useEffect(() => {
    if (!username) return;
    
    // Intentar recuperar ID almacenado localmente para este usuario y sala
    const storedUserId = localStorage.getItem(`userId_${roomId}_${username}`);
    
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    } else {
      // Generar nuevo ID único
      const newUserId = generateUniqueUserId(username);
      localStorage.setItem(`userId_${roomId}_${username}`, newUserId);
      setCurrentUserId(newUserId);
    }
  }, [username, roomId]);

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
    if (!room || !currentUserId) return false;
    return room.settings.admin === currentUserId || extractUsernameFromId(room.settings.admin) === username;
  }, [room, currentUserId, username]);
  // Unirse a la sala
  const joinRoom = useCallback(async () => {
    if (!username || !roomId || !currentUserId) return;

    try {      // Verificar si el usuario ya está en la sala
      if (room && room.players.find((p: Player) => p.id === currentUserId)) {
        return; // Ya está en la sala
      }

      // Generar nombre para mostrar que evite conflictos
      const displayName = room ? generateDisplayName(username, room.players) : username;

      const player: Player = {
        id: currentUserId,
        name: displayName,
        score: 0,
        joinedAt: new Date()
      };
      await GameService.joinRoom(roomId, player);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    }
  }, [roomId, username, currentUserId, room]);
  // Salir de la sala
  const leaveRoom = useCallback(async () => {
    if (!currentUserId || !roomId) return;

    try {
      await GameService.leaveRoom(roomId, currentUserId);
      // Limpiar ID almacenado al salir
      localStorage.removeItem(`userId_${roomId}_${username}`);
      setCurrentUserId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave room');
    }
  }, [roomId, currentUserId, username]);

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
    if (!currentUserId || !room || !currentRound) return;

    try {
      const submissions = words.map(w => ({
        playerId: currentUserId,
        playerName: username || 'Unknown',
        category: w.category,
        word: w.word,
        submittedAt: new Date()
      }));

      await GameService.submitWords(roomId, room.settings.currentRound, submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit words');
    }
  }, [roomId, currentUserId, username, room, currentRound]);

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
    currentUserId,
    isAdmin: isAdmin(),
    joinRoom,
    leaveRoom,
    startRound,
    submitWords,
    finalizeRound,
    finishGame
  };
};
