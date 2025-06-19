import { useEffect, useState } from 'react';
import { onSnapshot, doc, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Sincroniza el temporizador de una ronda usando la marca de tiempo final almacenada en Firestore.
 * @param roomId ID de la sala
 * @param roundId ID de la ronda (puede ser string o number)
 * @returns segundos restantes (number) o null si no hay timer
 */
export function useSynchronizedTimer(roomId: string, roundId: string | number) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!roomId || !roundId) return;
    const roundRef = doc(db, 'rooms', roomId, 'rounds', String(roundId));
    let interval: NodeJS.Timeout | null = null;
    const unsubscribe = onSnapshot(roundRef, (snap: QueryDocumentSnapshot<DocumentData> | DocumentData) => {
      const data = snap.data();
      if (data?.timerEndAt) {
        let end: Date;
        try {
          end = data.timerEndAt.toDate ? data.timerEndAt.toDate() : new Date(data.timerEndAt);
        } catch {
          setTimeLeft(null);
          if (interval) clearInterval(interval);
          return;
        }
        const update = () => setTimeLeft(Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000)));
        update();
        if (interval) clearInterval(interval);
        interval = setInterval(update, 1000);
      } else {
        setTimeLeft(null);
        if (interval) clearInterval(interval);
      }
    });
    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [roomId, roundId]);

  return timeLeft;
}
