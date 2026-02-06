import { GridNode, NodeType, PlayerInputs, Position, Vector } from '../types';
import { GRID_SIZE } from '../constants';

export const generateGrid = (): GridNode[] => {
  const nodes: GridNode[] = [];
  let goldCount = 0;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      let type = NodeType.EMPTY;
      const rand = Math.random();

      // Center safe zone
      const isCenter = x >= 3 && x <= 6 && y >= 3 && y <= 6;

      if (!isCenter) {
        if (rand > 0.96 && goldCount < 5) {
          type = NodeType.GOLD;
          goldCount++;
        } else if (rand > 0.85) {
          type = NodeType.COLLAPSER;
        } else if (rand > 0.95) {
          type = NodeType.MULTIPLIER;
        } else if (rand > 0.7) {
          type = NodeType.STABLE;
        }
      } else {
        // Ensure some stable nodes in center for pivoting
        if (rand > 0.6) type = NodeType.STABLE;
      }

      nodes.push({
        id: `${x}-${y}`,
        x,
        y,
        type,
        active: true,
      });
    }
  }
  
  // Ensure exactly 5 gold if random gen missed
  while(goldCount < 5) {
    const idx = Math.floor(Math.random() * nodes.length);
    if(nodes[idx].type === NodeType.EMPTY) {
      nodes[idx].type = NodeType.GOLD;
      goldCount++;
    }
  }

  return nodes;
};

export const getNearestNode = (pos: Position, nodes: GridNode[]): GridNode | null => {
  let nearest: GridNode | null = null;
  let minDist = Infinity;

  // We only pivot around integer grid points
  // Find nearest valid pivot (Stable, Collapser, Multiplier, Gold) - Empty nodes can't be pivots? 
  // Let's say any node including empty is a valid pivot point spatially, but "Empty" implies void of matter.
  // Gameplay wise, pivoting around nothing feels weak. Let's allow pivoting around any grid coordinate center.
  // Actually, prompt says "Nodes". Let's stick to any grid cell center.
  
  for (const node of nodes) {
    const dx = node.x - pos.x;
    const dy = node.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Pivot must be distinct from current pos somewhat, but usually nearest neighbor
    if (dist < minDist && dist > 0.1) {
      minDist = dist;
      nearest = node;
    }
  }
  return nearest;
};

export const calculateNextPosition = (
  currentPos: Position,
  inputs: PlayerInputs,
  pivotNode: GridNode | null
): Position => {
  let dx = 0;
  let dy = 0;

  // Vector Force (Linear)
  if (inputs.vectorDir) {
    dx += inputs.vectorDir.x;
    dy += inputs.vectorDir.y;
  }

  // Vortex Force (Rotational)
  if (inputs.vortexDir && pivotNode) {
    // Calculate vector from pivot to spark
    const rx = currentPos.x - pivotNode.x;
    const ry = currentPos.y - pivotNode.y;
    
    // Rotate 90 degrees
    // CW: (x, y) -> (-y, x)
    // CCW: (x, y) -> (y, -x)
    
    let rotDx = 0;
    let rotDy = 0;
    
    if (inputs.vortexDir === 'CW') {
      rotDx = -ry;
      rotDy = rx;
    } else {
      rotDx = ry;
      rotDy = -rx;
    }
    
    // Normalize rotation force to 1 unit to match Vector force magnitude
    // This creates a tug-of-war balance
    const mag = Math.sqrt(rotDx * rotDx + rotDy * rotDy) || 1;
    dx += (rotDx / mag);
    dy += (rotDy / mag);
  }

  // If both push, the spark moves faster/diagonally/spirally
  // Result is simply the sum of vectors.
  
  return {
    x: currentPos.x + dx,
    y: currentPos.y + dy,
  };
};

export const checkCollisions = (
  pos: Position,
  grid: GridNode[]
): {
  inVoid: boolean;
  touchedNode: GridNode | null;
} => {
  // Check Void (Bounds)
  if (pos.x < -0.5 || pos.x > GRID_SIZE - 0.5 || pos.y < -0.5 || pos.y > GRID_SIZE - 0.5) {
    return { inVoid: true, touchedNode: null };
  }

  // Check Node Proximity (Snap to center if close enough)
  // We use a small radius to detect "touch"
  const touchRadius = 0.4;
  const touchedNode = grid.find(n => {
    const dx = Math.abs(n.x - pos.x);
    const dy = Math.abs(n.y - pos.y);
    return dx < touchRadius && dy < touchRadius && n.active;
  });

  return { inVoid: false, touchedNode: touchedNode || null };
};
