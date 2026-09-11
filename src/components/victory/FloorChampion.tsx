import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, RotateCcw, Swords, Grid, BarChart2 } from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import { GameStatsModal } from './GameStatsModal';
import { soundEngine } from '../../utils/soundEngine';

export const FloorChampion: React.FC = () => {
  const players = useGameStore((state) => state.players);
  const tiles = useGameStore((state) => state.tiles);
  const resetToSetup = useGameStore((state) => state.resetToSetup);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const champion = players.find((p) => !p.isEliminated && p.territoryCount > 0) || players[0];
  const champColor = champion?.color || '#ffd700';

  useEffect(() => {
    soundEngine.playVictory(true);
    const duration = 5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: [champColor, '#00f0ff', '#ffd700', '#ffffff'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: [champColor, '#00f0ff', '#ffd700', '#ffffff'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [champColor]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-8 animate-fadeIn">
      {/* Corona y Trofeo Principal */}
      <div className="relative inline-block">
        <div
          className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full p-1 flex items-center justify-center animate-bounce border-2"
          style={{
            borderColor: champColor,
            boxShadow: `0 0 90px ${champColor}99`,
            backgroundColor: `${champColor}25`,
          }}
        >
          <div className="w-full h-full rounded-full bg-floor-surface flex items-center justify-center">
            <Trophy className="w-16 h-16 md:w-20 md:h-20" style={{ color: champColor }} />
          </div>
        </div>
        <Crown
          className="w-12 h-12 absolute -top-4 left-1/2 -translate-x-1/2 drop-shadow-[0_0_20px_rgba(255,215,0,1)]"
          style={{ color: champColor }}
        />
      </div>

      {/* Título de Campeón con Color del Ganador */}
      <div className="space-y-3">
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-floor-card border text-xs font-bold uppercase tracking-widest"
          style={{
            borderColor: champColor,
            color: champColor,
          }}
        >
          The Floor Champion
        </span>
        <h1 className="text-4xl md:text-6xl font-bold text-white digital-font">
          ¡<span style={{ color: champColor, textShadow: `0 0 25px ${champColor}` }}>{champion?.name}</span> HA CONQUISTADO THE FLOOR!
        </h1>
        <p className="text-slate-300 max-w-lg mx-auto text-sm md:text-base">
          Ha derrotado a todos sus oponentes y se proclama vencedor absoluto dominando el 100% del territorio.
        </p>
      </div>

      {/* Estadísticas Finales Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
        <div className="p-4 rounded-2xl bg-floor-surface/90 border border-floor-border text-center space-y-1">
          <Grid className="w-5 h-5 text-floor-cyan mx-auto" />
          <div className="text-2xl font-bold text-white digital-font">{tiles.length}</div>
          <div className="text-xs text-slate-400">Casillas Dominadas (100%)</div>
        </div>

        <div className="p-4 rounded-2xl bg-floor-surface/90 border border-floor-border text-center space-y-1">
          <Swords className="w-5 h-5 mx-auto" style={{ color: champColor }} />
          <div className="text-2xl font-bold text-white digital-font">{champion?.duelsWon || 0}</div>
          <div className="text-xs text-slate-400">Duelos Ganados</div>
        </div>

        <div className="p-4 rounded-2xl bg-floor-surface/90 border border-floor-border text-center space-y-1 col-span-2 sm:col-span-1">
          <Trophy className="w-5 h-5 text-floor-amber mx-auto" />
          <div className="text-2xl font-bold text-white digital-font">1º</div>
          <div className="text-xs text-slate-400">Posición Final</div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setIsStatsModalOpen(true)}
          className="w-full sm:w-auto px-6 py-4 rounded-2xl font-bold text-sm uppercase digital-font tracking-wider bg-floor-card hover:bg-slate-800 border-2 border-floor-cyan/60 text-floor-cyan hover:border-floor-cyan hover:scale-105 transition-all inline-flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer"
        >
          <BarChart2 className="w-5 h-5" />
          VER ESTADÍSTICAS DETALLADAS
        </button>

        <button
          type="button"
          onClick={resetToSetup}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base uppercase digital-font tracking-wider text-black hover:scale-105 transition-transform inline-flex items-center justify-center gap-2 shadow-xl cursor-pointer"
          style={{
            backgroundColor: champColor,
            boxShadow: `0 0 35px ${champColor}88`,
          }}
        >
          <RotateCcw className="w-5 h-5" />
          NUEVA PARTIDA
        </button>
      </div>

      {/* Modal de Estadísticas Completas */}
      <GameStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
      />
    </div>
  );
};
