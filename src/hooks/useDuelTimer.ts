import { useEffect, useRef } from 'react';
import { useGameStore } from './useGameStore';

/**
 * Hook de temporizador de alta precisión basado en requestAnimationFrame y delta time.
 */
export function useDuelTimer() {
  const currentDuel = useGameStore((state) => state.currentDuel);
  const tickDuel = useGameStore((state) => state.tickDuel);
  const lastTimeRef = useRef<number | null>(null);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentDuel || currentDuel.status !== 'in_progress') {
      lastTimeRef.current = null;
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      return;
    }

    const loop = (now: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (now - lastTimeRef.current) / 1000;
        // Evitar saltos si la pestaña estuvo en segundo plano
        if (delta > 0 && delta < 0.5) {
          tickDuel(delta);
        }
      }
      lastTimeRef.current = now;
      frameIdRef.current = requestAnimationFrame(loop);
    };

    frameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [currentDuel?.status, tickDuel]);
}
