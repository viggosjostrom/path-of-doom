import { GridCell } from '../types/gridTypes';
import { GRID_WIDTH, GRID_HEIGHT } from '../core/gridConstants';
import { Tower, Minion } from '../types';

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Create a new grid with the specified width and height
 */
export const createGrid = (width: number, height: number = width): GridCell[][] => {
  const grid: GridCell[][] = [];

  for (let y = 0; y < height; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        x,
        y,
        type: 'Empty',
        effect: 'None',
        id: `cell-${x}-${y}`, // Add unique ID for each cell
      });
    }
    grid.push(row);
  }

  return grid;
};

/**
 * Create a default path on the grid
 */
export const createDefaultPath = (grid: GridCell[][]): GridCell[][] => {
  // Create a simple S-shaped path
  const newGrid = [...grid.map(row => [...row])];
  const width = grid[0].length;
  const height = grid.length;
  
  // Start from the left middle
  const startY = Math.floor(height / 2);
  
  // First horizontal segment
  for (let x = 0; x < width / 3; x++) {
    newGrid[startY][x].type = 'Path';
  }
  
  // First vertical segment (down)
  for (let y = startY; y < height - 2; y++) {
    newGrid[y][Math.floor(width / 3) - 1].type = 'Path';
  }
  
  // Second horizontal segment (right)
  for (let x = Math.floor(width / 3) - 1; x < Math.floor(width * 2/3); x++) {
    newGrid[height - 3][x].type = 'Path';
  }
  
  // Second vertical segment (up)
  for (let y = height - 3; y >= 2; y--) {
    newGrid[y][Math.floor(width * 2/3)].type = 'Path';
  }
  
  // Final horizontal segment to exit
  for (let x = Math.floor(width * 2/3); x < width; x++) {
    newGrid[2][x].type = 'Path';
  }
  
  return newGrid;
};

/**
 * Extract path coordinates from grid
 */
export const extractPathFromGrid = (grid: GridCell[][]): { x: number; y: number; id: string }[] => {
  const path: { x: number; y: number; id: string }[] = [];
  const width = grid[0].length;
  const height = grid.length;
  
  // Find the starting point (leftmost path cell)
  let startX = width;
  let startY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].type === 'Path' && x < startX) {
        startX = x;
        startY = y;
      }
    }
  }
  
  // Start with the leftmost path cell
  path.push({ x: startX, y: startY, id: grid[startY][startX].id });
  
  // Simple algorithm to follow the path
  let currentX = startX;
  let currentY = startY;
  let previousX = -1;
  let previousY = -1;
  
  while (currentX < width - 1 || currentY < height - 1) {
    // Check all four directions
    const directions = [
      { x: currentX + 1, y: currentY }, // right
      { x: currentX, y: currentY + 1 }, // down
      { x: currentX - 1, y: currentY }, // left
      { x: currentX, y: currentY - 1 }, // up
    ];
    
    let found = false;
    
    for (const dir of directions) {
      if (
        dir.x >= 0 && dir.x < width &&
        dir.y >= 0 && dir.y < height &&
        grid[dir.y][dir.x].type === 'Path' &&
        (dir.x !== previousX || dir.y !== previousY)
      ) {
        previousX = currentX;
        previousY = currentY;
        currentX = dir.x;
        currentY = dir.y;
        path.push({ x: currentX, y: currentY, id: grid[currentY][currentX].id });
        found = true;
        break;
      }
    }
    
    if (!found) {
      // We've reached the end of the path
      break;
    }
    
    // If we've reached the right edge, we're done
    if (currentX === width - 1) {
      break;
    }
  }
  
  return path;
};

/**
 * Check if a position is valid for tower placement
 */
export const isValidTowerPosition = (
  grid: GridCell[][],
  x: number,
  y: number
): boolean => {
  const width = grid[0].length;
  const height = grid.length;
  
  // Check if the position is within the grid
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return false;
  }

  // Check if the cell is empty
  return grid[y][x].type === 'Empty';
};

/**
 * Calculate the Manhattan distance between two points
 */
export const calculateDistance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

/**
 * Find the closest minion to a tower within its range
 */
export const findClosestMinion = (
  tower: Tower,
  minions: Minion[]
): Minion | undefined => {
  // Filter out dead minions
  const aliveMinions = minions.filter(minion => !minion.isDead);
  
  if (aliveMinions.length === 0) {
    return undefined;
  }
  
  // Get all minions within range
  const minionsInRange = aliveMinions.filter(minion => {
    // If tower has pre-calculated range cells, use those for faster lookup
    if (tower.rangeCells) {
      const minionCellKey = `${Math.floor(minion.position.x)},${Math.floor(minion.position.y)}`;
      return tower.rangeCells.has(minionCellKey);
    }
    
    // Otherwise calculate distance - ensure we're using the same distance calculation as the range highlighting
    const distance = calculateDistance(
      tower.position.x,
      tower.position.y,
      Math.floor(minion.position.x),
      Math.floor(minion.position.y)
    );
    
    return distance <= tower.range;
  });
  
  if (minionsInRange.length === 0) {
    return undefined;
  }
  
  // Find the minion furthest along the path
  return minionsInRange.reduce((furthest, current) => {
    return current.pathIndex > furthest.pathIndex ? current : furthest;
  }, minionsInRange[0]);
};

/**
 * Get all cells within a tower's range
 */
export const getCellsInTowerRange = (
  towerX: number,
  towerY: number,
  range: number,
  gridWidth: number,
  gridHeight: number
): Set<string> => {
  const cellsInRange = new Set<string>();
  
  // Check all cells in a square around the tower
  for (let y = Math.max(0, towerY - range); y <= Math.min(gridHeight - 1, towerY + range); y++) {
    for (let x = Math.max(0, towerX - range); x <= Math.min(gridWidth - 1, towerX + range); x++) {
      // Calculate Manhattan distance (grid distance) from tower to this cell
      const distance = calculateDistance(x, y, towerX, towerY);
      
      // Include the cell if it's within range (using Manhattan distance for grid-based range)
      if (distance <= range) {
        cellsInRange.add(`${x},${y}`);
      }
    }
  }
  
  return cellsInRange;
}; 