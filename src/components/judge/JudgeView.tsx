import React, { useState, useEffect } from 'react';
import { usePeerJudge } from '../../hooks/usePeerConnection';
import {
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  Wifi,
  WifiOff,
  Swords,
  HelpCircle,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Trophy,
  Undo2,
  Dices,
  UserCog,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { BUILTIN_CATEGORIES } from '../../data/categoriesRegistry';

interface JudgeViewProps {
  roomId: string;
}

export const JudgeView: React.FC<JudgeViewProps> = ({ roomId }) => {
  const { isConnected, connectionType, syncState, syncReceivedAt, sendAction } = usePeerJudge(roomId);

  const currentDuel = syncState?.currentDuel;
  const challenger = syncState?.challenger;
  const defender = syncState?.defender;
  const canUndo = syncState?.canUndo || false;
  const phase = syncState?.phase;

  // Datos del Tablero y Modales Sincronizados
  const tiles = syncState?.tiles || [];
  const players = syncState?.players || [];
  const activeChallengerId = syncState?.activeChallengerId;
  const attackableIndices = syncState?.attackableTileIndices || [];
  const gridCols = syncState?.gridCols || 6;
  const activeRoulette = syncState?.activeRoulette;
  const pendingMergedTopicSelection = syncState?.pendingMergedTopicSelection;
  const pendingGrandFinalTopicChoice = syncState?.pendingGrandFinalTopicChoice;
  const canUndoBoard = syncState?.canUndoBoard || false;
  const undoBoardLabel = syncState?.undoBoardLabel || null;

  const [isRoulettePickerOpen, setIsRoulettePickerOpen] = useState(false);

  // Concursantes que el juez puede imponer manualmente en la ruleta abierta
  const rouletteEligiblePlayers = activeRoulette?.isOpen
    ? players.filter((p) => {
        if (p.isEliminated) return false;
        if (activeRoulette.type === 'defender') return p.id !== activeChallengerId;
        if (activeRoulette.type === 'grand_final_opponent')
          return p.id !== activeRoulette.grandFinalData?.activeChooserId;
        return true;
      })
    : [];

  const boardChallenger = players.find((p) => p.id === activeChallengerId) || null;
  const attackableTiles = tiles.filter((t) => attackableIndices.includes(t.index));
  const activePlayersCount = players.filter((p) => !p.isEliminated).length;

  const mergedWinner = pendingMergedTopicSelection
    ? players.find((p) => p.id === pendingMergedTopicSelection.winnerId) || null
    : null;

  const finalChooser = pendingGrandFinalTopicChoice
    ? players.find((p) => p.id === pendingGrandFinalTopicChoice.activeChooserId) || null
    : null;
  const finalOpponent = pendingGrandFinalTopicChoice
    ? players.find((p) => p.id === pendingGrandFinalTopicChoice.opponentId) || null
    : null;

  const championPlayer =
    players.find((p) => p.territoryCount === tiles.length) ||
    players.find((p) => !p.isEliminated) ||
    null;

  const isIntro = currentDuel?.status === 'intro';
  const isCountdown = currentDuel?.status === 'countdown';
  const isRunning = currentDuel?.status === 'in_progress';
  const isPaused = currentDuel?.status === 'paused';
  const isFinished = currentDuel?.status === 'finished';
  const isFrozen = currentDuel?.isFrozen;

  const currentItem = currentDuel?.currentItem || null;
  const nextItemImage = currentDuel?.nextItem?.image;

  // Precargar la imagen del siguiente ítem para que aparezca al instante
  useEffect(() => {
    if (!nextItemImage) return;
    const img = new Image();
    img.src = nextItemImage;
  }, [nextItemImage]);

  // Reloj interpolado localmente: la pantalla solo re-sincroniza cada segundo
  const isClockRunning = isRunning && !isFrozen;
  const [clockNow, setClockNow] = useState(() => performance.now());
  useEffect(() => {
    if (!isClockRunning) return;
    let frame = 0;
    const loop = () => {
      setClockNow(performance.now());
      frame = window.setTimeout(loop, 100);
    };
    loop();
    return () => clearTimeout(frame);
  }, [isClockRunning]);

  const isChallengerActive = currentDuel?.activePlayerId === currentDuel?.challengerId;
  const elapsedSinceSync = isClockRunning ? Math.max(0, (clockNow - syncReceivedAt) / 1000) : 0;
  const rawChallengerTime = currentDuel?.challengerTime ?? 45;
  const rawDefenderTime = currentDuel?.defenderTime ?? 45;
  const challengerTime = Math.max(0, rawChallengerTime - (isChallengerActive ? elapsedSinceSync : 0));
  const defenderTime = Math.max(0, rawDefenderTime - (!isChallengerActive ? elapsedSinceSync : 0));

  const phaseLabel =
    phase === 'setup'
      ? 'Configuración inicial de partida'
      : phase === 'board'
      ? 'En el Tablero de juego'
      : phase === 'victory'
      ? 'Partida terminada (Campeón)'
      : 'Sincronizado con Plató';

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-floor-bg text-slate-100 p-2 sm:p-3 flex flex-col justify-between max-w-lg mx-auto font-sans select-none overflow-hidden">
      {/* Barra Superior Compacta: Estado de Conexión y Sala */}
      <header className="px-3 py-1.5 rounded-xl bg-floor-surface border border-floor-border flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full',
              isConnected ? 'bg-floor-green shadow-[0_0_8px_#00ff88]' : 'bg-floor-red animate-pulse'
            )}
          />
          <span className="text-[11px] font-bold text-slate-200">
            {isConnected
              ? connectionType === 'local'
                ? 'MANDO (LOCAL)'
                : 'MANDO (WIFI)'
              : 'CONECTANDO...'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
          {isConnected ? <Wifi className="w-3 h-3 text-floor-cyan" /> : <WifiOff className="w-3 h-3 text-floor-red" />}
          <span>SALA: {roomId}</span>
        </div>
      </header>

      {/* Banner de Reconexión si se pierde la señal */}
      {!isConnected && (
        <div className="my-1.5 p-2 rounded-xl bg-floor-red/20 border border-floor-red flex items-center justify-between text-[11px] text-floor-red font-bold animate-pulse shadow-[0_0_15px_rgba(255,42,75,0.3)] flex-shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Reconectando a sala {roomId}...</span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-2 py-0.5 rounded-md bg-floor-surface border border-floor-red/50 hover:bg-slate-800 text-[10px] text-white cursor-pointer ml-2 flex-shrink-0"
          >
            Reconectar
          </button>
        </div>
      )}

      {/* Deshacer la última decisión del tablero (tema, ruleta, fusión, decisión post-duelo...) */}
      {canUndoBoard && (
        <button
          type="button"
          onClick={() => {
            setIsRoulettePickerOpen(false);
            sendAction({ type: 'ACTION_UNDO_BOARD' });
          }}
          className="mt-1.5 w-full py-2 px-3 rounded-xl bg-floor-card border border-floor-amber/60 text-floor-amber text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer flex-shrink-0 touch-manipulation"
        >
          <Undo2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            DESHACER{undoBoardLabel ? `: ${undoBoardLabel}` : ' ÚLTIMA DECISIÓN'}
          </span>
        </button>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col justify-center min-h-0 overflow-hidden my-1">
        {!currentDuel ? (
          /* Estado fuera de duelo (con scroll si es necesario en tableros grandes) */
          <div className="overflow-y-auto max-h-full py-1">
            {phase === 'board' ? (
              <div className="space-y-3">
                {/* Tarjeta de Control del Tablero */}
                <div className="p-4 rounded-3xl bg-floor-surface border border-floor-border space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-floor-border pb-2.5">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-floor-cyan" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        CONTROL DEL TABLERO
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-floor-card text-slate-300 border border-slate-700">
                      {activePlayersCount} Concursantes Vivos
                    </span>
                  </div>

                  {activeRoulette?.isOpen ? (
                    /* Ruleta Activa en Directo */
                    <div className="text-center py-4 space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-floor-cyan tracking-wider block">
                          {activeRoulette.type === 'grand_final_opponent'
                            ? '🔥 RULETA DE LA GRAN FINAL (RIVAL) 🔥'
                            : activeRoulette.type === 'challenger'
                            ? '★ RULETA DE RETADOR ★'
                            : '★ RULETA DE DEFENSOR (CASILLA NEUTRAL) ★'}
                        </span>
                        <h3 className="text-2xl font-bold text-white digital-font">
                          {activeRoulette.winner ? '¡CONCURSANTE ELEGIDO!' : '¡EL RANDOMIZER ESTÁ ELIGIENDO!'}
                        </h3>
                        <p className="text-xs text-slate-300">
                          {activeRoulette.winner
                            ? 'Pulsa para confirmar y avanzar en el plató.'
                            : `Sorteando entre ${activeRoulette.candidates.length} concursantes...`}
                        </p>
                      </div>

                      {activeRoulette.winner ? (
                        /* Concursante Ganador */
                        <div className="space-y-3">
                          <div
                            className="p-4 rounded-2xl border-2 flex items-center justify-between"
                            style={{
                              borderColor: activeRoulette.winner.color || '#00f0ff',
                              backgroundColor: `${activeRoulette.winner.color || '#00f0ff'}20`,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-black text-lg shadow-md"
                                style={{ backgroundColor: activeRoulette.winner.color || '#00f0ff' }}
                              >
                                {activeRoulette.winner.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="text-left">
                                <span className="text-[10px] uppercase font-bold text-floor-cyan block">
                                  {activeRoulette.type === 'grand_final_opponent'
                                    ? 'RIVAL DE LA GRAN FINAL'
                                    : 'ELEGIDO POR EL RANDOMIZER'}
                                </span>
                                <span className="font-extrabold text-white text-lg">
                                  {activeRoulette.winner.name}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-300">
                              {activeRoulette.winner.territoryCount > 0
                                ? `${activeRoulette.winner.territoryCount} casillas`
                                : 'Aspirante'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => sendAction({ type: 'ACTION_CONFIRM_ROULETTE' })}
                            className="w-full py-4 px-4 rounded-2xl font-extrabold text-sm uppercase digital-font tracking-wider text-black active:scale-95 hover:scale-102 transition-all shadow-[0_0_30px_rgba(0,240,255,0.6)] flex items-center justify-center gap-2.5 cursor-pointer"
                            style={{ backgroundColor: activeRoulette.winner.color || '#00f0ff' }}
                          >
                            <Swords className="w-5 h-5 fill-current" />
                            <span>
                              {activeRoulette.type === 'grand_final_opponent'
                                ? `¡IR A LA GRAN FINAL CON ${activeRoulette.winner.name.toUpperCase()}!`
                                : activeRoulette.type === 'challenger'
                                ? `¡CONTINUAR CON ${activeRoulette.winner.name.toUpperCase()}!`
                                : `¡INICIAR DUELO CON ${activeRoulette.winner.name.toUpperCase()}!`}
                            </span>
                          </button>

                          {/* Modificar la decisión de la ruleta */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsRoulettePickerOpen(false);
                                sendAction({ type: 'ACTION_RESPIN_ROULETTE' });
                              }}
                              className="py-2.5 rounded-xl bg-floor-card border border-floor-border text-[11px] font-bold text-slate-200 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              <Dices className="w-3.5 h-3.5 text-floor-cyan" />
                              Volver a girar
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsRoulettePickerOpen((v) => !v)}
                              className={cn(
                                'py-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer',
                                isRoulettePickerOpen
                                  ? 'bg-floor-cyan/15 border-floor-cyan text-floor-cyan'
                                  : 'bg-floor-card border-floor-border text-slate-200'
                              )}
                            >
                              <UserCog className="w-3.5 h-3.5 text-floor-cyan" />
                              Elegir otro
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Animación de Sorteo */
                        <div className="py-6 space-y-3">
                          <div className="w-12 h-12 rounded-full border-4 border-floor-cyan border-t-transparent animate-spin mx-auto" />
                          <span className="text-xs font-bold text-floor-cyan block animate-pulse">
                            Sorteando concursante en el plató...
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsRoulettePickerOpen((v) => !v)}
                            className="mx-auto px-3 py-2 rounded-xl bg-floor-card border border-floor-border text-[11px] font-bold text-slate-200 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <UserCog className="w-3.5 h-3.5 text-floor-cyan" />
                            Elegir concursante a mano
                          </button>
                        </div>
                      )}

                      {/* Selector manual de concursante para la ruleta */}
                      {isRoulettePickerOpen && (
                        <div className="space-y-1.5 text-left">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Selecciona el concursante correcto:
                          </span>
                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                            {rouletteEligiblePlayers.map((p) => {
                              const isCurrent = activeRoulette.winner?.id === p.id;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setIsRoulettePickerOpen(false);
                                    sendAction({
                                      type: 'ACTION_SET_ROULETTE_WINNER',
                                      payload: { playerId: p.id },
                                    });
                                  }}
                                  className={cn(
                                    'p-2 rounded-xl border-2 bg-floor-card flex items-center gap-2 active:scale-95 cursor-pointer',
                                    isCurrent && 'opacity-50'
                                  )}
                                  style={{ borderColor: p.color || '#334155' }}
                                >
                                  <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-black text-xs flex-shrink-0"
                                    style={{ backgroundColor: p.color || '#00f0ff' }}
                                  >
                                    {p.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="truncate">
                                    <span className="font-bold text-xs text-white block truncate">{p.name}</span>
                                    <span className="text-[9px] text-slate-400">
                                      {p.territoryCount > 0 ? `${p.territoryCount} casillas` : 'Aspirante'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : pendingMergedTopicSelection ? (
                    /* Modal de Fusión de Territorios */
                    <div className="space-y-3 py-2">
                      <div className="text-center space-y-1">
                        <span className="text-[10px] uppercase font-bold text-floor-gold tracking-wider block">
                          ★ FUSIÓN DE TERRITORIOS ★
                        </span>
                        <h3 className="text-xl font-bold text-white">
                          Elige la Categoría Final
                        </h3>
                        <p className="text-xs text-slate-300">
                          {mergedWinner ? `${mergedWinner.name} ha ganado un nuevo territorio.` : 'Selecciona categoría:'}
                        </p>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {pendingMergedTopicSelection.availableCategorySlugs.map((slug) => {
                          const cat = BUILTIN_CATEGORIES.find((c) => c.slug === slug) || {
                            name: slug.replace(/_/g, ' '),
                            icon: '🏷️',
                          };
                          return (
                            <button
                              key={slug}
                              type="button"
                              onClick={() =>
                                sendAction({
                                  type: 'ACTION_APPLY_MERGED_TOPIC',
                                  payload: { categorySlug: slug },
                                })
                              }
                              className="w-full p-3 rounded-2xl bg-floor-card hover:bg-slate-800 border-2 border-floor-border hover:border-floor-gold transition-all text-left flex items-center justify-between cursor-pointer group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{cat.icon}</span>
                                <div>
                                  <span className="font-bold text-white text-sm group-hover:text-floor-gold transition-colors block">
                                    {cat.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Categoría para todo el nuevo territorio fusionado
                                  </span>
                                </div>
                              </div>
                              <Sparkles className="w-4 h-4 text-floor-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : pendingGrandFinalTopicChoice ? (
                    /* Modal de Selección para la Gran Final */
                    <div className="space-y-3 py-2">
                      <div className="text-center space-y-1">
                        <span className="text-[10px] uppercase font-extrabold text-floor-gold tracking-wider block">
                          👑 LA GRAN FINAL DEFINITIVA 👑
                        </span>
                        <h3 className="text-xl font-bold text-white">
                          Elección de Categoría
                        </h3>
                        <p className="text-xs text-slate-300">
                          {finalChooser ? `${finalChooser.name} (mayor territorio)` : 'El finalista'} debe elegir
                          el tema contra {finalOpponent?.name || 'su oponente'}:
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {pendingGrandFinalTopicChoice.topics.map((topic) => {
                          const cat = BUILTIN_CATEGORIES.find((c) => c.slug === topic.slug) || {
                            name: topic.name || topic.slug,
                            icon: '🏷️',
                          };
                          const owner = players.find((p) => p.id === topic.ownerPlayerId);
                          return (
                            <button
                              key={topic.tileIndex}
                              type="button"
                              onClick={() =>
                                sendAction({
                                  type: 'ACTION_SELECT_GRAND_FINAL_TOPIC',
                                  payload: { categorySlug: topic.slug, tileIndex: topic.tileIndex },
                                })
                              }
                              className="p-3.5 rounded-2xl bg-floor-card hover:bg-slate-800 border-2 transition-all text-center flex flex-col items-center justify-between gap-2 cursor-pointer group hover:scale-102"
                              style={{ borderColor: owner?.color || '#ffd700' }}
                            >
                              <span className="text-3xl">{cat.icon}</span>
                              <div className="w-full">
                                <span className="font-extrabold text-sm text-white block group-hover:text-floor-gold">
                                  {cat.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-1">
                                  Tema de {owner?.name || 'Oponente'}
                                </span>
                              </div>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-floor-gold text-black">
                                ¡ELEGIR PARA FINAL!
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Controles normales del Tablero (Elegir Casilla o Ruleta) */
                    <div className="space-y-3">
                      {/* Estado actual del retador */}
                      {boardChallenger ? (
                        <div
                          className="p-3 rounded-2xl border flex items-center justify-between"
                          style={{
                            borderColor: boardChallenger.color || '#00f0ff',
                            backgroundColor: `${boardChallenger.color || '#00f0ff'}15`,
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black text-xs shadow"
                              style={{ backgroundColor: boardChallenger.color || '#00f0ff' }}
                            >
                              {boardChallenger.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-floor-cyan block">
                                RETADOR EN TURNO
                              </span>
                              <span className="font-bold text-white text-sm">
                                {boardChallenger.name}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-mono text-slate-300">
                            {boardChallenger.territoryCount} casillas
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-floor-card border border-floor-border text-center space-y-2">
                          <span className="text-xs text-slate-300 block">
                            No hay retador activo en el tablero.
                          </span>
                          <button
                            type="button"
                            onClick={() => sendAction({ type: 'ACTION_SPIN_ROULETTE' })}
                            className="w-full py-3 rounded-xl bg-floor-cyan hover:bg-floor-cyan/90 text-black font-extrabold text-xs uppercase digital-font tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                          >
                            <Sparkles className="w-4 h-4 fill-current" />
                            GIRAR RULETA DE RETADOR
                          </button>
                        </div>
                      )}

                      {/* Lista de Casillas Atacables para Seleccionar desde el Móvil */}
                      {boardChallenger && attackableTiles.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase font-bold text-slate-400">
                              Casillas Fronterizas Disponibles ({attackableTiles.length}):
                            </span>
                            <span className="text-[10px] text-floor-cyan">
                              Pulsa una para retar
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                            {attackableTiles.map((tile) => {
                              const defenderPlayer = players.find((p) => p.id === tile.playerId);
                              const cat = BUILTIN_CATEGORIES.find((c) => c.slug === tile.categorySlug) || {
                                name: tile.categorySlug,
                                icon: '🏷️',
                              };
                              return (
                                <button
                                  key={tile.index}
                                  type="button"
                                  onClick={() =>
                                    sendAction({
                                      type: 'ACTION_SELECT_TILE',
                                      payload: { tileIndex: tile.index },
                                    })
                                  }
                                  className="p-2.5 rounded-xl bg-floor-card hover:bg-slate-800 border transition-all text-left flex items-center justify-between gap-1.5 cursor-pointer group active:scale-95"
                                  style={{ borderColor: defenderPlayer?.color || '#ff2a4b' }}
                                >
                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="text-base">{cat.icon}</span>
                                      <span className="font-bold text-xs text-white truncate">
                                        {cat.name}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                      {defenderPlayer?.name || 'Neutral'} (Casilla #{tile.index + 1})
                                    </span>
                                  </div>
                                  <Swords className="w-3.5 h-3.5 text-floor-cyan opacity-40 group-hover:opacity-100 flex-shrink-0" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Mini Tablero Interactivo con Grid Real */}
                      <div className="pt-2 border-t border-floor-border">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Tablero Global (Vista Rápida)
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {gridCols} columnas
                          </span>
                        </div>
                        <div
                          className="grid gap-1 p-2 rounded-xl bg-black/40 border border-floor-border"
                          style={{
                            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                          }}
                        >
                          {tiles.map((tile) => {
                            const isAttackable = attackableIndices.includes(tile.index);
                            const isChallengerTile = tile.playerId === activeChallengerId;
                            const owner = players.find((p) => p.id === tile.playerId);
                            const cat = BUILTIN_CATEGORIES.find((c) => c.slug === tile.categorySlug) || {
                              name: tile.categorySlug,
                              icon: '🏷️',
                            };

                            return (
                              <button
                                key={tile.index}
                                type="button"
                                disabled={!isAttackable}
                                onClick={() =>
                                  sendAction({
                                    type: 'ACTION_SELECT_TILE',
                                    payload: { tileIndex: tile.index },
                                  })
                                }
                                className={cn(
                                  'aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-all relative border overflow-hidden select-none',
                                  isAttackable
                                    ? 'cursor-pointer hover:scale-110 active:scale-95 animate-pulse border-floor-gold shadow-[0_0_10px_rgba(255,215,0,0.6)] z-10'
                                    : 'cursor-default opacity-85 border-black/40',
                                  isChallengerTile && 'ring-2 ring-floor-cyan shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                                )}
                                style={{
                                  backgroundColor: owner ? `${owner.color}40` : '#1e293b',
                                  borderColor: isAttackable
                                    ? '#ffd700'
                                    : isChallengerTile
                                    ? '#00f0ff'
                                    : owner?.color || '#334155',
                                  color: '#fff',
                                }}
                                title={`${owner?.name || 'Libre'} - ${cat.name}`}
                              >
                                <span className="text-base sm:text-lg leading-none filter drop-shadow">
                                  {cat.icon}
                                </span>
                                <span className="text-[7px] font-extrabold text-white/90 truncate max-w-full px-0.5 mt-0.5 leading-none">
                                  #{tile.index + 1}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : phase === 'victory' ? (
              /* Pantalla de Victoria Final */
              <div className="text-center py-8 px-4 rounded-3xl bg-floor-surface border-2 border-floor-gold space-y-4 shadow-2xl">
                <Trophy className="w-14 h-14 text-floor-gold mx-auto animate-bounce" />
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-floor-gold tracking-widest block">
                    ★ ¡GRAN CAMPEÓN DE THE FLOOR! ★
                  </span>
                  <h2 className="text-2xl font-black text-white">
                    {championPlayer?.name || 'Concursante Ganador'}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Ha conquistado el 100% del territorio del plató.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => sendAction({ type: 'ACTION_RESET_TO_SETUP' })}
                  className="w-full py-3.5 rounded-xl font-bold text-xs uppercase bg-floor-card border border-floor-border text-slate-200 hover:text-white"
                >
                  Reiniciar Partida
                </button>
              </div>
            ) : (
              /* Pantalla Fuera de Tablero General */
              <div className="text-center py-10 px-6 rounded-3xl bg-floor-surface border border-floor-border space-y-4 shadow-xl">
                <Swords className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">THE FLOOR</h3>
                  <p className="text-xs text-slate-400">
                    El plató está actualmente en:
                  </p>
                  <span className="inline-block px-3 py-1 rounded-full bg-floor-card border border-floor-cyan/30 text-floor-cyan text-xs font-semibold">
                    📺 {phaseLabel}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : isIntro ? (
          /* Estado de Presentación del Duelo */
          <div className="p-5 rounded-3xl bg-floor-surface border-2 border-floor-cyan/60 text-center space-y-4 shadow-2xl my-auto">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-floor-cyan tracking-wider">
                Duelo Listo para Empezar
              </span>
              <h2 className="text-2xl font-bold text-white digital-font">
                {currentDuel.category.name}
              </h2>
            </div>

            {/* Contendientes */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                className="p-2.5 rounded-xl border bg-floor-card text-center"
                style={{ borderColor: challenger?.color || '#00f0ff' }}
              >
                <span className="text-[10px] font-bold text-floor-cyan block">RETADOR</span>
                <span className="font-extrabold text-white text-sm truncate block">{challenger?.name}</span>
                <span className="text-slate-400 text-xs">45.0s</span>
              </div>
              <div
                className="p-2.5 rounded-xl border bg-floor-card text-center"
                style={{ borderColor: defender?.color || '#ffd700' }}
              >
                <span className="text-[10px] font-bold text-floor-gold block">DEFENSOR</span>
                <span className="font-extrabold text-white text-sm truncate block">{defender?.name}</span>
                <span className="text-slate-400 text-xs">45.0s</span>
              </div>
            </div>

            {/* Botón para iniciar el duelo desde el móvil */}
            <button
              type="button"
              onClick={() => sendAction({ type: 'ACTION_START_COUNTDOWN' })}
              className="w-full py-3.5 rounded-2xl font-bold text-sm uppercase digital-font tracking-wider bg-gradient-to-r from-floor-cyan to-teal-400 text-black active:scale-95 transition-transform shadow-[0_0_25px_rgba(0,240,255,0.6)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              ¡EMPEZAR CUENTA ATRÁS!
            </button>
          </div>
        ) : isCountdown ? (
          /* Estado Cuenta Atrás */
          <div className="text-center py-8 rounded-3xl bg-floor-surface border border-floor-cyan text-center space-y-2 my-auto">
            <h3 className="text-2xl font-bold text-floor-cyan digital-font animate-bounce">
              ¡ATENCIÓN!
            </h3>
            <p className="text-xs text-slate-300">Cuenta atrás en curso en el plató...</p>
          </div>
        ) : isFinished ? (
          /* Estado Duelo Finalizado */
          <div className="p-5 rounded-3xl bg-floor-surface border-2 border-floor-gold text-center space-y-4 my-auto">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-floor-gold tracking-widest">
                ¡DUELO TERMINADO!
              </span>
              <h2 className="text-xl font-bold text-white">
                Vencedor Proclamado
              </h2>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  sendAction({ type: 'ACTION_DECIDE', payload: { decision: 'continue' } })
                }
                className="w-full py-3 rounded-xl font-bold text-xs uppercase digital-font bg-floor-cyan text-black active:scale-95 cursor-pointer"
              >
                Continuar Retando
              </button>
              <button
                type="button"
                onClick={() =>
                  sendAction({ type: 'ACTION_DECIDE', payload: { decision: 'board' } })
                }
                className="w-full py-3 rounded-xl font-bold text-xs uppercase bg-floor-card border border-slate-700 text-slate-200 active:scale-95 cursor-pointer"
              >
                Volver al Tablero
              </button>
            </div>
          </div>
        ) : (
          /* Duelo En Curso o Pausado: Relojes + Mini Preview + Tarjeta de Respuestas (Diseño Compacto sin Scroll) */
          <div className="flex flex-col h-full justify-between gap-2 overflow-hidden">
            {/* Banner de Duelo Pausado */}
            {isPaused && (
              <div className="p-1.5 rounded-xl bg-floor-amber/20 border border-floor-amber text-center text-[11px] text-floor-amber font-bold animate-pulse flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(255,170,0,0.3)] flex-shrink-0">
                <Pause className="w-3.5 h-3.5" />
                <span>DUELO EN PAUSA • Cronómetros detenidos</span>
              </div>
            )}

            {/* Relojes Split para el Juez con Botones de Ajuste de Segundos */}
            <div className="grid grid-cols-2 gap-2 flex-shrink-0">
              {/* Retador */}
              <div
                className={cn(
                  'p-2 rounded-xl border-2 transition-all text-center flex flex-col justify-between',
                  isChallengerActive
                    ? 'border-floor-cyan bg-floor-card shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                    : 'border-slate-800 bg-floor-surface/80 opacity-80'
                )}
              >
                <div>
                  <div className="text-[10px] font-bold text-floor-cyan truncate">
                    {challenger?.name} (Retador)
                  </div>
                  <div className="text-xl sm:text-2xl font-bold digital-font text-white leading-tight">
                    {challengerTime.toFixed(1)}s
                  </div>
                </div>

                {/* Botones de añadir/restar segundos por error */}
                <div className="mt-1 pt-1 border-t border-slate-700/50 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      sendAction({
                        type: 'ACTION_ADJUST_TIME',
                        payload: { target: 'challenger', secondsDelta: 1 },
                      })
                    }
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-90 text-floor-cyan border border-floor-cyan/40 text-[9px] font-bold cursor-pointer"
                    title="Añadir 1s"
                  >
                    +1s
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      sendAction({
                        type: 'ACTION_ADJUST_TIME',
                        payload: { target: 'challenger', secondsDelta: 3 },
                      })
                    }
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-90 text-floor-cyan border border-floor-cyan/40 text-[9px] font-bold cursor-pointer"
                    title="Añadir 3s"
                  >
                    +3s
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      sendAction({
                        type: 'ACTION_ADJUST_TIME',
                        payload: { target: 'challenger', secondsDelta: 5 },
                      })
                    }
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-90 text-floor-cyan border border-floor-cyan/40 text-[9px] font-bold cursor-pointer"
                    title="Añadir 5s"
                  >
                    +5s
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      sendAction({
                        type: 'ACTION_ADJUST_TIME',
                        payload: { target: 'challenger', secondsDelta: -1 },
                      })
                    }
                    className="px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-90 text-slate-400 border border-slate-700 text-[9px] font-bold cursor-pointer"
                    title="Restar 1s"
                  >
                    -1s
                  </button>
                </div>
              </div>

              {/* Defensor */}
              <div
                className={cn(
                  'p-2 rounded-xl border-2 transition-all text-center flex flex-col justify-between',
                  !isChallengerActive
                    ? 'border-floor-gold bg-floor-card shadow-[0_0_15px_rgba(255,215,0,0.35)]'
                    : 'border-slate-800 bg-floor-surface/80 opacity-80'
                )}
              >
                <div>
                  <div className="text-[10px] font-bold text-floor-gold truncate">
                    {defender?.name} (Defensor)
                  </div>
                  <div className="text-xl sm:text-2xl font-bold digital-font text-white leading-tight">
                    {defenderTime.toFixed(1)}s
                  </div>
                </div>

                {/* Botones de añadir/restar segundos por error */}
                <div className="mt-1 pt-1 border-t border-slate-700/50 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      sendAction({
                        type: 'ACTION_ADJUST_TIME',
                        payload: { target: 'defender', secondsDelta: 1 },
                      })
                    }
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-90 text-floor-gold border border-floor-gold/40 text-[9px] font-bold cursor-pointer"
                    title="Añadir 1s"
                  >
                    +1s
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      sendAction({
                        type: 'ACTION_ADJUST_TIME',
                        payload: { target: 'defender', secondsDelta: 3 },
                      })
                    }
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-90 text-floor-gold border border-floor-gold/40 text-[9px] font-bold cursor-pointer"
                    title="Añadir 3s"
                  >
                    +3s
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      sendAction({
                        type: 'ACTION_ADJUST_TIME',
                        payload: { target: 'defender', secondsDelta: 5 },
                      })
                    }
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-90 text-floor-gold border border-floor-gold/40 text-[9px] font-bold cursor-pointer"
                    title="Añadir 5s"
                  >
                    +5s
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      sendAction({
                        type: 'ACTION_ADJUST_TIME',
                        payload: { target: 'defender', secondsDelta: -1 },
                      })
                    }
                    className="px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-90 text-slate-400 border border-slate-700 text-[9px] font-bold cursor-pointer"
                    title="Restar 1s"
                  >
                    -1s
                  </button>
                </div>
              </div>
            </div>

            {/* Tarjeta de Respuesta para el Juez con Mini Preview de la Imagen y Variantes */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-floor-surface border border-floor-border shadow-lg flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
              <div className="flex items-center justify-between text-xs border-b border-floor-border pb-1 flex-shrink-0">
                <span className="font-bold text-slate-400 flex items-center gap-1 truncate">
                  <span>{currentDuel.category.icon}</span>
                  <span className="text-white font-bold truncate">{currentDuel.category.name}</span>
                </span>
                <span className="font-mono text-slate-400 text-[10px] px-1.5 py-0.5 rounded bg-floor-card border border-floor-border flex-shrink-0 ml-1">
                  #{currentDuel.currentIndex + 1} / {currentDuel.itemsCount}
                </span>
              </div>

              {/* Mini Preview de la Imagen en Plató */}
              {currentItem?.image ? (
                <div className="relative w-full h-24 sm:h-28 rounded-xl bg-black/90 border border-slate-700 overflow-hidden flex items-center justify-center p-1 my-1 flex-shrink-0 shadow-inner">
                  <img
                    src={currentItem.image}
                    alt="Foto en plató"
                    className="max-h-full max-w-full object-contain rounded-md"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 border border-slate-700 text-[8px] font-bold text-floor-cyan flex items-center gap-1">
                    <ImageIcon className="w-2.5 h-2.5" />
                    <span>PLATÓ</span>
                  </div>
                </div>
              ) : null}

              {/* Respuesta Principal Directa (Sin la cartela 'Respuesta válida principal:') */}
              <div className="text-center py-1 flex-shrink-0">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-floor-gold underline drop-shadow tracking-wide leading-tight line-clamp-2">
                  {currentItem?.name || '---'}
                </h3>
              </div>

              {/* Lista de Aliases Válidos Compacta */}
              {currentItem?.aliases && currentItem.aliases.length > 0 && (
                <div className="pt-1 border-t border-floor-border/70 flex-shrink-0">
                  <div className="flex flex-wrap items-center justify-center gap-1 max-h-12 overflow-y-auto">
                    <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-0.5 mr-1">
                      <HelpCircle className="w-2.5 h-2.5 text-floor-cyan" />
                      Sinónimos:
                    </span>
                    {currentItem.aliases.map((alias, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-floor-card border border-floor-border text-slate-200 font-medium"
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Botonera Fija Inferior del Juez (Permanentemente visible en duelo activo o pausado) */}
      {(isRunning || isPaused) && (
        <footer className="space-y-1.5 pt-1.5 border-t border-floor-border flex-shrink-0">
          {/* Fila de Control de Emergencia: Parar/Reanudar y Deshacer */}
          <div className="grid grid-cols-2 gap-2">
            {/* Botón de Parar / Reanudar Duelo */}
            <button
              type="button"
              onClick={() => sendAction({ type: 'ACTION_PAUSE' })}
              className={cn(
                'py-2.5 rounded-xl font-bold text-xs uppercase digital-font flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md select-none touch-manipulation',
                isPaused
                  ? 'bg-gradient-to-r from-floor-green to-emerald-400 text-black shadow-[0_0_20px_rgba(0,255,136,0.6)] animate-pulse'
                  : 'bg-floor-amber/20 border-2 border-floor-amber text-floor-amber active:scale-95'
              )}
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>▶️ REANUDAR</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  <span>🛑 PAUSAR</span>
                </>
              )}
            </button>

            {/* Deshacer Acción */}
            <button
              type="button"
              onClick={() => sendAction({ type: 'ACTION_UNDO' })}
              disabled={!canUndo}
              className="py-2.5 rounded-xl bg-floor-card border border-floor-border text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 hover:bg-slate-800 disabled:opacity-30 active:scale-95 transition-all cursor-pointer select-none touch-manipulation"
              title="Deshacer último acierto o paso"
            >
              <RotateCcw className="w-3.5 h-3.5 text-floor-cyan" />
              <span>Deshacer</span>
            </button>
          </div>

          {/* Fila Principal de Botones Grandes Fijos: Acierto y Paso (Bloqueo visual sin alertas intrusivas) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Paso */}
            <button
              type="button"
              onClick={() => sendAction({ type: 'ACTION_PASS' })}
              disabled={isFrozen || isPaused}
              className={cn(
                'py-3.5 sm:py-4 rounded-2xl font-bold text-base uppercase digital-font tracking-wider border-2 transition-all flex items-center justify-center gap-2 select-none touch-manipulation cursor-pointer',
                isFrozen
                  ? 'bg-floor-red/10 border-floor-red/40 text-floor-red/50 cursor-not-allowed opacity-60'
                  : isPaused
                  ? 'bg-floor-card border-slate-700 text-slate-500 opacity-40 cursor-not-allowed'
                  : 'bg-floor-card border-floor-red text-floor-red hover:bg-floor-red/10 active:scale-95 shadow-[0_0_15px_rgba(255,42,75,0.3)]'
              )}
            >
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <span>{isFrozen ? 'BLOQUEADO' : 'PASO'}</span>
            </button>

            {/* Acierto */}
            <button
              type="button"
              onClick={() => sendAction({ type: 'ACTION_CORRECT' })}
              disabled={isFrozen || isPaused}
              className={cn(
                'py-3.5 sm:py-4 rounded-2xl font-bold text-base uppercase digital-font tracking-wider transition-all flex items-center justify-center gap-2 select-none touch-manipulation cursor-pointer',
                isFrozen
                  ? 'bg-emerald-950/40 border border-emerald-700/50 text-emerald-400/50 cursor-not-allowed opacity-60'
                  : isPaused
                  ? 'bg-slate-800 text-slate-500 opacity-40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-floor-green via-emerald-400 to-green-500 text-black active:scale-95 shadow-[0_0_20px_rgba(0,255,136,0.6)]'
              )}
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{isFrozen ? 'BLOQUEADO' : '¡ACIERTO!'}</span>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};
