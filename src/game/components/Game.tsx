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
  const [testMinion, setTestMinion] = useState<Minion | null>(null);
  const [activeAttacks, setActiveAttacks] = useState<{tower: Tower, target: Minion, id: string}[]>([]);
  
  // Animation frame reference
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  
  // Initialize grid with a default path
  const [grid, setGrid] = useState<GridCell[][]>(() => 
    createDefaultPath(createGrid(GRID_WIDTH, GRID_HEIGHT))
  );
  
  // Create test minion on path
  useEffect(() => {
    const path = extractPathFromGrid(grid);
    if (path.length > 0) {
      // Place minion in the middle of the path
      const pathPosition = Math.floor(path.length / 2);
      const minionPosition = path[pathPosition];
      
      const newMinion: Minion = {
        id: 'test-minion',
        type: 'Grunt',
        health: 1000,
        maxHealth: 1000,
        speed: 0,
        reward: 10,
        abilities: [],
        position: minionPosition,
        path: path,
        pathIndex: pathPosition,
        effects: [],
        isDead: false
      };
      
      setTestMinion(newMinion);
    }
  }, [grid]);
  
  // Game update loop
  useEffect(() => {
    const updateGame = (timestamp: number) => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateTimeRef.current) / 1000; // Convert to seconds
      lastUpdateTimeRef.current = now;
      
      // Update towers (cooldowns, attacks)
      setTowers(prevTowers => {
        // Track which towers will attack this frame to prevent multiple attacks at once
        const attackingTowers: string[] = [];
        
        return prevTowers.map(tower => {
          // If tower is on cooldown, reduce it
          if (tower.currentCooldown > 0) {
            return {
              ...tower,
              currentCooldown: Math.max(0, tower.currentCooldown - deltaTime)
            };
          }
          
          // Check if tower can attack the test minion
          if (testMinion && !testMinion.isDead) {
            const dx = tower.position.x - testMinion.position.x;
            const dy = tower.position.y - testMinion.position.y;
            const distance = Math.abs(dx) + Math.abs(dy); // Manhattan distance
            
            if (distance <= tower.range) {
              // Tower can attack - but only allow one tower to attack per frame
              // to prevent multiple towers killing the minion at once
              if (!attackingTowers.includes(tower.id)) {
                attackingTowers.push(tower.id);
                
                // Use a more unique ID with a random component
                const attackId = `attack-${tower.id}-${now}-${Math.random().toString(36).substring(2, 8)}`;
                
                // Calculate animation duration based on tower type
                const animationDuration = getAnimationDuration(tower.type);
                
                // Add attack animation
                setActiveAttacks(prev => [
                  ...prev, 
                  { tower, target: testMinion, id: attackId }
                ]);
                
                // Remove attack animation after animation completes
                setTimeout(() => {
                  setActiveAttacks(prev => prev.filter(a => a.id !== attackId));
                }, animationDuration);
                
                // Damage the minion - with a delay to ensure animations complete first
                setTimeout(() => {
                  setTestMinion(prev => {
                    if (!prev || prev.isDead) return prev;
                    
                    console.log(`Tower ${tower.type} dealing ${tower.damage} damage to minion with ${prev.health} health`);
                    const newHealth = Math.max(0, prev.health - tower.damage);
                    const isDead = newHealth <= 0;
                    
                    return {
                      ...prev,
                      health: newHealth,
                      isDead
                    };
                  });
                }, animationDuration - 100); // Apply damage just before animation ends
                
                // Reset tower cooldown
                return {
                  ...tower,
                  currentCooldown: tower.cooldown,
                  lastAttackTime: now
                };
              }
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
  }, [testMinion]);
  
  // Handle cell click
  const handleCellClick = (x: number, y: number) => {
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
          const tower = towerTypes.find(t => t.id === towerType);
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
    
    // Reset test minion
    const path = extractPathFromGrid(createDefaultPath(createGrid(GRID_WIDTH, GRID_HEIGHT)));
    if (path.length > 0) {
      const pathPosition = Math.floor(path.length / 2);
      setTestMinion({
        id: 'test-minion',
        type: 'Grunt',
        health: 1000,
        maxHealth: 1000,
        speed: 0,
        reward: 10,
        abilities: [],
        position: path[pathPosition],
        path: path,
        pathIndex: pathPosition,
        effects: [],
        isDead: false
      });
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
            <h3 className="text-white font-bold mb-2">Test Minion</h3>
            {testMinion && (
              <div className="text-sm text-gray-300">
                <div>Health: {Math.max(0, testMinion.health)} / {testMinion.maxHealth}</div>
                <div>Status: {testMinion.isDead ? 'Dead' : 'Alive'}</div>
                
                {/* Health Slider */}
                <div className="mt-2">
                  <label className="block text-xs text-gray-400 mb-1">Set Health:</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="range" 
                      min="0" 
                      max={testMinion.maxHealth} 
                      value={testMinion.health}
                      onChange={(e) => {
                        const newHealth = parseInt(e.target.value);
                        setTestMinion(prev => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            health: newHealth,
                            isDead: newHealth <= 0
                          };
                        });
                      }}
                      className="w-full"
                    />
                    <span className="text-xs">{Math.max(0, testMinion.health)}</span>
                  </div>
                </div>
                
                {/* Max Health Input */}
                <div className="mt-2">
                  <label className="block text-xs text-gray-400 mb-1">Max Health:</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      min="1" 
                      max="10000" 
                      value={testMinion.maxHealth}
                      onChange={(e) => {
                        const newMaxHealth = Math.max(1, parseInt(e.target.value) || 1);
                        setTestMinion(prev => {
                          if (!prev) return prev;
                          // Adjust current health if it's higher than new max
                          const newHealth = Math.min(prev.health, newMaxHealth);
                          return {
                            ...prev,
                            health: newHealth,
                            maxHealth: newMaxHealth,
                            isDead: newHealth <= 0
                          };
                        });
                      }}
                      className="w-full bg-gray-800 text-white px-2 py-1 rounded"
                    />
                  </div>
                </div>
                
                <div className="mt-2">
                  <button 
                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                    onClick={() => {
                      // Reset just the test minion
                      const path = extractPathFromGrid(grid);
                      if (path.length > 0) {
                        const pathPosition = Math.floor(path.length / 2);
                        setTestMinion({
                          id: 'test-minion',
                          type: 'Grunt',
                          health: 1000,
                          maxHealth: 1000,
                          speed: 0,
                          reward: 10,
                          abilities: [],
                          position: path[pathPosition],
                          path: path,
                          pathIndex: pathPosition,
                          effects: [],
                          isDead: false
                        });
                      }
                    }}
                  >
                    Reset Minion
                  </button>
                </div>
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
            
            {/* Render test minion */}
            {testMinion && (
              <TestMinion minion={testMinion} />
            )}
            
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