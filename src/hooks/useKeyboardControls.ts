import { useEffect } from 'react';
import { useGameStore } from './useGameStore';

export function useKeyboardControls() {
  const phase = useGameStore((state) => state.phase);
  const currentDuel = useGameStore((state) => state.currentDuel);
  const handleCorrectAnswer = useGameStore((state) => state.handleCorrectAnswer);
  const handlePassAnswer = useGameStore((state) => state.handlePassAnswer);
  const togglePauseDuel = useGameStore((state) => state.togglePauseDuel);
  const toggleSound = useGameStore((state) => state.toggleSound);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input o textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (phase === 'duel' && currentDuel) {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
          e.preventDefault();
          handleCorrectAnswer();
        } else if (e.code === 'KeyP' || e.code === 'KeyS' || e.code === 'ArrowDown') {
          e.preventDefault();
          handlePassAnswer();
        } else if (e.code === 'KeyQ' || e.code === 'Escape') {
          e.preventDefault();
          togglePauseDuel();
        }
      }

      if (e.code === 'KeyM') {
        e.preventDefault();
        toggleSound();
      }

      if (e.code === 'KeyF') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, currentDuel, handleCorrectAnswer, handlePassAnswer, togglePauseDuel, toggleSound]);
}
