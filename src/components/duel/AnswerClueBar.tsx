import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { CategoryItem } from '../../types/category';
import { useGameStore } from '../../hooks/useGameStore';

interface AnswerClueBarProps {
  item: CategoryItem | undefined;
}

export const AnswerClueBar: React.FC<AnswerClueBarProps> = ({ item }) => {
  const [isVisible, setIsVisible] = useState(true);
  const isJudgeConnected = useGameStore((state) => state.isJudgeConnected);

  if (!item) return null;

  // Si el juez está conectado, ocultar la respuesta en la pantalla de TV para el plató
  if (isJudgeConnected) {
    return (
      <div className="w-full bg-floor-surface/80 border border-floor-border rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-slate-400 backdrop-blur-sm">
        <ShieldCheck className="w-4 h-4 text-floor-green" />
        <span>Respuestas protegidas y controladas exclusivamente desde el mando del juez.</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-floor-surface/90 border border-floor-border rounded-xl p-3 flex items-center justify-between gap-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="p-1.5 rounded-lg bg-floor-card border border-floor-border text-slate-400 hover:text-floor-cyan transition-colors"
          title={isVisible ? 'Ocultar respuesta' : 'Mostrar respuesta para presentador'}
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
          Respuesta (Presentador):
        </span>
      </div>

      <div className="flex-1 text-right truncate">
        {isVisible ? (
          <div className="space-x-2 truncate">
            <span className="text-base md:text-lg font-bold text-floor-gold underline">
              {item.name}
            </span>
            {item.aliases && item.aliases.length > 1 && (
              <span className="text-xs text-slate-400 hidden sm:inline">
                (Variantes: {item.aliases.filter((a) => a !== item.name).slice(0, 3).join(', ')})
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs italic text-slate-500">Respuesta oculta para concursantes</span>
        )}
      </div>
    </div>
  );
};
