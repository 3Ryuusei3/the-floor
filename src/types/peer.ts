import { GamePhase, DuelSession, Player, BoardTile, BoardStep } from './game';
import { CategoryItem } from './category';

// Ítem para el mando: incluye una miniatura ligera además de la imagen original
export type JudgeItem = CategoryItem & { thumb?: string };

// Duelo aligerado para el mando: sin la lista completa de ítems ni el historial
export type JudgeDuelSync = Omit<DuelSession, 'items' | 'history'> & {
  itemsCount: number;
  currentItem: JudgeItem | null;
  nextItem: JudgeItem | null;
};

export interface ActiveRouletteSync {
  isOpen: boolean;
  type: 'challenger' | 'defender' | 'grand_final_opponent';
  candidates: Player[];
  winner: Player | null;
  pendingDefenderTileIndex?: number | null;
  grandFinalData?: {
    activeChooserId: string;
    topics: GrandFinalTopicOptionSync[];
  };
}

export interface PendingMergedTopicSync {
  winnerId: string;
  componentTileIndices: number[];
  availableCategorySlugs: string[];
  decisionAfter: 'continue' | 'board';
}

export interface GrandFinalTopicOptionSync {
  slug: string;
  name: string;
  tileIndex: number;
  ownerPlayerId: string;
}

export interface PendingGrandFinalTopicSync {
  activeChooserId: string;
  opponentId: string;
  topics: GrandFinalTopicOptionSync[];
}

export interface HostSyncPayload {
  phase: GamePhase;
  currentDuel: JudgeDuelSync | null;
  challenger: Player | null;
  defender: Player | null;
  isJudgeConnected: boolean;
  canUndo: boolean;
  connectionType?: 'local' | 'webrtc';
  // Datos del Tablero para el Mando del Juez
  boardStep?: BoardStep;
  tiles?: BoardTile[];
  players?: Player[];
  activeChallengerId?: string | null;
  selectedTileIndex?: number | null;
  attackableTileIndices?: number[];
  gridRows?: number;
  gridCols?: number;
  // Modales y Estados Sincronizados
  activeRoulette?: ActiveRouletteSync | null;
  pendingMergedTopicSelection?: PendingMergedTopicSync | null;
  pendingGrandFinalTopicChoice?: PendingGrandFinalTopicSync | null;
  // Deshacer decisiones del tablero (elección de tema, ruleta, fusión...)
  canUndoBoard?: boolean;
  undoBoardLabel?: string | null;
}

export type JudgeActionType =
  | 'ACTION_CORRECT'
  | 'ACTION_PASS'
  | 'ACTION_PAUSE'
  | 'ACTION_START_COUNTDOWN'
  | 'ACTION_UNDO'
  | 'ACTION_DECIDE'
  | 'ACTION_SPIN_ROULETTE'
  | 'ACTION_CONFIRM_ROULETTE'
  | 'ACTION_SELECT_TILE'
  | 'ACTION_ADJUST_TIME'
  | 'ACTION_START_GAME'
  | 'ACTION_DEV_QUICK_GAME'
  | 'ACTION_APPLY_MERGED_TOPIC'
  | 'ACTION_SELECT_GRAND_FINAL_TOPIC'
  | 'ACTION_RESET_TO_SETUP'
  | 'ACTION_UNDO_BOARD'
  | 'ACTION_RESPIN_ROULETTE'
  | 'ACTION_SET_ROULETTE_WINNER'
  | 'REQUEST_SYNC'
  | 'JUDGE_PING';

export interface JudgeActionMessage {
  type: JudgeActionType;
  actionId?: string;
  timestamp?: number;
  payload?: {
    decision?: 'continue' | 'board';
    tileIndex?: number;
    target?: 'challenger' | 'defender';
    secondsDelta?: number;
    categorySlug?: string;
    playerId?: string;
  };
}

// Cambios respecto al último estado enviado. `currentDuelPatch` trae solo los campos
// del duelo que han cambiado (p. ej. solo el reloj).
export type HostPatchPayload = Partial<HostSyncPayload> & {
  currentDuelPatch?: Partial<JudgeDuelSync>;
};

// Confirmación de que la pantalla ha recibido una acción del mando
export interface HostAckMessage {
  type: 'ACTION_ACK';
  actionId: string;
}

export type HostMessage =
  | { type: 'STATE_SYNC'; payload: HostSyncPayload }
  | { type: 'STATE_PATCH'; payload: HostPatchPayload }
  | { type: 'HOST_PONG' }
  | HostAckMessage;

