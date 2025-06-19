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
      // DEPURACIÓN: log siempre que se recibe un snapshot
      console.log('[TIMER][SNAPSHOT]', { data });
      if (data?.timerEndAt) {
        let end: Date | null = null;
        let debugInfo: any = { timerEndAt: data.timerEndAt };
        try {
          if (typeof data.timerEndAt.toDate === 'function') {
            end = data.timerEndAt.toDate();
            debugInfo.method = 'toDate';
          } else if (
            typeof data.timerEndAt === 'object' &&
            typeof data.timerEndAt.seconds === 'number' &&
            typeof data.timerEndAt.nanoseconds === 'number'
          ) {
            end = new Date(data.timerEndAt.seconds * 1000 + Math.floor(data.timerEndAt.nanoseconds / 1e6));
            debugInfo.method = 'manual seconds+nanoseconds';
          } else {
            end = new Date(data.timerEndAt);
            debugInfo.method = 'Date constructor fallback';
          }
        } catch (e) {
          debugInfo.error = e;
          console.log('[TIMER][ERROR] timerEndAt parse fail', debugInfo);
          setTimeLeft(null);
          if (interval) clearInterval(interval);
          return;
        }
        debugInfo.endDate = end;
        debugInfo.now = Date.now();
        debugInfo.diff = end ? end.getTime() - Date.now() : null;
        debugInfo.secondsLeft = end ? Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000)) : null;
        console.log('[TIMER][DEBUG]', debugInfo);
        const update = () => setTimeLeft(end ? Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000)) : null);
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
