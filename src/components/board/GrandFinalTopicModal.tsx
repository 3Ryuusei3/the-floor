import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Swords, Trophy, Crown, Eye, X } from 'lucide-react';
import { Player } from '../../types/game';
import { BUILTIN_CATEGORIES } from '../../data/categoriesRegistry';

export interface GrandFinalTopicOption {
  slug: string;
  name: string;
  tileIndex: number;
  ownerPlayerId: string;
}

interface GrandFinalTopicModalProps {
  isOpen: boolean;
  chooser: Player | null;
  opponent: Player | null;
  topics: GrandFinalTopicOption[];
  onSelectTopic: (categorySlug: string, tileIndex: number) => void;
  onClose: () => void;
}

export const GrandFinalTopicModal: React.FC<GrandFinalTopicModalProps> = ({
  isOpen,
  chooser,
  opponent,
  topics,
  onSelectTopic,
  onClose,
}) => {
  if (!isOpen || !chooser || !opponent || topics.length === 0) return null;

  const chooserColor = chooser.color || '#00f0ff';
  const opponentColor = opponent.color || '#ff2a4b';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative max-w-3xl w-full max-h-[90vh] bg-floor-surface border-2 border-amber-500/80 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-[0_0_80px_rgba(255,170,0,0.4)] overflow-hidden flex flex-col justify-between my-auto"
        >
          {/* Botón cerrar / ocultar para ver tablero */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors z-20"
            title="Ocultar modal para ver el tablero"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Resplandor decorativo de fondo */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-amber-500/20 to-transparent blur-3xl pointer-events-none" />

          {/* Cabecera Épica de La Gran Final */}
          <div className="space-y-2 relative z-10 shrink-0">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(255,170,0,0.5)]">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              EL DUELO DEFINITIVO
            </div>
            <h2 className="text-2xl md:text-4xl font-bold digital-font text-white tracking-wider flex items-center justify-center gap-3">
              <Crown className="w-7 h-7 text-amber-400 fill-amber-400 hidden sm:inline" />
              ¡LA GRAN FINAL!
              <Crown className="w-7 h-7 text-amber-400 fill-amber-400 hidden sm:inline" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              <span className="font-bold" style={{ color: chooserColor }}>
                {chooser.name}
              </span>
              , elige la categoría para el enfrentamiento final contra{' '}
              <span className="font-bold" style={{ color: opponentColor }}>
                {opponent.name}
              </span>
              . ¡Quien gane este duelo conquista el 100% del suelo!
            </p>
          </div>

          {/* Opciones de Temas en Disputa (Scrollable si hay 3 o más) */}
          <div className="overflow-y-auto max-h-[50vh] pr-1 relative z-10">
            <div
              className={`grid gap-3.5 ${
                topics.length > 2
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2'
              }`}
            >
              {topics.map((item) => {
                const meta = BUILTIN_CATEGORIES.find((c) => c.slug === item.slug) || {
                  slug: item.slug,
                  name: item.name || item.slug.replace(/_/g, ' ').toUpperCase(),
                  icon: '🏷️',
                  totalItems: 30,
                };
                const isChooserTopic = item.ownerPlayerId === chooser.id;
                const cardColor = isChooserTopic ? chooserColor : opponentColor;
                const ownerName = isChooserTopic ? chooser.name : opponent.name;

                return (
                  <button
                    key={`${item.slug}-${item.tileIndex}`}
                    type="button"
                    onClick={() => onSelectTopic(item.slug, item.tileIndex)}
                    style={{
                      borderColor: `${cardColor}88`,
                      backgroundColor: `${cardColor}12`,
                    }}
                    className="group relative p-4 sm:p-5 rounded-2xl border-2 hover:border-amber-400 hover:bg-slate-800 transition-colors duration-200 flex flex-col items-center justify-between text-center gap-3 shadow-lg hover:shadow-[0_0_25px_rgba(255,170,0,0.35)] cursor-pointer"
                  >
                    <div
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                      style={{
                        borderColor: cardColor,
                        color: cardColor,
                        backgroundColor: `${cardColor}20`,
                      }}
                    >
                      Tema de {ownerName}
                    </div>

                    <span className="text-4xl drop-shadow-lg">
                      {meta.icon}
                    </span>

                    <div className="space-y-0.5">
                      <span className="block font-bold text-base text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                        {meta.name}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        30 imágenes • 45s
                      </span>
                    </div>

                    <div className="w-full py-2 rounded-xl font-bold text-xs uppercase tracking-wider bg-amber-500 text-black group-hover:bg-amber-400 flex items-center justify-center gap-1.5 shadow-md transition-colors">
                      <Swords className="w-3.5 h-3.5" />
                      JUGAR POR ESTE TEMA
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 relative z-10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
            >
              <Eye className="w-4 h-4 text-floor-cyan" />
              Ver Tablero (Ocultar)
            </button>

            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Trophy className="w-4 h-4 text-amber-400" />
              Duelo definitivo por el Campeonato
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
