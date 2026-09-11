import React from 'react';
import { Player } from '../../types/game';
import { cn } from '../../utils/cn';

interface TimerDisplayProps {
  player: Player;
  timeRemaining: number;
  isActive: number | boolean;
  isChallenger: boolean;
  isPassLocked: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  player,
  timeRemaining,
  isActive,
  isChallenger,
  isPassLocked,
}) => {
  const isDanger = timeRemaining > 0 && timeRemaining <= 5.0;
  const isDead = timeRemaining <= 0;

  const seconds = Math.floor(timeRemaining);
  const decimals = Math.floor((timeRemaining % 1) * 10);
  const formattedTime = `${seconds.toString().padStart(2, '0')}.${decimals}`;

  // Porcentaje restante (base 45 segundos)
  const percentage = Math.min(100, Math.max(0, (timeRemaining / 45) * 100));

  return (
    <div
      className={cn(
        'relative rounded-3xl p-4 md:p-6 border-2 transition-all duration-200 flex flex-col items-center justify-between min-w-[200px] md:min-w-[250px] bg-floor-surface/95 backdrop-blur-md',
        isActive && !isDead &&
          'z-10 shadow-[0_0_35px_rgba(0,240,255,0.45)] border-floor-cyan',
        isActive && isDanger && 'animate-danger-pulse border-floor-red shadow-[0_0_40px_rgba(255,42,75,0.6)]',
        !isActive && 'opacity-70 border-floor-border',
        isDead && 'opacity-30 border-slate-800'
      )}
      style={{
        borderColor: isActive
          ? isDanger
            ? '#ff2a4b'
            : player.color
          : '#232e4d',
        boxShadow: isActive && !isDead
          ? isDanger
            ? '0 0 35px rgba(255,42,75,0.5)'
            : `0 0 35px ${player.color}66`
          : undefined,
      }}
    >
      {/* Etiqueta de Rol */}
      <div className="w-full flex items-center justify-between">
        <span
          className={cn(
            'text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider',
            isChallenger ? 'bg-floor-cyan text-black' : 'bg-floor-gold text-black'
          )}
        >
          {isChallenger ? 'Retador' : 'Defensor'}
        </span>
        {isActive && !isDead && (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-floor-cyan animate-pulse">
            <span className="w-2 h-2 rounded-full bg-floor-cyan inline-block animate-ping" />
            TURNO
          </span>
        )}
      </div>

      {/* Avatar & Nombre */}
      <div className="flex flex-col items-center text-center my-3 space-y-2">
        <div
          className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold text-black transition-transform"
          style={{
            backgroundColor: player.color,
            boxShadow: isActive ? `0 0 25px ${player.color}` : 'none',
          }}
        >
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white truncate max-w-[180px]">
            {player.name}
          </h3>
          <span className="text-xs text-slate-400">
            {player.territoryCount} casillas dominadas
          </span>
        </div>
      </div>

      {/* Reloj Digital Gigante */}
      <div className="w-full space-y-2">
        <div
          className={cn(
            'text-center py-2 px-3 rounded-xl digital-font text-4xl md:text-5xl font-bold tracking-wider transition-colors',
            isDead && 'text-slate-600',
            isDanger && 'text-floor-red neon-text-red',
            !isDanger && !isDead && isActive && 'text-floor-cyan neon-text-cyan',
            !isActive && !isDead && 'text-slate-400'
          )}
        >
          {formattedTime}
        </div>

        {/* Barra de progreso de tiempo */}
        <div className="w-full h-2 rounded-full bg-floor-border overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-100',
              isDanger
                ? 'bg-floor-red shadow-[0_0_10px_#ff2a4b]'
                : isChallenger
                ? 'bg-floor-cyan'
                : 'bg-floor-gold'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Indicador de Penalización de Bloqueo ÚNICAMENTE al PASAR */}
      {isPassLocked && isActive && (
        <div className="absolute inset-0 rounded-3xl bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-30 animate-pulse border-2 border-floor-red">
          <span className="text-3xl mb-1">⏱️</span>
          <span className="text-sm font-bold text-floor-red uppercase tracking-wider digital-font">
            ¡PASO! (3s de Bloqueo)
          </span>
          <span className="text-[11px] text-slate-300">El reloj sigue corriendo</span>
        </div>
      )}
    </div>
  );
};
