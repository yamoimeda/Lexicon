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
    // CAMBIO: Leer la ronda actual desde el array rounds dentro del documento de la sala
    const roomRef = doc(db, 'rooms', roomId);
    let interval: ReturnType<typeof setInterval> | null = null;
    const unsubscribe = onSnapshot(roomRef, (snap) => {
      const data = snap.data();
      // Buscar la ronda actual en el array rounds
      const round = data?.rounds?.find((r: any) => r.roundNumber === Number(roundId));
      // DEPURACIÓN: log de la ronda encontrada
      console.log('[TIMER][ROUND]', { round, allRounds: data?.rounds });
      if (round?.timerEndAt) {
        let end: Date | null = null;
        let debugInfo: any = { timerEndAt: round.timerEndAt };
        try {
          if (typeof round.timerEndAt.toDate === 'function') {
            end = round.timerEndAt.toDate();
            debugInfo.method = 'toDate';
          } else if (
            typeof round.timerEndAt === 'object' &&
            typeof round.timerEndAt.seconds === 'number' &&
            typeof round.timerEndAt.nanoseconds === 'number'
          ) {
            end = new Date(round.timerEndAt.seconds * 1000 + Math.floor(round.timerEndAt.nanoseconds / 1e6));
            debugInfo.method = 'manual seconds+nanoseconds';
          } else {
            end = new Date(round.timerEndAt);
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
