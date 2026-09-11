import React from 'react';
import { CheckCircle2, XCircle, Pause, Play, Volume2, VolumeX, Maximize, Smartphone, Zap } from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';

export const HostControls: React.FC = () => {
  const currentDuel = useGameStore((state) => state.currentDuel);
  const players = useGameStore((state) => state.players);
  const isDevMode = useGameStore((state) => state.isDevMode);
  const forceDuelWinner = useGameStore((state) => state.forceDuelWinner);
  const handleCorrectAnswer = useGameStore((state) => state.handleCorrectAnswer);
  const handlePassAnswer = useGameStore((state) => state.handlePassAnswer);
  const togglePauseDuel = useGameStore((state) => state.togglePauseDuel);
  const isSoundMuted = useGameStore((state) => state.isSoundMuted);
  const isJudgeConnected = useGameStore((state) => state.isJudgeConnected);
  const toggleSound = useGameStore((state) => state.toggleSound);

  const isPaused = currentDuel?.status === 'paused';
  const isFrozen = currentDuel?.isFrozen;
  const isFinished = currentDuel?.status === 'finished';

  const challenger = players.find((p) => p.id === currentDuel?.challengerId);
  const defender = players.find((p) => p.id === currentDuel?.defenderId);

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
    <div className="w-full flex flex-col gap-2">
      {/* Barra de Modo Desarrollador (Si está activo) */}
      {isDevMode && currentDuel && !isFinished && (
        <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-900/95 border border-floor-cyan/50 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.2)]">
          <div className="flex items-center gap-2 text-floor-cyan font-bold text-xs uppercase tracking-wider">
            <Zap className="w-4 h-4 fill-current animate-pulse text-floor-cyan" />
            <span>DEV MODE: Forzar Ganador</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => forceDuelWinner(currentDuel.challengerId)}
              style={{
                backgroundColor: `${challenger?.color || '#00f0ff'}25`,
                borderColor: challenger?.color || '#00f0ff',
                color: challenger?.color || '#00f0ff',
                boxShadow: `0 0 15px ${challenger?.color || '#00f0ff'}40`,
              }}
              className="px-3.5 py-1.5 rounded-xl border-2 font-bold text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              👑 Gana {challenger?.name || 'Retador'}
            </button>
            <button
              type="button"
              onClick={() => forceDuelWinner(currentDuel.defenderId)}
              style={{
                backgroundColor: `${defender?.color || '#ff2a4b'}25`,
                borderColor: defender?.color || '#ff2a4b',
                color: defender?.color || '#ff2a4b',
                boxShadow: `0 0 15px ${defender?.color || '#ff2a4b'}40`,
              }}
              className="px-3.5 py-1.5 rounded-xl border-2 font-bold text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              👑 Gana {defender?.name || 'Defensor'}
            </button>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-floor-surface/90 border border-floor-border rounded-2xl backdrop-blur-md">
        {/* Botones Secundarios (Mando QR, Pausa, Sonido, Fullscreen) */}
        <div className="flex items-center gap-2 order-2 sm:order-1 flex-wrap">
          <button
            type="button"
            onClick={handleOpenQR}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isJudgeConnected
                ? 'bg-floor-card border-floor-green text-floor-green'
                : 'bg-floor-card border-floor-border text-slate-300 hover:text-floor-cyan'
            }`}
            title="Mando Juez Remoto"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isJudgeConnected ? 'Juez Activo' : 'Mando QR'}</span>
          </button>

          <button
            type="button"
            onClick={togglePauseDuel}
            disabled={isFinished}
            className="px-3.5 py-2 rounded-xl bg-floor-card border border-floor-border text-slate-200 font-bold text-xs flex items-center gap-2 hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Pausar / Reanudar (Esc o Q)"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 text-floor-green fill-current" /> Reanudar
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 text-floor-amber" /> Pausa
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-xl bg-floor-card border border-floor-border text-slate-300 hover:text-floor-cyan transition-colors"
            title="Silenciar (M)"
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-floor-card border border-floor-border text-slate-300 hover:text-floor-cyan transition-colors"
            title="Pantalla Completa (F)"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        {/* Botones de Control Principal del Presentador */}
        <div className="flex-1 flex items-center justify-end gap-3 w-full sm:w-auto order-1 sm:order-2">
          {/* Botón Paso */}
          <button
            type="button"
            onClick={handlePassAnswer}
            disabled={isPaused || isFrozen || isFinished}
            className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl font-extrabold text-sm md:text-base tracking-wider uppercase digital-font bg-floor-card hover:bg-slate-800 border-2 border-floor-red/60 text-floor-red hover:border-floor-red transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,42,75,0.2)]"
          >
            <XCircle className="w-5 h-5" />
            PASO <span className="text-[10px] opacity-70 hidden md:inline">[Tecla P]</span>
          </button>

          {/* Botón Acierto */}
          <button
            type="button"
            onClick={handleCorrectAnswer}
            disabled={isPaused || isFrozen || isFinished}
            className="flex-1 sm:flex-initial px-8 py-3.5 rounded-xl font-bold text-sm md:text-base tracking-wider uppercase digital-font bg-gradient-to-r from-floor-green via-emerald-400 to-green-500 text-black hover:scale-105 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(0,255,136,0.5)]"
          >
            <CheckCircle2 className="w-5 h-5" />
            ¡ACIERTO! <span className="text-[10px] opacity-80 hidden md:inline">[Espacio / Enter]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
