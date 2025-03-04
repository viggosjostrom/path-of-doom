'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CELL_SIZE } from '../core/gridConstants';
import { GridCell } from '../types/gridTypes';
import { getCellsInTowerRange } from '../utils';

// Tower visual styles based on tower type
const TOWER_STYLES = {
  basic: {
    color: '#007bff', // Blue
    innerColor: '#80bdff',
    symbol: '●', // Circle
    name: 'Basic Tower',
    damage: 5,
    range: 3,
    level: 1
  },
  sniper: {
    color: '#dc3545', // Red
    innerColor: '#f8d7da',
    symbol: '◆', // Diamond
    name: 'Sniper Tower',
    damage: 20,
    range: 6,
    level: 1
  },
  splash: {
    color: '#fd7e14', // Orange
    innerColor: '#ffe5d0',
    symbol: '✱', // Burst
    name: 'Splash Tower',
    damage: 10,
    range: 2,
    level: 1
  },
  slow: {
    color: '#6f42c1', // Purple
    innerColor: '#d5c8e5',
    symbol: '❄', // Snowflake
    name: 'Slow Tower',
    damage: 2,
    range: 3,
    level: 1
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
  const gridRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Calculate grid dimensions
  const gridWidth = grid[0].length * cellSize;
  const gridHeight = grid.length * cellSize;
  
  // CSS styles for different cell types
  const cellStyles = `
    .grid-cell {
      position: absolute;
      transition: all 150ms;
      transform: translateZ(0);
      backface-visibility: hidden;
      will-change: transform;
    }
    
    .grid-cell-path {
      background-color: #555;
      background-image: 
        linear-gradient(335deg, #666 23px, transparent 23px),
        linear-gradient(155deg, #666 23px, transparent 23px);
      background-size: 58px 58px;
      background-position: 0px 2px, 4px 35px;
    }
    
    .grid-cell-empty {
      background-color: #4a7c10;
      background-image: 
        radial-gradient(circle at 30% 40%, #5c9e12 8%, transparent 8%),
        radial-gradient(circle at 70% 60%, #5c9e12 8%, transparent 8%);
      background-size: 24px 24px;
      background-position: 0 0, 12px 12px;
    }
    
    .grid-cell-empty:hover {
      background-color: #5c9e12;
    }
  `;
  
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
  
  // Get hovered tower info
  const getHoveredTowerInfo = () => {
    if (!hoveredCell) return null;
    
    const cell = grid[hoveredCell.y][hoveredCell.x];
    if (cell.type !== 'Tower' || !cell.towerId) return null;
    
    const towerStyle = getTowerStyle(cell.towerId);
    const towerType = cell.towerId.split('-')[0];
    
    return {
      ...towerStyle,
      type: towerType,
      position: { x: hoveredCell.x, y: hoveredCell.y }
    };
  };
  
  // Get the hovered tower info
  const hoveredTower = getHoveredTowerInfo();
  
  // Calculate tooltip position to ensure it stays within the grid
  const getTooltipPosition = () => {
    if (!hoveredTower || !gridRef.current || !tooltipRef.current) {
      return { left: 0, top: 0 };
    }
    
    const gridRect = gridRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    // Default position (to the right of the tower)
    let left = (hoveredTower.position.x + 1) * cellSize;
    let top = hoveredTower.position.y * cellSize;
    
    // Check if tooltip would go off the right edge
    if (left + tooltipRect.width > gridWidth) {
      // Place to the left of the tower instead
      left = (hoveredTower.position.x - tooltipRect.width / cellSize) * cellSize;
    }
    
    // Check if tooltip would go off the bottom edge
    if (top + tooltipRect.height > gridHeight) {
      // Place above the tower instead
      top = (hoveredTower.position.y + 1) * cellSize - tooltipRect.height;
    }
    
    return { left, top };
  };
  
  // Calculate cells within tower range
  const getCellsInRange = (towerX: number, towerY: number, range: number) => {
    return Array.from(getCellsInTowerRange(towerX, towerY, range, grid[0].length, grid.length))
      .map(coordStr => {
        const [x, y] = coordStr.split(',').map(Number);
        return { x, y };
      });
  };
  
  // Get cells in range of the hovered tower
  const cellsInRange = hoveredTower 
    ? getCellsInRange(hoveredTower.position.x, hoveredTower.position.y, hoveredTower.range)
    : [];
  
  // Render grid cells
  const renderCell = (cell: GridCell) => {
    const { x, y, type, id, towerId } = cell;
    const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
    
    // Check if this cell is within range of the hovered tower
    const isInRange = hoveredTower && cellsInRange.some(c => c.x === cell.x && c.y === cell.y);
    
    // Determine cell color based on type
    let backgroundColor = 'transparent';
    let borderColor = showGridLines ? '#333' : 'transparent';
    let cursor = 'default';
    let cellClassName = '';
    
    // Apply cell styles based on type
    if (type === 'Path') {
      cellClassName = 'grid-cell-path';
    } else if (type === 'Empty') {
      cellClassName = 'grid-cell-empty';
      cursor = onCellClick ? 'pointer' : 'default';
    } else if (type === 'Tower') {
      // Tower cells are transparent to show the tower visualization
      backgroundColor = 'transparent';
      cursor = 'pointer'; // Make tower cells have pointer cursor for hover
    }
    
    // Enhanced hover effect
    if (isHovered && type === 'Empty') {
      borderColor = '#666';
    }
    
    // Get tower style if this is a tower cell
    const towerStyle = type === 'Tower' ? getTowerStyle(towerId) : null;
    
    // Apply range highlight if this cell is in range of the hovered tower
    // Don't highlight the tower cell itself
    const isRangeHighlighted = isInRange && !(hoveredTower && hoveredTower.position.x === x && hoveredTower.position.y === y);
    
    return (
      <div
        key={id}
        className={`grid-cell border ${cellClassName}`}
        style={{
          width: cellSize,
          height: cellSize,
          left: x * cellSize,
          top: y * cellSize,
          backgroundColor: isRangeHighlighted 
            ? `${hoveredTower?.color}20` // Add 20 hex for 12.5% opacity
            : (type === 'Tower' ? backgroundColor : undefined), // Only set backgroundColor for Tower cells
          borderColor: isRangeHighlighted 
            ? hoveredTower?.color || borderColor 
            : borderColor,
          cursor,
          boxShadow: isHovered ? '0 0 5px rgba(255, 255, 255, 0.5)' : 'none',
          zIndex: type === 'Tower' ? 10 : (isRangeHighlighted ? 6 : 5), // Higher z-index for towers and range cells
        }}
        onClick={() => onCellClick && onCellClick(x, y)}
        onMouseEnter={() => setHoveredCell({ x, y })}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {/* Cell coordinates */}
        {showCoordinates && (
          <div className="absolute bottom-0 right-0 text-xs text-white bg-black bg-opacity-50 px-1 z-20">
            {x},{y}
          </div>
        )}
        
        {/* Cell type indicator */}
        {showCellTypes && (
          <div className="absolute top-0 left-0 text-xs text-white bg-black bg-opacity-50 px-1 z-20">
            {type.charAt(0)}
          </div>
        )}
        
        {/* Tower visualization */}
        {type === 'Tower' && towerStyle && (
          <div 
            className="absolute inset-2 rounded-full flex items-center justify-center z-20"
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
        
        {/* Range cell indicator */}
        {isRangeHighlighted && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div 
              className="w-full h-full opacity-20 transition-opacity duration-200"
              style={{ backgroundColor: hoveredTower?.color }}
            />
          </div>
        )}
      </div>
    );
  };
  
  // Get tooltip position
  const tooltipPosition = getTooltipPosition();
  
  return (
    <div className="relative transform origin-center transition-transform duration-300 ease-in-out" style={{ transform: `scale(${gridScale})` }}>
      {/* Add style element for CSS patterns */}
      <style>{cellStyles}</style>
      
      <div 
        ref={gridRef}
        className="relative"
        style={{ 
          width: gridWidth, 
          height: gridHeight,
          backgroundColor: '#111',
          overflow: 'hidden',
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
        
        {/* Tower Info Tooltip */}
        {hoveredTower && (
          <div 
            ref={tooltipRef}
            className="absolute bg-gray-800 border rounded shadow-lg p-2 z-20 pointer-events-none"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              borderColor: hoveredTower.color,
              minWidth: '150px',
            }}
          >
            <div className="text-white font-bold" style={{ color: hoveredTower.color }}>
              {hoveredTower.name}
            </div>
            <div className="text-xs text-gray-300">
              <div>Type: {hoveredTower.type}</div>
              <div>Level: {hoveredTower.level}</div>
              <div>Damage: {hoveredTower.damage}</div>
              <div>Range: {hoveredTower.range} tiles</div>
              <div className="mt-1 text-xs italic">Special: {
                hoveredTower.type === 'basic' ? 'None' :
                hoveredTower.type === 'sniper' ? 'High damage, long range' :
                hoveredTower.type === 'splash' ? 'Area damage' :
                'Slows enemies'
              }</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 