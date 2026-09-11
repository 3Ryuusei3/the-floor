import React, { useState } from 'react';
import { CategoryItem, CategoryMeta } from '../../types/category';
import { Image as ImageIcon, Music, HelpCircle, CheckCircle, XCircle } from 'lucide-react';

interface ImageDisplayProps {
  item: CategoryItem | undefined;
  category: CategoryMeta;
  itemNumber: number;
  totalItems: number;
  isFrozen?: boolean;
  isPassLocked?: boolean;
  passPenaltySecondsRemaining?: number;
  revealedAnswerText?: string;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  item,
  category,
  itemNumber,
  totalItems,
  isFrozen,
  isPassLocked,
  revealedAnswerText,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="self-stretch flex-1 w-full flex flex-col justify-between rounded-3xl bg-floor-surface/95 border border-floor-border backdrop-blur-md relative overflow-hidden shadow-2xl">
      {/* Cabecera Compacta */}
      <div className="w-full flex items-center justify-between px-5 py-3 border-b border-floor-border/70 z-10 bg-floor-card/40 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl drop-shadow">{category.icon || '🏷️'}</span>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Categoría en juego
            </span>
            <h2 className="text-base sm:text-xl font-bold text-white leading-tight">
              {category.name}
            </h2>
          </div>
        </div>

        <div className="text-xs sm:text-sm font-mono font-bold px-3.5 py-1 rounded-full bg-floor-card border border-floor-border text-slate-300">
          {item?.image ? 'Foto' : 'Pregunta'} #{itemNumber} / {totalItems}
        </div>
      </div>

      {/* Visor Central de Imagen con Altura y Ancho Bounding Box para no Desbordar */}
      <div className="flex-1 w-full h-[50vh] max-h-[480px] flex items-center justify-center relative p-3 sm:p-5 overflow-hidden my-auto">
        {/* Overlay cuando se ACIERTA (100% Opaco, Alto Contraste y Texto Adaptado) */}
        {isFrozen && revealedAnswerText && (
          <div className="absolute inset-x-4 sm:inset-x-10 max-w-xl mx-auto top-1/2 -translate-y-1/2 z-40 p-5 sm:p-7 rounded-3xl bg-black border-4 border-[#00ff88] shadow-[0_0_80px_rgba(0,255,136,0.9)] flex flex-col items-center justify-center text-center space-y-2.5 animate-scaleIn select-none">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00ff88]/25 border-2 border-[#00ff88] text-[#00ff88] text-xs font-bold uppercase tracking-wider">
              <CheckCircle className="w-4 h-4" /> ¡ACIERTO!
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug uppercase break-words max-w-full px-2 drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
              {revealedAnswerText}
            </div>
          </div>
        )}

        {/* Overlay cuando se PASA (100% Opaco, Solo "PASO" y Texto Adaptado) */}
        {isPassLocked && revealedAnswerText && (
          <div className="absolute inset-x-4 sm:inset-x-10 max-w-xl mx-auto top-1/2 -translate-y-1/2 z-40 p-5 sm:p-7 rounded-3xl bg-black border-4 border-floor-red shadow-[0_0_80px_rgba(255,42,75,0.9)] flex flex-col items-center justify-center text-center space-y-2.5 animate-scaleIn select-none">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-floor-red/25 border-2 border-floor-red text-floor-red text-xs font-bold uppercase tracking-wider">
              <XCircle className="w-4 h-4" /> PASO
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug uppercase break-words max-w-full px-2 drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
              {revealedAnswerText}
            </div>
          </div>
        )}

        {item?.image ? (
          <div className="w-full h-full flex items-center justify-center relative">
            <img
              src={item.image}
              alt="Elemento en juego"
              onLoad={() => setImageLoaded(true)}
              className={`max-h-full max-w-full w-auto h-auto object-contain mx-auto my-auto rounded-2xl drop-shadow-2xl transition-all duration-200 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 gap-2">
                <ImageIcon className="w-6 h-6 animate-pulse" />
                <span className="text-xs">Cargando imagen...</span>
              </div>
            )}
          </div>
        ) : item?.audio ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 rounded-2xl bg-floor-card border border-floor-border text-center space-y-4 my-auto">
            <Music className="w-16 h-16 text-floor-cyan animate-bounce" />
            <span className="text-xl font-bold text-white">Escucha la pista musical</span>
          </div>
        ) : (
          <div className="w-full h-full min-h-[240px] flex flex-col items-center justify-center p-6 sm:p-10 rounded-2xl bg-gradient-to-br from-floor-card to-floor-surface/95 border-2 border-floor-cyan/60 shadow-[0_0_40px_rgba(0,240,255,0.25)] text-center space-y-4 animate-fadeIn my-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-floor-surface border border-floor-cyan/40 text-floor-cyan text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" /> PREGUNTA EN PANTALLA
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug drop-shadow-lg max-w-xl">
              {item?.name || 'Pregunta de Duelo'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
