// src/services/gameService.ts
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Player {
  id: string;
  name: string;
  score: number;
  isAdmin?: boolean;
  joinedAt: Date;
}

export interface RoomSettings {
  roomName: string;
  numberOfRounds: number;
  timePerRound: number;
  categories: string[];
  language: string;
  endRoundOnFirstSubmit: boolean;
  admin: string;
  currentRound: number;
  gameStatus: 'waiting' | 'playing' | 'reviewing' | 'finished';
  currentLetter?: string;
  roundStartTime?: Date;
}

export interface PlayerSubmission {
  playerId: string;
  playerName: string;
  category: string;
  word: string;
  isValid?: boolean;
  validationReason?: string;
  submittedAt: Date;
}

export interface Room {
  id: string;
  settings: RoomSettings;
  players: Player[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoundData {
  roomId: string;
  roundNumber: number;
  letter: string;
  submissions: PlayerSubmission[];
  playerScores: Record<string, number>;
  isFinalized: boolean;
  startTime: Date;
  endTime?: Date;
}

export class GameService {
  // Crear una nueva sala
  static async createRoom(roomId: string, settings: RoomSettings, creator: Player): Promise<void> {
    const room: Room = {
      id: roomId,
      settings,
      players: [{ ...creator, isAdmin: true }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'rooms', roomId), room);
  }

  // Unirse a una sala
  static async joinRoom(roomId: string, player: Player): Promise<void> {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }

    const room = roomSnap.data() as Room;
    
    // Verificar que el jugador no esté ya en la sala
    if (!room.players.find(p => p.id === player.id)) {
      await updateDoc(roomRef, {
        players: arrayUnion({ ...player, joinedAt: new Date() }),
        updatedAt: new Date()
      });
    }
  }

  // Salir de una sala
  static async leaveRoom(roomId: string, playerId: string): Promise<void> {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) return;

    const room = roomSnap.data() as Room;
    const updatedPlayers = room.players.filter(p => p.id !== playerId);
    
    // Si era el admin, asignar nuevo admin
    let updatedSettings = room.settings;
    if (room.settings.admin === playerId && updatedPlayers.length > 0) {
      updatedSettings = { ...room.settings, admin: updatedPlayers[0].id };
      updatedPlayers[0].isAdmin = true;
    }

    await updateDoc(roomRef, {
      players: updatedPlayers,
      settings: updatedSettings,
      updatedAt: new Date()
    });
  }

  // Actualizar configuración de la sala
  static async updateRoomSettings(roomId: string, settings: Partial<RoomSettings>): Promise<void> {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      'settings': settings,
      updatedAt: new Date()
    });
  }

  // Iniciar una nueva ronda
  static async startRound(roomId: string, roundNumber: number, letter: string): Promise<void> {
    const roomRef = doc(db, 'rooms', roomId);
    
    // Actualizar estado de la sala
    await updateDoc(roomRef, {
      'settings.currentRound': roundNumber,
      'settings.gameStatus': 'playing',
      'settings.currentLetter': letter,
      'settings.roundStartTime': new Date(),
      updatedAt: new Date()
    });

    // Crear documento de ronda
    const roundData: RoundData = {
      roomId,
      roundNumber,
      letter,
      submissions: [],
      playerScores: {},
      isFinalized: false,
      startTime: new Date()
    };

    await setDoc(doc(db, 'rounds', `${roomId}_${roundNumber}`), roundData);
  }

  // Enviar palabras de un jugador
  static async submitWords(roomId: string, roundNumber: number, submissions: PlayerSubmission[]): Promise<void> {
    const roundRef = doc(db, 'rounds', `${roomId}_${roundNumber}`);
    const roundSnap = await getDoc(roundRef);
    
    if (!roundSnap.exists()) {
      throw new Error('Round not found');
    }

    const roundData = roundSnap.data() as RoundData;
    
    // Filtrar submissions existentes del mismo jugador y agregar las nuevas
    const filteredSubmissions = roundData.submissions.filter(
      s => s.playerId !== submissions[0]?.playerId
    );
    
    await updateDoc(roundRef, {
      submissions: [...filteredSubmissions, ...submissions]
    });
  }

  // Finalizar ronda con puntuaciones
  static async finalizeRound(roomId: string, roundNumber: number, playerScores: Record<string, number>): Promise<void> {
    const roundRef = doc(db, 'rounds', `${roomId}_${roundNumber}`);
    const roomRef = doc(db, 'rooms', roomId);
    
    // Actualizar puntuaciones de la ronda
    await updateDoc(roundRef, {
      playerScores,
      isFinalized: true,
      endTime: new Date()
    });

    // Actualizar puntuaciones totales de los jugadores
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
      const room = roomSnap.data() as Room;
      const updatedPlayers = room.players.map(player => ({
        ...player,
        score: player.score + (playerScores[player.id] || 0)
      }));

      await updateDoc(roomRef, {
        players: updatedPlayers,
        'settings.gameStatus': 'reviewing',
        updatedAt: new Date()
      });
    }
  }

  // Escuchar cambios en una sala
  static subscribeToRoom(roomId: string, callback: (room: Room | null) => void): () => void {
    const roomRef = doc(db, 'rooms', roomId);
    return onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as Room);
      } else {
        callback(null);
      }
    });
  }

  // Escuchar cambios en una ronda
  static subscribeToRound(roomId: string, roundNumber: number, callback: (round: RoundData | null) => void): () => void {
    const roundRef = doc(db, 'rounds', `${roomId}_${roundNumber}`);
    return onSnapshot(roundRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as RoundData);
      } else {
        callback(null);
      }
    });
  }

  // Obtener salas públicas
  static async getPublicRooms(): Promise<Room[]> {
    const q = query(
      collection(db, 'rooms'),
      where('settings.gameStatus', '==', 'waiting')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Room);
  }

  // Terminar juego
  static async finishGame(roomId: string): Promise<void> {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      'settings.gameStatus': 'finished',
      updatedAt: new Date()
    });
  }
}
