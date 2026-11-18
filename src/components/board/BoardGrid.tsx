import React, { useState } from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import { BoardTile } from './BoardTile';
import { BoardHeader } from './BoardHeader';
import { PlayerRouletteModal } from './PlayerRouletteModal';
import { MergedTopicSelectionModal } from './MergedTopicSelectionModal';
import { GrandFinalTopicModal } from './GrandFinalTopicModal';
import { getAdjacentAttackableTileIndices } from '../../utils/boardLogic';

export const BoardGrid: React.FC = () => {
  const tiles = useGameStore((state) => state.tiles);
  const players = useGameStore((state) => state.players);
  const settings = useGameStore((state) => state.settings);
  const activeChallengerId = useGameStore((state) => state.activeChallengerId);
  const selectedTileIndex = useGameStore((state) => state.selectedTileIndex);
  const boardStep = useGameStore((state) => state.boardStep);
  const pendingMergedTopicSelection = useGameStore((state) => state.pendingMergedTopicSelection);
  const pendingGrandFinalTopicChoice = useGameStore((state) => state.pendingGrandFinalTopicChoice);
  const setBoardStep = useGameStore((state) => state.setBoardStep);
  const setActiveChallenger = useGameStore((state) => state.setActiveChallenger);
  const claimStartingTile = useGameStore((state) => state.claimStartingTile);
  const applyMergedTopic = useGameStore((state) => state.applyMergedTopic);
  const startGrandFinalDuel = useGameStore((state) => state.startGrandFinalDuel);
  const startDuel = useGameStore((state) => state.startDuel);
  const conqueringTiles = useGameStore((state) => state.conqueringTiles);
  const activeRoulette = useGameStore((state) => state.activeRoulette);
  const openChallengerRoulette = useGameStore((state) => state.openChallengerRoulette);
  const openDefenderRoulette = useGameStore((state) => state.openDefenderRoulette);
  const setRouletteWinner = useGameStore((state) => state.setRouletteWinner);
  const confirmRouletteWinner = useGameStore((state) => state.confirmRouletteWinner);

  // Modal de Gran Final
  const [isGrandFinalModalOpen, setIsGrandFinalModalOpen] = useState(true);

  React.useEffect(() => {
    if (pendingGrandFinalTopicChoice) {
      setIsGrandFinalModalOpen(true);
    }
  }, [pendingGrandFinalTopicChoice]);

  // La animación de conquista se muestra una sola vez y después se limpia
  React.useEffect(() => {
    if (conqueringTiles.length === 0) return;
    const timer = setTimeout(() => useGameStore.setState({ conqueringTiles: [] }), 900);
    return () => clearTimeout(timer);
  }, [conqueringTiles]);

  // Guardia de seguridad: Si todo el tablero pertenece al mismo jugador, proclamar Campeón de inmediato
  React.useEffect(() => {
    if (tiles.length === 0) return;
    const hasUnclaimed = tiles.some((t) => t.playerId === null);
    const activeSurvivors = players.filter((p) => p.territoryCount > 0);
    const allConqueredByOne = tiles.every((t) => t.playerId && t.playerId === tiles[0].playerId);

    if (allConqueredByOne || (!hasUnclaimed && activeSurvivors.length === 1)) {
      useGameStore.setState({ phase: 'victory' });
    }
  }, [tiles, players]);

  const challenger = players.find((p) => p.id === activeChallengerId) || null;
  const mergedPlayer = pendingMergedTopicSelection
    ? players.find((p) => p.id === pendingMergedTopicSelection.winnerId) || null
    : null;

  const grandFinalChooser = pendingGrandFinalTopicChoice
    ? players.find((p) => p.id === pendingGrandFinalTopicChoice.activeChooserId) || null
    : null;
  const grandFinalOpponent = pendingGrandFinalTopicChoice
    ? players.find((p) => p.id === pendingGrandFinalTopicChoice.opponentId) || null
    : null;

  // Calcular casillas adyacentes que el retador puede atacar
  const attackableTileIndices =
    activeChallengerId && boardStep === 'SELECT_ADJACENT_TOPIC'
      ? getAdjacentAttackableTileIndices(tiles, activeChallengerId, settings.gridRows, settings.gridCols)
      : [];

  const handleStartChallengerSelection = () => {
    openChallengerRoulette();
  };

  const handleTileClick = (tileIndex: number) => {
    const clickedTile = tiles.find((t) => t.index === tileIndex);
    if (!clickedTile) return;

    if (boardStep === 'CHALLENGER_SELECT_START_TILE' && activeChallengerId) {
      if (clickedTile.playerId === null) {
        claimStartingTile(activeChallengerId, tileIndex);
      }
      return;
    }

    if (activeChallengerId && boardStep === 'SELECT_ADJACENT_TOPIC') {
      if (clickedTile.playerId === activeChallengerId) {
        setActiveChallenger(activeChallengerId, tileIndex);
        return;
      }

      if (attackableTileIndices.includes(tileIndex)) {
        if (clickedTile.playerId !== null && clickedTile.playerId !== activeChallengerId) {
          startDuel(activeChallengerId, clickedTile.playerId, tileIndex);
          return;
        }

        if (clickedTile.playerId === null) {
          openDefenderRoulette(tileIndex);
        }
      }
      return;
    }

    if (!activeChallengerId) {
      if (clickedTile.playerId) {
        setActiveChallenger(clickedTile.playerId, tileIndex);
        setBoardStep('SELECT_ADJACENT_TOPIC');
      } else {
        handleStartChallengerSelection();
      }
    }
  };

  // Escuchar acciones remotas del mando del Juez
  React.useEffect(() => {
    const handleRemoteSpin = () => {
      if (!activeChallengerId) {
        openChallengerRoulette();
      }
    };

    const handleRemoteConfirmRoulette = () => {
      confirmRouletteWinner();
    };

    const handleRemoteSelectTile = (e: Event) => {
      const customEvent = e as CustomEvent<{ tileIndex: number }>;
      if (typeof customEvent.detail?.tileIndex === 'number') {
        handleTileClick(customEvent.detail.tileIndex);
      }
    };

    window.addEventListener('remote-spin-roulette', handleRemoteSpin);
    window.addEventListener('remote-confirm-roulette', handleRemoteConfirmRoulette);
    window.addEventListener('remote-select-tile', handleRemoteSelectTile);
    return () => {
      window.removeEventListener('remote-spin-roulette', handleRemoteSpin);
      window.removeEventListener('remote-confirm-roulette', handleRemoteConfirmRoulette);
      window.removeEventListener('remote-select-tile', handleRemoteSelectTile);
    };
  }, [activeChallengerId, boardStep, tiles, attackableTileIndices, openChallengerRoulette, confirmRouletteWinner]);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-6 space-y-6 animate-fadeIn">
      {/* Cabecera del Tablero */}
      <BoardHeader onOpenRoulette={handleStartChallengerSelection} />

      {/* Banner de Estado e Instrucciones según la Fase */}
      <div className="text-center py-1">
        {boardStep === 'GRAND_FINAL_TOPIC_SELECTION' && grandFinalChooser && grandFinalOpponent ? (
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 px-6 py-3 rounded-2xl bg-amber-500/15 border-2 border-amber-400 text-amber-300 font-bold text-sm shadow-[0_0_30px_rgba(255,170,0,0.4)] animate-pulse">
            <span>
              🔥 ¡LA GRAN FINAL! <strong style={{ color: grandFinalChooser.color }}>{grandFinalChooser.name}</strong> elige la categoría decisiva contra{' '}
              <strong style={{ color: grandFinalOpponent.color }}>{grandFinalOpponent.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsGrandFinalModalOpen(true)}
              className="px-4 py-1.5 rounded-xl font-bold text-xs uppercase bg-amber-500 text-black hover:bg-amber-400 active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              👑 Elegir Tema Final
            </button>
          </div>
        ) : boardStep === 'CHALLENGER_SELECT_START_TILE' && challenger ? (
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-floor-cyan/15 border-2 border-floor-cyan text-floor-cyan font-bold text-sm shadow-[0_0_25px_rgba(0,240,255,0.4)] animate-bounce">
            ★ ¡{challenger.name}, elige en el tablero la casilla con el tema por el que empezarás a conquistar! ★
          </div>
        ) : challenger ? (
          <p className="text-sm font-semibold text-slate-200">
            Retador en juego:{' '}
            <span className="text-floor-cyan font-bold text-lg">{challenger.name}</span>.
            {attackableTileIndices.length > 0
              ? ' Haz clic en un tema adyacente iluminado en DORADO (o casilla RIVAL) para disputarlo.'
              : ' No hay casillas adyacentes disponibles.'}
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            Pulsa <span className="text-floor-cyan font-bold">¡Randomizer!</span> para sortear al retador inicial.
          </p>
        )}
      </div>

      {/* Grid del Tablero The Floor Centrado y Proporcionado */}
      <div
        className="grid gap-2.5 mx-auto w-full transition-all"
        style={{
          gridTemplateColumns: `repeat(${settings.gridCols}, minmax(0, 1fr))`,
          maxWidth: settings.gridCols <= 2 ? '26rem' : '1168px',
        }}
      >
        {tiles.map((tile) => {
          const player = tile.playerId ? players.find((p) => p.id === tile.playerId) || null : null;
          const isChallenger = tile.playerId === activeChallengerId && activeChallengerId !== null;
          const isSelectedTile = selectedTileIndex === tile.index;
          
          const isAttackable =
            boardStep === 'CHALLENGER_SELECT_START_TILE'
               ? tile.playerId === null
              : attackableTileIndices.includes(tile.index);

          const isConquering = conqueringTiles.includes(tile.index);

          return (
            <BoardTile
              key={tile.index}
              index={tile.index}
              row={tile.row}
              col={tile.col}
              player={player}
              categorySlug={tile.categorySlug}
              isPlayed={tile.isPlayed}
              isChallenger={isChallenger}
              isSelectedTile={isSelectedTile}
              isAttackable={isAttackable}
              isRouletteHighlight={false}
              isConquering={isConquering}
              onClick={() => handleTileClick(tile.index)}
            />
          );
        })}
      </div>

      {/* Ruleta de Jugador: Seleccionar Retador */}
      <PlayerRouletteModal
        isOpen={activeRoulette?.isOpen === true && activeRoulette?.type === 'challenger'}
        badgeText="Randomizer: Retador"
        title="SORTEO DE RETADOR"
        subtitle="Seleccionando qué concursante comenzará a conquistar en The Floor"
        candidates={activeRoulette?.type === 'challenger' ? activeRoulette.candidates : []}
        forcedWinner={activeRoulette?.winner ?? null}
        onWinnerDetermined={setRouletteWinner}
        onPlayerChosen={confirmRouletteWinner}
      />

      {/* Ruleta de Jugador: Seleccionar Defensor para Casilla Neutral */}
      <PlayerRouletteModal
        isOpen={activeRoulette?.isOpen === true && activeRoulette?.type === 'defender'}
        badgeText="Randomizer: Defensor"
        title="SORTEO DE DEFENSOR"
        subtitle="Seleccionando quién defenderá este tema frente al retador"
        candidates={activeRoulette?.type === 'defender' ? activeRoulette.candidates : []}
        forcedWinner={activeRoulette?.winner ?? null}
        onWinnerDetermined={setRouletteWinner}
        onPlayerChosen={confirmRouletteWinner}
      />

      {/* Ruleta de Jugador: Seleccionar Rival de la Gran Final (Con Tensión Máxima) */}
      <PlayerRouletteModal
        isOpen={activeRoulette?.isOpen === true && activeRoulette?.type === 'grand_final_opponent'}
        badgeText="GRAN FINAL: RIVAL EN DISPUTA"
        title="SORTEO DEL RIVAL DEFINITIVO"
        subtitle="¿Quién retará al líder en la Gran Final por el 100% de The Floor?"
        candidates={activeRoulette?.type === 'grand_final_opponent' ? activeRoulette.candidates : []}
        isTensionRoulette={true}
        forcedWinner={activeRoulette?.winner ?? null}
        onWinnerDetermined={setRouletteWinner}
        onPlayerChosen={confirmRouletteWinner}
      />

      {/* Modal de Elección de Tema cuando se unen varias zonas del mismo jugador */}
      <MergedTopicSelectionModal
        isOpen={pendingMergedTopicSelection !== null}
        player={mergedPlayer}
        availableCategorySlugs={pendingMergedTopicSelection?.availableCategorySlugs || []}
        onSelectTopic={applyMergedTopic}
      />

      {/* Modal de Elección de Tema de LA GRAN FINAL */}
      <GrandFinalTopicModal
        isOpen={pendingGrandFinalTopicChoice !== null && isGrandFinalModalOpen}
        chooser={grandFinalChooser}
        opponent={grandFinalOpponent}
        topics={pendingGrandFinalTopicChoice?.topics || []}
        onSelectTopic={(slug, tileIndex) => startGrandFinalDuel(slug, tileIndex)}
        onClose={() => setIsGrandFinalModalOpen(false)}
      />
    </div>
  );
};
