import { BoardTile, Player } from '../types/game';
import { CategoryMeta } from '../types/category';

/**
 * Genera un tablero neutral rectangular con gridRows x gridCols casillas.
 */
export function generateNeutralBoardTiles(
  gridRows: number,
  gridCols: number,
  categories: CategoryMeta[]
): BoardTile[] {
  const totalTiles = gridRows * gridCols;
  const tiles: BoardTile[] = [];

  if (categories.length === 0) return [];

  const shuffledCategories = [...categories];
  for (let i = shuffledCategories.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledCategories[i], shuffledCategories[j]] = [shuffledCategories[j], shuffledCategories[i]];
  }

  for (let i = 0; i < totalTiles; i++) {
    const row = Math.floor(i / gridCols);
    const col = i % gridCols;
    const categorySlug = shuffledCategories[i % shuffledCategories.length].slug;

    tiles.push({
      index: i,
      row,
      col,
      playerId: null, // Neutral inicialmente
      categorySlug,
      isPlayed: false,
    });
  }

  return tiles;
}

/**
 * Obtiene los índices de todas las casillas adyacentes ortogonalmente
 * al territorio de un jugador dado.
 */
export function getAdjacentAttackableTileIndices(
  tiles: BoardTile[],
  challengerId: string,
  gridRows: number,
  gridCols: number
): number[] {
  const challengerTiles = tiles.filter((t) => t.playerId === challengerId);
  if (challengerTiles.length === 0) return [];

  const attackableIndices = new Set<number>();

  const gridMap: (BoardTile | null)[][] = Array.from({ length: gridRows }, () =>
    Array(gridCols).fill(null)
  );

  tiles.forEach((tile) => {
    if (tile.row < gridRows && tile.col < gridCols) {
      gridMap[tile.row][tile.col] = tile;
    }
  });

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  challengerTiles.forEach((tile) => {
    directions.forEach(([dRow, dCol]) => {
      const nRow = tile.row + dRow;
      const nCol = tile.col + dCol;

      if (nRow >= 0 && nRow < gridRows && nCol >= 0 && nCol < gridCols) {
        const neighborTile = gridMap[nRow][nCol];
        if (neighborTile && neighborTile.playerId !== challengerId) {
          attackableIndices.add(neighborTile.index);
        }
      }
    });
  });

  return Array.from(attackableIndices);
}

/**
 * Encuentra todas las componentes conexas (islas/bloques) de casillas de un jugador en el tablero.
 */
export function getPlayerConnectedComponents(
  tiles: BoardTile[],
  playerId: string,
  gridRows: number,
  gridCols: number
): number[][] {
  const playerTiles = tiles.filter((t) => t.playerId === playerId);
  const visited = new Set<number>();
  const components: number[][] = [];

  const gridMap: (BoardTile | null)[][] = Array.from({ length: gridRows }, () =>
    Array(gridCols).fill(null)
  );

  tiles.forEach((tile) => {
    if (tile.row < gridRows && tile.col < gridCols) {
      gridMap[tile.row][tile.col] = tile;
    }
  });

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  playerTiles.forEach((tile) => {
    if (visited.has(tile.index)) return;

    const currentComponent: number[] = [];
    const queue: BoardTile[] = [tile];
    visited.add(tile.index);

    while (queue.length > 0) {
      const current = queue.shift()!;
      currentComponent.push(current.index);

      directions.forEach(([dRow, dCol]) => {
        const nRow = current.row + dRow;
        const nCol = current.col + dCol;

        if (nRow >= 0 && nRow < gridRows && nCol >= 0 && nCol < gridCols) {
          const neighbor = gridMap[nRow][nCol];
          if (neighbor && neighbor.playerId === playerId && !visited.has(neighbor.index)) {
            visited.add(neighbor.index);
            queue.push(neighbor);
          }
        }
      });
    }

    components.push(currentComponent);
  });

  return components;
}

/**
 * Obtiene los índices exactos de las casillas que se pierden y conquistan en el duelo:
 * 1. Casilla Neutral:
 *    - Si el Retador gana: solo conquista la casilla neutral disputada. El defensor NO pierde sus otras casillas.
 *    - Si el Defensor gana: gana la casilla neutral + el territorio desde donde atacó el retador.
 * 2. Casilla con Dueño Rival:
 *    - Si el Retador gana: conquista todo el bloque conexo del defensor en esa zona.
 *    - Si el Defensor gana: conquista el territorio desde donde atacó el retador.
 */
export function getConqueredBlockIndices(
  tiles: BoardTile[],
  challengerId: string,
  winnerId: string,
  loserId: string,
  defendedTileIndex: number,
  gridRows: number,
  gridCols: number
): number[] {
  const defendedTile = tiles.find((t) => t.index === defendedTileIndex);
  const conqueredSet = new Set<number>([defendedTileIndex]);

  const isNeutralTile = !defendedTile || defendedTile.playerId === null;

  if (isNeutralTile) {
    // Si la casilla era neutral y el retador gana, SOLO conquista la casilla neutral
    if (winnerId === challengerId) {
      return [defendedTileIndex];
    }

    // Si el defensor gana protegiendo la casilla neutral, gana la casilla neutral + el territorio del retador perdedor
    if (loserId && defendedTile) {
      const loserComponents = getPlayerConnectedComponents(tiles, loserId, gridRows, gridCols);
      const challengerComp = loserComponents.find((comp) => {
        return comp.some((cIdx) => {
          const cTile = tiles.find((t) => t.index === cIdx);
          if (!cTile) return false;
          const dRow = Math.abs(cTile.row - defendedTile.row);
          const dCol = Math.abs(cTile.col - defendedTile.col);
          return (dRow === 1 && dCol === 0) || (dRow === 0 && dCol === 1);
        });
      });

      if (challengerComp) {
        challengerComp.forEach((idx) => conqueredSet.add(idx));
      }
    }

    return Array.from(conqueredSet);
  }

  // Casilla con dueño rival
  if (winnerId === challengerId) {
    // El retador conquista el bloque conexo del defensor
    const loserComponents = getPlayerConnectedComponents(tiles, loserId, gridRows, gridCols);
    const targetComp = loserComponents.find((comp) => comp.includes(defendedTileIndex));
    if (targetComp) {
      targetComp.forEach((idx) => conqueredSet.add(idx));
    }
  } else if (loserId && defendedTile) {
    // El defensor vence al retador y conquista el bloque desde donde retó el retador
    const loserComponents = getPlayerConnectedComponents(tiles, loserId, gridRows, gridCols);
    const challengerComp = loserComponents.find((comp) => {
      return comp.some((cIdx) => {
        const cTile = tiles.find((t) => t.index === cIdx);
        if (!cTile) return false;
        const dRow = Math.abs(cTile.row - defendedTile.row);
        const dCol = Math.abs(cTile.col - defendedTile.col);
        return (dRow === 1 && dCol === 0) || (dRow === 0 && dCol === 1);
      });
    });

    if (challengerComp) {
      challengerComp.forEach((idx) => conqueredSet.add(idx));
    }
  }

  return Array.from(conqueredSet);
}

/**
 * Comprueba si la nueva conquista hace que casillas del MISMO jugador
 * queden conectadas (adyacentes) con 2 o más temas NO jugados disponibles.
 * 
 * Reglas:
 * 1. Se evalúa la componente conexa del ganador que contiene la conquista.
 * 2. Solo se pueden elegir temas NO jugados (los temas disputados en este o anteriores duelos no se ofrecen).
 * 3. Si en este bloque contiguo del ganador hay 2 o más temas no jugados disponibles,
 *    se abre el selector de tema para que el jugador elija el tema de su territorio unificado.
 */
export function detectMergedTerritoryTopics(
  currentTiles: BoardTile[],
  winnerId: string,
  conqueredIndices: number[],
  defendedTileIndex: number,
  playedCategorySlug: string,
  playedCategoryHistory: string[],
  gridRows: number,
  gridCols: number
): { componentTileIndices: number[]; availableCategorySlugs: string[] } | null {
  // 1. Simular el tablero asignando las nuevas casillas conquistadas al ganador
  const simulatedTiles = currentTiles.map((tile) => {
    if (conqueredIndices.includes(tile.index) || tile.playerId === winnerId) {
      return { ...tile, playerId: winnerId };
    }
    return tile;
  });

  // 2. Encontrar la componente conexa resultante del ganador que contiene la conquista
  const components = getPlayerConnectedComponents(simulatedTiles, winnerId, gridRows, gridCols);
  const targetComponent = components.find((comp) =>
    comp.includes(defendedTileIndex) || conqueredIndices.some((idx) => comp.includes(idx))
  );
  if (!targetComponent) return null;

  // 3. Conjunto de temas que ya han sido jugados en duelos
  const playedSet = new Set<string>(
    playedCategoryHistory.filter(Boolean).concat(playedCategorySlug).filter(Boolean)
  );

  // 4. Recoger ÚNICAMENTE los temas NO jugados presentes en este bloque continuo
  const distinctCategories = new Set<string>();

  targetComponent.forEach((idx) => {
    const origTile = currentTiles.find((t) => t.index === idx);
    if (origTile && origTile.categorySlug && origTile.categorySlug.trim() !== '') {
      if (!playedSet.has(origTile.categorySlug)) {
        distinctCategories.add(origTile.categorySlug);
      }
    }
  });

  const categoryList = Array.from(distinctCategories);

  // Si hay más de 1 tema no jugado disponible para el territorio contiguo, se activa la elección de tema
  if (categoryList.length > 1) {
    return {
      componentTileIndices: targetComponent,
      availableCategorySlugs: categoryList,
    };
  }

  return null;
}

/**
 * Recalcula el conteo de casillas de cada jugador.
 */
export function recalculateTerritories(tiles: BoardTile[], players: Player[]): Player[] {
  const countMap: Record<string, number> = {};
  tiles.forEach((tile) => {
    if (tile.playerId) {
      countMap[tile.playerId] = (countMap[tile.playerId] || 0) + 1;
    }
  });

  const hasUnclaimedTiles = tiles.some((t) => t.playerId === null);

  return players.map((player) => {
    const count = countMap[player.id] || 0;
    const isEliminated = !hasUnclaimedTiles && count === 0;

    return {
      ...player,
      territoryCount: count,
      isEliminated,
    };
  });
}

/**
 * Selecciona al ganador de la ruleta:
 * Si coexisten jugadores sin casillas (territoryCount === 0) y con casillas (territoryCount > 0),
 * se elige OBLIGATORIAMENTE entre los jugadores que aún no tienen casillas en el tablero.
 */
export function pickWeightedRouletteWinner(candidates: Player[]): Player {
  if (candidates.length === 0) throw new Error('Candidates array cannot be empty');
  if (candidates.length === 1) return candidates[0];

  const unplaced = candidates.filter((p) => p.territoryCount === 0);
  const targetPool = unplaced.length > 0 ? unplaced : candidates;

  const randomIndex = Math.floor(Math.random() * targetPool.length);
  return targetPool[randomIndex];
}
