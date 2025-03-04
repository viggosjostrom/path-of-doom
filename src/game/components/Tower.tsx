'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tower as TowerType } from '../types';
import { CELL_SIZE, THEME_COLORS } from '../core/constants';
import { useGameStore } from '../store/gameStore';

interface TowerProps {
  tower: TowerType;
  onClick: (towerId: string) => void;
}

export const Tower: React.FC<TowerProps> = ({ tower, onClick }) => {
  const theme = useGameStore((state) => state.theme);
  const themeColors = THEME_COLORS[theme];
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate position
  const x = tower.position.x * CELL_SIZE;
  const y = tower.position.y * CELL_SIZE;
  
  // Determine tower appearance based on type
  const getTowerAppearance = () => {
    switch (tower.type) {
      case 'Gunner':
        return {
          shape: 'circle',
          color: '#3B82F6', // blue-500
          innerColor: '#1D4ED8', // blue-700
          size: 0.7,
        };
      case 'Frost':
        return {
          shape: 'diamond',
          color: '#06B6D4', // cyan-500
          innerColor: '#0E7490', // cyan-700
          size: 0.6,
        };
      case 'Flamethrower':
        return {
          shape: 'square',
          color: '#EF4444', // red-500
          innerColor: '#B91C1C', // red-700
          size: 0.65,
        };
      case 'Tesla':
        return {
          shape: 'triangle',
          color: '#EAB308', // yellow-500
          innerColor: '#A16207', // yellow-700
          size: 0.75,
        };
      default:
        return {
          shape: 'circle',
          color: themeColors.tower,
          innerColor: themeColors.accent,
          size: 0.7,
        };
    }
  };
  
  const appearance = getTowerAppearance();
  const size = CELL_SIZE * appearance.size;
  
  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        left: x,
        top: y,
        zIndex: 25,
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onClick(tower.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
    >
      {/* Range indicator */}
      {isHovered && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: tower.range * CELL_SIZE * 2,
            height: tower.range * CELL_SIZE * 2,
            backgroundColor: appearance.color,
            opacity: 0.2,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 15,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {/* Tower shape */}
      {appearance.shape === 'circle' && (
        <div 
          className="rounded-full absolute"
          style={{
            width: size,
            height: size,
            backgroundColor: appearance.color,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            border: `2px solid ${appearance.innerColor}`,
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div 
            className="rounded-full absolute"
            style={{
              width: size * 0.5,
              height: size * 0.5,
              backgroundColor: appearance.innerColor,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )}
      
      {appearance.shape === 'diamond' && (
        <div 
          className="absolute"
          style={{
            width: size,
            height: size,
            backgroundColor: appearance.color,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(45deg)',
            border: `2px solid ${appearance.innerColor}`,
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div 
            className="absolute"
            style={{
              width: size * 0.5,
              height: size * 0.5,
              backgroundColor: appearance.innerColor,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )}
      
      {appearance.shape === 'square' && (
        <div 
          className="absolute"
          style={{
            width: size,
            height: size,
            backgroundColor: appearance.color,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            border: `2px solid ${appearance.innerColor}`,
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div 
            className="absolute"
            style={{
              width: size * 0.5,
              height: size * 0.5,
              backgroundColor: appearance.innerColor,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )}
      
      {appearance.shape === 'triangle' && (
        <div 
          className="absolute"
          style={{
            width: 0,
            height: 0,
            borderLeft: `${size / 2}px solid transparent`,
            borderRight: `${size / 2}px solid transparent`,
            borderBottom: `${size}px solid ${appearance.color}`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            filter: 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.5))',
          }}
        >
          <div 
            className="absolute"
            style={{
              width: 0,
              height: 0,
              borderLeft: `${size / 4}px solid transparent`,
              borderRight: `${size / 4}px solid transparent`,
              borderBottom: `${size / 2}px solid ${appearance.innerColor}`,
              top: '25%',
              left: '0%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )}
      
      {/* Level indicator */}
      <div 
        className="absolute bottom-0 right-0 text-xs font-bold bg-black bg-opacity-70 px-1 rounded"
        style={{
          color: 'white',
          zIndex: 26,
        }}
      >
        {tower.level}
      </div>
    </motion.div>
  );
}; 