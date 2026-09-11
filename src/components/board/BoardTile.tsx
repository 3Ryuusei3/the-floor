import React from 'react';
import { Player } from '../../types/game';
import { BUILTIN_CATEGORIES } from '../../data/categoriesRegistry';
import { cn } from '../../utils/cn';

interface BoardTileProps {
  index: number;
  row: number;
  col: number;
  player: Player | null; // null si es casilla neutral
  categorySlug: string;
  isPlayed: boolean;
  isChallenger: boolean;
  isSelectedTile: boolean;
  isAttackable: boolean; // Si es una casilla adyacente que el retador puede atacar
  isRouletteHighlight: boolean;
  isConquering: boolean;
  onClick: () => void;
}

export const BoardTile: React.FC<BoardTileProps> = ({
  player,
  categorySlug,
  isChallenger,
  isSelectedTile,
  isAttackable,
  isRouletteHighlight,
  isConquering,
  onClick,
}) => {
  const categoryMeta = BUILTIN_CATEGORIES.find((c) => c.slug === categorySlug) || {
    slug: categorySlug,
    name: categorySlug.replace(/_/g, ' ').toUpperCase(),
    totalItems: 30,
  };

  const isNeutral = player === null;
  const isRival = player !== null && !isChallenger;
  const categoryName = categoryMeta.name;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isAttackable && !isChallenger && !isSelectedTile}
      className={cn(
        // Formato rectangular panorámico homogéneo y equilibrado
        'relative group aspect-[16/11] rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center border-[3px] transition-all duration-200 overflow-hidden select-none text-center shadow-lg',
        isRouletteHighlight &&
          'scale-105 z-40 ring-4 ring-white border-white bg-white/40 shadow-[0_0_40px_#ffffff]',
        isChallenger && !isRouletteHighlight &&
          'ring-4 ring-floor-cyan scale-[1.03] z-20 shadow-[0_0_30px_rgba(0,240,255,0.9)] border-white animate-pulse-glow bg-[#00f0ff]/25',
        isSelectedTile && !isChallenger && !isRouletteHighlight &&
          'ring-4 ring-floor-cyan scale-[1.03] z-20 shadow-[0_0_30px_rgba(0,240,255,0.9)] border-floor-cyan bg-[#00f0ff]/25',
        isAttackable && isNeutral && !isRouletteHighlight &&
          'cursor-pointer hover:scale-105 z-10 border-floor-gold ring-2 ring-floor-gold shadow-[0_0_25px_rgba(255,215,0,0.85)] animate-pulse bg-floor-gold/20',
        isAttackable && isRival && !isRouletteHighlight &&
          'cursor-pointer hover:scale-105 z-10 border-floor-red ring-2 ring-floor-red shadow-[0_0_25px_rgba(255,42,75,0.85)] animate-pulse bg-floor-red/20',
        !isChallenger && !isSelectedTile && !isAttackable && !isRouletteHighlight && (
          player
            ? ''
            : 'border-[#3b4c7a] bg-gradient-to-b from-[#1e294b] to-[#121930] hover:border-[#526aab]'
        ),
        isConquering && 'animate-conquer z-30'
      )}
      style={{
        backgroundColor: player ? `${player.color}35` : undefined,
        borderColor: isRouletteHighlight
          ? '#ffffff'
          : isChallenger || isSelectedTile
          ? '#00f0ff'
          : isAttackable && isNeutral
          ? '#ffd700'
          : isAttackable && isRival
          ? '#ff2a4b'
          : player
          ? player.color
          : undefined,
      }}
    >
      {/* Brillo ambiental de plató */}
      <div
        className="absolute inset-0 opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none"
        style={{
          background: player
            ? `radial-gradient(circle at center, ${player.color} 0%, transparent 80%)`
            : 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Centro Total: Nombre de la Categoría con peso bold y tamaño superior */}
      <div className="flex-1 flex items-center justify-center text-center z-10 w-full px-1.5">
        <h3 className="text-[15px] sm:text-base md:text-[17px] lg:text-lg font-bold text-white uppercase leading-tight tracking-tight break-normal whitespace-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] max-w-full">
          {categoryName}
        </h3>
      </div>

      {/* Etiqueta del conquistador en la esquina inferior con POSICIÓN ABSOLUTA */}
      {player && (
        <div className="absolute bottom-1.5 right-1.5 z-20 pointer-events-none inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/75 border border-white/20 shadow-md backdrop-blur-sm">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: player.color,
              boxShadow: `0 0 6px ${player.color}`,
            }}
          />
          <span className="text-[9px] sm:text-[10px] font-bold text-white truncate max-w-[90px] drop-shadow">
            {player.name}
          </span>
        </div>
      )}
    </button>
  );
};
