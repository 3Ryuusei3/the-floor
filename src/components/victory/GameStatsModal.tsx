import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Crown,
  Swords,
  CheckCircle2,
  Clock,
  RotateCcw,
  X,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import { BUILTIN_CATEGORIES } from '../../data/categoriesRegistry';

interface GameStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameStatsModal: React.FC<GameStatsModalProps> = ({ isOpen, onClose }) => {
  const players = useGameStore((state) => state.players);
  const stats = useGameStore((state) => state.stats);
  const resetToSetup = useGameStore((state) => state.resetToSetup);

  if (!isOpen) return null;

  // Clasificación final de jugadores
  // 1º = Ganador activo (territorio = total casillas)
  // 2º = Último eliminado (subcampeón)
  // 3º... = Del penúltimo eliminado al primero eliminado
  const champion = players.find((p) => !p.isEliminated && p.territoryCount > 0) || players[0];
  const eliminatedOrderReversed = [...stats.eliminationOrder].reverse();
  const rankedPlayerIds = [
    champion.id,
    ...eliminatedOrderReversed.filter((id) => id !== champion.id),
    ...players.map((p) => p.id).filter((id) => id !== champion.id && !stats.eliminationOrder.includes(id)),
  ];

  const rankedPlayers = rankedPlayerIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean);

  // Jugador con más victorias
  const topWinner = [...players].sort((a, b) => b.duelsWon - a.duelsWon)[0];

  // Jugador con más aciertos
  let mostAccuratePlayer = players[0];
  let maxCorrect = 0;
  players.forEach((p) => {
    const pStat = stats.playerStats[p.id];
    if (pStat && pStat.correctAnswers > maxCorrect) {
      maxCorrect = pStat.correctAnswers;
      mostAccuratePlayer = p;
    }
  });

  // Duelo más rápido (con más tiempo restante para el ganador)
  const fastestDuel = [...stats.duelRecords].sort((a, b) => {
    const aTime = Math.max(a.challengerTimeLeft, a.defenderTimeLeft);
    const bTime = Math.max(b.challengerTimeLeft, b.defenderTimeLeft);
    return bTime - aTime;
  })[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-floor-surface border-2 border-floor-cyan/60 rounded-3xl p-5 sm:p-8 text-white shadow-[0_0_80px_rgba(0,240,255,0.25)] flex flex-col justify-between overflow-hidden my-auto"
        >
          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center space-y-2 mb-6 shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-floor-card border border-floor-cyan/40 text-floor-cyan text-xs font-bold uppercase tracking-widest">
              <TrendingUp className="w-3.5 h-3.5" /> ESTADÍSTICAS OFICIALES
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold digital-font text-white">
              INFORME COMPLETO DE LA PARTIDA
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Resumen de duelos, efectividad y podio de concursantes
            </p>
          </div>

          {/* Contenido con Scroll */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-6 max-h-[60vh]">
            {/* Destacados Rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-floor-card border border-floor-border text-center space-y-1">
                <Swords className="w-5 h-5 text-floor-cyan mx-auto" />
                <div className="text-xl font-bold digital-font text-white">{stats.totalDuels}</div>
                <div className="text-[11px] text-slate-400">Duelos Totales</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-floor-card border border-floor-border text-center space-y-1">
                <Crown className="w-5 h-5 text-floor-gold mx-auto" />
                <div className="text-xl font-bold digital-font text-white">{topWinner?.name || '-'}</div>
                <div className="text-[11px] text-slate-400">Más Victorias ({topWinner?.duelsWon || 0})</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-floor-card border border-floor-border text-center space-y-1">
                <CheckCircle2 className="w-5 h-5 text-floor-green mx-auto" />
                <div className="text-xl font-bold digital-font text-white">{mostAccuratePlayer?.name || '-'}</div>
                <div className="text-[11px] text-slate-400">Más Aciertos ({maxCorrect})</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-floor-card border border-floor-border text-center space-y-1">
                <Clock className="w-5 h-5 text-floor-amber mx-auto" />
                <div className="text-xl font-bold digital-font text-white">
                  {fastestDuel ? `${Math.max(fastestDuel.challengerTimeLeft, fastestDuel.defenderTimeLeft).toFixed(1)}s` : '-'}
                </div>
                <div className="text-[11px] text-slate-400">Victoria más Rápida</div>
              </div>
            </div>

            {/* Clasificación General / Podio */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-floor-gold" /> Clasificación Final
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-floor-border bg-floor-card/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-floor-border">
                    <tr>
                      <th className="py-3 px-3">Puesto</th>
                      <th className="py-3 px-3">Concursante</th>
                      <th className="py-3 px-3 text-center">Duelos (G/P)</th>
                      <th className="py-3 px-3 text-center">% Victorias</th>
                      <th className="py-3 px-3 text-center">Aciertos</th>
                      <th className="py-3 px-3 text-center">Pasos</th>
                      <th className="py-3 px-3 text-center">Casillas Pico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {rankedPlayers.map((player, idx) => {
                      if (!player) return null;
                      const pStat = stats.playerStats[player.id] || {
                        duelsPlayed: player.duelsWon,
                        duelsWon: player.duelsWon,
                        duelsLost: player.isEliminated ? 1 : 0,
                        correctAnswers: 0,
                        passAnswers: 0,
                        peakTerritory: player.territoryCount,
                      };
                      const winRate =
                        pStat.duelsPlayed > 0
                          ? Math.round((pStat.duelsWon / pStat.duelsPlayed) * 100)
                          : 0;

                      return (
                        <tr key={player.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-bold">
                            {idx === 0 && <span className="text-floor-gold flex items-center gap-1">🥇 1º</span>}
                            {idx === 1 && <span className="text-slate-300 flex items-center gap-1">🥈 2º</span>}
                            {idx === 2 && <span className="text-amber-600 flex items-center gap-1">🥉 3º</span>}
                            {idx > 2 && <span className="text-slate-500 pl-1">{idx + 1}º</span>}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: player.color }}
                              />
                              <span className="font-bold text-white">{player.name}</span>
                              {idx === 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-floor-gold/20 text-floor-gold font-bold border border-floor-gold/40">
                                  CAMPEÓN
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="text-floor-green font-bold">{pStat.duelsWon}</span> /{' '}
                            <span className="text-floor-red font-bold">{pStat.duelsLost}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-300">
                            {winRate}%
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-floor-green">
                            {pStat.correctAnswers}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-floor-red">
                            {pStat.passAnswers}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-floor-cyan">
                            {pStat.peakTerritory}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historial Cronológico de Duelos */}
            {stats.duelRecords.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-floor-cyan" /> Historial de Enfrentamientos
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-floor-border bg-floor-card/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-floor-border">
                      <tr>
                        <th className="py-3 px-3 text-center">#</th>
                        <th className="py-3 px-3">Tema</th>
                        <th className="py-3 px-3 text-center">Enfrentamiento</th>
                        <th className="py-3 px-3 text-center">Vencedor</th>
                        <th className="py-3 px-3 text-right">Tiempo Restante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {stats.duelRecords.map((record, i) => {
                        const challenger = players.find((p) => p.id === record.challengerId);
                        const defender = players.find((p) => p.id === record.defenderId);
                        const winner = players.find((p) => p.id === record.winnerId);
                        const catMeta = BUILTIN_CATEGORIES.find((c) => c.slug === record.categorySlug);
                        const remainingTime = Math.max(record.challengerTimeLeft, record.defenderTimeLeft);

                        return (
                          <tr key={record.id || i} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">
                              #{record.duelNumber}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{catMeta?.icon || '🏷️'}</span>
                                <span className="font-bold text-white whitespace-nowrap">{record.categoryName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex items-center gap-2">
                                <span className="font-bold" style={{ color: challenger?.color || '#00f0ff' }}>
                                  {challenger?.name}
                                </span>
                                <span className="text-slate-500 font-bold text-[10px]">VS</span>
                                <span className="font-bold" style={{ color: defender?.color || '#ff2a4b' }}>
                                  {defender?.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border"
                                style={{
                                  borderColor: `${winner?.color || '#ffd700'}66`,
                                  backgroundColor: `${winner?.color || '#ffd700'}18`,
                                  color: winner?.color || '#ffd700',
                                }}
                              >
                                👑 {winner?.name}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-400 text-[11px]">
                              {remainingTime.toFixed(1)}s
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer de Acciones */}
          <div className="pt-4 border-t border-floor-border flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              Volver al Podio
            </button>

            <button
              type="button"
              onClick={() => resetToSetup()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-floor-cyan to-teal-400 text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              JUGAR NUEVA PARTIDA
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
