import React from 'react';
import { Play, Sparkles, Trophy } from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import { BoardSizeSelector } from './BoardSizeSelector';
import { PlayerListManager } from './PlayerListManager';

export const GameSetup: React.FC = () => {
  const settings = useGameStore((state) => state.settings);
  const setSettings = useGameStore((state) => state.setSettings);
  const players = useGameStore((state) => state.players);
  const addPlayer = useGameStore((state) => state.addPlayer);
  const removePlayer = useGameStore((state) => state.removePlayer);
  const updatePlayer = useGameStore((state) => state.updatePlayer);
  const initGame = useGameStore((state) => state.initGame);

  const canStart = players.length >= 2;

  const handleStartGame = () => {
    if (!canStart) return;
    initGame();
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header Estilo Concurso de Televisión */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-floor-surface border border-floor-cyan/40 text-floor-cyan text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          <Sparkles className="w-3.5 h-3.5" /> Plató de Televisión Oficial
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white digital-font">
          THE <span className="neon-text-cyan">FLOOR</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
          Conquista el suelo casilla a casilla en duelos a contrarreloj de 45 segundos.
        </p>
      </div>

      {/* Contenedor Principal de Configuración */}
      <div className="bg-floor-surface/90 border border-floor-border rounded-2xl p-6 md:p-8 space-y-8 shadow-2xl backdrop-blur-md">
        {/* Selector de Tamaño de Tablero (20, 24 y 30 casillas) */}
        <BoardSizeSelector
          currentRows={settings.gridRows}
          currentCols={settings.gridCols}
          onSelectDimensions={(rows, cols) => setSettings({ gridRows: rows, gridCols: cols })}
        />

        {/* Gestor de Concursantes */}
        <PlayerListManager
          players={players}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
          onUpdatePlayer={updatePlayer}
        />

        {/* Botón de Iniciar Partida */}
        <div className="pt-4 border-t border-floor-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-floor-gold" />
            <span>Mínimo 2 concursantes para comenzar</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {useGameStore.getState().isDevMode && (
              <button
                type="button"
                onClick={() => useGameStore.getState().initDevQuickGame()}
                className="w-full sm:w-auto px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-800 border border-amber-500/60 text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,165,0,0.3)] cursor-pointer"
              >
                ⚡ Partida 1 y 2
              </button>
            )}

            <button
              type="button"
              onClick={handleStartGame}
              disabled={!canStart}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-extrabold text-base tracking-wider uppercase digital-font flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-floor-cyan via-teal-400 to-cyan-500 text-black hover:scale-105 shadow-[0_0_25px_rgba(0,240,255,0.5)] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              ¡COMENZAR THE FLOOR!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
