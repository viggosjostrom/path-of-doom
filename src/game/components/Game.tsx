'use client';

import React, { useState, useEffect } from 'react';
import { Grid } from './Grid';
import { createDefaultPath, createGrid, generateId } from '../utils';
import { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE } from '../core/gridConstants';
import { GridCell, CellType } from '../types/gridTypes';

// Tower type definition
interface TowerType {
  id: string;
  name: string;
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
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);
  
  // Initialize grid with a default path
  const [grid, setGrid] = useState<GridCell[][]>(() => 
    createDefaultPath(createGrid(GRID_WIDTH, GRID_HEIGHT))
  );
  
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
  const towerTypes: TowerType[] = [
    { 
      id: 'basic', 
      name: 'Basic Tower', 
      cost: 10, 
      damage: 5, 
      range: 3,
      description: 'A simple tower with balanced stats.'
    },
    { 
      id: 'sniper', 
      name: 'Sniper Tower', 
      cost: 25, 
      damage: 20, 
      range: 6,
      description: 'Long range with high damage but slow firing rate.'
    },
    { 
      id: 'splash', 
      name: 'Splash Tower', 
      cost: 30, 
      damage: 10, 
      range: 2,
      description: 'Deals damage to multiple enemies in a small area.'
    },
    { 
      id: 'slow', 
      name: 'Slow Tower', 
      cost: 15, 
      damage: 2, 
      range: 3,
      description: 'Slows down enemies passing through its range.'
    },
  ];
  
  // Handle tower selection
  const handleTowerSelect = (tower: TowerType) => {
    if (selectedTower?.id === tower.id) {
      setSelectedTower(null);
    } else {
      setSelectedTower(tower);
      setSelectedTool('tower');
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Top Bar - Game Statistics */}
      <div className="bg-gray-800 p-3 border-b border-gray-700">
        <div className="container mx-auto flex flex-wrap justify-between items-center">
          {/* Game Title */}
          <div className="text-white font-bold text-xl mb-2 md:mb-0">
            Path of Doom
          </div>
          
          {/* Game Stats */}
          <div className="flex space-x-6">
            <div className="text-white">
              <span className="font-semibold">Wave:</span> {wave}
            </div>
            <div className="text-yellow-400">
              <span className="font-semibold">Resources:</span> {resources}
            </div>
            <div className="text-red-400">
              <span className="font-semibold">Lives:</span> {lives}
            </div>
            
            {/* Display Options Toggle */}
            <div className="relative">
              <button 
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                onClick={() => setShowGridStats(!showGridStats)}
              >
                Display Options {showGridStats ? '▲' : '▼'}
              </button>
              
              {/* Dropdown Panel */}
              {showGridStats && (
                <div className="absolute right-0 mt-1 w-64 bg-gray-700 rounded shadow-lg z-10 p-3">
                  <h3 className="text-white text-sm font-semibold mb-2">Display Options</h3>
                  <div className="flex flex-col space-y-2">
                    <label className="flex items-center text-white text-sm">
                      <input 
                        type="checkbox" 
                        checked={showGridLines} 
                        onChange={() => setShowGridLines(!showGridLines)}
                        className="mr-2"
                      />
                      Show Grid Lines
                    </label>
                    <label className="flex items-center text-white text-sm">
                      <input 
                        type="checkbox" 
                        checked={showCoordinates} 
                        onChange={() => setShowCoordinates(!showCoordinates)}
                        className="mr-2"
                      />
                      Show Coordinates
                    </label>
                    <label className="flex items-center text-white text-sm">
                      <input 
                        type="checkbox" 
                        checked={showCellTypes} 
                        onChange={() => setShowCellTypes(!showCellTypes)}
                        className="mr-2"
                      />
                      Show Cell Types
                    </label>
                  </div>
                  
                  <h3 className="text-white text-sm font-semibold mt-3 mb-2">Grid Statistics</h3>
                  <div className="text-sm text-white">
                    <p>Grid Size: {GRID_WIDTH} x {GRID_HEIGHT}</p>
                    <p>Path Cells: {stats.pathCells}</p>
                    <p>Tower Cells: {stats.towerCells}</p>
                    <p>Empty Cells: {stats.emptyCells}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Reset Button */}
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              onClick={handleReset}
            >
              Reset Game
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Grid Container - Centered */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="border border-gray-700 rounded-lg overflow-hidden shadow-lg">
            <Grid 
              grid={grid} 
              onCellClick={handleCellClick} 
              showCoordinates={showCoordinates}
              showGridLines={showGridLines}
              showCellTypes={showCellTypes}
              cellSize={cellSize}
            />
          </div>
        </div>
        
        {/* Right Sidebar - Tower Selection */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
          <h2 className="text-white text-lg font-bold mb-4">Tower Selection</h2>
          
          {/* Tool Selection */}
          <div className="mb-4">
            <h3 className="text-white text-sm font-semibold mb-2">Tool</h3>
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-1 rounded ${selectedTool === 'tower' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-200'}`}
                onClick={() => setSelectedTool('tower')}
              >
                Place Tower
              </button>
              <button 
                className={`px-3 py-1 rounded ${selectedTool === 'remove' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200'}`}
                onClick={() => setSelectedTool('remove')}
              >
                Remove
              </button>
            </div>
          </div>
          
          {/* Tower List */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-2">Available Towers</h3>
            <div className="space-y-2">
              {towerTypes.map(tower => {
                // Get the tower style color for the button
                const towerColor = tower.id === 'basic' ? '#007bff' : 
                                  tower.id === 'sniper' ? '#dc3545' :
                                  tower.id === 'splash' ? '#fd7e14' : '#6f42c1';
                
                return (
                  <div 
                    key={tower.id}
                    className={`p-2 rounded transition-colors ${
                      selectedTower?.id === tower.id 
                        ? 'bg-opacity-80' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    } ${
                      resources < tower.cost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    style={{
                      backgroundColor: selectedTower?.id === tower.id ? towerColor : undefined
                    }}
                    onClick={() => resources >= tower.cost && handleTowerSelect(tower)}
                  >
                    <div className="flex justify-between">
                      <span className="text-white font-medium">{tower.name}</span>
                      <span className="text-yellow-400">{tower.cost}</span>
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
                      <div>Damage: {tower.damage}</div>
                      <div>Range: {tower.range}</div>
                    </div>
                    {tower.description && (
                      <div className="text-xs text-gray-300 mt-1 italic">
                        {tower.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Selected Tower Info */}
          {selectedTower && (
            <div className="mt-4 p-3 bg-blue-900 bg-opacity-50 rounded">
              <h3 className="text-white text-sm font-semibold mb-1">Selected: {selectedTower.name}</h3>
              <div className="text-xs text-gray-300">
                <p>Click on an empty grid cell to place this tower.</p>
                <p className="mt-1">Cost: <span className="text-yellow-400">{selectedTower.cost}</span></p>
              </div>
            </div>
          )}
          
          {/* Resources Display */}
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <div className="text-yellow-400 font-bold">Resources: {resources}</div>
            <div className="text-xs text-gray-300 mt-1">
              Place towers to defend your path
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 