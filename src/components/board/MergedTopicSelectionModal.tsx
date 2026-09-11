import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { Player } from '../../types/game';
import { BUILTIN_CATEGORIES } from '../../data/categoriesRegistry';

interface MergedTopicSelectionModalProps {
  isOpen: boolean;
  player: Player | null;
  availableCategorySlugs: string[];
  onSelectTopic: (categorySlug: string) => void;
}

export const MergedTopicSelectionModal: React.FC<MergedTopicSelectionModalProps> = ({
  isOpen,
  player,
  availableCategorySlugs,
  onSelectTopic,
}) => {
  if (!isOpen || !player || availableCategorySlugs.length <= 1) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-floor-surface border-2 border-floor-gold rounded-3xl max-w-lg w-full p-6 md:p-8 text-center space-y-6 shadow-[0_0_60px_rgba(255,215,0,0.4)]">
        {/* Cabecera */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-floor-card border border-floor-gold/40 text-floor-gold text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Fusión Territorial
          </div>
          <h2 className="text-2xl md:text-3xl font-bold digital-font text-white">
            ¡TERRITORIOS UNIDOS!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
            <span className="font-bold text-floor-cyan">{player.name}</span>, has conectado varias de tus zonas. Elige con qué tema deseas defender tu nuevo territorio unificado:
          </p>
        </div>

        {/* Opciones de Temas a Elegir */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {availableCategorySlugs.map((slug) => {
            const categoryMeta = BUILTIN_CATEGORIES.find((c) => c.slug === slug) || {
              slug,
              name: slug.replace(/_/g, ' ').toUpperCase(),
              icon: '🏷️',
              totalItems: 30,
            };

            return (
              <button
                key={slug}
                type="button"
                onClick={() => onSelectTopic(slug)}
                className="group p-4 rounded-2xl bg-floor-card hover:bg-slate-800/90 border-2 border-slate-700 hover:border-floor-gold transition-colors duration-200 flex flex-col items-center justify-between text-center gap-2 shadow-md hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] cursor-pointer"
              >
                <span className="text-3xl sm:text-4xl drop-shadow-md">
                  {categoryMeta.icon}
                </span>
                <span className="font-extrabold text-sm sm:text-base text-white group-hover:text-floor-gold transition-colors line-clamp-2">
                  {categoryMeta.name}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-floor-gold flex items-center gap-1 mt-1">
                  <Check className="w-3 h-3" /> Seleccionar este tema
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
