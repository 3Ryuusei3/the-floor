import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, CheckCircle, ShieldAlert, Zap } from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';

interface DevModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevModeModal: React.FC<DevModeModalProps> = ({ isOpen, onClose }) => {
  const isDevMode = useGameStore((state) => state.isDevMode);
  const setIsDevMode = useGameStore((state) => state.setIsDevMode);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-floor-surface border-2 border-floor-cyan/60 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden text-white p-6 md:p-8"
        >
          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-floor-cyan/10 border border-floor-cyan/30 rounded-2xl text-floor-cyan">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-wider uppercase text-slate-100 flex items-center gap-2">
                Modo Developer
              </h2>
              <p className="text-xs text-slate-400">Herramientas de testing y control de partida</p>
            </div>
          </div>

          {/* Estado del interruptor */}
          <div className="bg-floor-card border border-floor-border rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="font-bold text-base text-slate-200">Activar Modo Desarrollador</span>
                <span className="text-xs text-slate-400">
                  Habilita botones en pantalla de duelo para forzar la victoria de cualquier participante.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDevMode(!isDevMode)}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isDevMode ? 'bg-floor-cyan shadow-[0_0_15px_rgba(0,240,255,0.5)]' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-slate-900 shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                    isDevMode ? 'translate-x-6 bg-slate-950 text-floor-cyan' : 'translate-x-0 text-slate-500'
                  }`}
                >
                  {isDevMode ? <Zap className="w-4 h-4 fill-current" /> : <X className="w-3.5 h-3.5" />}
                </span>
              </button>
            </div>
          </div>

          {/* Funcionalidades incluidas */}
          <div className="space-y-3 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Funcionalidades:</h3>
            <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <CheckCircle className="w-4 h-4 text-floor-green flex-shrink-0 mt-0.5" />
              <span>
                <strong>Forzar Ganador de Duelo:</strong> Botones con el color de cada jugador para decidir el vencedor al instante.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <CheckCircle className="w-4 h-4 text-floor-green flex-shrink-0 mt-0.5" />
              <span>
                <strong>Ruleta Ultra Rápida y Sin Cuenta Atrás:</strong> Giros acelerados a ~200ms e inicio inmediato del duelo sin esperar los 3s de cuenta atrás.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <ShieldAlert className="w-4 h-4 text-floor-amber flex-shrink-0 mt-0.5" />
              <span>
                <strong>Atajo de Teclado:</strong> Pulsa <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-floor-cyan">Shift + D</kbd> en cualquier momento para abrir/cerrar este panel.
              </span>
            </div>
          </div>

          {/* Botones de Partida Rápida Dev */}
          <div className="mb-6 p-4 bg-floor-card border border-floor-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <div className="font-bold text-sm text-white">Partida de Prueba Rápida</div>
              <div className="text-xs text-slate-400">Crea automáticamente 2 jugadores ('1' y '2') y lanza el tablero</div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <button
                type="button"
                onClick={() => {
                  useGameStore.getState().initDevQuickGame(2, 2);
                  onClose();
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,165,0,0.4)] whitespace-nowrap cursor-pointer"
              >
                ⚡ Mini (4 casillas)
              </button>
              <button
                type="button"
                onClick={() => {
                  useGameStore.getState().initDevQuickGame(4, 5);
                  onClose();
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-800 border border-amber-500/50 text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
              >
                ⚡ 20 casillas
              </button>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-floor-cyan text-black hover:bg-cyan-300 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer"
            >
              Cerrar y Guardar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
