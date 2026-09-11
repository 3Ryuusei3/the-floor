import React, { useState, useEffect } from 'react';
import { Play, Clock, Grid } from 'lucide-react';
import { Player } from '../../types/game';
import { CategoryMeta } from '../../types/category';
import { soundEngine } from '../../utils/soundEngine';
import { useGameStore } from '../../hooks/useGameStore';

interface DuelIntroCountdownProps {
  status: 'intro' | 'countdown';
  challenger: Player;
  defender: Player;
  category: CategoryMeta;
  onStartCountdown: () => void;
  onCountdownComplete: () => void;
}

export const DuelIntroCountdown: React.FC<DuelIntroCountdownProps> = ({
  status,
  challenger,
  defender,
  category,
  onStartCountdown,
  onCountdownComplete,
}) => {
  const isDevMode = useGameStore((state) => state.isDevMode);
  const [countdownNumber, setCountdownNumber] = useState<number | string>(3);

  useEffect(() => {
    if (status !== 'countdown') return;

    if (isDevMode) {
      onCountdownComplete();
      return;
    }

    setCountdownNumber(3);
    soundEngine.playCountdownBeep(false);

    const timer1 = setTimeout(() => {
      setCountdownNumber(2);
      soundEngine.playCountdownBeep(false);
    }, 1000);

    const timer2 = setTimeout(() => {
      setCountdownNumber(1);
      soundEngine.playCountdownBeep(false);
    }, 2000);

    const timer3 = setTimeout(() => {
      setCountdownNumber('¡YA!');
      soundEngine.playCountdownBeep(true);
    }, 3000);

    const timer4 = setTimeout(() => {
      onCountdownComplete();
    }, 3700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [status, onCountdownComplete]);

  // Si está en cuenta atrás (3, 2, 1, ¡YA!)
  if (status === 'countdown') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-fadeIn text-center p-4 select-none">
        <div className="space-y-4">
          <div className="text-sm md:text-base font-extrabold uppercase tracking-widest text-floor-cyan digital-font">
            {category.name}
          </div>
          <div
            key={String(countdownNumber)}
            className="text-8xl md:text-9xl font-bold digital-font animate-bounce text-white drop-shadow-[0_0_50px_rgba(0,240,255,0.9)]"
            style={{
              color: countdownNumber === '¡YA!' ? '#00ff88' : '#00f0ff',
            }}
          >
            {countdownNumber}
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-wider">
            ¡Prepárense para el duelo!
          </p>
        </div>
      </div>
    );
  }

  // Pantalla de Resumen / VS Screen antes de arrancar
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn select-none">
      <div className="bg-floor-surface border-2 border-floor-border rounded-3xl max-w-4xl w-full p-6 md:p-10 space-y-8 shadow-[0_0_80px_rgba(0,240,255,0.25)] relative overflow-hidden">
        {/* Luces de fondo de plató */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 filter blur-3xl pointer-events-none"
          style={{ backgroundColor: challenger.color }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full opacity-20 filter blur-3xl pointer-events-none"
          style={{ backgroundColor: defender.color }}
        />

        {/* Cabecera del Enfrentamiento */}
        <div className="text-center space-y-2 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold digital-font text-white">
            PRÓXIMO DUELO
          </h2>
          <div className="pt-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Categoría en juego:</span>
            <span className="text-xl md:text-2xl font-bold text-floor-cyan drop-shadow flex items-center justify-center gap-2 mt-1">
              <span>{category.icon || '🏷️'}</span>
              <span>{category.name}</span>
            </span>
          </div>
        </div>

        {/* Bloque VS Comparativo */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center relative z-10">
          {/* Tarjeta Retador (Col 1-5) */}
          <div
            className="md:col-span-5 p-6 rounded-2xl border-2 bg-floor-card/90 flex flex-col items-center text-center space-y-4 shadow-xl"
            style={{
              borderColor: challenger.color,
              boxShadow: `0 0 20px ${challenger.color}33`,
            }}
          >
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-floor-cyan text-black uppercase tracking-wider digital-font">
              Retador
            </span>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-black shadow-lg"
              style={{ backgroundColor: challenger.color }}
            >
              {challenger.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{challenger.name}</h3>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-1.5">
                <Grid className="w-4 h-4 text-floor-cyan" />
                <span className="font-bold text-slate-200">{challenger.territoryCount} casillas</span>
              </div>
            </div>
            <div className="text-sm font-mono text-floor-cyan flex items-center gap-1.5 font-bold pt-2 border-t border-white/10 w-full justify-center">
              <Clock className="w-4 h-4" /> 45.0 segundos
            </div>
          </div>

          {/* Icono VS Central (Col 6) */}
          <div className="md:col-span-1 flex items-center justify-center my-2 md:my-0">
            <div className="w-14 h-14 rounded-full bg-floor-surface border-2 border-floor-gold flex items-center justify-center text-floor-gold font-bold text-lg digital-font shadow-[0_0_20px_rgba(255,215,0,0.5)]">
              VS
            </div>
          </div>

          {/* Tarjeta Defensor (Col 7-11) */}
          <div
            className="md:col-span-5 p-6 rounded-2xl border-2 bg-floor-card/90 flex flex-col items-center text-center space-y-4 shadow-xl"
            style={{
              borderColor: defender.color,
              boxShadow: `0 0 20px ${defender.color}33`,
            }}
          >
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-floor-gold text-black uppercase tracking-wider digital-font">
              Defensor
            </span>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-black shadow-lg"
              style={{ backgroundColor: defender.color }}
            >
              {defender.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{defender.name}</h3>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-1.5">
                <Grid className="w-4 h-4 text-floor-gold" />
                <span className="font-bold text-slate-200">{defender.territoryCount} casillas</span>
              </div>
            </div>
            <div className="text-sm font-mono text-floor-gold flex items-center gap-1.5 font-bold pt-2 border-t border-white/10 w-full justify-center">
              <Clock className="w-4 h-4" /> 45.0 segundos
            </div>
          </div>
        </div>

        {/* Botón de Inicio con Cuenta Atrás */}
        <div className="pt-2 text-center relative z-10">
          <button
            type="button"
            onClick={onStartCountdown}
            className="w-full md:w-auto px-10 py-5 rounded-2xl font-bold text-base md:text-lg tracking-wider uppercase digital-font bg-gradient-to-r from-floor-cyan via-teal-400 to-cyan-500 text-black hover:scale-105 transition-all shadow-[0_0_35px_rgba(0,240,255,0.6)] inline-flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6 fill-current" />
            ¡EMPEZAR DUELO!
          </button>
        </div>
      </div>
    </div>
  );
};
