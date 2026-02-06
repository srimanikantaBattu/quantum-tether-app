export enum NodeType {
  EMPTY = 'EMPTY',
  STABLE = 'STABLE',
  COLLAPSER = 'COLLAPSER',
  MULTIPLIER = 'MULTIPLIER',
  GOLD = 'GOLD',
}

export enum PlayerRole {
  VECTOR = 'VECTOR',
  VORTEX = 'VORTEX',
}

export enum GamePhase {
  MENU = 'MENU',
  PLANNING = 'PLANNING', // 3s countdown for input
  RESOLVING = 'RESOLVING', // Animation of move
  GAME_OVER = 'GAME_OVER',
}

export interface Position {
  x: number;
  y: number;
}

export interface Vector {
  x: number;
  y: number;
}

export interface GridNode {
  id: string;
  x: number;
  y: number;
  type: NodeType;
  active: boolean; // For collapsers that have triggered
}

export interface GameState {
  phase: GamePhase;
  grid: GridNode[];
  sparkPos: Position;
  flux: number; // 0-100
  p1Score: number; // Gold collected (Goal: 5)
  p2Score: number; // Voidouts (Goal: 3)
  timer: number;
  entangled: boolean; // Are controls swapped?
  entanglementAvailable: {
    p1: boolean;
    p2: boolean;
  };
  lastVoidoutPos: Position | null;
  winner: PlayerRole | null;
}

export interface PlayerInputs {
  vectorDir: Vector | null; // (0,-1), (0,1), (-1,0), (1,0)
  vortexDir: 'CW' | 'CCW' | null;
  entangleTriggered: boolean;
}