import React from 'react';
import { motion } from 'framer-motion';
import { GridNode, NodeType, Position, PlayerRole } from '../types';
import { GRID_SIZE, CELL_SIZE_REM, COLOR_VECTOR, COLOR_VORTEX } from '../constants';
import { Hexagon, Circle, Square, Star, Zap } from 'lucide-react';

interface GridBoardProps {
  grid: GridNode[];
  sparkPos: Position;
  nearestPivot: GridNode | null;
  entangled: boolean;
}

const NodeIcon = ({ type }: { type: NodeType }) => {
  switch (type) {
    case NodeType.GOLD:
      return <Star className="w-full h-full text-yellow-400 fill-yellow-400 animate-pulse" />;
    case NodeType.COLLAPSER:
      return <Hexagon className="w-full h-full text-red-500/50" />;
    case NodeType.MULTIPLIER:
      return <Zap className="w-full h-full text-blue-400" />;
    case NodeType.STABLE:
      return <Square className="w-3 h-3 text-gray-600 rotate-45" />;
    default:
      return <Circle className="w-1 h-1 text-gray-800" />;
  }
};

export const GridBoard: React.FC<GridBoardProps> = ({ grid, sparkPos, nearestPivot, entangled }) => {
  
  // Calculate pixel positions for absolute elements
  const getStyle = (x: number, y: number) => ({
    left: `${x * CELL_SIZE_REM}rem`,
    top: `${y * CELL_SIZE_REM}rem`,
    width: `${CELL_SIZE_REM}rem`,
    height: `${CELL_SIZE_REM}rem`,
  });

  return (
    <div 
      className="relative bg-gray-900 border-2 border-gray-800 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-visible"
      style={{
        width: `${GRID_SIZE * CELL_SIZE_REM}rem`,
        height: `${GRID_SIZE * CELL_SIZE_REM}rem`,
      }}
    >
      {/* Grid Nodes */}
      {grid.map((node) => (
        <div
          key={node.id}
          className={`absolute flex items-center justify-center transition-opacity duration-500 ${!node.active && node.type !== NodeType.EMPTY ? 'opacity-0' : 'opacity-100'}`}
          style={getStyle(node.x, node.y)}
        >
          <div className={`w-3/5 h-3/5 flex items-center justify-center ${node.id === nearestPivot?.id ? 'ring-2 ring-fuchsia-500 rounded-full scale-110' : ''}`}>
             <NodeIcon type={node.type} />
          </div>
        </div>
      ))}

      {/* Tether Visual (Only if pivot exists) */}
      {nearestPivot && (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-visible">
          <line
            x1={`${(sparkPos.x + 0.5) * CELL_SIZE_REM}rem`}
            y1={`${(sparkPos.y + 0.5) * CELL_SIZE_REM}rem`}
            x2={`${(nearestPivot.x + 0.5) * CELL_SIZE_REM}rem`}
            y2={`${(nearestPivot.y + 0.5) * CELL_SIZE_REM}rem`}
            stroke={entangled ? COLOR_VECTOR : COLOR_VORTEX}
            strokeWidth="2"
            strokeDasharray="5,5"
            className="opacity-50"
          />
        </svg>
      )}

      {/* Spark Entity */}
      <motion.div
        className="absolute z-20 pointer-events-none"
        initial={false}
        animate={{
          left: `${sparkPos.x * CELL_SIZE_REM}rem`,
          top: `${sparkPos.y * CELL_SIZE_REM}rem`,
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15,
          mass: 0.5
        }}
        style={{
          width: `${CELL_SIZE_REM}rem`,
          height: `${CELL_SIZE_REM}rem`,
        }}
      >
        <div className="w-full h-full flex items-center justify-center relative">
            {/* Core */}
            <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_15px_#fff] z-10" />
            {/* Vector Aura */}
            <div className={`absolute w-8 h-8 rounded-full border-2 opacity-75 animate-ping ${entangled ? 'border-fuchsia-500' : 'border-cyan-500'}`} style={{ animationDuration: '3s' }}></div>
            {/* Vortex Aura */}
            <div className={`absolute w-12 h-12 rounded-full border border-dashed opacity-50 animate-spin-slow ${entangled ? 'border-cyan-500' : 'border-fuchsia-500'}`}></div>
        </div>
      </motion.div>
    </div>
  );
};
