// src/hooks/useGameRoom.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  // Generar o recuperar ID único para el usuario
  useEffect(() => {
    console.log('🔍 useGameRoom - Effect 1: Generating userId', { username, roomId });
    if (!username) return;
    
    // Intentar recuperar ID almacenado localmente para este usuario y sala
    const storedUserId = localStorage.getItem(`userId_${roomId}_${username}`);
    
    if (storedUserId) {
      console.log('✅ useGameRoom - Using stored userId:', storedUserId);
      setCurrentUserId(storedUserId);
    } else {
      // Generar nuevo ID único
      const newUserId = generateUniqueUserId(username);
      console.log('🆕 useGameRoom - Generated new userId:', newUserId);
      localStorage.setItem(`userId_${roomId}_${username}`, newUserId);
      setCurrentUserId(newUserId);
    }
  }, [username, roomId]);
  // Suscribirse a cambios en la sala
  useEffect(() => {
    console.log('🏠 useGameRoom - Effect 2: Room subscription', { roomId });
    if (!roomId) return;

    setLoading(true);
    const unsubscribe = GameService.subscribeToRoom(roomId, (roomData) => {
      console.log('📡 useGameRoom - Room data received:', roomData ? 'Room exists' : 'Room not found');
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
    console.log('🎯 useGameRoom - Effect 3: Round subscription', { 
      hasRoom: !!room, 
      currentRound: room?.settings.currentRound 
    });
    if (!room || !room.settings.currentRound) return;

    const unsubscribe = GameService.subscribeToRound(
      roomId, 
      room.settings.currentRound, 
      (roundData) => {
        console.log('📊 useGameRoom - Round data received:', roundData ? 'Round exists' : 'Round not found');
        setCurrentRound(roundData);
      }
    );    return unsubscribe;
  }, [roomId, room?.settings.currentRound]);

  // Extraer solo el admin ID para evitar recalcular isAdmin constantemente
  useEffect(() => {
    console.log('🔑 useGameRoom - Effect 4: Extract admin ID', { 
      hasRoom: !!room,
      newAdminId: room?.settings.admin 
    });
    if (room?.settings.admin) {
      setAdminUserId(room.settings.admin);
    } else {
      setAdminUserId(null);
    }
  }, [room?.settings.admin]);  // Verificar si el usuario actual es admin (usando valores estables)
  const isAdmin = useMemo(() => {
    console.log('👑 useGameRoom - isAdmin computed', { 
      currentUserId,
      adminUserId,
      username 
    });
    if (!adminUserId || !currentUserId) return false;
    return adminUserId === currentUserId || extractUsernameFromId(adminUserId) === username;
  }, [adminUserId, currentUserId, username]);// Unirse a la sala
  const joinRoom = useCallback(async () => {
    console.log('🚪 useGameRoom - joinRoom called', { username, roomId, currentUserId });
    if (!username || !roomId || !currentUserId) return;

    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        console.log('❌ useGameRoom - Room not found');
        throw new Error('Room not found');
      }

      const currentRoom = roomSnap.data() as Room;
      
      // Verificar si el usuario ya está en la sala
      if (currentRoom.players.find((p: Player) => p.id === currentUserId)) {
        console.log('✅ useGameRoom - User already in room');
        return; // Ya está en la sala
      }

      // Generar nombre para mostrar que evite conflictos
      const displayName = generateDisplayName(username, currentRoom.players);
      console.log('🏷️ useGameRoom - Generated display name:', displayName);

      const player: Player = {
        id: currentUserId,
        name: displayName,
        score: 0,
        joinedAt: new Date()
      };
      
      console.log('🎮 useGameRoom - Joining room with player:', player);
      await GameService.joinRoom(roomId, player);
      console.log('✅ useGameRoom - Successfully joined room');
    } catch (err) {
      console.error('❌ useGameRoom - Error joining room:', err);
      setError(err instanceof Error ? err.message : 'Failed to join room');
    }
  }, [roomId, username, currentUserId]);
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
