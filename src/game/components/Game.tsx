'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Grid } from './Grid';
import { createDefaultPath, createGrid, generateId, extractPathFromGrid } from '../utils';
import { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE } from '../core/gridConstants';
import { GridCell, CellType } from '../types/gridTypes';
import { TestMinion } from './TestMinion';
import { TowerAttack } from './TowerAttack';
import { Minion, Tower, TowerType } from '../types';

// Tower selection type
interface TowerSelection {
  id: string;
  name: string;
  type: TowerType;
  cost: number;
  damage: number;
  range: number;
  description?: string;
}

export const Game: React.FC = () => {
  // State for grid settings
  const [cellSize, setCellSize] = useState(CELL_SIZE);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [showGridLines, setShowGridLines] = useState(true);
  const [showCellTypes, setShowCellTypes] = useState(true);
  const [selectedTool, setSelectedTool] = useState<'tower' | 'remove'>('tower');
  const [showGridStats, setShowGridStats] = useState(false);
  
  // Game state
  const [resources, setResources] = useState(100);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(20);
  const [selectedTower, setSelectedTower] = useState<TowerSelection | null>(null);
  
  // Tower and minion state
  const [towers, setTowers] = useState<Tower[]>([]);
  const [testMinions, setTestMinions] = useState<Minion[]>([]);
  const [activeAttacks, setActiveAttacks] = useState<{tower: Tower, target: Minion, id: string}[]>([]);
  const [isMovementActive, setIsMovementActive] = useState(false);
  const [movementSpeed, setMovementSpeed] = useState(1); // Tiles per second
  
  // Animation frame reference
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const lastMinionSpawnTimeRef = useRef<number>(Date.now());
  
  // Initialize grid with a default path
  const [grid, setGrid] = useState<GridCell[][]>(() => 
    createDefaultPath(createGrid(GRID_WIDTH, GRID_HEIGHT))
  );
  
  // Create test minions on path - only run once on initial mount
  useEffect(() => {
    const path = extractPathFromGrid(grid);
    if (path.length > 0) {
      // Create initial test minion in the middle of the path
      const pathPosition = Math.floor(path.length / 2);
      const minionPosition = path[pathPosition];
      
      const initialMinion: Minion = {
        id: 'test-minion-1',
        type: 'Grunt',
        health: 200,
        maxHealth: 200,
        speed: 0,
        reward: 10,
        abilities: [],
        position: minionPosition,
        path: path,
        pathIndex: pathPosition,
        effects: [],
        isDead: false
      };
      
      setTestMinions([initialMinion]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this only runs once on mount
  
  // Game update loop
  useEffect(() => {
    if (testMinions.length === 0) return;
    
    const updateGame = (timestamp: number) => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;
      
      // Update minion positions if movement is active
      if (isMovementActive) {
        setTestMinions(prevMinions => {
          // Calculate how much to move based on speed and time
          const moveAmount = (movementSpeed * deltaTime) / 1000; // Convert to tiles per millisecond
          
          return prevMinions.map(minion => {
            if (minion.isDead) return minion;
            
            // Calculate new path index
            const newPathIndex = minion.pathIndex + moveAmount;
            
            // If minion reached the end of the path, mark it as "escaped"
            if (newPathIndex >= minion.path.length) {
              console.log(`Minion ${minion.id} reached the end of the path`);
              return {
                ...minion,
                isDead: true, // Use isDead to remove it from rendering
                pathIndex: minion.path.length - 1 // Keep at last position for animation
              };
            }
            
            // Get the current and next path positions
            const currentPathPos = Math.floor(minion.pathIndex);
            const nextPathPos = Math.min(Math.floor(newPathIndex), minion.path.length - 1);
            
            // If we're moving to a new tile, update the position
            if (nextPathPos !== currentPathPos) {
              console.log(`Minion ${minion.id} moving from tile ${currentPathPos} to ${nextPathPos}`);
            }
            
            // Get the exact position based on path index
            const exactPosition = getPositionOnPath(minion.path, newPathIndex);
            
            return {
              ...minion,
              pathIndex: newPathIndex,
              position: exactPosition
            };
          });
        });
        
        // Spawn new minions periodically if we have fewer than the max
        const timeSinceLastSpawn = now - lastMinionSpawnTimeRef.current;
        const minionsAlive = testMinions.filter(m => !m.isDead).length;
        const maxMinions = 3; // Maximum number of minions on the path at once
        const spawnInterval = 3000; // Time between spawns in ms
        
        if (minionsAlive < maxMinions && timeSinceLastSpawn > spawnInterval) {
          const path = extractPathFromGrid(grid);
          if (path.length > 0) {
            // Spawn at the start of the path
            const newMinion: Minion = {
              id: `test-minion-${Date.now()}`,
              type: 'Grunt',
              health: 200,
              maxHealth: 200,
              speed: movementSpeed,
              reward: 10,
              abilities: [],
              position: path[0],
              path: path,
              pathIndex: 0,
              effects: [],
              isDead: false
            };
            
            console.log(`Spawning new minion at the start of the path`);
            setTestMinions(prev => [...prev, newMinion]);
            lastMinionSpawnTimeRef.current = now;
          }
        }
      }
      
      // Update towers (cooldowns, targeting, etc)
      setTowers(prevTowers => {
        // Track which towers are attacking this frame to prevent duplicates
        const attackingTowerIds = new Set<string>();
        
        return prevTowers.map(tower => {
          // Reduce cooldown
          if (tower.currentCooldown > 0) {
            tower = {
              ...tower,
              currentCooldown: Math.max(0, tower.currentCooldown - deltaTime / 1000)
            };
          }
          
          // Check if tower can attack
          if (tower.currentCooldown <= 0) {
            // Find alive minions
            const aliveMinions = testMinions.filter(minion => !minion.isDead);
            
            // For area effect towers (Flamethrower), find all minions in range
            const isAreaEffect = tower.type === 'Flamethrower';
            const minionsInRange: Minion[] = [];
            
            for (const minion of aliveMinions) {
              const dx = tower.position.x - minion.position.x;
              const dy = tower.position.y - minion.position.y;
              const distance = Math.abs(dx) + Math.abs(dy);
              
              if (distance <= tower.range) {
                minionsInRange.push(minion);
                
                // For non-area effect towers, only target one minion
                if (!isAreaEffect) break;
              }
            }
            
            // If there are minions in range and this tower hasn't attacked this frame
            if (minionsInRange.length > 0 && !attackingTowerIds.has(tower.id)) {
              // Mark this tower as attacking this frame
              attackingTowerIds.add(tower.id);
              
              // For each minion in range (or just the first one for non-area effect towers)
              const targetsToAttack = isAreaEffect ? minionsInRange : [minionsInRange[0]];
              
              for (const target of targetsToAttack) {
                console.log(`Tower at (${tower.position.x}, ${tower.position.y}) attacking minion at (${target.position.x}, ${target.position.y})`);
                
                // Create attack animation with a truly unique ID
                const attackId = `attack-${tower.id}-${target.id}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
                
                // Calculate distance for animation duration
                const dx = tower.position.x - Math.floor(target.position.x);
                const dy = tower.position.y - Math.floor(target.position.y);
                const distance = Math.abs(dx) + Math.abs(dy);
                
                // Calculate animation duration based on distance
                const animationDuration = 100 + (distance * 150); // 250ms for 1 tile, 400ms for 2 tiles, etc.
                
                setActiveAttacks(prev => [
                  ...prev, 
                  {
                    tower,
                    target,
                    id: attackId
                  }
                ]);
                
                // Remove attack after animation completes
                setTimeout(() => {
                  setActiveAttacks(prev => prev.filter(attack => attack.id !== attackId));
                }, animationDuration);
                
                // Apply damage after animation
                setTimeout(() => {
                  setTestMinions(prev => prev.map(minion => {
                    if (minion.id !== target.id || minion.isDead) return minion;
                    
                    console.log(`Tower ${tower.type} dealing ${tower.damage} damage to minion with ${minion.health} health`);
                    const newHealth = Math.max(0, minion.health - tower.damage);
                    const isDead = newHealth <= 0;
                    
                    if (isDead) {
                      console.log(`Minion ${minion.id} died from ${tower.damage} damage`);
                    }
                    
                    return {
                      ...minion,
                      health: newHealth,
                      isDead
                    };
                  }));
                }, animationDuration - 100); // Apply damage just before animation ends
              }
              
              // Reset tower cooldown
              return {
                ...tower,
                currentCooldown: tower.cooldown,
                lastAttackTime: now
              };
            }
          }
          
          return tower;
        });
      });
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(updateGame);
    };
    
    // Start the game loop
    animationFrameRef.current = requestAnimationFrame(updateGame);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [testMinions, isMovementActive, movementSpeed]);
  
  // Handle cell click
  const handleCellClick = (x: number, y: number) => {
    console.log(`Cell clicked at (${x}, ${y}), current minions:`, testMinions);
    
    // Toggle cell type based on selected tool
    setGrid(prevGrid => {
      const newGrid = [...prevGrid.map(row => [...row])];
      
      if (selectedTool === 'tower') {
        // Only allow placing towers on Empty cells
        if (newGrid[y][x].type === 'Empty' && selectedTower) {
          // Check if we have enough resources
          if (resources >= selectedTower.cost) {
            // Create a tower ID that includes the tower type for visual differentiation
            const towerId = `${selectedTower.id}-${generateId()}`;
            
            newGrid[y][x] = {
              ...newGrid[y][x],
              type: 'Tower',
              towerId: towerId
            };
            
            // Add tower to towers array
            const newTower: Tower = {
              id: towerId,
              type: selectedTower.type,
              level: 1,
              position: { x, y },
              damage: selectedTower.damage,
              range: selectedTower.range,
              cooldown: getTowerCooldown(selectedTower.id), // Use a function to get appropriate cooldown
              currentCooldown: 0,
              cost: selectedTower.cost,
              ability: 'None'
            };
            
            setTowers(prev => [...prev, newTower]);
            
            // Deduct resources
            setResources(prev => Math.max(0, prev - selectedTower.cost));
            
            // Log minions after tower placement
            console.log("Tower placed, current minions:", testMinions);
          } else {
            // Not enough resources - could show a notification here
            console.log("Not enough resources!");
          }
        }
      } else if (selectedTool === 'remove') {
        // Only allow removing towers, not paths
        if (newGrid[y][x].type === 'Tower') {
          // Find the tower type to calculate refund
          const towerId = newGrid[y][x].towerId;
          const towerType = towerId?.split('-')[0];
          const tower = towers.find(t => t.id === towerId);
          const refundAmount = tower ? Math.floor(tower.cost / 2) : 5;
          
          // Remove tower from towers array
          setTowers(prev => prev.filter(t => t.id !== towerId));
          
          newGrid[y][x] = {
            ...newGrid[y][x],
            type: 'Empty',
            towerId: undefined
          };
          
          // Refund some resources
          setResources(prev => prev + refundAmount);
        }
      }
      
      return newGrid;
    });
  };
  
  // Reset grid
  const handleReset = () => {
    setGrid(createDefaultPath(createGrid(GRID_WIDTH, GRID_HEIGHT)));
    setResources(100);
    setWave(1);
    setLives(20);
    setSelectedTower(null);
    setTowers([]);
    
    // Reset test minions
    const path = extractPathFromGrid(createDefaultPath(createGrid(GRID_WIDTH, GRID_HEIGHT)));
    if (path.length > 0) {
      const pathPosition = Math.floor(path.length / 2);
      setTestMinions([{
        id: 'test-minion-1',
        type: 'Grunt',
        health: 200,
        maxHealth: 200,
        speed: 0,
        reward: 10,
        abilities: [],
        position: path[pathPosition],
        path: path,
        pathIndex: pathPosition,
        effects: [],
        isDead: false
      }]);
    }
  };
  
  // Get grid statistics
  const getGridStats = () => {
    let pathCells = 0;
    let towerCells = 0;
    let emptyCells = 0;
    
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.type === 'Path') pathCells++;
        else if (cell.type === 'Tower') towerCells++;
        else emptyCells++;
      });
    });
    
    return { pathCells, towerCells, emptyCells };
  };
  
  const stats = getGridStats();
  
  // Tower types
  const towerTypes: TowerSelection[] = [
    {
      id: 'basic',
      name: 'Gunner',
      type: 'Gunner',
      cost: 10,
      damage: 10,
      range: 2,
      description: 'Basic tower with moderate damage and range'
    },
    {
      id: 'sniper',
      name: 'Sniper',
      type: 'Gunner',
      cost: 25,
      damage: 25,
      range: 4,
      description: 'Long range tower with high damage'
    },
    {
      id: 'splash',
      name: 'Flamethrower',
      type: 'Flamethrower',
      cost: 30,
      damage: 15,
      range: 2,
      description: 'Area damage tower with burn effect'
    },
    {
      id: 'slow',
      name: 'Frost',
      type: 'Frost',
      cost: 20,
      damage: 5,
      range: 3,
      description: 'Slows enemies within range'
    }
  ];
  
  // Handle tower selection
  const handleTowerSelect = (tower: TowerSelection) => {
    setSelectedTower(tower);
  };
  
  // Helper function to get position on path based on path index (can be fractional)
  const getPositionOnPath = (path: {x: number, y: number, id: string}[], pathIndex: number): {x: number, y: number, id: string} => {
    // Handle edge cases
    if (pathIndex <= 0) return path[0];
    if (pathIndex >= path.length - 1) return path[path.length - 1];
    
    // Get the current and next positions
    const currentIndex = Math.floor(pathIndex);
    const nextIndex = Math.min(currentIndex + 1, path.length - 1);
    const fraction = pathIndex - currentIndex;
    
    // Interpolate between current and next positions
    return {
      x: path[currentIndex].x + (path[nextIndex].x - path[currentIndex].x) * fraction,
      y: path[currentIndex].y + (path[nextIndex].y - path[currentIndex].y) * fraction,
      id: path[currentIndex].id // Use the current cell's ID
    };
  };
  
  // Add a function to spawn a test minion at the start of the path
  const spawnTestMinionAtStart = () => {
    // Get the path with cell IDs
    const path = extractPathFromGrid(grid);
    if (path.length === 0) return;
    
    // Add default id if it doesn't exist (for backward compatibility)
    const pathWithIds = path.map(point => ({
      x: point.x,
      y: point.y,
      id: point.id || `cell-${point.x}-${point.y}`
    }));
    
    // Spawn at the start of the path
    const newMinion: Minion = {
      id: `test-minion-${testMinions.length + 1}-${Date.now()}`,
      type: 'Grunt',
      health: 200,
      maxHealth: 200,
      speed: movementSpeed,
      reward: 10,
      abilities: [],
      position: {
        x: pathWithIds[0].x,
        y: pathWithIds[0].y,
        id: pathWithIds[0].id
      },
      path: pathWithIds,
      pathIndex: 0,
      effects: [],
      isDead: false
    };
    
    console.log("Spawning new minion at the start of the path", pathWithIds[0]);
    setTestMinions(prev => [...prev, newMinion]);
  };
  
  // Add a function to reset all test minions
  const resetTestMinions = () => {
    // Get the path with cell IDs
    const path = extractPathFromGrid(grid);
    if (path.length === 0) return;
    
    // Add default id if it doesn't exist (for backward compatibility)
    const pathWithIds = path.map(point => ({
      x: point.x,
      y: point.y,
      id: point.id || `cell-${point.x}-${point.y}`
    }));
    
    // Reset to a single minion in the middle of the path
    const pathPosition = Math.floor(pathWithIds.length / 2);
    const minionPosition = pathWithIds[pathPosition];
    
    const initialMinion: Minion = {
      id: 'test-minion-1',
      type: 'Grunt',
      health: 200,
      maxHealth: 200,
      speed: 0,
      reward: 10,
      abilities: [],
      position: {
        x: minionPosition.x,
        y: minionPosition.y,
        id: minionPosition.id
      },
      path: path,
      pathIndex: pathPosition,
      effects: [],
      isDead: false
    };
    
    setTestMinions([initialMinion]);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Game Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-white text-xl font-bold">Path of Doom</h1>
        
        <div className="flex items-center space-x-4">
          <div className="text-yellow-400 font-medium">Resources: {resources}</div>
          <div className="text-blue-400 font-medium">Wave: {wave}</div>
          <div className="text-red-400 font-medium">Lives: {lives}</div>
          
          <button 
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
            onClick={handleReset}
          >
            Reset Game
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Panel - Tower Selection */}
        <div className="w-64 bg-gray-800 p-4 border-r border-gray-700">
          <h2 className="text-white font-bold mb-4">Tower Selection</h2>
          
          <div className="space-y-3">
            {towerTypes.map(tower => (
              <div 
                key={tower.id}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  selectedTower?.id === tower.id 
                    ? getTowerSelectionColor(tower.id)
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => handleTowerSelect(tower)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{tower.name}</span>
                  <span className="text-yellow-400 text-sm">{tower.cost}</span>
                </div>
                <div className="mt-1 text-xs text-gray-300">
                  <div>Damage: {tower.damage}</div>
                  <div>Range: {tower.range}</div>
                </div>
                {tower.description && (
                  <div className="mt-1 text-xs text-gray-400">{tower.description}</div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <h3 className="text-white font-bold mb-2">Tools</h3>
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-2 rounded text-white text-sm ${
                  selectedTool === 'tower' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => setSelectedTool('tower')}
              >
                Place Tower
              </button>
              <button 
                className={`px-3 py-2 rounded text-white text-sm ${
                  selectedTool === 'remove' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => setSelectedTool('remove')}
              >
                Remove
              </button>
            </div>
          </div>
          
          {/* Test Minion Controls */}
          <div className="mt-6 p-3 bg-gray-700 rounded">
            <h3 className="text-white font-bold mb-2">Test Minions</h3>
            <div className="flex space-x-2 mb-3">
              <button 
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                onClick={spawnTestMinionAtStart}
              >
                Spawn Minion
              </button>
              <button 
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                onClick={resetTestMinions}
              >
                Reset Minions
              </button>
            </div>
            
            {/* Movement controls */}
            <div className="mb-3 p-2 bg-gray-800 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm">Movement:</span>
                <button 
                  className={`px-3 py-1 ${isMovementActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded text-xs`}
                  onClick={() => setIsMovementActive(!isMovementActive)}
                >
                  {isMovementActive ? 'Stop' : 'Start'} Movement
                </button>
              </div>
              
              <div className="flex flex-col space-y-1">
                <label className="text-xs text-gray-400">Speed (tiles/second):</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="range" 
                    min="0.5" 
                    max="5" 
                    step="0.5"
                    value={movementSpeed}
                    onChange={(e) => setMovementSpeed(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-white text-xs">{movementSpeed}</span>
                </div>
              </div>
            </div>
            
            {testMinions.length > 0 && (
              <div className="space-y-4">
                {testMinions.map((minion, index) => (
                  <div key={minion.id} className="text-sm text-gray-300 border border-gray-600 p-2 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">Minion #{index + 1}</div>
                      <div className="text-xs">
                        {minion.isDead ? (
                          <span className="text-red-400">Dead</span>
                        ) : (
                          <span className="text-green-400">Alive</span>
                        )}
                      </div>
                    </div>
                    
                    <div>Health: {Math.max(0, minion.health)} / {minion.maxHealth}</div>
                    <div>Position: Tile {Math.floor(minion.pathIndex)} ({minion.pathIndex.toFixed(2)})</div>
                    
                    {/* Health Slider */}
                    <div className="mt-2">
                      <label className="block text-xs text-gray-400 mb-1">Set Health:</label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="range" 
                          min="0" 
                          max={minion.maxHealth} 
                          value={minion.health}
                          onChange={(e) => {
                            const newHealth = parseInt(e.target.value);
                            setTestMinions(prev => prev.map(m => {
                              if (m.id !== minion.id) return m;
                              return {
                                ...m,
                                health: newHealth,
                                isDead: newHealth <= 0
                              };
                            }));
                          }}
                          className="w-full"
                        />
                        <span className="text-xs">{Math.max(0, minion.health)}</span>
                      </div>
                    </div>
                    
                    {/* Remove button */}
                    <button 
                      className="mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                      onClick={() => {
                        setTestMinions(prev => prev.filter(m => m.id !== minion.id));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Main Grid Area */}
        <div className="flex-1 p-4 flex items-center justify-center relative">
          <div className="relative">
            <Grid 
              grid={grid} 
              onCellClick={handleCellClick}
              showCoordinates={showCoordinates}
              showGridLines={showGridLines}
              showCellTypes={showCellTypes}
              cellSize={cellSize}
            />
            
            {/* Render test minions */}
            {testMinions.map(minion => (
              <TestMinion key={minion.id} minion={minion} />
            ))}
            
            {/* Render active attacks */}
            {activeAttacks.map(attack => (
              <TowerAttack 
                key={attack.id}
                tower={attack.tower}
                target={attack.target}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get tower selection color
const getTowerSelectionColor = (towerId: string) => {
  switch (towerId) {
    case 'basic': return 'bg-blue-700 border-2 border-blue-500';
    case 'sniper': return 'bg-red-700 border-2 border-red-500';
    case 'splash': return 'bg-orange-700 border-2 border-orange-500';
    case 'slow': return 'bg-purple-700 border-2 border-purple-500';
    default: return 'bg-blue-700 border-2 border-blue-500';
  }
};

// Helper function to get tower cooldown based on tower type
const getTowerCooldown = (towerId: string): number => {
  switch (towerId) {
    case 'basic': return 1.0; // 1 second cooldown for basic tower
    case 'sniper': return 2.5; // 2.5 seconds cooldown for sniper (high damage, slow fire rate)
    case 'splash': return 1.5; // 1.5 seconds cooldown for splash
    case 'slow': return 0.8; // 0.8 seconds cooldown for slow (low damage, fast fire rate)
    default: return 1.0;
  }
};

// Helper function to get animation duration based on tower type
const getAnimationDuration = (towerType: TowerType): number => {
  switch (towerType) {
    case 'Gunner': return 800; // 0.8 seconds for basic gunner
    case 'Frost': return 1000; // 1 second for frost tower
    case 'Flamethrower': return 1200; // 1.2 seconds for flamethrower
    case 'Tesla': return 600; // 0.6 seconds for tesla (fast electricity)
    default: return 1000;
  }
}; 