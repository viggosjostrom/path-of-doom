'use client';

import React, { useState, useEffect } from 'react';
import { CELL_SIZE } from '../core/gridConstants';
import { GridCell } from '../types/gridTypes';

// Tower visual styles based on tower type
const TOWER_STYLES = {
  basic: {
    color: '#007bff', // Blue
    innerColor: '#80bdff',
    symbol: '●' // Circle
  },
  sniper: {
    color: '#dc3545', // Red
    innerColor: '#f8d7da',
    symbol: '◆' // Diamond
  },
  splash: {
    color: '#fd7e14', // Orange
    innerColor: '#ffe5d0',
    symbol: '✱' // Burst
  },
  slow: {
    color: '#6f42c1', // Purple
    innerColor: '#d5c8e5',
    symbol: '❄' // Snowflake
  }
};

interface GridProps {
  grid: GridCell[][];
  onCellClick?: (x: number, y: number) => void;
  showCoordinates?: boolean;
  showGridLines?: boolean;
  showCellTypes?: boolean;
  cellSize?: number;
}

export const Grid: React.FC<GridProps> = ({ 
  grid, 
  onCellClick, 
  showCoordinates = false, 
  showGridLines = true,
  showCellTypes = true,
  cellSize = CELL_SIZE
}) => {
  // Track hovered cell for enhanced UI feedback
  const [hoveredCell, setHoveredCell] = useState<{ x: number, y: number } | null>(null);
  const [gridScale, setGridScale] = useState(1);
  
  // Calculate grid dimensions
  const gridWidth = grid[0].length * cellSize;
  const gridHeight = grid.length * cellSize;
  
  // Calculate scale factor for responsive sizing
  useEffect(() => {
    const calculateScale = () => {
      if (typeof window === 'undefined') return 1;
      
      // Get the available space (accounting for UI elements)
      const availableWidth = window.innerWidth - 300; // Account for sidebar
      const availableHeight = window.innerHeight - 100; // Account for top bar
      
      // Calculate scale factors for width and height
      const widthScale = availableWidth / gridWidth;
      const heightScale = availableHeight / gridHeight;
      
      // Use the smaller scale factor to ensure the grid fits
      return Math.min(widthScale, heightScale, 1);
    };
    
    const handleResize = () => {
      setGridScale(calculateScale());
    };
    
    // Initial calculation
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gridWidth, gridHeight]);
  
  // Get tower style based on tower ID
  const getTowerStyle = (towerId?: string) => {
    if (!towerId) return TOWER_STYLES.basic;
    
    // Extract the tower type from the ID (assuming the ID starts with the type)
    const towerType = towerId.split('-')[0];
    return TOWER_STYLES[towerType as keyof typeof TOWER_STYLES] || TOWER_STYLES.basic;
  };
  
  // Render grid cells
  const renderCell = (cell: GridCell) => {
    const { x, y, type, id, towerId } = cell;
    const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
    
    // Determine cell color based on type
    let backgroundColor = 'transparent';
    let borderColor = showGridLines ? '#333' : 'transparent';
    let cursor = 'default';
    
    switch (type) {
      case 'Path':
        backgroundColor = '#444';
        break;
      case 'Tower':
        // Tower cells are transparent to show the tower visualization
        backgroundColor = 'transparent';
        break;
      case 'Empty':
        backgroundColor = 'transparent';
        cursor = onCellClick ? 'pointer' : 'default';
        break;
    }
    
    // Enhanced hover effect
    if (isHovered && type === 'Empty') {
      backgroundColor = 'rgba(255, 255, 255, 0.1)';
      borderColor = '#666';
    }
    
    // Get tower style if this is a tower cell
    const towerStyle = type === 'Tower' ? getTowerStyle(towerId) : null;
    
    return (
      <div
        key={id}
        className="absolute border transition-all duration-150"
        style={{
          width: cellSize,
          height: cellSize,
          left: x * cellSize,
          top: y * cellSize,
          backgroundColor,
          borderColor,
          cursor,
          boxShadow: isHovered ? '0 0 5px rgba(255, 255, 255, 0.5)' : 'none',
        }}
        onClick={() => onCellClick && onCellClick(x, y)}
        onMouseEnter={() => setHoveredCell({ x, y })}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {/* Cell coordinates */}
        {showCoordinates && (
          <div className="absolute bottom-0 right-0 text-xs text-white bg-black bg-opacity-50 px-1">
            {x},{y}
          </div>
        )}
        
        {/* Cell type indicator */}
        {showCellTypes && (
          <div className="absolute top-0 left-0 text-xs text-white bg-black bg-opacity-50 px-1">
            {type.charAt(0)}
          </div>
        )}
        
        {/* Tower visualization */}
        {type === 'Tower' && towerStyle && (
          <div 
            className="absolute inset-2 rounded-full flex items-center justify-center"
            style={{ backgroundColor: towerStyle.color }}
          >
            <div 
              className="absolute w-1/2 h-1/2 rounded-full flex items-center justify-center"
              style={{ backgroundColor: towerStyle.innerColor }}
            >
              <span className="text-xs font-bold" style={{ color: towerStyle.color }}>
                {towerStyle.symbol}
              </span>
            </div>
          </div>
        )}
        
        {/* Path visualization */}
        {type === 'Path' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1/2 h-1/2 rounded-full bg-gray-600 opacity-30"></div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="relative transform origin-center transition-transform duration-300 ease-in-out">
      <div 
        className="relative"
        style={{ 
          width: gridWidth, 
          height: gridHeight,
          backgroundColor: '#111',
          overflow: 'hidden',
          transform: `scale(${gridScale})`,
          transformOrigin: 'center',
        }}
      >
        {/* Grid background pattern for better visualization */}
        {showGridLines && (
          <div 
            className="absolute inset-0 z-0" 
            style={{ 
              backgroundSize: `${cellSize}px ${cellSize}px`,
              backgroundImage: 'linear-gradient(to right, #222 1px, transparent 1px), linear-gradient(to bottom, #222 1px, transparent 1px)',
              opacity: 0.5,
            }}
          />
        )}
        
        {/* Cells */}
        {grid.flat().map(renderCell)}
      </div>
    </div>
  );
}; 