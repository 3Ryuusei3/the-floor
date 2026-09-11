import React from 'react';
import { Volume2, VolumeX, Maximize, RotateCcw, Sparkles, Smartphone } from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';

interface BoardHeaderProps {
  onOpenRoulette: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({ onOpenRoulette }) => {
  const players = useGameStore((state) => state.players);
  const activeChallengerId = useGameStore((state) => state.activeChallengerId);
  const isSoundMuted = useGameStore((state) => state.isSoundMuted);
  const isJudgeConnected = useGameStore((state) => state.isJudgeConnected);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const resetToSetup = useGameStore((state) => state.resetToSetup);

  const tiles = useGameStore((state) => state.tiles);
  const activePlayers = players.filter((p) => !p.isEliminated);
  const activeChallenger = players.find((p) => p.id === activeChallengerId);
  const hasUnclaimed = tiles.some((t) => t.playerId === null);
  const isGrandFinal = !hasUnclaimed && activePlayers.length === 2;

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleOpenQR = () => {
    window.dispatchEvent(new CustomEvent('open-judge-qr'));
  };

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-floor-surface/80 border border-floor-border backdrop-blur-md">
      {/* Título & Estado del Juego */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold digital-font tracking-tight text-white">
          THE <span className="neon-text-cyan">FLOOR</span>
        </h1>
        <div className="h-6 w-px bg-slate-700 hidden sm:block" />
        <div className="text-xs text-slate-400">
          Supervivientes:{' '}
          <span className="font-bold text-white text-sm">{activePlayers.length}</span> / {players.length}
        </div>
        {isGrandFinal && (
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-bold text-xs uppercase tracking-wider animate-pulse shadow-[0_0_15px_rgba(255,170,0,0.4)]">
            🔥 LA GRAN FINAL 🔥
          </span>
        )}
      </div>

      {/* Indicador Central de Turno */}
      <div className="flex items-center gap-3">
        {isGrandFinal && activeChallenger ? (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/60 shadow-[0_0_15px_rgba(255,170,0,0.3)]">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: activeChallenger.color,
                boxShadow: `0 0 8px ${activeChallenger.color}`,
              }}
            />
            <span className="text-xs text-amber-300 font-bold">Elige Tema de la Final:</span>
            <span className="font-extrabold text-sm text-white">{activeChallenger.name}</span>
          </div>
        ) : activeChallenger ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-floor-card border border-floor-cyan/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: activeChallenger.color,
                boxShadow: `0 0 8px ${activeChallenger.color}`,
              }}
            />
            <span className="text-xs text-slate-300">Retador Activo:</span>
            <span className="font-extrabold text-sm text-white">{activeChallenger.name}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenRoulette}
            className="px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase digital-font bg-gradient-to-r from-floor-cyan to-teal-400 text-black hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            ¡Randomizer!
          </button>
        )}
      </div>

      {/* Controles de Utilidad (Mando Juez, Sonido, Pantalla Completa, Reiniciar) */}
      <div className="flex items-center gap-2">
        {/* Botón Mando Juez */}
        <button
          type="button"
          onClick={handleOpenQR}
          className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
            isJudgeConnected
              ? 'bg-floor-card border-floor-green text-floor-green shadow-[0_0_10px_rgba(0,255,136,0.3)]'
              : 'bg-floor-card border-floor-border text-slate-300 hover:text-floor-cyan hover:border-floor-cyan'
          }`}
          title="Conectar móvil del juez por QR"
        >
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">{isJudgeConnected ? 'Juez Conectado' : 'Mando Juez (QR)'}</span>
        </button>

        <button
          type="button"
          onClick={toggleSound}
          className="p-2.5 rounded-xl bg-floor-card border border-floor-border text-slate-300 hover:text-floor-cyan transition-colors"
          title={isSoundMuted ? 'Activar sonido' : 'Silenciar'}
        >
          {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="p-2.5 rounded-xl bg-floor-card border border-floor-border text-slate-300 hover:text-floor-cyan transition-colors"
          title="Pantalla Completa"
        >
          <Maximize className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={resetToSetup}
          className="p-2.5 rounded-xl bg-floor-card border border-floor-border text-slate-400 hover:text-floor-red transition-colors"
          title="Reiniciar Partida"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
