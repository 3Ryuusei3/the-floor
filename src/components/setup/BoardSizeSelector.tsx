import React from 'react';
import { Grid, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useGameStore } from '../../hooks/useGameStore';

interface BoardSizeSelectorProps {
  currentRows: number;
  currentCols: number;
  onSelectDimensions: (rows: number, cols: number) => void;
}

interface BoardSizeOption {
  rows: number;
  cols: number;
  total: number;
  label: string;
  format: string;
  desc: string;
  isDev?: boolean;
}

const STANDARD_SIZES: BoardSizeOption[] = [
  { rows: 4, cols: 5, total: 20, label: '20 Casillas', format: '4 × 5', desc: 'Partida Rápida' },
  { rows: 4, cols: 6, total: 24, label: '24 Casillas', format: '4 × 6', desc: 'Estándar Plató' },
  { rows: 5, cols: 6, total: 30, label: '30 Casillas', format: '5 × 6', desc: 'Gran Torneo' },
];

const DEV_MINI_SIZE: BoardSizeOption = {
  rows: 2,
  cols: 2,
  total: 4,
  label: '4 Casillas',
  format: '2 × 2',
  desc: 'Dev Mode Mini',
  isDev: true,
};

export const BoardSizeSelector: React.FC<BoardSizeSelectorProps> = ({
  currentRows,
  currentCols,
  onSelectDimensions,
}) => {
  const isDevMode = useGameStore((state) => state.isDevMode);
  const currentTotal = currentRows * currentCols;

  const availableSizes = isDevMode ? [DEV_MINI_SIZE, ...STANDARD_SIZES] : STANDARD_SIZES;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Grid className="w-4 h-4 text-floor-cyan" />
          Tamaño del Tablero
        </label>
        <span className="text-xs text-slate-400 font-mono">
          Seleccionado: <strong className="text-floor-cyan">{currentTotal} casillas ({currentRows}x{currentCols})</strong>
        </span>
      </div>

      {/* Opciones de tamaño (incluyendo 4 casillas si está en Dev Mode) */}
      <div className={cn('grid gap-3.5', isDevMode ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3')}>
        {availableSizes.map((item) => {
          const isSelected = currentRows === item.rows && currentCols === item.cols;
          return (
            <button
              key={item.total}
              type="button"
              onClick={() => onSelectDimensions(item.rows, item.cols)}
              className={cn(
                'p-4 rounded-2xl border-2 transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none relative overflow-hidden',
                isSelected
                  ? 'bg-floor-surface border-floor-cyan shadow-[0_0_20px_rgba(0,240,255,0.4)] text-floor-cyan font-bold scale-[1.02]'
                  : 'bg-floor-card/80 border-floor-border text-slate-300 hover:border-slate-500 hover:bg-floor-surface/80'
              )}
            >
              {item.isDev && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold uppercase flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" /> Dev
                </div>
              )}
              <div className="text-2xl font-bold digital-font text-white">{item.label}</div>
              <div className="text-xs font-mono text-floor-gold font-bold">{item.format} rectangulares</div>
              <div className="text-[11px] text-slate-400">{item.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
