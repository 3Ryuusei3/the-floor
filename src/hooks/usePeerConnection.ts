import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { useGameStore } from './useGameStore';
import { HostMessage, JudgeActionMessage, HostSyncPayload, JudgeDuelSync } from '../types/peer';
import { DuelSession } from '../types/game';
import { getAdjacentAttackableTileIndices } from '../utils/boardLogic';
import { getIceServers } from '../utils/iceServers';

const PEER_PREFIX = 'floor-game-room-';

// El relay SSE/HTTP (/api/judge-*) solo existe en el servidor de desarrollo de Vite
const USE_DEV_RELAY = import.meta.env.DEV;

// Mientras el reloj corre, el mando interpola localmente: basta con re-sincronizar cada segundo
const CLOCK_RESYNC_MS = 1000;

async function getPeerOptions() {
  const iceServers = await getIceServers();
  return { config: { iceServers } };
}

// Quitar del duelo lo que el mando no necesita (lista de ítems e historial)
function toJudgeDuel(duel: DuelSession | null): JudgeDuelSync | null {
  if (!duel) return null;
  const { items, history: _history, ...rest } = duel;
  return {
    ...rest,
    itemsCount: items.length,
    currentItem: items[duel.currentIndex] || null,
    nextItem: items[duel.currentIndex + 1] || null,
  };
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

  // Enviar estado actual al juez (por BroadcastChannel, Local Relay y WebRTC)
  const sendSync = useCallback((conn?: DataConnection | null) => {
    const targetConn = conn || connRef.current;
    const payload: HostSyncPayload = {
      ...stateRef.current,
      isJudgeConnected: true,
    };

    const msg: HostMessage = { type: 'STATE_SYNC', payload };

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

    // 3. Local / LAN Relay (Vite, solo en desarrollo)
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
      if (lastExecuted && now - lastExecuted < 3000) {
        // Acción ya procesada por otro canal (WebRTC / LAN / BroadcastChannel)
        return;
      }
      processedActionIdsRef.current.set(actionKey, now);

      // Limpieza de claves antiguas periódica
      if (processedActionIdsRef.current.size > 200) {
        for (const [k, time] of processedActionIdsRef.current.entries()) {
          if (now - time > 10000) {
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

    // 1. BroadcastChannel para conexión inmediata entre pestañas locales del mismo origen
    try {
      const bc = new BroadcastChannel(`the-floor-${roomId}`);
      broadcastRef.current = bc;
      bc.onmessage = (event) => {
        if (!isSubscribed) return;
        const msg = event.data as JudgeActionMessage;
        if (!msg || !msg.type) return;

        if (msg.type === 'REQUEST_SYNC' || msg.type === 'JUDGE_PING') {
          refreshLocalPresence();
          sendSync(); // Responder inmediatamente al juez con el estado
        } else if (msg.type.startsWith('ACTION_')) {
          refreshLocalPresence();
          handleJudgeMessage(msg);
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
          connRef.current = conn;

          conn.on('open', () => {
            if (!isSubscribed) return;
            setIsConnected(true);
            setIsJudgeConnected(true);
            sendSync(conn);
          });

          conn.on('data', (data) => {
            if (!isSubscribed) return;
            const action = data as JudgeActionMessage;
            if (action.type === 'REQUEST_SYNC' || action.type === 'JUDGE_PING') {
              setIsConnected(true);
              setIsJudgeConnected(true);
              sendSync(conn);
            } else if (action.type.startsWith('ACTION_')) {
              handleJudgeMessage(action);
            }
          });

          conn.on('close', () => {
            if (!isSubscribed) return;
            connRef.current = null;
            if (!isLocalPresentRef.current) {
              setIsConnected(false);
              setIsJudgeConnected(false);
            }
          });

          conn.on('error', () => {
            if (!isSubscribed) return;
            connRef.current = null;
            if (!isLocalPresentRef.current) {
              setIsConnected(false);
              setIsJudgeConnected(false);
            }
          });
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
              sendSync();
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
  }, [roomId, handleJudgeMessage, sendSync, refreshLocalPresence, setIsJudgeConnected]);

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
  const setSyncState = useCallback((payload: HostSyncPayload) => {
    setSyncStateRaw(payload);
    setSyncReceivedAt(performance.now());
  }, []);
  const connRef = useRef<DataConnection | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const lastMsgTimeRef = useRef<number>(Date.now());

  const sendAction = useCallback((action: JudgeActionMessage) => {
    // Generar ID único para la acción y timestamp para evitar doble ejecución si se recibe por múltiples canales
    const actionWithId: JudgeActionMessage = {
      ...action,
      actionId: action.actionId || `${action.type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: action.timestamp || Date.now(),
    };

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
        if (msg && msg.type === 'STATE_SYNC') {
          setSyncState(msg.payload);
          setIsConnected(true);
          setConnectionType('local');
          lastMsgTimeRef.current = Date.now();
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

    const connectPeer = async () => {
      if (!isSubscribed) return;
      const peerOptions = await getPeerOptions();
      if (!isSubscribed) return;
      try {
        if (peerInstance && !peerInstance.destroyed) {
          peerInstance.destroy();
        }

        const peer = new Peer(peerOptions);
        peerInstance = peer;
        peerRef.current = peer;

        peer.on('open', () => {
          if (!isSubscribed) return;
          const conn = peer.connect(hostPeerId, { reliable: true });
          connRef.current = conn;

          conn.on('open', () => {
            if (!isSubscribed) return;
            setIsConnected(true);
            setConnectionType((prev) => prev || 'webrtc');
            lastMsgTimeRef.current = Date.now();
            conn.send({ type: 'REQUEST_SYNC' });
          });

          conn.on('data', (data) => {
            if (!isSubscribed) return;
            const msg = data as HostMessage;
            if (msg && msg.type === 'STATE_SYNC') {
              setSyncState(msg.payload);
              setIsConnected(true);
              setConnectionType('webrtc');
              lastMsgTimeRef.current = Date.now();
            }
          });

          conn.on('close', () => {
            if (!isSubscribed) return;
            connRef.current = null;
            if (webrtcReconnectTimeout) clearTimeout(webrtcReconnectTimeout);
            webrtcReconnectTimeout = setTimeout(connectPeer, 3000);
          });

          conn.on('error', () => {
            if (!isSubscribed) return;
            connRef.current = null;
            if (webrtcReconnectTimeout) clearTimeout(webrtcReconnectTimeout);
            webrtcReconnectTimeout = setTimeout(connectPeer, 3000);
          });
        });

        peer.on('error', (err) => {
          console.warn('PeerJS Juez aviso:', err.type, err.message);
          if (isSubscribed) {
            if (webrtcReconnectTimeout) clearTimeout(webrtcReconnectTimeout);
            webrtcReconnectTimeout = setTimeout(connectPeer, 4000);
          }
        });
      } catch (e) {
        console.warn('Error inicializando Peer Juez:', e);
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
      } else {
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
  };
}


