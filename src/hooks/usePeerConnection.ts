import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { useGameStore } from './useGameStore';
import {
  HostMessage,
  HostAckMessage,
  HostPatchPayload,
  JudgeActionMessage,
  HostSyncPayload,
  JudgeDuelSync,
  JudgeItem,
} from '../types/peer';
import { CategoryItem } from '../types/category';
import { DuelSession } from '../types/game';
import { getAdjacentAttackableTileIndices } from '../utils/boardLogic';
import { getIceServers } from '../utils/iceServers';

const PEER_PREFIX = 'floor-game-room-';

// El relay SSE/HTTP (/api/judge-*) solo existe en el servidor de desarrollo de Vite
const USE_DEV_RELAY = import.meta.env.DEV;

// Mientras el reloj corre, el mando interpola localmente: basta con re-sincronizar cada segundo
const CLOCK_RESYNC_MS = 1000;

// Margen antes de dar al juez por desconectado tras un corte (en datos móviles hay microcortes)
const HOST_DISCONNECT_GRACE_MS = 8000;
// Reintentos de acciones del mando hasta recibir confirmación
const ACTION_RETRY_MS = 600;
const ACTION_EXPIRE_MS = 4000;
// Si la conexión WebRTC parece abierta pero no llega nada en este tiempo, está muerta
const JUDGE_DEAD_CONNECTION_MS = 7000;
const JUDGE_CONNECT_TIMEOUT_MS = 10000;

async function getPeerOptions() {
  const iceServers = await getIceServers();
  return { config: { iceServers } };
}

// /categories/<cat>/<foto>.jpg -> /categories/<cat>/thumbs/<foto>.jpg (scripts/generate_thumbs.sh)
function toThumbUrl(image?: string): string | undefined {
  if (!image) return undefined;
  const match = image.match(/^(\/categories\/[^/]+)\/([^/]+)\.[a-z0-9]+$/i);
  return match ? `${match[1]}/thumbs/${match[2]}.jpg` : undefined;
}

function toJudgeItem(item: CategoryItem | undefined): JudgeItem | null {
  if (!item) return null;
  return { ...item, thumb: toThumbUrl(item.image) };
}

// Redondear el reloj evita enviar cambios irrelevantes
const roundTime = (t: number) => Math.round(t * 100) / 100;

// Quitar del duelo lo que el mando no necesita (lista de ítems e historial)
function toJudgeDuel(duel: DuelSession | null): JudgeDuelSync | null {
  if (!duel) return null;
  const { items, history: _history, ...rest } = duel;
  return {
    ...rest,
    challengerTime: roundTime(duel.challengerTime),
    defenderTime: roundTime(duel.defenderTime),
    passPenaltySecondsRemaining: 0,
    frozenSecondsRemaining: 0,
    itemsCount: items.length,
    currentItem: toJudgeItem(items[duel.currentIndex]),
    nextItem: toJudgeItem(items[duel.currentIndex + 1]),
  };
}

const isSameDuel = (a: JudgeDuelSync, b: JudgeDuelSync) =>
  a.challengerId === b.challengerId &&
  a.defenderId === b.defenderId &&
  a.defendedTileIndex === b.defendedTileIndex &&
  a.category.slug === b.category.slug;

// Calcular solo lo que ha cambiado respecto al último estado enviado
function diffPayload(prev: HostSyncPayload, next: HostSyncPayload): HostPatchPayload {
  const patch: HostPatchPayload = {};
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]) as Set<keyof HostSyncPayload>;
  keys.forEach((key) => {
    const a = prev[key];
    const b = next[key];
    if (a === b) return;
    if (key === 'currentDuel' && a && b && isSameDuel(a as JudgeDuelSync, b as JudgeDuelSync)) {
      const duelA = a as JudgeDuelSync;
      const duelB = b as JudgeDuelSync;
      const duelPatch: Record<string, unknown> = {};
      (Object.keys(duelB) as (keyof JudgeDuelSync)[]).forEach((dk) => {
        if (duelA[dk] !== duelB[dk] && JSON.stringify(duelA[dk]) !== JSON.stringify(duelB[dk])) {
          duelPatch[dk] = duelB[dk];
        }
      });
      if (Object.keys(duelPatch).length > 0) {
        // Los tiempos viajan siempre con cualquier cambio del duelo: el mando reancla su reloj
        duelPatch.challengerTime = duelB.challengerTime;
        duelPatch.defenderTime = duelB.defenderTime;
        patch.currentDuelPatch = duelPatch as Partial<JudgeDuelSync>;
      }
      return;
    }
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      (patch as Record<string, unknown>)[key] = b;
    }
  });
  return patch;
}

// Aplicar un parche recibido sobre el estado que ya tiene el mando
function applyPatch(prev: HostSyncPayload, patch: HostPatchPayload): HostSyncPayload {
  const { currentDuelPatch, ...rest } = patch;
  const next: HostSyncPayload = { ...prev, ...rest };
  if (currentDuelPatch && next.currentDuel) {
    next.currentDuel = { ...next.currentDuel, ...currentDuelPatch };
  }
  return next;
}

export function usePeerHost(roomId: string) {
  const [peerId, setPeerId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const connRef = useRef<DataConnection | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const isLocalPresentRef = useRef(false);
  const localPresenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const phase = useGameStore((state) => state.phase);
  const currentDuel = useGameStore((state) => state.currentDuel);
  const players = useGameStore((state) => state.players);
  const lastDuelSnapshot = useGameStore((state) => state.lastDuelSnapshot);
  const setIsJudgeConnected = useGameStore((state) => state.setIsJudgeConnected);

  // Estado del Tablero y Modales
  const tiles = useGameStore((state) => state.tiles);
  const boardStep = useGameStore((state) => state.boardStep);
  const activeChallengerId = useGameStore((state) => state.activeChallengerId);
  const selectedTileIndex = useGameStore((state) => state.selectedTileIndex);
  const settings = useGameStore((state) => state.settings);
  const activeRoulette = useGameStore((state) => state.activeRoulette);
  const pendingMergedTopicSelection = useGameStore((state) => state.pendingMergedTopicSelection);
  const pendingGrandFinalTopicChoice = useGameStore((state) => state.pendingGrandFinalTopicChoice);

  const handleCorrectAnswer = useGameStore((state) => state.handleCorrectAnswer);
  const handlePassAnswer = useGameStore((state) => state.handlePassAnswer);
  const togglePauseDuel = useGameStore((state) => state.togglePauseDuel);
  const adjustDuelTime = useGameStore((state) => state.adjustDuelTime);
  const startDuelCountdown = useGameStore((state) => state.startDuelCountdown);
  const undoLastDuelAction = useGameStore((state) => state.undoLastDuelAction);
  const decidePostDuel = useGameStore((state) => state.decidePostDuel);
  const initGame = useGameStore((state) => state.initGame);
  const initDevQuickGame = useGameStore((state) => state.initDevQuickGame);
  const applyMergedTopic = useGameStore((state) => state.applyMergedTopic);
  const startGrandFinalDuel = useGameStore((state) => state.startGrandFinalDuel);
  const resetToSetup = useGameStore((state) => state.resetToSetup);
  const confirmRouletteWinner = useGameStore((state) => state.confirmRouletteWinner);
  const openChallengerRoulette = useGameStore((state) => state.openChallengerRoulette);
  const boardHistory = useGameStore((state) => state.boardHistory);
  const undoBoardAction = useGameStore((state) => state.undoBoardAction);
  const rerollRoulette = useGameStore((state) => state.rerollRoulette);
  const overrideRouletteWinner = useGameStore((state) => state.overrideRouletteWinner);

  const canUndoBoard =
    boardHistory.length > 0 &&
    (!currentDuel || currentDuel.status === 'intro' || currentDuel.status === 'finished');
  const undoBoardLabel = boardHistory.length > 0 ? boardHistory[boardHistory.length - 1].label : null;

  const challenger = players.find((p) => p.id === currentDuel?.challengerId) || null;
  const defender = players.find((p) => p.id === currentDuel?.defenderId) || null;

  // Calcular casillas atacables actualmente
  const attackableTileIndices =
    activeChallengerId && boardStep === 'SELECT_ADJACENT_TOPIC'
      ? getAdjacentAttackableTileIndices(tiles, activeChallengerId, settings.gridRows, settings.gridCols)
      : boardStep === 'CHALLENGER_SELECT_START_TILE'
      ? tiles.filter((t) => t.playerId === null).map((t) => t.index)
      : [];

  // Mantener referencia al estado actual para evitar recrear la conexión en cada cambio
  const stateRef = useRef<HostSyncPayload>({
    phase,
    currentDuel: toJudgeDuel(currentDuel),
    challenger,
    defender,
    isJudgeConnected: isConnected,
    canUndo: !!lastDuelSnapshot,
    boardStep,
    tiles,
    players,
    activeChallengerId,
    selectedTileIndex,
    attackableTileIndices,
    gridRows: settings.gridRows,
    gridCols: settings.gridCols,
    activeRoulette,
    pendingMergedTopicSelection,
    pendingGrandFinalTopicChoice,
    canUndoBoard,
    undoBoardLabel,
  });

  stateRef.current = {
    phase,
    currentDuel: toJudgeDuel(currentDuel),
    challenger,
    defender,
    isJudgeConnected: isConnected,
    canUndo: !!lastDuelSnapshot,
    boardStep,
    tiles,
    players,
    activeChallengerId,
    selectedTileIndex,
    attackableTileIndices,
    gridRows: settings.gridRows,
    gridCols: settings.gridCols,
    activeRoulette,
    pendingMergedTopicSelection,
    pendingGrandFinalTopicChoice,
    canUndoBoard,
    undoBoardLabel,
  };

  // Mantener referencia a las funciones de acción del store
  const actionsRef = useRef({
    handleCorrectAnswer,
    handlePassAnswer,
    togglePauseDuel,
    adjustDuelTime,
    startDuelCountdown,
    undoLastDuelAction,
    decidePostDuel,
    initGame,
    initDevQuickGame,
    applyMergedTopic,
    startGrandFinalDuel,
    resetToSetup,
    confirmRouletteWinner,
    openChallengerRoulette,
    undoBoardAction,
    rerollRoulette,
    overrideRouletteWinner,
  });
  actionsRef.current = {
    handleCorrectAnswer,
    handlePassAnswer,
    togglePauseDuel,
    adjustDuelTime,
    startDuelCountdown,
    undoLastDuelAction,
    decidePostDuel,
    initGame,
    initDevQuickGame,
    applyMergedTopic,
    startGrandFinalDuel,
    resetToSetup,
    confirmRouletteWinner,
    openChallengerRoulette,
    undoBoardAction,
    rerollRoulette,
    overrideRouletteWinner,
  };

  // Último estado difundido: los envíos siguientes solo llevan las diferencias
  const lastBroadcastRef = useRef<HostSyncPayload | null>(null);

  const buildPayload = (): HostSyncPayload => ({ ...stateRef.current, isJudgeConnected: true });

  const postToChannels = (msg: HostMessage, targetConn: DataConnection | null) => {
    // 1. WebRTC
    if (targetConn && targetConn.open) {
      try {
        targetConn.send(msg);
      } catch (e) {
        console.warn('Error enviando sync por WebRTC:', e);
      }
    }
    // 2. BroadcastChannel
    if (broadcastRef.current) {
      try {
        broadcastRef.current.postMessage(msg);
      } catch (e) {
        console.warn('Error enviando sync por BroadcastChannel:', e);
      }
    }
  };

  // Estado completo solo para una conexión concreta (al conectar o si lo pide el mando)
  const sendFullTo = useCallback((conn: DataConnection) => {
    if (!conn.open) return;
    try {
      conn.send({ type: 'STATE_SYNC', payload: buildPayload() } satisfies HostMessage);
    } catch (e) {
      console.warn('Error enviando sync completo por WebRTC:', e);
    }
  }, []);

  // Difundir el estado: parche con lo que ha cambiado (o completo si se pide)
  const sendSync = useCallback((full = false) => {
    const payload = buildPayload();
    const prev = lastBroadcastRef.current;

    if (full || !prev) {
      postToChannels({ type: 'STATE_SYNC', payload }, connRef.current);
    } else {
      const patch = diffPayload(prev, payload);
      if (Object.keys(patch).length > 0) {
        postToChannels({ type: 'STATE_PATCH', payload: patch }, connRef.current);
      }
    }
    lastBroadcastRef.current = payload;

    // 3. Local / LAN Relay (Vite, solo en desarrollo): siempre estado completo
    if (USE_DEV_RELAY) try {
      fetch('/api/judge-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, payload }),
      }).catch(() => {});
    } catch {}
  }, [roomId]);

  // Evitar ejecuciones duplicadas de la misma acción provenientes de múltiples canales de transporte
  const processedActionIdsRef = useRef<Map<string, number>>(new Map());

  // Procesar acciones enviadas por el juez
  const handleJudgeMessage = useCallback((data: JudgeActionMessage) => {
    if (!data || !data.type) return;

    // Deduplicación por actionId (o type + timestamp si no hay ID)
    const actionKey = data.actionId || (data.timestamp ? `${data.type}_${data.timestamp}` : null);
    const now = Date.now();
    if (actionKey) {
      const lastExecuted = processedActionIdsRef.current.get(actionKey);
      if (lastExecuted && now - lastExecuted < 60000) {
        // Acción ya procesada por otro canal (WebRTC / LAN / BroadcastChannel)
        return;
      }
      processedActionIdsRef.current.set(actionKey, now);

      // Limpieza de claves antiguas periódica
      if (processedActionIdsRef.current.size > 200) {
        for (const [k, time] of processedActionIdsRef.current.entries()) {
          if (now - time > 60000) {
            processedActionIdsRef.current.delete(k);
          }
        }
      }
    }

    switch (data.type) {
      case 'ACTION_CORRECT':
        actionsRef.current.handleCorrectAnswer();
        break;
      case 'ACTION_PASS':
        actionsRef.current.handlePassAnswer();
        break;
      case 'ACTION_PAUSE':
        actionsRef.current.togglePauseDuel();
        break;
      case 'ACTION_START_COUNTDOWN':
        actionsRef.current.startDuelCountdown();
        break;
      case 'ACTION_UNDO':
        actionsRef.current.undoLastDuelAction();
        break;
      case 'ACTION_DECIDE':
        if (data.payload?.decision) {
          actionsRef.current.decidePostDuel(data.payload.decision);
        }
        break;
      case 'ACTION_SPIN_ROULETTE':
        window.dispatchEvent(new CustomEvent('remote-spin-roulette'));
        break;
      case 'ACTION_CONFIRM_ROULETTE':
        window.dispatchEvent(new CustomEvent('remote-confirm-roulette'));
        actionsRef.current.confirmRouletteWinner();
        break;
      case 'ACTION_SELECT_TILE':
        if (typeof data.payload?.tileIndex === 'number') {
          window.dispatchEvent(
            new CustomEvent('remote-select-tile', {
              detail: { tileIndex: data.payload.tileIndex },
            })
          );
        }
        break;
      case 'ACTION_ADJUST_TIME':
        if (data.payload?.target && typeof data.payload?.secondsDelta === 'number') {
          actionsRef.current.adjustDuelTime(data.payload.target, data.payload.secondsDelta);
        }
        break;
      case 'ACTION_START_GAME':
        actionsRef.current.initGame();
        break;
      case 'ACTION_DEV_QUICK_GAME':
        actionsRef.current.initDevQuickGame();
        break;
      case 'ACTION_APPLY_MERGED_TOPIC':
        if (data.payload?.categorySlug) {
          actionsRef.current.applyMergedTopic(data.payload.categorySlug);
        }
        break;
      case 'ACTION_SELECT_GRAND_FINAL_TOPIC':
        if (data.payload?.categorySlug && typeof data.payload?.tileIndex === 'number') {
          actionsRef.current.startGrandFinalDuel(data.payload.categorySlug, data.payload.tileIndex);
        }
        break;
      case 'ACTION_RESET_TO_SETUP':
        actionsRef.current.resetToSetup();
        break;
      case 'ACTION_UNDO_BOARD':
        actionsRef.current.undoBoardAction();
        break;
      case 'ACTION_RESPIN_ROULETTE':
        actionsRef.current.rerollRoulette();
        break;
      case 'ACTION_SET_ROULETTE_WINNER':
        if (data.payload?.playerId) {
          actionsRef.current.overrideRouletteWinner(data.payload.playerId);
        }
        break;
    }
  }, []);

  // Renovar presencia del juez en local (BroadcastChannel)
  const refreshLocalPresence = useCallback(() => {
    isLocalPresentRef.current = true;
    setIsConnected(true);
    setIsJudgeConnected(true);
    if (localPresenceTimerRef.current) {
      clearTimeout(localPresenceTimerRef.current);
    }
    // Si no se reciben pings en 10 segundos por BroadcastChannel y no hay WebRTC abierto, marcar desconectado
    localPresenceTimerRef.current = setTimeout(() => {
      isLocalPresentRef.current = false;
      if (!connRef.current || !connRef.current.open) {
        setIsConnected(false);
        setIsJudgeConnected(false);
      }
    }, 10000);
  }, [setIsJudgeConnected]);

  // Inicializar conexiones (BroadcastChannel + PeerJS) SOLAMENTE cuando cambia roomId
  useEffect(() => {
    if (!roomId) return;

    let isSubscribed = true;
    let peerInstance: Peer | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let disconnectGraceTimer: NodeJS.Timeout | null = null;

    // 1. BroadcastChannel para conexión inmediata entre pestañas locales del mismo origen
    try {
      const bc = new BroadcastChannel(`the-floor-${roomId}`);
      broadcastRef.current = bc;
      bc.onmessage = (event) => {
        if (!isSubscribed) return;
        const msg = event.data as JudgeActionMessage;
        if (!msg || !msg.type) return;

        if (msg.type === 'REQUEST_SYNC') {
          refreshLocalPresence();
          sendSync(true); // Estado completo para el mando que lo pide
        } else if (msg.type === 'JUDGE_PING') {
          refreshLocalPresence();
          try {
            bc.postMessage({ type: 'HOST_PONG' } satisfies HostMessage);
          } catch {}
        } else if (msg.type.startsWith('ACTION_')) {
          refreshLocalPresence();
          handleJudgeMessage(msg);
          if (msg.actionId) {
            const ack: HostAckMessage = { type: 'ACTION_ACK', actionId: msg.actionId };
            try {
              bc.postMessage(ack);
            } catch {}
          }
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel no disponible:', err);
    }

    // 2. PeerJS para conexión entre orígenes distintos (móvil, red WiFi, etc.)
    const fullPeerId = `${PEER_PREFIX}${roomId}`;

    const initPeer = async () => {
      if (!isSubscribed) return;
      const peerOptions = await getPeerOptions();
      if (!isSubscribed) return;
      try {
        if (peerInstance && !peerInstance.destroyed) {
          peerInstance.destroy();
        }

        const peer = new Peer(fullPeerId, peerOptions);
        peerInstance = peer;
        peerRef.current = peer;

        peer.on('open', (id) => {
          if (!isSubscribed) return;
          setPeerId(id);
        });

        // El servidor de emparejamiento de PeerJS puede cortar la conexión: reconectar
        peer.on('disconnected', () => {
          if (!isSubscribed || peer.destroyed) return;
          setTimeout(() => {
            if (isSubscribed && !peer.destroyed && peer.disconnected) {
              try {
                peer.reconnect();
              } catch {}
            }
          }, 1000);
        });

        peer.on('connection', (conn) => {
          if (!isSubscribed) return;

          const markConnected = () => {
            if (disconnectGraceTimer) {
              clearTimeout(disconnectGraceTimer);
              disconnectGraceTimer = null;
            }
            setIsConnected(true);
            setIsJudgeConnected(true);
          };

          conn.on('open', () => {
            if (!isSubscribed) return;
            // La conexión más reciente sustituye a la anterior (el mando se ha reconectado)
            const previous = connRef.current;
            connRef.current = conn;
            if (previous && previous !== conn) {
              try {
                previous.close();
              } catch {}
            }
            markConnected();
            sendFullTo(conn);
          });

          conn.on('data', (data) => {
            if (!isSubscribed) return;
            const action = data as JudgeActionMessage;
            if (!action || !action.type) return;
            if (connRef.current !== conn && conn.open) {
              connRef.current = conn;
            }
            if (action.type === 'REQUEST_SYNC') {
              markConnected();
              sendFullTo(conn);
            } else if (action.type === 'JUDGE_PING') {
              // Respuesta mínima: el estado ya llega por parches cuando cambia
              markConnected();
              try {
                conn.send({ type: 'HOST_PONG' } satisfies HostMessage);
              } catch {}
            } else if (action.type.startsWith('ACTION_')) {
              markConnected();
              handleJudgeMessage(action);
              if (action.actionId) {
                const ack: HostAckMessage = { type: 'ACTION_ACK', actionId: action.actionId };
                try {
                  conn.send(ack);
                } catch {}
              }
            }
          });

          const handleConnLost = () => {
            if (!isSubscribed) return;
            // Ignorar cierres de conexiones antiguas ya sustituidas
            if (connRef.current !== conn) return;
            connRef.current = null;
            if (disconnectGraceTimer) clearTimeout(disconnectGraceTimer);
            // No marcar desconectado al instante: dar margen para que el mando se reconecte
            disconnectGraceTimer = setTimeout(() => {
              disconnectGraceTimer = null;
              const hasOpenConn = !!(connRef.current && connRef.current.open);
              if (!hasOpenConn && !isLocalPresentRef.current) {
                setIsConnected(false);
                setIsJudgeConnected(false);
              }
            }, HOST_DISCONNECT_GRACE_MS);
          };

          conn.on('close', handleConnLost);
          conn.on('error', handleConnLost);
        });

        peer.on('error', (err) => {
          console.warn('PeerJS Host aviso:', err.type, err.message);
          if (err.type === 'unavailable-id' && isSubscribed) {
            try {
              peer.destroy();
            } catch {}
            peerRef.current = null;
            reconnectTimeout = setTimeout(() => {
              if (isSubscribed) {
                initPeer();
              }
            }, 1500);
          }
        });
      } catch (e) {
        console.warn('Error inicializando PeerJS Host:', e);
      }
    };

    initPeer();

    // 3. Local / LAN SSE Relay (Vite) para comunicación entre dominios y red WiFi
    let eventSourceInstance: EventSource | null = null;
    if (USE_DEV_RELAY) try {
      const es = new EventSource(`/api/judge-stream?role=host&room=${roomId}`);
      eventSourceInstance = es;
      es.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'JUDGE_ACTION') {
            refreshLocalPresence();
            handleJudgeMessage(data.action);
          } else if (data.type === 'JUDGE_PRESENCE') {
            if (data.connected) {
              refreshLocalPresence();
              sendSync(true);
            } else if (!connRef.current || !connRef.current.open) {
              setIsConnected(false);
              setIsJudgeConnected(false);
            }
          }
        } catch {}
      };
      es.onerror = () => {
        // Fallback transparente si no estamos en entorno con Vite middleware
      };
    } catch {}

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (disconnectGraceTimer) {
        clearTimeout(disconnectGraceTimer);
      }
      if (localPresenceTimerRef.current) {
        clearTimeout(localPresenceTimerRef.current);
      }
      if (broadcastRef.current) {
        broadcastRef.current.close();
        broadcastRef.current = null;
      }
      if (eventSourceInstance) {
        eventSourceInstance.close();
      }
      if (peerInstance) {
        peerInstance.destroy();
        peerRef.current = null;
      }
    };
  }, [roomId, handleJudgeMessage, sendSync, sendFullTo, refreshLocalPresence, setIsJudgeConnected]);

  // Sincronizar al instante ante cualquier evento; los ticks del reloj solo cada segundo
  // (el mando interpola el reloj localmente entre sincronizaciones)
  const lastSyncTimeRef = useRef(0);
  const lastSentTimesRef = useRef<{ ch: number; def: number } | null>(null);
  const lastEventKeyRef = useRef('');
  useEffect(() => {
    const now = performance.now();
    const isDuelRunning = currentDuel?.status === 'in_progress';
    const prevTimes = lastSentTimesRef.current;
    const chTime = currentDuel?.challengerTime ?? 0;
    const defTime = currentDuel?.defenderTime ?? 0;
    // Un tiempo que sube = ajuste manual del juez -> sincronizar ya
    const timeWasAdjusted =
      !!prevTimes && (chTime > prevTimes.ch + 0.05 || defTime > prevTimes.def + 0.05);

    const send = () => {
      lastSyncTimeRef.current = now;
      lastSentTimesRef.current = { ch: chTime, def: defTime };
      sendSync();
    };

    const eventKey = [
      phase,
      boardStep,
      activeChallengerId,
      selectedTileIndex,
      currentDuel?.status,
      currentDuel?.currentIndex,
      currentDuel?.activePlayerId,
      currentDuel?.isFrozen,
      currentDuel?.isPassLocked,
    ].join('|');
    const isNewEvent = eventKey !== lastEventKeyRef.current;
    lastEventKeyRef.current = eventKey;

    if (
      isDuelRunning &&
      !isNewEvent &&
      !timeWasAdjusted &&
      now - lastSyncTimeRef.current < CLOCK_RESYNC_MS
    ) {
      // Solo ha avanzado el reloj: lo cubre la interpolación del mando
      return;
    }
    send();
  }, [
    phase,
    boardStep,
    activeChallengerId,
    selectedTileIndex,
    tiles,
    players,
    activeRoulette,
    pendingMergedTopicSelection,
    pendingGrandFinalTopicChoice,
    boardHistory,
    currentDuel?.status,
    currentDuel?.currentIndex,
    currentDuel?.activePlayerId,
    currentDuel?.isFrozen,
    currentDuel?.isPassLocked,
    currentDuel?.challengerTime,
    currentDuel?.defenderTime,
    sendSync,
  ]);

  return { peerId, isConnected, sendSync };
}

export function usePeerJudge(roomId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'local' | 'webrtc' | null>(null);
  const [syncState, setSyncStateRaw] = useState<HostSyncPayload | null>(null);
  // Momento local (performance.now) en que llegó el último estado, para interpolar el reloj
  const [syncReceivedAt, setSyncReceivedAt] = useState(0);
  const syncStateRef = useRef<HostSyncPayload | null>(null);
  const setSyncState = useCallback((payload: HostSyncPayload) => {
    syncStateRef.current = payload;
    setSyncStateRaw(payload);
    setSyncReceivedAt(performance.now());
  }, []);
  const connRef = useRef<DataConnection | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const lastMsgTimeRef = useRef<number>(Date.now());

  // Acciones pendientes de confirmación (se reintentan hasta recibir ACTION_ACK)
  const pendingActionsRef = useRef<
    Map<string, { action: JudgeActionMessage; firstSentAt: number; lastSentAt: number }>
  >(new Map());
  const [pendingCount, setPendingCount] = useState(0);
  const refreshPendingCount = useCallback(() => {
    setPendingCount(pendingActionsRef.current.size);
  }, []);

  const handleAck = useCallback((actionId: string) => {
    if (pendingActionsRef.current.delete(actionId)) {
      refreshPendingCount();
    }
  }, [refreshPendingCount]);

  // Enviar por todos los canales disponibles (sin registrar como pendiente)
  const transmitAction = useCallback((actionWithId: JudgeActionMessage) => {
    // 1. WebRTC
    if (connRef.current && connRef.current.open) {
      try {
        connRef.current.send(actionWithId);
      } catch (e) {
        console.warn('Error enviando acción por WebRTC:', e);
      }
    }

    // 2. BroadcastChannel
    if (broadcastRef.current) {
      try {
        broadcastRef.current.postMessage(actionWithId);
      } catch (e) {
        console.warn('Error enviando acción por BroadcastChannel:', e);
      }
    }

    // 3. Local / LAN Relay (Vite, solo en desarrollo)
    if (USE_DEV_RELAY) try {
      fetch('/api/judge-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action: actionWithId }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, [roomId]);

  const sendAction = useCallback((action: JudgeActionMessage) => {
    // ID único: la pantalla descarta duplicados, así que reintentar es seguro
    const actionWithId: JudgeActionMessage = {
      ...action,
      actionId: action.actionId || `${action.type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: action.timestamp || Date.now(),
    };
    const now = Date.now();
    pendingActionsRef.current.set(actionWithId.actionId!, {
      action: actionWithId,
      firstSentAt: now,
      lastSentAt: now,
    });
    refreshPendingCount();
    transmitAction(actionWithId);
  }, [transmitAction, refreshPendingCount]);

  // Reenviar las acciones sin confirmar; descartarlas si ya son demasiado antiguas
  const flushPendingActions = useCallback((force = false) => {
    const now = Date.now();
    let changed = false;
    pendingActionsRef.current.forEach((entry, id) => {
      if (now - entry.firstSentAt > ACTION_EXPIRE_MS) {
        pendingActionsRef.current.delete(id);
        changed = true;
        return;
      }
      if (force || now - entry.lastSentAt >= ACTION_RETRY_MS) {
        entry.lastSentAt = now;
        transmitAction(entry.action);
      }
    });
    if (changed) refreshPendingCount();
  }, [transmitAction, refreshPendingCount]);

  useEffect(() => {
    const interval = setInterval(() => flushPendingActions(), 250);
    return () => clearInterval(interval);
  }, [flushPendingActions]);

  // Procesar un mensaje de la pantalla. Devuelve false si hace falta pedir el estado completo.
  const handleHostMessage = useCallback((msg: HostMessage): boolean => {
    if (!msg || !msg.type) return true;
    if (msg.type === 'ACTION_ACK') {
      handleAck(msg.actionId);
    } else if (msg.type === 'STATE_SYNC') {
      setSyncState(msg.payload);
    } else if (msg.type === 'STATE_PATCH') {
      const prev = syncStateRef.current;
      if (!prev) return false; // Parche sin base: pedir estado completo
      // Cualquier cambio del duelo trae los tiempos actuales -> reanclar el reloj
      const hasClockChange = !!msg.payload.currentDuelPatch;
      const next = applyPatch(prev, msg.payload);
      syncStateRef.current = next;
      setSyncStateRaw(next);
      // Solo reiniciar la interpolación del reloj cuando llega un tiempo nuevo
      if (hasClockChange || msg.payload.currentDuel !== undefined) {
        setSyncReceivedAt(performance.now());
      }
    }
    return true;
  }, [handleAck, setSyncState]);

  useEffect(() => {
    if (!roomId) return;

    let isSubscribed = true;
    let peerInstance: Peer | null = null;
    let webrtcReconnectTimeout: NodeJS.Timeout | null = null;
    let eventSourceInstance: EventSource | null = null;

    // 1. BroadcastChannel (para misma máquina y mismo navegador)
    try {
      const bc = new BroadcastChannel(`the-floor-${roomId}`);
      broadcastRef.current = bc;

      bc.onmessage = (event) => {
        if (!isSubscribed) return;
        const msg = event.data as HostMessage;
        if (!msg || !msg.type) return;
        // Ignorar los mensajes del propio mando (el canal es compartido)
        if (!['STATE_SYNC', 'STATE_PATCH', 'HOST_PONG', 'ACTION_ACK'].includes(msg.type)) return;
        lastMsgTimeRef.current = Date.now();
        setIsConnected(true);
        setConnectionType((prev) => (prev === 'webrtc' ? prev : 'local'));
        if (!handleHostMessage(msg)) {
          bc.postMessage({ type: 'REQUEST_SYNC' });
        }
      };

      // Solicitar sincronización inicial
      bc.postMessage({ type: 'REQUEST_SYNC' });
      setTimeout(() => {
        if (isSubscribed && broadcastRef.current) {
          broadcastRef.current.postMessage({ type: 'REQUEST_SYNC' });
        }
      }, 300);
    } catch (e) {
      console.warn('BroadcastChannel no soportado:', e);
    }

    // 2. Local / LAN SSE Relay (Vite) para conexión entre pestañas y WiFi
    if (USE_DEV_RELAY) try {
      const es = new EventSource(`/api/judge-stream?role=judge&room=${roomId}`);
      eventSourceInstance = es;
      es.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg && msg.type === 'STATE_SYNC') {
            setSyncState(msg.payload);
            setIsConnected(true);
            setConnectionType((prev) => prev || 'local');
            lastMsgTimeRef.current = Date.now();
          }
        } catch {}
      };
      es.onerror = () => {
        // Fallback transparente si no estamos en entorno Vite dev
      };
    } catch {}

    // 3. Conectar por PeerJS (para móviles o diferentes dominios)
    const hostPeerId = `${PEER_PREFIX}${roomId}`;

    let isConnecting = false;
    let connectTimeout: NodeJS.Timeout | null = null;

    const scheduleReconnect = (delay: number) => {
      if (!isSubscribed) return;
      if (webrtcReconnectTimeout) clearTimeout(webrtcReconnectTimeout);
      webrtcReconnectTimeout = setTimeout(() => {
        webrtcReconnectTimeout = null;
        connectPeer();
      }, delay);
    };

    const connectPeer = async () => {
      if (!isSubscribed || isConnecting) return;
      isConnecting = true;
      const peerOptions = await getPeerOptions();
      if (!isSubscribed) {
        isConnecting = false;
        return;
      }
      try {
        if (peerInstance && !peerInstance.destroyed) {
          peerInstance.destroy();
        }
        connRef.current = null;

        const peer = new Peer(peerOptions);
        peerInstance = peer;
        peerRef.current = peer;
        const isCurrentPeer = () => isSubscribed && peerInstance === peer;

        // Si la conexión no llega a abrirse, reintentar
        if (connectTimeout) clearTimeout(connectTimeout);
        connectTimeout = setTimeout(() => {
          if (!isCurrentPeer()) return;
          if (!connRef.current || !connRef.current.open) {
            isConnecting = false;
            connectPeer();
          }
        }, JUDGE_CONNECT_TIMEOUT_MS);

        peer.on('open', () => {
          if (!isCurrentPeer()) return;
          const conn = peer.connect(hostPeerId, { reliable: true });

          conn.on('open', () => {
            if (!isCurrentPeer()) return;
            isConnecting = false;
            if (connectTimeout) clearTimeout(connectTimeout);
            connRef.current = conn;
            setIsConnected(true);
            setConnectionType((prev) => prev || 'webrtc');
            lastMsgTimeRef.current = Date.now();
            conn.send({ type: 'REQUEST_SYNC' });
            // Reenviar al instante lo que se pulsó durante el corte
            flushPendingActions(true);
          });

          conn.on('data', (data) => {
            if (!isCurrentPeer()) return;
            const msg = data as HostMessage;
            lastMsgTimeRef.current = Date.now();
            setIsConnected(true);
            setConnectionType('webrtc');
            if (!handleHostMessage(msg)) {
              try {
                conn.send({ type: 'REQUEST_SYNC' });
              } catch {}
            }
          });

          const handleConnLost = () => {
            // Ignorar eventos de conexiones/peers antiguos ya sustituidos
            if (!isCurrentPeer()) return;
            if (connRef.current && connRef.current !== conn) return;
            connRef.current = null;
            isConnecting = false;
            scheduleReconnect(1000);
          };
          conn.on('close', handleConnLost);
          conn.on('error', handleConnLost);
        });

        peer.on('disconnected', () => {
          // Perder el servidor de emparejamiento no corta un canal ya abierto
          if (!isCurrentPeer()) return;
          if (!connRef.current || !connRef.current.open) {
            try {
              peer.reconnect();
            } catch {}
          }
        });

        peer.on('error', (err) => {
          if (!isCurrentPeer()) return;
          console.warn('PeerJS Juez aviso:', err.type, err.message);
          if (!connRef.current || !connRef.current.open) {
            isConnecting = false;
            scheduleReconnect(2000);
          }
        });
      } catch (e) {
        isConnecting = false;
        console.warn('Error inicializando Peer Juez:', e);
        scheduleReconnect(3000);
      }
    };

    connectPeer();

    // Al volver a la app (pantalla bloqueada, cambio de app...) reconectar y pedir estado
    const handleVisibility = () => {
      if (!isSubscribed || document.visibilityState !== 'visible') return;
      if (connRef.current && connRef.current.open) {
        try {
          connRef.current.send({ type: 'REQUEST_SYNC' });
        } catch {}
      } else if (!isConnecting) {
        if (webrtcReconnectTimeout) clearTimeout(webrtcReconnectTimeout);
        connectPeer();
      }
      if (broadcastRef.current) {
        try {
          broadcastRef.current.postMessage({ type: 'REQUEST_SYNC' });
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Heartbeat bidireccional cada 2 segundos
    const pingInterval = setInterval(() => {
      if (!isSubscribed) return;
      const pingMsg: JudgeActionMessage = { type: 'JUDGE_PING' };
      if (broadcastRef.current) {
        try {
          broadcastRef.current.postMessage(pingMsg);
        } catch {}
      }
      if (connRef.current && connRef.current.open) {
        try {
          connRef.current.send(pingMsg);
        } catch {}
      }
    }, 2000);

    // Detección de pérdida de conexión (margen generoso de 10s)
    const livenessInterval = setInterval(() => {
      if (!isSubscribed) return;
      const timeSinceLastMsg = Date.now() - lastMsgTimeRef.current;
      const isWebRTCOpen = !!(connRef.current && connRef.current.open);
      const isEventSourceOpen = eventSourceInstance?.readyState === EventSource.OPEN;

      // Canal WebRTC "abierto" pero mudo (cambio de antena, red móvil...): forzar reconexión
      if (isWebRTCOpen && timeSinceLastMsg > JUDGE_DEAD_CONNECTION_MS && !isConnecting) {
        try {
          connRef.current?.close();
        } catch {}
        connRef.current = null;
        connectPeer();
      }

      if (timeSinceLastMsg > 10000 && !isWebRTCOpen && !isEventSourceOpen) {
        setIsConnected(false);
        // Solicitar re-sincronización activa
        if (broadcastRef.current) {
          broadcastRef.current.postMessage({ type: 'REQUEST_SYNC' });
        }
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (connectTimeout) clearTimeout(connectTimeout);
      if (webrtcReconnectTimeout) {
        clearTimeout(webrtcReconnectTimeout);
      }
      clearInterval(pingInterval);
      clearInterval(livenessInterval);
      if (broadcastRef.current) {
        broadcastRef.current.close();
        broadcastRef.current = null;
      }
      if (eventSourceInstance) {
        eventSourceInstance.close();
      }
      if (peerInstance) {
        peerInstance.destroy();
        peerRef.current = null;
      }
    };
  }, [roomId]); // ¡SOLAMENTE depende de roomId!

  return {
    isConnected,
    connectionType,
    syncState,
    syncReceivedAt,
    sendAction,
    pendingCount,
  };
}


