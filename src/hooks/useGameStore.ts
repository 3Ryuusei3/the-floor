import { create } from 'zustand';
import { GamePhase, Player, BoardTile, DuelSession, GameSettings, BoardStep, GameStats, DuelRecord } from '../types/game';
import { BUILTIN_CATEGORIES, loadCategoryItems, shuffleItems } from '../data/categoriesRegistry';
import {
  generateNeutralBoardTiles,
  recalculateTerritories,
  getConqueredBlockIndices,
  detectMergedTerritoryTopics,
  getPlayerConnectedComponents,
} from '../utils/boardLogic';
import { soundEngine } from '../utils/soundEngine';

export interface PendingMergedTopic {
  winnerId: string;
  componentTileIndices: number[];
  availableCategorySlugs: string[];
  decisionAfter: 'continue' | 'board';
}

export interface GrandFinalTopicOption {
  slug: string;
  name: string;
  tileIndex: number;
  ownerPlayerId: string;
}

export interface PendingGrandFinalTopicChoice {
  activeChooserId: string;
  opponentId: string;
  topics: GrandFinalTopicOption[];
}

export interface ActiveRoulette {
  isOpen: boolean;
  type: 'challenger' | 'defender' | 'grand_final_opponent';
  candidates: Player[];
  winner: Player | null;
  pendingDefenderTileIndex?: number | null;
  grandFinalData?: {
    activeChooserId: string;
    topics: GrandFinalTopicOption[];
  };
}

interface GameState {
  phase: GamePhase;
  settings: GameSettings;
  isDevMode: boolean; // Modo desarrollador
  players: Player[];
  tiles: BoardTile[];
  activeChallengerId: string | null;
  selectedTileIndex: number | null;
  boardStep: BoardStep;
  lastDefenderId: string | null;
  chosenRoulettePlayers: string[];
  lastDuelParticipants: string[];
  currentDuel: DuelSession | null;
  lastDuelSnapshot: DuelSession | null;
  pendingMergedTopicSelection: PendingMergedTopic | null;
  pendingGrandFinalTopicChoice: PendingGrandFinalTopicChoice | null;
  activeRoulette: ActiveRoulette | null;
  stats: GameStats;
  isSoundMuted: boolean;
  isJudgeConnected: boolean;
  conqueringTiles: number[];

  // Acciones
  setSettings: (settings: Partial<GameSettings>) => void;
  setIsDevMode: (enabled: boolean) => void;
  initDevQuickGame: (rows?: number, cols?: number) => void; // Iniciar partida rápida con 2 jugadores 1 y 2
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (id: string) => void;
  updatePlayer: (player: Player) => void;
  initGame: (players?: Player[], customRows?: number, customCols?: number) => void;
  
  // Tablero, Ruleta y Selección
  setBoardStep: (step: BoardStep) => void;
  setActiveChallenger: (id: string | null, tileIndex?: number | null) => void;
  claimStartingTile: (playerId: string, tileIndex: number) => void;
  openChallengerRoulette: () => void;
  openDefenderRoulette: (tileIndex: number) => void;
  setRouletteWinner: (player: Player) => void;
  confirmRouletteWinner: () => void;
  closeRoulette: () => void;
  applyMergedTopic: (categorySlug: string) => void;
  recordPlayerChosenInRoulette: (playerId: string) => void;
  startGrandFinalDuel: (chosenCategorySlug: string, defendedTileIndex: number) => Promise<void>;

  // Duelo
  startDuel: (challengerId: string, defenderId: string, defendedTileIndex: number, isGrandFinal?: boolean) => Promise<void>;
  startDuelCountdown: () => void;
  startDuelRunning: () => void;
  tickDuel: (deltaSeconds: number) => void;
  handleCorrectAnswer: () => void;
  handlePassAnswer: () => void;
  forceDuelWinner: (winnerId: string) => void; // Finalizar duelo en modo developer
  undoLastDuelAction: () => void;
  togglePauseDuel: () => void;
  adjustDuelTime: (target: 'challenger' | 'defender', secondsDelta: number) => void;
  resolveDuelEnd: (winnerId: string, loserId: string, defendedTileIndex: number, decision: 'continue' | 'board') => void;
  decidePostDuel: (decision: 'continue' | 'board') => void;

  // Utilidades y Conexión
  setIsJudgeConnected: (connected: boolean) => void;
  toggleSound: () => void;
  resetToSetup: () => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  gridRows: 4,
  gridCols: 6, // 24 casillas por defecto
  duelTime: 45,
  passPenaltyTime: 3,
};

const INITIAL_STATS: GameStats = {
  totalDuels: 0,
  eliminationOrder: [],
  duelRecords: [],
  playerStats: {},
};

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'setup',
  settings: DEFAULT_SETTINGS,
  isDevMode: false,
  players: [],
  tiles: [],
  activeChallengerId: null,
  selectedTileIndex: null,
  boardStep: 'INITIAL_ROULETTE',
  lastDefenderId: null,
  chosenRoulettePlayers: [],
  lastDuelParticipants: [],
  currentDuel: null,
  lastDuelSnapshot: null,
  pendingMergedTopicSelection: null,
  pendingGrandFinalTopicChoice: null,
  activeRoulette: null,
  stats: INITIAL_STATS,
  isSoundMuted: false,
  isJudgeConnected: false,
  conqueringTiles: [],

  setSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),

  setIsDevMode: (enabled) => set({ isDevMode: enabled }),

  initDevQuickGame: (customRows = 2, customCols = 2) => {
    const p1: Player = {
      id: 'player_dev_1',
      name: '1',
      color: '#00f0ff',
      territoryCount: 0,
      duelsWon: 0,
      isEliminated: false,
    };
    const p2: Player = {
      id: 'player_dev_2',
      name: '2',
      color: '#ff2a4b',
      territoryCount: 0,
      duelsWon: 0,
      isEliminated: false,
    };
    set({
      isDevMode: true,
      settings: {
        ...get().settings,
        gridRows: customRows,
        gridCols: customCols,
      },
    });
    get().initGame([p1, p2], customRows, customCols);
  },

  setPlayers: (players) => set({ players }),

  addPlayer: (player) =>
    set((state) => ({ players: [...state.players, player] })),

  removePlayer: (id) =>
    set((state) => ({ players: state.players.filter((p) => p.id !== id) })),

  updatePlayer: (player) =>
    set((state) => ({
      players: state.players.map((p) => (p.id === player.id ? player : p)),
    })),

  initGame: (customPlayers, customRows, customCols) => {
    const state = get();
    const playersToUse = customPlayers || state.players;
    const rows = customRows || state.settings.gridRows;
    const cols = customCols || state.settings.gridCols;

    if (playersToUse.length === 0) return;

    const tiles = generateNeutralBoardTiles(rows, cols, BUILTIN_CATEGORIES);
    const updatedPlayers = playersToUse.map((p) => ({
      ...p,
      territoryCount: 0,
      duelsWon: 0,
      isEliminated: false,
    }));

    const initialPlayerStats: GameStats['playerStats'] = {};
    playersToUse.forEach((p) => {
      initialPlayerStats[p.id] = {
        duelsPlayed: 0,
        duelsWon: 0,
        duelsLost: 0,
        correctAnswers: 0,
        passAnswers: 0,
        peakTerritory: 0,
      };
    });

    set({
      players: updatedPlayers,
      tiles,
      phase: 'board',
      activeChallengerId: null,
      selectedTileIndex: null,
      boardStep: 'INITIAL_ROULETTE',
      lastDefenderId: null,
      chosenRoulettePlayers: [],
      lastDuelParticipants: [],
      currentDuel: null,
      lastDuelSnapshot: null,
      pendingMergedTopicSelection: null,
      pendingGrandFinalTopicChoice: null,
      stats: {
        totalDuels: 0,
        eliminationOrder: [],
        duelRecords: [],
        playerStats: initialPlayerStats,
      },
      conqueringTiles: [],
    });
  },

  setBoardStep: (step) => set({ boardStep: step }),

  setActiveChallenger: (id, tileIndex = null) =>
    set({ activeChallengerId: id, selectedTileIndex: tileIndex }),

  recordPlayerChosenInRoulette: (playerId: string) => {
    set((state) => {
      const updated = state.chosenRoulettePlayers.includes(playerId)
        ? state.chosenRoulettePlayers
        : [...state.chosenRoulettePlayers, playerId];
      return { chosenRoulettePlayers: updated };
    });
  },

  claimStartingTile: (playerId, tileIndex) => {
    const { tiles, players } = get();
    const updatedTiles = tiles.map((t) =>
      t.index === tileIndex ? { ...t, playerId } : t
    );
    const updatedPlayers = recalculateTerritories(updatedTiles, players);

    set({
      tiles: updatedTiles,
      players: updatedPlayers,
      activeChallengerId: playerId,
      selectedTileIndex: tileIndex,
      boardStep: 'SELECT_ADJACENT_TOPIC',
    });
  },

  openChallengerRoulette: () => {
    const { players, chosenRoulettePlayers } = get();
    const active = players.filter((p) => !p.isEliminated);
    if (active.length === 0) return;

    // Regla estricta: Si hay jugadores sin casillas, salen OBLIGATORIAMENTE antes que nadie con casillas
    const unplaced = active.filter((p) => p.territoryCount === 0);
    const pool = unplaced.length > 0 ? unplaced : active;

    const unchosen = pool.filter((p) => !chosenRoulettePlayers.includes(p.id));
    const candidates = unchosen.length > 0 ? unchosen : pool;

    set({
      activeRoulette: {
        isOpen: true,
        type: 'challenger',
        candidates,
        winner: null,
      },
    });
  },

  openDefenderRoulette: (tileIndex: number) => {
    const { players, activeChallengerId, chosenRoulettePlayers } = get();
    const available = players.filter(
      (p) => !p.isEliminated && p.id !== activeChallengerId
    );
    if (available.length === 0) return;

    // Regla estricta: Si hay rivales sin casillas, salen OBLIGATORIAMENTE para defender la casilla neutral
    const unplaced = available.filter((p) => p.territoryCount === 0);
    const pool = unplaced.length > 0 ? unplaced : available;

    const unchosen = pool.filter((p) => !chosenRoulettePlayers.includes(p.id));
    const candidates = unchosen.length > 0 ? unchosen : pool;

    set({
      activeRoulette: {
        isOpen: true,
        type: 'defender',
        candidates,
        winner: null,
        pendingDefenderTileIndex: tileIndex,
      },
    });
  },

  setRouletteWinner: (player: Player) => {
    set((state) => ({
      activeRoulette: state.activeRoulette
        ? { ...state.activeRoulette, winner: player }
        : null,
    }));
  },

  confirmRouletteWinner: () => {
    const {
      activeRoulette,
      tiles,
      recordPlayerChosenInRoulette,
      setActiveChallenger,
      setBoardStep,
      startDuel,
      activeChallengerId,
    } = get();

    if (!activeRoulette || !activeRoulette.winner) return;

    const winner = activeRoulette.winner;
    recordPlayerChosenInRoulette(winner.id);

    if (activeRoulette.type === 'challenger') {
      if (winner.territoryCount > 0) {
        const firstTile = tiles.find((t) => t.playerId === winner.id);
        setActiveChallenger(winner.id, firstTile?.index || null);
        setBoardStep('SELECT_ADJACENT_TOPIC');
      } else {
        setActiveChallenger(winner.id, null);
        setBoardStep('CHALLENGER_SELECT_START_TILE');
      }
    } else if (
      activeRoulette.type === 'defender' &&
      typeof activeRoulette.pendingDefenderTileIndex === 'number' &&
      activeChallengerId
    ) {
      startDuel(activeChallengerId, winner.id, activeRoulette.pendingDefenderTileIndex);
    } else if (activeRoulette.type === 'grand_final_opponent') {
      const gfData = activeRoulette.grandFinalData;
      if (gfData) {
        const updatedTopics = gfData.topics.map((t) => ({
          ...t,
          ownerPlayerId: t.ownerPlayerId || winner.id,
        }));
        set({
          pendingGrandFinalTopicChoice: {
            activeChooserId: gfData.activeChooserId,
            opponentId: winner.id,
            topics: updatedTopics,
          },
          activeRoulette: null,
          boardStep: 'GRAND_FINAL_TOPIC_SELECTION',
        });
        return;
      }
    }

    set({ activeRoulette: null });
  },

  closeRoulette: () => set({ activeRoulette: null }),

  applyMergedTopic: (chosenCategorySlug: string) => {
    const { tiles, players, pendingMergedTopicSelection } = get();
    if (!pendingMergedTopicSelection) return;

    const { winnerId, componentTileIndices, decisionAfter } = pendingMergedTopicSelection;

    const updatedTiles = tiles.map((t) => {
      if (componentTileIndices.includes(t.index)) {
        return { ...t, playerId: winnerId, categorySlug: chosenCategorySlug };
      }
      return t;
    });

    const updatedPlayers = recalculateTerritories(updatedTiles, players);
    const activeSurvivors = updatedPlayers.filter((p) => p.territoryCount > 0);
    const hasUnclaimed = updatedTiles.some((t) => t.playerId === null);
    const isAllBoardConquered = updatedTiles.length > 0 && updatedTiles.every((t) => t.playerId === winnerId);

    // COMPROBACIÓN DE VICTORIA TRAS FUSIÓN TERRITORIAL
    if (isAllBoardConquered || (!hasUnclaimed && activeSurvivors.length <= 1)) {
      const champTiles = updatedTiles.map((t) => ({
        ...t,
        playerId: winnerId,
        isPlayed: true,
      }));
      const champPlayers = recalculateTerritories(champTiles, players).map((p) => {
        if (p.id === winnerId) {
          return { ...p, duelsWon: p.duelsWon + 1 };
        }
        return p;
      });

      set({
        tiles: champTiles,
        players: champPlayers,
        phase: 'victory',
        currentDuel: null,
        pendingMergedTopicSelection: null,
        pendingGrandFinalTopicChoice: null,
        activeRoulette: null,
      });
      return;
    }

    // Si quedan 2 temas en el tablero o 2 supervivientes -> Configurar La Gran Final
    const finalTopicMap = new Map<string, GrandFinalTopicOption>();
    updatedTiles.forEach((tile) => {
      if (tile.categorySlug && tile.categorySlug.trim() !== '') {
        if (!finalTopicMap.has(tile.categorySlug)) {
          const meta = BUILTIN_CATEGORIES.find((c) => c.slug === tile.categorySlug);
          finalTopicMap.set(tile.categorySlug, {
            slug: tile.categorySlug,
            name: meta?.name || tile.categorySlug.replace(/_/g, ' ').toUpperCase(),
            tileIndex: tile.index,
            ownerPlayerId: tile.playerId || '',
          });
        }
      }
    });

    const isGrandFinalAfterMerge =
      (!hasUnclaimed && activeSurvivors.length === 2) ||
      (finalTopicMap.size === 2 && activeSurvivors.length >= 1);

    if (isGrandFinalAfterMerge) {
      let activeChooserId = winnerId;

      if (activeSurvivors.length === 2 && !hasUnclaimed) {
        const otherSurvivor = activeSurvivors.find((p) => p.id !== winnerId)!;
        activeChooserId = decisionAfter === 'continue' ? winnerId : otherSurvivor.id;
        const opponentId = decisionAfter === 'continue' ? otherSurvivor.id : winnerId;
        const topics: GrandFinalTopicOption[] = Array.from(finalTopicMap.values());

        set({
          tiles: updatedTiles,
          pendingMergedTopicSelection: null,
          activeChallengerId: activeChooserId,
          boardStep: 'GRAND_FINAL_TOPIC_SELECTION',
          pendingGrandFinalTopicChoice: {
            activeChooserId,
            opponentId,
            topics,
          },
          activeRoulette: null,
        });
        return;
      } else {
        // Hay una casilla neutral o 1 solo superviviente: ¡Ruleta con tensión para elegir el rival!
        activeChooserId = winnerId;
        const otherPlayers = players.filter((p) => p.id !== winnerId);
        const unplaced = otherPlayers.filter((p) => p.territoryCount === 0 && !p.isEliminated);
        const opponentPool = unplaced.length > 0 ? unplaced : otherPlayers.filter((p) => !p.isEliminated);
        const unchosen = opponentPool.filter((p) => !get().chosenRoulettePlayers.includes(p.id));
        const candidates = unchosen.length > 0 ? unchosen : opponentPool;
        const topics: GrandFinalTopicOption[] = Array.from(finalTopicMap.values());

        set({
          tiles: updatedTiles,
          pendingMergedTopicSelection: null,
          activeChallengerId: activeChooserId,
          boardStep: 'GRAND_FINAL_TOPIC_SELECTION',
          pendingGrandFinalTopicChoice: null,
          activeRoulette: {
            isOpen: true,
            type: 'grand_final_opponent',
            candidates,
            winner: null,
            grandFinalData: {
              activeChooserId,
              topics,
            },
          },
        });
        return;
      }
    }

    set({
      tiles: updatedTiles,
      pendingMergedTopicSelection: null,
      activeChallengerId: decisionAfter === 'continue' ? winnerId : null,
      boardStep: decisionAfter === 'continue' ? 'SELECT_ADJACENT_TOPIC' : 'INITIAL_ROULETTE',
    });
  },

  startGrandFinalDuel: async (_chosenCategorySlug: string, defendedTileIndex: number) => {
    const { pendingGrandFinalTopicChoice } = get();
    if (!pendingGrandFinalTopicChoice) return;

    const { activeChooserId, opponentId } = pendingGrandFinalTopicChoice;
    set({ pendingGrandFinalTopicChoice: null });

    await get().startDuel(activeChooserId, opponentId, defendedTileIndex, true);
  },

  startDuel: async (challengerId, defenderId, defendedTileIndex, isExplicitGrandFinal = false) => {
    const { players, tiles, settings } = get();
    const challenger = players.find((p) => p.id === challengerId);
    const defender = players.find((p) => p.id === defenderId);
    const defendedTile = tiles.find((t) => t.index === defendedTileIndex);

    if (!challenger || !defender || !defendedTile) return;

    const categorySlug = defendedTile.categorySlug;
    const builtinCategory = BUILTIN_CATEGORIES.find((c) => c.slug === categorySlug);

    const categoryMeta =
      builtinCategory || {
        slug: categorySlug,
        name: categorySlug.replace(/_/g, ' ').toUpperCase(),
        totalItems: 30,
      };

    const rawItems = await loadCategoryItems(categorySlug);
    const items = shuffleItems(rawItems);

    const activeSurvivors = players.filter((p) => !p.isEliminated && p.territoryCount > 0);
    const hasUnclaimed = tiles.some((t) => t.playerId === null);
    const uniqueTopicsOnBoard = new Set(tiles.map((t) => t.categorySlug).filter(Boolean));
    const isGrandFinalDuel =
      isExplicitGrandFinal ||
      (!hasUnclaimed && activeSurvivors.length === 2) ||
      uniqueTopicsOnBoard.size <= 2 ||
      Boolean(get().pendingGrandFinalTopicChoice);

    const duel: DuelSession = {
      challengerId,
      defenderId,
      defendedTileIndex,
      category: categoryMeta,
      items,
      currentIndex: 0,
      activePlayerId: challengerId,
      challengerTime: settings.duelTime,
      defenderTime: settings.duelTime,
      status: 'intro',
      isFrozen: false,
      frozenSecondsRemaining: 0,
      isPassLocked: false,
      passPenaltySecondsRemaining: 0,
      winnerId: null,
      loserId: null,
      isGrandFinalDuel,
      history: [],
    };

    set({
      currentDuel: duel,
      lastDuelSnapshot: null,
      phase: 'duel',
      lastDefenderId: defenderId,
    });
  },

  startDuelCountdown: () => {
    const { isDevMode } = get();
    if (isDevMode) {
      get().startDuelRunning();
      return;
    }
    set((state) => {
      if (!state.currentDuel) return state;
      return {
        currentDuel: {
          ...state.currentDuel,
          status: 'countdown',
        },
      };
    });
  },

  startDuelRunning: () => {
    set((state) => {
      if (!state.currentDuel) return state;
      return {
        currentDuel: {
          ...state.currentDuel,
          status: 'in_progress',
        },
      };
    });
  },

  tickDuel: (deltaSeconds) => {
    const { currentDuel } = get();
    if (!currentDuel || currentDuel.status !== 'in_progress') return;

    // CASO 1: Congelación por Acierto (1s de pausa donde los relojes NO corren)
    if (currentDuel.isFrozen) {
      const remaining = currentDuel.frozenSecondsRemaining - deltaSeconds;
      if (remaining <= 0) {
        const nextIndex = currentDuel.currentIndex + 1;

        if (nextIndex >= currentDuel.items.length) {
          let winnerId: string;
          let loserId: string;
          if (currentDuel.challengerTime > currentDuel.defenderTime) {
            winnerId = currentDuel.challengerId;
            loserId = currentDuel.defenderId;
          } else if (currentDuel.defenderTime > currentDuel.challengerTime) {
            winnerId = currentDuel.defenderId;
            loserId = currentDuel.challengerId;
          } else {
            winnerId = currentDuel.challengerId;
            loserId = currentDuel.defenderId;
          }
          soundEngine.playBuzzer();
          set((state) => ({
            currentDuel: state.currentDuel
              ? {
                  ...state.currentDuel,
                  status: 'finished',
                  winnerId,
                  loserId,
                  endReason: 'items_exhausted',
                  isFrozen: false,
                  frozenReason: undefined,
                  frozenSecondsRemaining: 0,
                  revealedAnswerText: undefined,
                }
              : null,
          }));
          return;
        }

        // Tras el acierto de 1s, el turno pasa al rival
        const nextPlayerId =
          currentDuel.activePlayerId === currentDuel.challengerId
            ? currentDuel.defenderId
            : currentDuel.challengerId;

        set((state) => ({
          currentDuel: state.currentDuel
            ? {
                ...state.currentDuel,
                currentIndex: nextIndex,
                activePlayerId: nextPlayerId,
                isFrozen: false,
                frozenReason: undefined,
                frozenSecondsRemaining: 0,
                revealedAnswerText: undefined,
              }
            : null,
        }));
      } else {
        set((state) => ({
          currentDuel: state.currentDuel
            ? {
                ...state.currentDuel,
                frozenSecondsRemaining: remaining,
              }
            : null,
        }));
      }
      return;
    }

    // CASO 2: El juego está corriendo (o en bloqueo de 3s por PASO donde el reloj SIGUE corriendo)
    const isChallengerActive = currentDuel.activePlayerId === currentDuel.challengerId;
    let newChallengerTime = currentDuel.challengerTime;
    let newDefenderTime = currentDuel.defenderTime;

    if (isChallengerActive) {
      newChallengerTime = Math.max(0, newChallengerTime - deltaSeconds);
    } else {
      newDefenderTime = Math.max(0, newDefenderTime - deltaSeconds);
    }

    // Comprobar si está en penalización de PASO (3s)
    let isPassLocked = currentDuel.isPassLocked;
    let passPenaltyRemaining = currentDuel.passPenaltySecondsRemaining;
    let currentIndex = currentDuel.currentIndex;
    let revealedAnswer = currentDuel.revealedAnswerText;

    if (isPassLocked) {
      passPenaltyRemaining -= deltaSeconds;
      if (passPenaltyRemaining <= 0) {
        isPassLocked = false;
        passPenaltyRemaining = 0;
        revealedAnswer = undefined;
        currentIndex = currentIndex + 1;

        if (currentIndex >= currentDuel.items.length) {
          let winnerId: string;
          let loserId: string;
          if (newChallengerTime > newDefenderTime) {
            winnerId = currentDuel.challengerId;
            loserId = currentDuel.defenderId;
          } else if (newDefenderTime > newChallengerTime) {
            winnerId = currentDuel.defenderId;
            loserId = currentDuel.challengerId;
          } else {
            winnerId = currentDuel.challengerId;
            loserId = currentDuel.defenderId;
          }
          soundEngine.playBuzzer();
          set((state) => ({
            currentDuel: state.currentDuel
              ? {
                  ...state.currentDuel,
                  status: 'finished',
                  winnerId,
                  loserId,
                  endReason: 'items_exhausted',
                  isPassLocked: false,
                  passPenaltySecondsRemaining: 0,
                  revealedAnswerText: undefined,
                }
              : null,
          }));
          return;
        }
      }
    }

    // Sonidos de advertencia
    const activeTime = isChallengerActive ? newChallengerTime : newDefenderTime;
    if (activeTime > 0 && activeTime <= 5.0) {
      const prevSec = Math.floor(activeTime + deltaSeconds);
      const currSec = Math.floor(activeTime);
      if (prevSec !== currSec) {
        soundEngine.playWarning();
      }
    } else if (activeTime > 5.0) {
      const prevSec = Math.floor(activeTime + deltaSeconds);
      const currSec = Math.floor(activeTime);
      if (prevSec !== currSec) {
        soundEngine.playTick();
      }
    }

    // Fin del tiempo
    if (newChallengerTime <= 0 || newDefenderTime <= 0) {
      soundEngine.playBuzzer();
      const winnerId =
        newChallengerTime <= 0 ? currentDuel.defenderId : currentDuel.challengerId;
      const loserId =
        newChallengerTime <= 0 ? currentDuel.challengerId : currentDuel.defenderId;

      set((state) => ({
        currentDuel: state.currentDuel
          ? {
              ...state.currentDuel,
              challengerTime: newChallengerTime,
              defenderTime: newDefenderTime,
              status: 'finished',
              winnerId,
              loserId,
              endReason: 'timeout',
              isFrozen: false,
              isPassLocked: false,
            }
          : null,
      }));
      return;
    }

    set((state) => ({
      currentDuel: state.currentDuel
        ? {
            ...state.currentDuel,
            challengerTime: newChallengerTime,
            defenderTime: newDefenderTime,
            isPassLocked,
            passPenaltySecondsRemaining: passPenaltyRemaining,
            currentIndex,
            revealedAnswerText: revealedAnswer,
          }
        : null,
    }));
  },

  handleCorrectAnswer: () => {
    const { currentDuel } = get();
    if (!currentDuel || currentDuel.status !== 'in_progress' || currentDuel.isFrozen || currentDuel.isPassLocked) return;

    const snapshot = { ...currentDuel };
    soundEngine.playCorrect();

    const currentItem = currentDuel.items[currentDuel.currentIndex];

    // Pausar 1s con reloj detenido y mostrar respuesta
    set((state) => ({
      lastDuelSnapshot: snapshot,
      currentDuel: state.currentDuel
        ? {
            ...state.currentDuel,
            isFrozen: true,
            frozenReason: 'correct',
            frozenSecondsRemaining: 1.0,
            revealedAnswerText: currentItem?.name || '',
            history: currentItem
              ? [
                  ...state.currentDuel.history,
                  {
                    item: currentItem,
                    answeredBy: state.currentDuel.activePlayerId,
                    action: 'correct',
                    timestamp: Date.now(),
                  },
                ]
              : state.currentDuel.history,
          }
        : null,
    }));
  },

  handlePassAnswer: () => {
    const { currentDuel, settings } = get();
    if (!currentDuel || currentDuel.status !== 'in_progress' || currentDuel.isFrozen || currentDuel.isPassLocked) return;

    const snapshot = { ...currentDuel };
    soundEngine.playPass();

    const currentItem = currentDuel.items[currentDuel.currentIndex];

    // Bloqueo de 3s (el reloj del concursante SIGUE corriendo en tickDuel)
    set((state) => ({
      lastDuelSnapshot: snapshot,
      currentDuel: state.currentDuel
        ? {
            ...state.currentDuel,
            isPassLocked: true,
            passPenaltySecondsRemaining: settings.passPenaltyTime,
            revealedAnswerText: currentItem?.name || '',
            history: currentItem
              ? [
                  ...state.currentDuel.history,
                  {
                    item: currentItem,
                    answeredBy: state.currentDuel.activePlayerId,
                    action: 'pass',
                    timestamp: Date.now(),
                  },
                ]
              : state.currentDuel.history,
          }
        : null,
    }));
  },

  forceDuelWinner: (winnerId: string) => {
    const { currentDuel } = get();
    if (!currentDuel) return;

    soundEngine.playBuzzer();
    const loserId =
      winnerId === currentDuel.challengerId
        ? currentDuel.defenderId
        : currentDuel.challengerId;

    set((state) => ({
      currentDuel: state.currentDuel
        ? {
            ...state.currentDuel,
            status: 'finished',
            winnerId,
            loserId,
            endReason: 'timeout',
            isFrozen: false,
            isPassLocked: false,
          }
        : null,
    }));
  },

  undoLastDuelAction: () => {
    const { lastDuelSnapshot } = get();
    if (!lastDuelSnapshot) return;

    soundEngine.playRouletteBlip(700);

    set({
      currentDuel: { ...lastDuelSnapshot, status: 'in_progress' },
      lastDuelSnapshot: null,
    });
  },

  togglePauseDuel: () => {
    set((state) => {
      if (!state.currentDuel) return state;
      const nextStatus =
        state.currentDuel.status === 'in_progress' ? 'paused' : 'in_progress';
      return {
        currentDuel: {
          ...state.currentDuel,
          status: nextStatus,
        },
      };
    });
  },

  adjustDuelTime: (target, secondsDelta) => {
    set((state) => {
      if (!state.currentDuel) return state;
      if (target === 'challenger') {
        const newTime = Math.max(0.5, Math.min(99, state.currentDuel.challengerTime + secondsDelta));
        return {
          currentDuel: {
            ...state.currentDuel,
            challengerTime: newTime,
          },
        };
      } else {
        const newTime = Math.max(0.5, Math.min(99, state.currentDuel.defenderTime + secondsDelta));
        return {
          currentDuel: {
            ...state.currentDuel,
            defenderTime: newTime,
          },
        };
      }
    });
  },

  resolveDuelEnd: (winnerId, loserId, defendedTileIndex, decision) => {
    const { tiles, players, settings, currentDuel } = get();
    soundEngine.playConquer();

    const defendedTile = tiles.find((t) => t.index === defendedTileIndex);
    const playedCategorySlug = currentDuel?.category.slug || (defendedTile ? defendedTile.categorySlug : '');

    const { stats } = get();
    const pastPlayedCategorySlugs = stats.duelRecords.map((d) => d.categorySlug);

    const challengerId = currentDuel?.challengerId || '';
    const challengerTile = tiles.find((t) => t.playerId === challengerId);
    const challengerTopic = challengerTile ? challengerTile.categorySlug : '';

    // Obtener los índices de casillas conquistadas
    const conqueredTileIndices = getConqueredBlockIndices(
      tiles,
      challengerId,
      winnerId,
      loserId,
      defendedTileIndex,
      settings.gridRows,
      settings.gridCols
    );

    // Simular para encontrar la componente conexa resultante del ganador
    const simulatedTiles = tiles.map((tile) => {
      if (conqueredTileIndices.includes(tile.index) || tile.playerId === winnerId) {
        return { ...tile, playerId: winnerId };
      }
      return tile;
    });
    const winnerComponents = getPlayerConnectedComponents(simulatedTiles, winnerId, settings.gridRows, settings.gridCols);
    const targetComponent = winnerComponents.find((comp) =>
      comp.includes(defendedTileIndex) || conqueredTileIndices.some((idx) => comp.includes(idx))
    ) || conqueredTileIndices;

    // Comprobar si esta conquista une o deja 2 o más temas NO jugados en el bloque conexo resultante
    const mergeDetection = detectMergedTerritoryTopics(
      tiles,
      winnerId,
      conqueredTileIndices,
      defendedTileIndex,
      playedCategorySlug,
      pastPlayedCategorySlugs,
      settings.gridRows,
      settings.gridCols
    );

    // Si no hay selector (solo 1 o 0 temas no jugados), determinar el tema único a asignar
    const playedSet = new Set<string>(
      pastPlayedCategorySlugs.filter(Boolean).concat(playedCategorySlug).filter(Boolean)
    );
    const unplayedInComp: string[] = [];
    targetComponent.forEach((idx) => {
      const orig = tiles.find((t) => t.index === idx);
      if (orig && orig.categorySlug && orig.categorySlug.trim() !== '' && !playedSet.has(orig.categorySlug)) {
        if (!unplayedInComp.includes(orig.categorySlug)) {
          unplayedInComp.push(orig.categorySlug);
        }
      }
    });

    const fallbackTopic = unplayedInComp.length > 0
      ? unplayedInComp[0]
      : (challengerTopic && !playedSet.has(challengerTopic) ? challengerTopic : playedCategorySlug);

    // Actualizar casillas:
    // Si mergeDetection tiene 2+ temas, las casillas conquistadas pasan a winnerId manteniendo sus temas
    // hasta que el usuario elija en el modal.
    // Si NO hay conflicto de temas (0 o 1 tema), todo el bloque conexo adopta el tema único.
    const isTopicConflict = mergeDetection && mergeDetection.availableCategorySlugs.length > 1;

    const updatedTiles = tiles.map((tile) => {
      if (conqueredTileIndices.includes(tile.index)) {
        return {
          ...tile,
          playerId: winnerId,
          categorySlug: isTopicConflict ? tile.categorySlug : fallbackTopic,
        };
      }
      if (!isTopicConflict && targetComponent.includes(tile.index)) {
        return {
          ...tile,
          playerId: winnerId,
          categorySlug: fallbackTopic,
        };
      }
      return tile;
    });

    const updatedPlayers = recalculateTerritories(updatedTiles, players).map((p) => {
      if (p.id === winnerId) {
        return { ...p, duelsWon: p.duelsWon + 1 };
      }
      return p;
    });

    const hasUnclaimed = updatedTiles.some((t) => t.playerId === null);
    const newLastParticipants = [winnerId, loserId];

    // Calcular estadísticas del duelo
    const chId = currentDuel?.challengerId || '';
    const defId = currentDuel?.defenderId || '';

    let correctCountCh = 0;
    let correctCountDef = 0;
    let passCountCh = 0;
    let passCountDef = 0;

    currentDuel?.history?.forEach((h) => {
      if (h.answeredBy === chId) {
        if (h.action === 'correct') correctCountCh++;
        else if (h.action === 'pass') passCountCh++;
      } else if (h.answeredBy === defId) {
        if (h.action === 'correct') correctCountDef++;
        else if (h.action === 'pass') passCountDef++;
      }
    });

    const duelRecord: DuelRecord = {
      id: `duel_${Date.now()}_${stats.totalDuels + 1}`,
      duelNumber: stats.totalDuels + 1,
      challengerId: chId,
      defenderId: defId,
      winnerId,
      loserId,
      categorySlug: currentDuel?.category.slug || playedCategorySlug,
      categoryName: currentDuel?.category.name || playedCategorySlug,
      durationSeconds: Math.max(
        1,
        Math.round(settings.duelTime * 2 - (currentDuel?.challengerTime || 0) - (currentDuel?.defenderTime || 0))
      ),
      challengerTimeLeft: Math.max(0, currentDuel?.challengerTime || 0),
      defenderTimeLeft: Math.max(0, currentDuel?.defenderTime || 0),
      correctAnswersCount: { [chId]: correctCountCh, [defId]: correctCountDef },
      passAnswersCount: { [chId]: passCountCh, [defId]: passCountDef },
      endReason: currentDuel?.endReason || 'timeout',
    };

    // Actualizar orden de eliminación
    const newEliminationOrder = [...stats.eliminationOrder];
    const loserPlayer = updatedPlayers.find((p) => p.id === loserId);
    if (loserPlayer && loserPlayer.territoryCount === 0 && !newEliminationOrder.includes(loserId)) {
      newEliminationOrder.push(loserId);
    }

    // Actualizar estadísticas por jugador
    const newPlayerStats = { ...stats.playerStats };
    [chId, defId].forEach((pId) => {
      if (!pId) return;
      const prev = newPlayerStats[pId] || {
        duelsPlayed: 0,
        duelsWon: 0,
        duelsLost: 0,
        correctAnswers: 0,
        passAnswers: 0,
        peakTerritory: 0,
      };
      const isWinner = pId === winnerId;
      const pPlayer = updatedPlayers.find((p) => p.id === pId);
      const currentTerritory = pPlayer?.territoryCount || 0;

      newPlayerStats[pId] = {
        duelsPlayed: prev.duelsPlayed + 1,
        duelsWon: prev.duelsWon + (isWinner ? 1 : 0),
        duelsLost: prev.duelsLost + (isWinner ? 0 : 1),
        correctAnswers: prev.correctAnswers + (pId === chId ? correctCountCh : correctCountDef),
        passAnswers: prev.passAnswers + (pId === chId ? passCountCh : passCountDef),
        peakTerritory: Math.max(prev.peakTerritory, currentTerritory),
      };
    });

    const updatedStats: GameStats = {
      totalDuels: stats.totalDuels + 1,
      eliminationOrder: newEliminationOrder,
      duelRecords: [...stats.duelRecords, duelRecord],
      playerStats: newPlayerStats,
    };

    // Si este duelo era la Gran Final, el ganador conquista TODO el tablero restante (100%)
    let resolvedTiles = updatedTiles;
    if (currentDuel?.isGrandFinalDuel) {
      resolvedTiles = tiles.map((t) => ({
        ...t,
        playerId: winnerId,
        isPlayed: true,
      }));
    }

    const finalPlayers = recalculateTerritories(resolvedTiles, players).map((p) => {
      if (p.id === winnerId) {
        return { ...p, duelsWon: p.duelsWon + 1 };
      }
      return p;
    });

    const finalSurvivors = finalPlayers.filter((p) => p.territoryCount > 0);
    const resolvedHasUnclaimed = resolvedTiles.some((t) => t.playerId === null);
    const isAllBoardConquered = resolvedTiles.length > 0 && resolvedTiles.every((t) => t.playerId === winnerId);

    // CASO 1: ¡TENEMOS UN CAMPEÓN! (Solo 1 superviviente queda en el tablero, o todas las casillas son del ganador, o Gran Final terminada)
    if (isAllBoardConquered || (!resolvedHasUnclaimed && finalSurvivors.length <= 1) || (currentDuel?.isGrandFinalDuel && winnerId)) {
      const champTiles = resolvedTiles.map((t) => ({
        ...t,
        playerId: winnerId,
        isPlayed: true,
      }));
      const champPlayers = recalculateTerritories(champTiles, players).map((p) => {
        if (p.id === winnerId) {
          return { ...p, duelsWon: p.duelsWon + 1 };
        }
        return p;
      });

      set({
        tiles: champTiles,
        players: champPlayers,
        stats: updatedStats,
        phase: 'victory',
        currentDuel: null,
        conqueringTiles: conqueredTileIndices,
        pendingMergedTopicSelection: null,
        pendingGrandFinalTopicChoice: null,
        activeRoulette: null,
        lastDuelParticipants: newLastParticipants,
      });
      return;
    }

    // CASO 2: FUSIÓN TERRITORIAL (Unión de 2 o más islas del mismo jugador)
    if (mergeDetection && mergeDetection.availableCategorySlugs.length > 1) {
      set({
        tiles: resolvedTiles,
        players: finalPlayers,
        stats: updatedStats,
        phase: 'board',
        currentDuel: null,
        conqueringTiles: conqueredTileIndices,
        lastDuelParticipants: newLastParticipants,
        pendingGrandFinalTopicChoice: null,
        pendingMergedTopicSelection: {
          winnerId,
          componentTileIndices: mergeDetection.componentTileIndices,
          availableCategorySlugs: mergeDetection.availableCategorySlugs,
          decisionAfter: decision,
        },
      });
      return;
    }

    // CASO 3: ¡LA GRAN FINAL! (Quedan 2 temas en el tablero o 2 supervivientes sin casillas neutrales)
    const topicMap = new Map<string, GrandFinalTopicOption>();
    resolvedTiles.forEach((tile) => {
      if (tile.categorySlug && tile.categorySlug.trim() !== '') {
        if (!topicMap.has(tile.categorySlug)) {
          const meta = BUILTIN_CATEGORIES.find((c) => c.slug === tile.categorySlug);
          topicMap.set(tile.categorySlug, {
            slug: tile.categorySlug,
            name: meta?.name || tile.categorySlug.replace(/_/g, ' ').toUpperCase(),
            tileIndex: tile.index,
            ownerPlayerId: tile.playerId || '',
          });
        }
      }
    });

    const isGrandFinalCondition =
      (!hasUnclaimed && finalSurvivors.length === 2) ||
      (topicMap.size === 2 && finalSurvivors.length >= 1);

    if (isGrandFinalCondition) {
      let activeChooserId = winnerId;

      if (finalSurvivors.length === 2 && !hasUnclaimed) {
        const otherSurvivor = finalSurvivors.find((p) => p.id !== winnerId)!;
        activeChooserId = decision === 'continue' ? winnerId : otherSurvivor.id;
        const opponentId = decision === 'continue' ? otherSurvivor.id : winnerId;
        const topics: GrandFinalTopicOption[] = Array.from(topicMap.values());

        set({
          tiles: resolvedTiles,
          players: finalPlayers,
          stats: updatedStats,
          phase: 'board',
          activeChallengerId: activeChooserId,
          boardStep: 'GRAND_FINAL_TOPIC_SELECTION',
          currentDuel: null,
          conqueringTiles: conqueredTileIndices,
          lastDuelParticipants: newLastParticipants,
          pendingMergedTopicSelection: null,
          pendingGrandFinalTopicChoice: {
            activeChooserId,
            opponentId,
            topics,
          },
          activeRoulette: null,
        });
        return;
      } else {
        // Hay una casilla neutral o 1 solo superviviente: ¡Ruleta con tensión para elegir el rival!
        activeChooserId = winnerId;
        const otherPlayers = finalPlayers.filter((p) => p.id !== winnerId);
        const unplaced = otherPlayers.filter((p) => p.territoryCount === 0 && !p.isEliminated);
        const opponentPool = unplaced.length > 0 ? unplaced : otherPlayers.filter((p) => !p.isEliminated);
        const unchosen = opponentPool.filter((p) => !get().chosenRoulettePlayers.includes(p.id));
        const candidates = unchosen.length > 0 ? unchosen : opponentPool;
        const topics: GrandFinalTopicOption[] = Array.from(topicMap.values());

        set({
          tiles: resolvedTiles,
          players: finalPlayers,
          stats: updatedStats,
          phase: 'board',
          activeChallengerId: activeChooserId,
          boardStep: 'GRAND_FINAL_TOPIC_SELECTION',
          currentDuel: null,
          conqueringTiles: conqueredTileIndices,
          lastDuelParticipants: newLastParticipants,
          pendingMergedTopicSelection: null,
          pendingGrandFinalTopicChoice: null,
          activeRoulette: {
            isOpen: true,
            type: 'grand_final_opponent',
            candidates,
            winner: null,
            grandFinalData: {
              activeChooserId,
              topics,
            },
          },
        });
        return;
      }
    }

    // CASO 4: CONTINUACIÓN REGULAR DE PARTIDA
    set({
      tiles: resolvedTiles,
      players: finalPlayers,
      stats: updatedStats,
      phase: 'board',
      activeChallengerId: decision === 'continue' ? winnerId : null,
      boardStep: decision === 'continue' ? 'SELECT_ADJACENT_TOPIC' : 'INITIAL_ROULETTE',
      currentDuel: null,
      conqueringTiles: conqueredTileIndices,
      lastDuelParticipants: newLastParticipants,
      pendingMergedTopicSelection: null,
      pendingGrandFinalTopicChoice: null,
    });
  },

  decidePostDuel: (decision) => {
    const { currentDuel } = get();
    if (!currentDuel || !currentDuel.winnerId || !currentDuel.loserId) return;

    get().resolveDuelEnd(
      currentDuel.winnerId,
      currentDuel.loserId,
      currentDuel.defendedTileIndex,
      decision
    );
  },

  setIsJudgeConnected: (connected) => set({ isJudgeConnected: connected }),

  toggleSound: () => {
    set((state) => {
      const next = !state.isSoundMuted;
      soundEngine.setMuted(next);
      return { isSoundMuted: next };
    });
  },

  resetToSetup: () => {
    set({
      phase: 'setup',
      currentDuel: null,
      lastDuelSnapshot: null,
      activeChallengerId: null,
      selectedTileIndex: null,
      boardStep: 'INITIAL_ROULETTE',
      lastDefenderId: null,
      chosenRoulettePlayers: [],
      lastDuelParticipants: [],
      pendingMergedTopicSelection: null,
      pendingGrandFinalTopicChoice: null,
      activeRoulette: null,
      conqueringTiles: [],
    });
  },
}));
