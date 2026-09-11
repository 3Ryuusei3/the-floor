import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Swords, Clock, AlertCircle } from 'lucide-react';
import { Player } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';

interface DuelVictoryModalProps {
  isOpen: boolean;
  winner: Player | null;
  loser: Player | null;
  endReason?: 'timeout' | 'items_exhausted';
  onDecide: (decision: 'continue' | 'board') => void;
}

export const DuelVictoryModal: React.FC<DuelVictoryModalProps> = ({
  isOpen,
  winner,
  loser,
  endReason,
  onDecide,
}) => {
  useEffect(() => {
    if (isOpen && winner) {
      soundEngine.playVictory(false);
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.6 },
        colors: [winner.color, '#ffd700', '#00f0ff', '#ffffff'],
      });
    }
  }, [isOpen, winner]);

  if (!isOpen || !winner || !loser) return null;

  const winnerColor = winner.color || '#ffd700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn">
      <div
        className="bg-floor-surface border-2 rounded-3xl max-w-lg w-full p-6 md:p-8 text-center space-y-6 transition-all duration-300 shadow-2xl"
        style={{
          borderColor: winnerColor,
          boxShadow: `0 0 70px ${winnerColor}66`,
        }}
      >
        {/* Icono de Trofeo con color del ganador */}
        <div
          className="w-20 h-20 mx-auto rounded-full border-2 flex items-center justify-center animate-bounce"
          style={{
            backgroundColor: `${winnerColor}20`,
            borderColor: winnerColor,
            boxShadow: `0 0 35px ${winnerColor}88`,
          }}
        >
          <Trophy className="w-10 h-10" style={{ color: winnerColor }} />
        </div>

        {/* Proclamación de Ganador con texto y sombra del color del jugador */}
        <div className="space-y-2">
          <span
            className="text-xs uppercase font-bold tracking-widest digital-font"
            style={{ color: winnerColor }}
          >
            ¡FIN DEL DUELO!
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            ¡VICTORIA DE{' '}
            <span
              style={{
                color: winnerColor,
                textShadow: `0 0 20px ${winnerColor}`,
              }}
            >
              {winner.name}
            </span>!
          </h2>

          {endReason === 'items_exhausted' ? (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-floor-card border border-floor-cyan/40 text-floor-cyan text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              ¡Preguntas agotadas! Vencedor por mayor tiempo restante.
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              {winner.name} conquista el territorio disputado de {loser.name}.
            </p>
          )}
        </div>

        {/* Resumen del Contendiente */}
        <div className="p-3.5 rounded-xl bg-floor-card border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: loser.color }}
            />
            <span className="font-semibold text-slate-200">{loser.name}</span>
          </div>
          <span className="text-floor-red font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> TERRITORIO ABSORBIDO
          </span>
        </div>

        {/* Botones de Decisión Post-Duelo */}
        <div className="space-y-3 pt-2">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            ¿Qué decide hacer el ganador?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onDecide('continue')}
              className="py-3.5 px-4 rounded-xl font-bold text-xs md:text-sm tracking-wider uppercase digital-font text-black hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg"
              style={{
                backgroundColor: winnerColor,
                boxShadow: `0 0 25px ${winnerColor}88`,
              }}
            >
              <Swords className="w-4 h-4" />
              Continuar Retando
            </button>

            <button
              type="button"
              onClick={() => onDecide('board')}
              className="py-3.5 px-4 rounded-xl font-bold text-xs md:text-sm tracking-wider uppercase digital-font bg-floor-card hover:bg-slate-800 border border-slate-700 text-slate-200 hover:border-slate-500 transition-colors flex items-center justify-center gap-2"
            >
              Volver al Tablero
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
