import React from 'react';
import { GamePhase, PlayerRole } from '../types';
import { Zap, Target, AlertTriangle, ArrowUp, RotateCw, RotateCcw, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';
import { FLUX_MAX, WIN_SCORE_VECTOR, WIN_SCORE_VORTEX, COLOR_VECTOR, COLOR_VORTEX } from '../constants';

interface GameHUDProps {
  phase: GamePhase;
  timer: number;
  flux: number;
  p1Score: number;
  p2Score: number;
  entangled: boolean;
  onEntangle: () => void;
  canEntangle: boolean;
  p1InputActive: boolean;
  p2InputActive: string | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  phase,
  timer,
  flux,
  p1Score,
  p2Score,
  entangled,
  onEntangle,
  canEntangle,
  p1InputActive,
  p2InputActive,
}) => {
  
  const getBarColor = () => {
    if (flux > 60) return 'bg-green-400';
    if (flux > 30) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-4 flex flex-col gap-4">
      {/* Top Bar: Scores & Time */}
      <div className="flex justify-between items-center bg-gray-900/80 p-4 rounded-xl border border-gray-700 backdrop-blur-sm">
        
        {/* P1 Vector Stats */}
        <div className={`flex items-center gap-3 ${entangled ? 'text-fuchsia-400' : 'text-cyan-400'}`}>
          <div className="text-right">
            <h3 className="font-display font-bold text-lg">{entangled ? 'VORTEX (P1)' : 'VECTOR (P1)'}</h3>
            <div className="flex items-center gap-1 text-sm opacity-80">
              <Target size={14} />
              <span>{p1Score} / {WIN_SCORE_VECTOR} GOLD</span>
            </div>
          </div>
          <div className={`p-2 rounded-lg ${entangled ? 'bg-fuchsia-900/50' : 'bg-cyan-900/50'} border ${entangled ? 'border-fuchsia-500' : 'border-cyan-500'}`}>
            <span className="font-display text-2xl">{p1Score}</span>
          </div>
        </div>

        {/* Timer / Pulse */}
        <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="absolute w-full h-full rotate-[-90deg]">
                    <circle cx="32" cy="32" r="28" stroke="#374151" strokeWidth="4" fill="none" />
                    <circle 
                        cx="32" cy="32" r="28" 
                        stroke="#fbbf24" 
                        strokeWidth="4" 
                        fill="none" 
                        strokeDasharray="176"
                        strokeDashoffset={176 - (176 * (timer / 3))}
                        className="transition-[stroke-dashoffset] duration-100 ease-linear"
                    />
                </svg>
                <span className="font-display text-2xl font-bold">{Math.ceil(timer)}</span>
            </div>
            <span className="text-xs uppercase tracking-widest text-gray-400 mt-1">{phase === GamePhase.PLANNING ? 'CALCULATING' : 'ACTING'}</span>
        </div>

        {/* P2 Vortex Stats */}
        <div className={`flex items-center gap-3 ${entangled ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
          <div className={`p-2 rounded-lg ${entangled ? 'bg-cyan-900/50' : 'bg-fuchsia-900/50'} border ${entangled ? 'border-cyan-500' : 'border-fuchsia-500'}`}>
            <span className="font-display text-2xl">{p2Score}</span>
          </div>
          <div className="text-left">
            <h3 className="font-display font-bold text-lg">{entangled ? 'VECTOR (P2)' : 'VORTEX (P2)'}</h3>
            <div className="flex items-center gap-1 text-sm opacity-80">
              <AlertTriangle size={14} />
              <span>{p2Score} / {WIN_SCORE_VORTEX} VOIDOUTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flux Bar */}
      <div className="relative w-full h-6 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
        <div 
          className={`absolute top-0 left-0 h-full transition-all duration-300 ${getBarColor()}`} 
          style={{ width: `${flux}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-bold text-shadow text-white">
            <Zap size={12} fill="currentColor" />
            SHARED FLUX RESERVES: {Math.floor(flux)}%
        </div>
      </div>

      {/* Controls & Entangle */}
      <div className="flex justify-between items-end h-24">
         {/* P1 Controls */}
         <div className="flex flex-col gap-2 opacity-80">
            <span className="text-xs text-gray-400 uppercase">Player 1 Inputs (WASD)</span>
            <div className="grid grid-cols-3 gap-1 w-max">
                <div />
                <div className={`w-10 h-10 flex items-center justify-center border rounded ${p1InputActive ? 'bg-white text-black' : 'border-gray-600 bg-gray-800'}`}>W</div>
                <div />
                <div className={`w-10 h-10 flex items-center justify-center border rounded ${p1InputActive ? 'bg-white text-black' : 'border-gray-600 bg-gray-800'}`}>A</div>
                <div className={`w-10 h-10 flex items-center justify-center border rounded ${p1InputActive ? 'bg-white text-black' : 'border-gray-600 bg-gray-800'}`}>S</div>
                <div className={`w-10 h-10 flex items-center justify-center border rounded ${p1InputActive ? 'bg-white text-black' : 'border-gray-600 bg-gray-800'}`}>D</div>
            </div>
         </div>

         {/* Entangle Button */}
         <button 
            onClick={onEntangle}
            disabled={!canEntangle}
            className={`flex flex-col items-center gap-2 p-4 rounded-full border-2 transition-all duration-300 ${canEntangle ? 'border-purple-400 bg-purple-900/20 hover:bg-purple-900/50 hover:scale-110 cursor-pointer' : 'border-gray-700 bg-gray-900 opacity-50 cursor-not-allowed'}`}
         >
            <RotateCw size={32} className={`${canEntangle ? 'animate-spin-slow' : ''}`} />
            <span className="text-[10px] font-bold tracking-widest">ENTANGLE</span>
         </button>

         {/* P2 Controls */}
         <div className="flex flex-col gap-2 items-end opacity-80">
            <span className="text-xs text-gray-400 uppercase">Player 2 Inputs (ARROWS)</span>
            <div className="flex gap-2">
                 <div className={`flex flex-col items-center gap-1 p-2 border rounded ${p2InputActive === 'CCW' ? 'bg-fuchsia-500 text-white' : 'border-gray-600 bg-gray-800'}`}>
                    <RotateCcw size={20} />
                    <ArrowLeft size={16} />
                 </div>
                 <div className={`flex flex-col items-center gap-1 p-2 border rounded ${p2InputActive === 'CW' ? 'bg-fuchsia-500 text-white' : 'border-gray-600 bg-gray-800'}`}>
                    <RotateCw size={20} />
                    <ArrowRight size={16} />
                 </div>
            </div>
            <div className="text-[10px] text-gray-500 max-w-[120px] text-right">
                Pivots around nearest node
            </div>
         </div>
      </div>

      {/* Warning if Entangled */}
      {entangled && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
             <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 opacity-20 animate-pulse">
                ENTANGLED
             </h1>
        </div>
      )}

    </div>
  );
};
