import { useEffect, useState } from 'react';
import { onSnapshot, doc, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Player {
  id: string;
  name: string;
  score: number;
}

interface StoredRoomSettings {
  roomName: string;
  numberOfRounds: number;
  timePerRound: number;
  categories: string;
  language: string;
  endRoundOnFirstSubmit: boolean;
  admin: string;
  currentRound: number;
  gameStatus?: string;
}

export function useWaitRoundSync(
  roomId: string,
  roundNumber: number,
  username: string | undefined
) {
  const [currentPlayerRoundScore, setCurrentPlayerRoundScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firestoreRoomSettings, setFirestoreRoomSettings] = useState<StoredRoomSettings | null>(null);
  const [firestorePlayers, setFirestorePlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !username || isNaN(roundNumber)) return;
    setIsLoading(true);
    setError(null);
    // Tipado explícito de los snapshots
    const unsubRoom = onSnapshot(
      doc(db, 'rooms', roomId),
      (snap: QueryDocumentSnapshot<DocumentData> | DocumentData) => {
        const data = snap.data();
        if (data?.settings) setFirestoreRoomSettings(data.settings);
        if (data?.players) setFirestorePlayers(data.players.sort((a: Player, b: Player) => b.score - a.score));
      },
      (err) => {
        setError('Error al sincronizar sala');
        setIsLoading(false);
      }
    );
    const unsubScore = onSnapshot(
      doc(db, 'rooms', roomId, 'rounds', String(roundNumber)),
      (snap: QueryDocumentSnapshot<DocumentData> | DocumentData) => {
        const data = snap.data();
        if (data?.playerScores && data.playerScores[username] !== undefined) {
          setCurrentPlayerRoundScore(data.playerScores[username]);
        } else {
          setCurrentPlayerRoundScore(null);
        }
        setIsLoading(false);
      },
      (err) => {
        setError('Error al sincronizar puntuación');
        setIsLoading(false);
      }
    );
    return () => {
      unsubRoom();
      unsubScore();
    };
  }, [roomId, roundNumber, username]);

  return {
    firestoreRoomSettings,
    firestorePlayers,
    currentPlayerRoundScore,
    isLoading,
    error,
  };
}
