import React, { useState } from 'react';
import { Plus, Trash2, User, Sparkles } from 'lucide-react';
import { Player } from '../../types/game';
import { VIBRANT_PLAYER_COLORS, getDistinctPlayerColor } from '../../utils/playerColors';

interface PlayerListManagerProps {
  players: Player[];
  onAddPlayer: (player: Player) => void;
  onRemovePlayer: (id: string) => void;
  onUpdatePlayer: (player: Player) => void;
}

export const PlayerListManager: React.FC<PlayerListManagerProps> = ({
  players,
  onAddPlayer,
  onRemovePlayer,
}) => {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(getDistinctPlayerColor(0));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const assignedColor = newColor || getDistinctPlayerColor(players.length);

    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: newName.trim(),
      color: assignedColor,
      territoryCount: 0,
      duelsWon: 0,
      isEliminated: false,
    };

    onAddPlayer(newPlayer);
    setNewName('');
    setNewColor(getDistinctPlayerColor(players.length + 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <User className="w-4 h-4 text-floor-cyan" />
          Concursantes ({players.length})
        </label>
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-floor-gold" />
          <span>Temas asignados al azar al iniciar</span>
        </div>
      </div>

      {/* Formulario rápido para añadir solo nombre y color */}
      <form
        onSubmit={handleAdd}
        className="p-3.5 rounded-xl bg-floor-surface/80 border border-floor-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
      >
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            placeholder="Nombre del concursante..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 bg-floor-card border border-floor-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-floor-cyan text-white placeholder-slate-500 font-medium"
            autoFocus
          />
        </div>

        {/* Selector de color */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {VIBRANT_PLAYER_COLORS.slice(0, 8).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setNewColor(c)}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: newColor === c ? '#ffffff' : 'transparent',
                boxShadow: newColor === c ? `0 0 10px ${c}` : 'none',
              }}
            />
          ))}
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
            title="Color personalizado"
          />
        </div>

        <button
          type="submit"
          disabled={!newName.trim()}
          className="bg-floor-cyan text-black font-extrabold px-6 py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Añadir
        </button>
      </form>

      {/* Lista de concursantes añadidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {players.map((player) => (
          <div
            key={player.id}
            className="p-3 rounded-xl bg-floor-card/90 border border-floor-border flex items-center justify-between gap-2 transition-all hover:border-slate-500"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: player.color,
                  boxShadow: `0 0 8px ${player.color}`,
                }}
              />
              <span className="font-bold text-sm text-white truncate">{player.name}</span>
            </div>

            <button
              type="button"
              onClick={() => onRemovePlayer(player.id)}
              className="text-slate-500 hover:text-floor-red p-1 rounded transition-colors cursor-pointer"
              title="Eliminar jugador"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {players.length === 0 && (
        <div className="text-center py-6 text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
          Escribe los nombres de los concursantes arriba para agregarlos a la partida.
        </div>
      )}
    </div>
  );
};
