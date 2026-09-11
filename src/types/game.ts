import { CategoryMeta, CategoryItem } from './category';

export type GamePhase = 'setup' | 'board' | 'duel' | 'victory';

export interface Player {
  id: string;
  name: string;
  color: string;
  territoryCount: number;
  duelsWon: number;
  avatar?: string;
  isEliminated: boolean;
}

export interface BoardTile {
  index: number;
  row: number;
  col: number;
  playerId: string | null; // null si es casilla neutral/sin dueño inicial
  categorySlug: string; // Cada casilla tiene su categoría temática asignada
  isPlayed: boolean; // Si este tema ya ha sido jugado en un duelo
}

export type BoardStep =
  | 'INITIAL_ROULETTE'
  | 'CHALLENGER_SELECT_START_TILE'
  | 'SELECT_ADJACENT_TOPIC'
  | 'DEFENDER_ROULETTE'
  | 'GRAND_FINAL_TOPIC_SELECTION';

export interface DuelRecord {
  id: string;
  duelNumber: number;
  challengerId: string;
  defenderId: string;
  winnerId: string;
  loserId: string;
  categorySlug: string;
  categoryName: string;
  durationSeconds: number;
  challengerTimeLeft: number;
  defenderTimeLeft: number;
  correctAnswersCount: { [playerId: string]: number };
  passAnswersCount: { [playerId: string]: number };
  endReason?: string;
}

export interface PlayerStatItem {
  duelsPlayed: number;
  duelsWon: number;
  duelsLost: number;
  correctAnswers: number;
  passAnswers: number;
  peakTerritory: number;
}

export interface GameStats {
  totalDuels: number;
  eliminationOrder: string[]; // IDs de jugadores en orden de eliminación (del 1º eliminado al último)
  duelRecords: DuelRecord[];
  playerStats: {
    [playerId: string]: PlayerStatItem;
  };
}

export interface DuelSession {
  challengerId: string;
  defenderId: string;
  defendedTileIndex: number;
  category: CategoryMeta;
  items: CategoryItem[];
  currentIndex: number;
  activePlayerId: string;
  challengerTime: number;
  defenderTime: number;
  status: 'intro' | 'countdown' | 'in_progress' | 'paused' | 'finished';
  isFrozen: boolean; // Congelación de 1s al acertar (los relojes se paran)
  frozenReason?: 'correct';
  frozenSecondsRemaining: number;
  isPassLocked: boolean; // Bloqueo de 3s al pasar (el reloj del jugador SIGUE corriendo)
  passPenaltySecondsRemaining: number;
  revealedAnswerText?: string;
  winnerId: string | null;
  loserId: string | null;
  endReason?: 'timeout' | 'items_exhausted';
  isGrandFinalDuel?: boolean; // Indica si es el duelo definitivo por el 100% del tablero
  history: {
    item: CategoryItem;
    answeredBy: string;
    action: 'correct' | 'pass';
    timestamp: number;
  }[];
}

export interface GameSettings {
  gridRows: number; // Número de filas
  gridCols: number; // Número de columnas
  duelTime: number; // 45s por defecto
  passPenaltyTime: number; // 3s por defecto
}

