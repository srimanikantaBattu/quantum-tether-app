import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GamePhase, PlayerRole, Position, PlayerInputs, Vector, NodeType } from './types';
import { 
  GRID_SIZE, 
  PHASE_DURATION_PLANNING, 
  FLUX_MAX, 
  FLUX_REGEN, 
  FLUX_COST_MOVE, 
  FLUX_COST_VORTEX,
  WIN_SCORE_VECTOR,
  WIN_SCORE_VORTEX
} from './constants';
import { generateGrid, calculateNextPosition, checkCollisions, getNearestNode } from './utils/physics';
import { GridBoard } from './components/GridBoard';
import { GameHUD } from './components/GameHUD';

// Initial state factory
const createInitialState = (): GameState => ({
  phase: GamePhase.MENU,
  grid: [],
  sparkPos: { x: 5, y: 5 },
  flux: FLUX_MAX,
  p1Score: 0,
  p2Score: 0,
  timer: PHASE_DURATION_PLANNING,
  entangled: false,
  entanglementAvailable: { p1: true, p2: true },
  lastVoidoutPos: null,
  winner: null,
});

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [inputs, setInputs] = useState<PlayerInputs>({
    vectorDir: null,
    vortexDir: null,
    entangleTriggered: false,
  });

  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  
  // Game Loop Logic
  const update = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    setGameState(prev => {
      if (prev.phase === GamePhase.GAME_OVER || prev.phase === GamePhase.MENU) return prev;

      let newTimer = prev.timer - deltaTime;
      
      // Phase Transition: Planning -> Resolving
      if (prev.phase === GamePhase.PLANNING && newTimer <= 0) {
        // Resolve Turns
        let nextPos = { ...prev.sparkPos };
        let nextFlux = prev.flux;
        let p1Input = inputs.vectorDir;
        let p2Input = inputs.vortexDir;

        // Handle Entanglement Logic (Swap Inputs if entangled)
        if (prev.entangled) {
            // If entangled, P1 physical input (WASD) acts as Vortex
            // P2 physical input (Arrows) acts as Vector
            // But 'inputs' state stores physical key presses mapped to logic.
            // Let's re-map:
            // The inputs state currently stores logical intent based on keys.
            // P1(WASD) -> vectorDir in state.
            // P2(Arrows) -> vortexDir in state.
            // If entangled, we need to swap the effect.
            
            // Actually, easier way:
            // Input handling sets 'vectorDir' when WASD is pressed.
            // If entangled, WASD should set 'vortexDir'.
            // See input handler below.
        }

        // Apply Flux Costs
        const p1Cost = p1Input ? FLUX_COST_MOVE : 0;
        const p2Cost = p2Input ? FLUX_COST_VORTEX : 0;
        
        let moveAllowed = true;
        // Simple logic: if not enough flux for both, partial failure?
        // Let's just deduct. If flux goes negative, movement is dampened?
        // Simplification: Allow move but clamp flux at 0. If 0, no move next turn.
        
        if (prev.flux <= 5) {
             moveAllowed = false; // Exhausted
        }

        nextFlux = Math.min(FLUX_MAX, nextFlux - p1Cost - p2Cost + FLUX_REGEN);
        if (nextFlux < 0) nextFlux = 0;

        let gridUpdates = [...prev.grid];
        let p1Score = prev.p1Score;
        let p2Score = prev.p2Score;
        let winner = prev.winner;

        if (moveAllowed) {
            // Find pivot for vortex logic
            const nearestPivot = getNearestNode(prev.sparkPos, prev.grid);
            
            // Calculate physics
            nextPos = calculateNextPosition(prev.sparkPos, inputs, nearestPivot);
            
            // Collisions
            const collision = checkCollisions(nextPos, prev.grid);
            
            if (collision.inVoid) {
                // Voidout!
                p2Score += 1;
                // Reset to center
                nextPos = { x: GRID_SIZE / 2, y: GRID_SIZE / 2 };
                // Penalty?
                nextFlux = 50; 
                if (p2Score >= WIN_SCORE_VORTEX) winner = PlayerRole.VORTEX;
            } else if (collision.touchedNode) {
                // Handle Node Effects
                const node = collision.touchedNode;
                if (node.type === NodeType.GOLD) {
                    p1Score += 1;
                    // Deactivate node
                    const idx = gridUpdates.findIndex(n => n.id === node.id);
                    if (idx !== -1) gridUpdates[idx] = { ...node, active: false, type: NodeType.EMPTY };
                    if (p1Score >= WIN_SCORE_VECTOR) winner = PlayerRole.VECTOR;
                } else if (node.type === NodeType.COLLAPSER) {
                     // Disappear
                    const idx = gridUpdates.findIndex(n => n.id === node.id);
                    if (idx !== -1) gridUpdates[idx] = { ...node, active: false, type: NodeType.EMPTY };
                } else if (node.type === NodeType.MULTIPLIER) {
                    nextFlux = Math.min(FLUX_MAX, nextFlux + 30);
                }
            }
        }

        // Reset inputs for next turn
        setInputs({ vectorDir: null, vortexDir: null, entangleTriggered: false });

        return {
            ...prev,
            // Let's stick to planning loop for simplicity but reset timer
            timer: PHASE_DURATION_PLANNING,
            sparkPos: nextPos,
            flux: nextFlux,
            grid: gridUpdates,
            p1Score,
            p2Score,
            winner: winner || null,
            phase: winner ? GamePhase.GAME_OVER : GamePhase.PLANNING
        };
      }

      return { ...prev, timer: newTimer };
    });

    requestRef.current = requestAnimationFrame(update);
  }, [inputs]); // dependency on inputs to capture latest state

  useEffect(() => {
    if (gameState.phase === GamePhase.PLANNING) {
        requestRef.current = requestAnimationFrame(update);
    }
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState.phase, update]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (gameState.phase !== GamePhase.PLANNING) return;

        // Determine who is who based on Entanglement
        const p1IsVector = !gameState.entangled;

        // P1 Controls (WASD)
        if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
            const key = e.key.toLowerCase();
            if (p1IsVector) {
                // Vector Logic
                let dir: Vector = { x: 0, y: 0 };
                if (key === 'w') dir = { x: 0, y: -1 };
                if (key === 's') dir = { x: 0, y: 1 };
                if (key === 'a') dir = { x: -1, y: 0 };
                if (key === 'd') dir = { x: 1, y: 0 };
                setInputs(prev => ({ ...prev, vectorDir: dir }));
            } else {
                // Vortex Logic via WASD (if entangled)
                // Map A/D to spin?
                if (key === 'a') setInputs(prev => ({ ...prev, vortexDir: 'CCW' }));
                if (key === 'd') setInputs(prev => ({ ...prev, vortexDir: 'CW' }));
            }
        }

        // P2 Controls (Arrows)
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
            const key = e.key.toLowerCase();
            if (!p1IsVector) {
                // P2 is now Vector (Entangled)
                let dir: Vector = { x: 0, y: 0 };
                if (key === 'arrowup') dir = { x: 0, y: -1 };
                if (key === 'arrowdown') dir = { x: 0, y: 1 };
                if (key === 'arrowleft') dir = { x: -1, y: 0 };
                if (key === 'arrowright') dir = { x: 1, y: 0 };
                setInputs(prev => ({ ...prev, vectorDir: dir }));
            } else {
                // P2 is Vortex (Normal)
                if (key === 'arrowleft') setInputs(prev => ({ ...prev, vortexDir: 'CCW' }));
                if (key === 'arrowright') setInputs(prev => ({ ...prev, vortexDir: 'CW' }));
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.phase, gameState.entangled]);

  const startGame = () => {
    setGameState({
        ...createInitialState(),
        grid: generateGrid(),
        phase: GamePhase.PLANNING
    });
  };

  const toggleEntangle = () => {
      // One time use logic can be added here
      if (!gameState.entanglementAvailable.p1 && !gameState.entanglementAvailable.p2) return;
      
      setGameState(prev => ({
          ...prev,
          entangled: !prev.entangled,
          entanglementAvailable: { p1: false, p2: false } // consume charge
      }));
  };

  // Helper to visualize inputs on HUD
  const getP1InputActive = () => {
      if (gameState.entangled) return inputs.vortexDir !== null;
      return inputs.vectorDir !== null;
  };
  const getP2InputActive = () => {
      if (gameState.entangled) return inputs.vectorDir ? 'ACTIVE' : null; // simplified
      return inputs.vortexDir;
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        
        {/* Background Grid Effect */}
        <div className="absolute inset-0 grid-lines opacity-20 pointer-events-none z-0" />

        {gameState.phase === GamePhase.MENU && (
            <div className="z-50 flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-white to-fuchsia-500 glow-text mb-4 font-display">
                    QUANTUM TETHER
                </h1>
                <p className="max-w-md text-gray-400 text-lg">
                    Two minds. One Spark. <br/>
                    Player 1 (WASD) seeks <span className="text-yellow-400">Gold</span>.<br/>
                    Player 2 (ARROWS) seeks the <span className="text-red-500">Void</span>.
                </p>
                <button 
                    onClick={startGame}
                    className="px-12 py-4 bg-white text-black font-bold text-xl tracking-widest hover:scale-105 transition-transform rounded-sm shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                >
                    INITIATE LINK
                </button>
            </div>
        )}

        {(gameState.phase === GamePhase.PLANNING || gameState.phase === GamePhase.RESOLVING || gameState.phase === GamePhase.GAME_OVER) && (
            <>
                <GameHUD 
                    phase={gameState.phase}
                    timer={gameState.timer}
                    flux={gameState.flux}
                    p1Score={gameState.p1Score}
                    p2Score={gameState.p2Score}
                    entangled={gameState.entangled}
                    onEntangle={toggleEntangle}
                    canEntangle={gameState.entanglementAvailable.p1 || gameState.entanglementAvailable.p2}
                    p1InputActive={getP1InputActive()}
                    p2InputActive={getP2InputActive()}
                />

                <GridBoard 
                    grid={gameState.grid}
                    sparkPos={gameState.sparkPos}
                    nearestPivot={getNearestNode(gameState.sparkPos, gameState.grid)}
                    entangled={gameState.entangled}
                />
            </>
        )}

        {gameState.phase === GamePhase.GAME_OVER && (
            <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                <h2 className="text-6xl font-display font-bold mb-4">
                    {gameState.winner === PlayerRole.VECTOR ? (
                        <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">VECTOR WINS</span>
                    ) : (
                        <span className="text-fuchsia-500 drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]">VORTEX WINS</span>
                    )}
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                    {gameState.winner === PlayerRole.VECTOR 
                        ? "The Spark has stabilized." 
                        : "The Spark has been lost to the Void."}
                </p>
                <button 
                    onClick={startGame}
                    className="px-8 py-3 border border-white/50 hover:bg-white hover:text-black transition-colors font-display"
                >
                    REBOOT SYSTEM
                </button>
            </div>
        )}
    </div>
  );
};

export default App;