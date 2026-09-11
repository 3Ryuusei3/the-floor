import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Swords, User, Flame, Crown } from 'lucide-react';
import { Player } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { useGameStore } from '../../hooks/useGameStore';
import { pickWeightedRouletteWinner } from '../../utils/boardLogic';

interface PlayerRouletteModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  badgeText: string;
  candidates: Player[];
  isTensionRoulette?: boolean;
  onWinnerDetermined?: (player: Player) => void;
  onPlayerChosen: (player: Player) => void;
}

export const PlayerRouletteModal: React.FC<PlayerRouletteModalProps> = ({
  isOpen,
  title,
  subtitle,
  badgeText,
  candidates,
  isTensionRoulette = false,
  onWinnerDetermined,
  onPlayerChosen,
}) => {
  const isDevMode = useGameStore((state) => state.isDevMode);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [winner, setWinner] = useState<Player | null>(null);
  const [isNearEnd, setIsNearEnd] = useState(false);

  useEffect(() => {
    if (!isOpen || candidates.length === 0) return;

    setWinner(null);
    setIsNearEnd(false);

    // Seleccionar de forma ponderada al ganador (dando 3x probabilidad a los concursantes sin casillas)
    const targetWinner = pickWeightedRouletteWinner(candidates);
    const targetIndex = candidates.findIndex((p) => p.id === targetWinner.id);

    const N = candidates.length;
    let currentIndex = Math.floor(Math.random() * N);
    setHighlightedIndex(currentIndex);

    // En Dev Mode, la ruleta es súper rápida (2-3 giros, ~200ms)
    const minSpins = isDevMode
      ? 3
      : isTensionRoulette
      ? 22 + Math.floor(Math.random() * 4)
      : 14 + Math.floor(Math.random() * 4);

    let diff = (targetIndex - currentIndex) % N;
    if (diff < 0) diff += N;
    let maxSpins = diff;
    while (maxSpins < minSpins) {
      maxSpins += N;
    }

    let count = 0;

    const getNextDelay = (step: number, total: number) => {
      if (isDevMode) return 30 + step * 20;

      if (!isTensionRoulette) {
        // Ruleta estándar
        return 40 + Math.pow(step / total, 2) * 220;
      }

      // RULETA CON TENSIÓN MÁXIMA PARA LA GRAN FINAL
      const remaining = total - step;
      if (remaining > 6) {
        return 35 + (step / total) * 45; // Fase rápida fluida
      } else if (remaining === 6) {
        return 160;
      } else if (remaining === 5) {
        return 240;
      } else if (remaining === 4) {
        return 360;
      } else if (remaining === 3) {
        return 520;
      } else if (remaining === 2) {
        return 750;
      } else {
        // Último paso con agonía dramática
        return 1050;
      }
    };

    const spin = () => {
      currentIndex = (currentIndex + 1) % N;
      setHighlightedIndex(currentIndex);
      count++;

      const remaining = maxSpins - count;

      if (isTensionRoulette && remaining <= 5 && !isDevMode) {
        setIsNearEnd(true);
        const tensionProgress = (5 - remaining) / 5;
        soundEngine.playTensionTick(tensionProgress);
      } else {
        soundEngine.playRouletteBlip(450 + (count % 8) * 60);
      }

      if (count < maxSpins) {
        const nextDelay = getNextDelay(count, maxSpins);
        setTimeout(spin, nextDelay);
      } else {
        const chosen = candidates[currentIndex];
        setWinner(chosen);
        onWinnerDetermined?.(chosen);

        if (isTensionRoulette) {
          soundEngine.playDramaticSting();
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: [chosen.color || '#ffd700', '#ff2a4b', '#ffd700', '#00f0ff'],
          });
        } else {
          soundEngine.playCorrect();
        }
      }
    };

    const initialDelay = isTensionRoulette ? 40 : 50;
    const timer = setTimeout(spin, initialDelay);
    return () => clearTimeout(timer);
  }, [isOpen, candidates, isDevMode, isTensionRoulette, onWinnerDetermined]);

  if (!isOpen || candidates.length === 0) return null;

  const currentDisplayPlayer = winner || candidates[highlightedIndex] || candidates[0];
  const activeColor = currentDisplayPlayer?.color || '#00f0ff';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none">
      <div
        className={`bg-floor-surface border-2 rounded-3xl max-w-md w-full p-6 md:p-8 text-center space-y-6 transition-all duration-300 shadow-2xl relative overflow-hidden ${
          isTensionRoulette ? 'border-amber-500 shadow-[0_0_80px_rgba(255,170,0,0.35)]' : ''
        }`}
        style={{
          borderColor: isTensionRoulette && !winner ? '#f59e0b' : activeColor,
          boxShadow: isTensionRoulette
            ? `0 0 70px ${activeColor}77`
            : `0 0 50px ${activeColor}55`,
        }}
      >
        {/* Resplandor épico de fondo en modo tensión */}
        {isTensionRoulette && (
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-36 bg-gradient-to-b from-amber-500/25 to-transparent blur-2xl pointer-events-none" />
        )}

        {/* Cabecera */}
        <div className="space-y-1.5 relative z-10">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-floor-card border text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
            style={{
              borderColor: isTensionRoulette ? '#f59e0b' : `${activeColor}88`,
              color: isTensionRoulette ? '#fbbf24' : activeColor,
            }}
          >
            {isTensionRoulette ? (
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {badgeText}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold digital-font text-white flex items-center justify-center gap-2">
            {isTensionRoulette && <Crown className="w-6 h-6 text-amber-400 fill-amber-400" />}
            {title}
            {isTensionRoulette && <Crown className="w-6 h-6 text-amber-400 fill-amber-400" />}
          </h2>
          {subtitle && <p className="text-xs text-slate-300 max-w-xs mx-auto">{subtitle}</p>}
        </div>

        {/* Tarjeta del jugador en la ruleta con animación de latido/tensión */}
        <div
          className={`p-6 rounded-2xl border-2 transition-all duration-150 flex flex-col items-center justify-center gap-3 bg-floor-card relative z-10 ${
            isNearEnd && !winner ? 'scale-105 transition-transform duration-300' : ''
          }`}
          style={{
            borderColor: activeColor,
            boxShadow: `0 0 40px ${activeColor}66`,
            backgroundColor: `${activeColor}18`,
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-black transition-transform"
            style={{
              backgroundColor: activeColor,
              boxShadow: `0 0 25px ${activeColor}`,
            }}
          >
            {currentDisplayPlayer?.name.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1">
            <h3
              className="text-2xl font-bold transition-colors"
              style={{
                color: activeColor,
                textShadow: `0 0 15px ${activeColor}88`,
              }}
            >
              {currentDisplayPlayer?.name}
            </h3>
            <div className="text-xs text-slate-300">
              {currentDisplayPlayer?.territoryCount > 0
                ? `${currentDisplayPlayer.territoryCount} casillas dominadas`
                : 'Aspirante'}
            </div>
          </div>
        </div>

        {/* Botón de Confirmación con el color del jugador */}
        <div className="relative z-10">
          {winner ? (
            <button
              type="button"
              onClick={() => onPlayerChosen(winner)}
              className="w-full py-4 rounded-xl font-bold text-sm tracking-wider uppercase digital-font text-black hover:scale-105 transition-transform flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              style={{
                backgroundColor: activeColor,
                boxShadow: `0 0 30px ${activeColor}`,
              }}
            >
              <Swords className="w-4 h-4" />
              {isTensionRoulette
                ? `¡IR A LA GRAN FINAL CON ${winner.name.toUpperCase()}!`
                : `¡CONTINUAR CON ${winner.name.toUpperCase()}!`}
            </button>
          ) : (
            <div
              className="text-xs flex items-center justify-center gap-2 font-bold py-2"
              style={{ color: isTensionRoulette ? '#fbbf24' : activeColor }}
            >
              <User className={`w-4 h-4 ${isNearEnd ? 'animate-bounce text-amber-400' : 'animate-spin'}`} />
              {isTensionRoulette
                ? isNearEnd
                  ? '¡EL DESTINO ESTÁ A PUNTO DE DECIDIRSE...!'
                  : 'Sorteando rival definitivo...'
                : 'Sorteando...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

