'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Minion as MinionType } from '../types';
import { CELL_SIZE, THEME_COLORS } from '../core/constants';
import { useGameStore } from '../store/gameStore';

interface MinionProps {
  minion: MinionType;
}

export const Minion: React.FC<MinionProps> = ({ minion }) => {
  const theme = useGameStore((state) => state.theme);
  const themeColors = THEME_COLORS[theme];
  
  // Calculate position
  const x = minion.position.x * CELL_SIZE;
  const y = minion.position.y * CELL_SIZE;
  
  // Determine minion appearance based on type
  const getMinionAppearance = () => {
    switch (minion.type) {
      case 'Grunt':
        return {
          shape: 'circle',
          color: '#FF3333',
          size: 0.6,
          eyeColor: '#FFFFFF',
        };
      case 'Runner':
        return {
          shape: 'triangle',
          color: '#8800FF',
          size: 0.5,
          eyeColor: '#FFFFFF',
        };
      case 'Tank':
        return {
          shape: 'square',
          color: '#888888',
          size: 0.8,
          eyeColor: '#FF0000',
        };
      case 'Cursed':
        return {
          shape: 'diamond',
          color: '#00FF88',
          size: 0.7,
          eyeColor: '#00FF00',
        };
      default:
        return {
          shape: 'circle',
          color: themeColors.minion,
          size: 0.6,
          eyeColor: '#FFFFFF',
        };
    }
  };
  
  const appearance = getMinionAppearance();
  const size = CELL_SIZE * appearance.size;
  
  // Skip rendering if minion is dead
  if (minion.isDead) {
    return null;
  }
  
  // Calculate health percentage
  const healthPercentage = (minion.health / minion.maxHealth) * 100;
  
  return (
    <motion.div
      className="absolute"
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        left: x,
        top: y,
        zIndex: 30,
        pointerEvents: 'none',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1,
        scale: 1,
      }}
      transition={{ 
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
      }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Health bar */}
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-3/4 h-1 bg-gray-800 rounded-full overflow-hidden"
          style={{ zIndex: 31 }}
        >
          <div 
            className="h-full bg-green-500 rounded-full"
            style={{ 
              width: `${healthPercentage}%`,
              backgroundColor: healthPercentage > 50 ? '#22c55e' : healthPercentage > 25 ? '#eab308' : '#ef4444'
            }}
          />
        </div>
        
        {/* Minion body */}
        {appearance.shape === 'circle' && (
          <div 
            className="rounded-full absolute shadow-lg"
            style={{
              width: size,
              height: size,
              backgroundColor: appearance.color,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px solid rgba(0,0,0,0.3)',
              boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            }}
          >
            {/* Eyes */}
            <div 
              className="rounded-full absolute"
              style={{
                width: size * 0.2,
                height: size * 0.2,
                backgroundColor: appearance.eyeColor,
                top: '30%',
                left: '30%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div 
              className="rounded-full absolute"
              style={{
                width: size * 0.2,
                height: size * 0.2,
                backgroundColor: appearance.eyeColor,
                top: '30%',
                left: '70%',
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
              filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))',
            }}
          >
            {/* Eyes */}
            <div 
              className="rounded-full absolute"
              style={{
                width: size * 0.15,
                height: size * 0.15,
                backgroundColor: appearance.eyeColor,
                top: '60%',
                left: '35%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div 
              className="rounded-full absolute"
              style={{
                width: size * 0.15,
                height: size * 0.15,
                backgroundColor: appearance.eyeColor,
                top: '60%',
                left: '65%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        )}
        
        {appearance.shape === 'square' && (
          <div 
            className="absolute shadow-lg"
            style={{
              width: size,
              height: size,
              backgroundColor: appearance.color,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px solid rgba(0,0,0,0.3)',
              boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            }}
          >
            {/* Eyes */}
            <div 
              className="rounded-full absolute"
              style={{
                width: size * 0.2,
                height: size * 0.2,
                backgroundColor: appearance.eyeColor,
                top: '30%',
                left: '30%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div 
              className="rounded-full absolute"
              style={{
                width: size * 0.2,
                height: size * 0.2,
                backgroundColor: appearance.eyeColor,
                top: '30%',
                left: '70%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        )}
        
        {appearance.shape === 'diamond' && (
          <div 
            className="absolute shadow-lg"
            style={{
              width: size,
              height: size,
              backgroundColor: appearance.color,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(45deg)',
              border: '2px solid rgba(0,0,0,0.3)',
              boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            }}
          >
            {/* Eyes */}
            <div 
              className="rounded-full absolute"
              style={{
                width: size * 0.2,
                height: size * 0.2,
                backgroundColor: appearance.eyeColor,
                top: '30%',
                left: '30%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div 
              className="rounded-full absolute"
              style={{
                width: size * 0.2,
                height: size * 0.2,
                backgroundColor: appearance.eyeColor,
                top: '30%',
                left: '70%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        )}
        
        {/* Effects visualization */}
        {minion.effects.map((effect, index) => {
          if (effect.type === 'Slow') {
            return (
              <div 
                key={`${effect.type}-${index}`}
                className="absolute top-0 right-0 w-2 h-2 rounded-full bg-blue-500 animate-pulse"
                style={{ zIndex: 32 }}
              />
            );
          } else if (effect.type === 'Burn') {
            return (
              <div 
                key={`${effect.type}-${index}`}
                className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-orange-500 animate-pulse"
                style={{ zIndex: 32 }}
              />
            );
          }
          return null;
        })}
      </div>
    </motion.div>
  );
}; 