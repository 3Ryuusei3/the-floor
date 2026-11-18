import React, { useState, useEffect } from 'react';
import { useGameStore } from './hooks/useGameStore';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { usePeerHost } from './hooks/usePeerConnection';
import { GameSetup } from './components/setup/GameSetup';
import { BoardGrid } from './components/board/BoardGrid';
import { DuelArena } from './components/duel/DuelArena';
import { FloorChampion } from './components/victory/FloorChampion';
import { JudgeView } from './components/judge/JudgeView';
import { QRPairingModal } from './components/judge/QRPairingModal';
import { DevModeModal } from './components/dev/DevModeModal';

export const App: React.FC = () => {
  // Atajos de teclado para el presentador
  useKeyboardControls();

  const phase = useGameStore((state) => state.phase);
  const isDevMode = useGameStore((state) => state.isDevMode);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  // Comprobar si esta instancia se abre como Mando del Juez
  const searchParams = new URLSearchParams(window.location.search);
  const role = searchParams.get('role');
  const queryRoom = searchParams.get('room');

  // Identificador de sala único persistente para la pantalla Host y el Mando
  const [roomId] = useState(() => {
    if (queryRoom) {
      try {
        localStorage.setItem('the_floor_room_id', queryRoom);
      } catch {}
      return queryRoom;
    }
    const stored = (() => {
      try {
        return localStorage.getItem('the_floor_room_id') || sessionStorage.getItem('the_floor_room_id');
      } catch {
        return null;
      }
    })();
    if (stored) return stored;
    const generated = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      localStorage.setItem('the_floor_room_id', generated);
      sessionStorage.setItem('the_floor_room_id', generated);
    } catch {}
    return generated;
  });

  // Inicializar servidor Host WebRTC si somos la pantalla principal
  const { isConnected } = usePeerHost(role === 'judge' ? '' : roomId);

  useEffect(() => {
    // Evento personalizado para abrir modal QR desde cualquier componente
    const handleOpenQR = () => setIsQRModalOpen(true);
    window.addEventListener('open-judge-qr', handleOpenQR);
    return () => window.removeEventListener('open-judge-qr', handleOpenQR);
  }, []);

  // Atajo Shift + D para abrir el Modo Developer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input o textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsDevModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Si es la vista del juez (móvil/tablet)
  if (role === 'judge') {
    return <JudgeView roomId={queryRoom || roomId} />;
  }

  // Vista principal de Televisión (Host) - Totalmente nítida y limpia sin scanlines
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden selection:bg-floor-cyan selection:text-black">
      {/* Contenido dinámico según la fase */}
      <main className="relative z-10 flex-1 flex flex-col justify-center">
        {phase === 'setup' && <GameSetup />}
        {phase === 'board' && <BoardGrid />}
        {phase === 'duel' && <DuelArena />}
        {phase === 'victory' && <FloorChampion />}
      </main>

      {/* Modal de emparejamiento QR */}
      <QRPairingModal
        isOpen={isQRModalOpen}
        roomId={roomId}
        isConnected={isConnected}
        onClose={() => setIsQRModalOpen(false)}
      />

      {/* Modal Modo Developer */}
      <DevModeModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
      />

      {/* Footer con acceso rápido al mando */}
      <footer className="relative z-10 py-3 px-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 border-t border-floor-border/40 gap-2">
        <div className="flex items-center gap-2">
          <span>THE FLOOR • Concurso de Televisión • Sala: <strong className="text-slate-300 font-mono">{roomId}</strong></span>
          {isDevMode && (
            <span className="px-2 py-0.5 rounded bg-floor-cyan/20 border border-floor-cyan/40 text-floor-cyan font-bold text-[10px] animate-pulse">
              ⚡ DEV MODE ACTIVO
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsDevModalOpen(true)}
            className="text-slate-400 hover:text-floor-cyan transition-colors font-bold cursor-pointer"
            title="Abrir Modo Developer (Shift + D)"
          >
            🛠️ Dev Mode <span className="opacity-60 text-[10px]">[Shift+D]</span>
          </button>
          <button
            type="button"
            onClick={() => setIsQRModalOpen(true)}
            className="text-floor-cyan hover:text-cyan-300 transition-colors font-bold underline cursor-pointer"
          >
            {isConnected ? '🟢 Mando Juez Conectado' : '📱 Conectar Mando del Juez (QR)'}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
