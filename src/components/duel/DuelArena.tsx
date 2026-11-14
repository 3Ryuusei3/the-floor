import React, { useEffect } from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import { useDuelTimer } from '../../hooks/useDuelTimer';
import { TimerDisplay } from './TimerDisplay';
import { ImageDisplay } from './ImageDisplay';
import { AnswerClueBar } from './AnswerClueBar';
import { HostControls } from './HostControls';
import { DuelVictoryModal } from './DuelVictoryModal';
import { DuelIntroCountdown } from './DuelIntroCountdown';

export const DuelArena: React.FC = () => {
  useDuelTimer();

  const currentDuel = useGameStore((state) => state.currentDuel);
  const players = useGameStore((state) => state.players);
  const startDuelCountdown = useGameStore((state) => state.startDuelCountdown);
  const startDuelRunning = useGameStore((state) => state.startDuelRunning);
  const decidePostDuel = useGameStore((state) => state.decidePostDuel);

  const isGrandFinal = currentDuel?.isGrandFinalDuel;

  // En la Gran Final, al terminar el duelo no se muestra modal de volver al tablero:
  // pasa directamente a la pantalla de victoria del campeón
  useEffect(() => {
    if (currentDuel?.status === 'finished' && isGrandFinal) {
      const timer = setTimeout(() => {
        decidePostDuel('continue');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentDuel?.status, isGrandFinal, decidePostDuel]);

  if (!currentDuel) return null;

  const challenger = players.find((p) => p.id === currentDuel.challengerId);
  const defender = players.find((p) => p.id === currentDuel.defenderId);
  const currentItem = currentDuel.items[currentDuel.currentIndex];

  const winner = players.find((p) => p.id === currentDuel.winnerId) || null;
  const loser = players.find((p) => p.id === currentDuel.loserId) || null;

  if (!challenger || !defender) return null;

  const isIntroOrCountdown =
    currentDuel.status === 'intro' || currentDuel.status === 'countdown';

  return (
    <div className="w-full max-w-[1200px] mx-auto px-2 sm:px-4 py-2 space-y-2 animate-fadeIn flex flex-col min-h-[94vh] justify-between">
      {/* Pantalla de Resumen / Cuenta Atrás Pre-Duelo */}
      {isIntroOrCountdown && (
        <DuelIntroCountdown
          status={currentDuel.status as 'intro' | 'countdown'}
          challenger={challenger}
          defender={defender}
          category={currentDuel.category}
          onStartCountdown={startDuelCountdown}
          onCountdownComplete={startDuelRunning}
        />
      )}

      {/* Contenedor Principal del Duelo */}
      <div className="flex flex-col lg:flex-row items-stretch justify-between gap-3 flex-1 min-h-0">
        {/* Lado Izquierdo: Retador */}
        <TimerDisplay
          player={challenger}
          timeRemaining={currentDuel.challengerTime}
          isActive={currentDuel.activePlayerId === challenger.id}
          isChallenger={true}
          isPassLocked={currentDuel.isPassLocked && currentDuel.activePlayerId === challenger.id}
        />

        {/* Centro: Visor de Imagen */}
        <ImageDisplay
          item={currentItem}
          category={currentDuel.category}
          itemNumber={currentDuel.currentIndex + 1}
          totalItems={currentDuel.items.length || 30}
          isFrozen={currentDuel.isFrozen}
          isPassLocked={currentDuel.isPassLocked}
          passPenaltySecondsRemaining={currentDuel.passPenaltySecondsRemaining}
          revealedAnswerText={currentDuel.revealedAnswerText}
        />

        {/* Lado Derecho: Defensor */}
        <TimerDisplay
          player={defender}
          timeRemaining={currentDuel.defenderTime}
          isActive={currentDuel.activePlayerId === defender.id}
          isChallenger={false}
          isPassLocked={currentDuel.isPassLocked && currentDuel.activePlayerId === defender.id}
        />
      </div>

      {/* Barra de Respuesta / Pista para el Presentador */}
      <AnswerClueBar item={currentItem} />

      {/* Botonera de Control del Presentador */}
      <HostControls />

      {/* Modal de Victoria al Terminar el Duelo (solo en duelos regulares, no en la gran final) */}
      <DuelVictoryModal
        isOpen={currentDuel.status === 'finished' && !isGrandFinal}
        winner={winner}
        loser={loser}
        endReason={currentDuel.endReason}
        onDecide={decidePostDuel}
      />
    </div>
  );
};
