'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CELL_SIZE, GRID_WIDTH, GRID_HEIGHT } from '../core/gridConstants';
import { Tower, Minion } from '../types';

interface TowerAttackProps {
  tower: Tower;
  target: Minion;
}

export const TowerAttack: React.FC<TowerAttackProps> = ({ tower, target }) => {
  // State to track when projectile reaches target (for effects)
  const [projectileReached, setProjectileReached] = useState(false);
  
  // Calculate positions
  const towerX = tower.position.x * CELL_SIZE + CELL_SIZE / 2;
  const towerY = tower.position.y * CELL_SIZE + CELL_SIZE / 2;
  const targetX = target.position.x * CELL_SIZE + CELL_SIZE / 2;
  const targetY = target.position.y * CELL_SIZE + CELL_SIZE / 2;
  
  // Calculate grid boundaries
  const gridWidth = GRID_WIDTH * CELL_SIZE;
  const gridHeight = GRID_HEIGHT * CELL_SIZE;
  
  // Ensure all effects stay within the grid boundaries
  const ensureWithinBounds = (x: number, size: number) => {
    return Math.min(Math.max(x, size/2), gridWidth - size/2);
  };
  
  const boundedTargetX = ensureWithinBounds(targetX, CELL_SIZE * 0.8);
  const boundedTargetY = ensureWithinBounds(targetY, CELL_SIZE * 0.8);
  
  // Determine if this is a sniper tower (based on damage and range)
  const isSniper = tower.type === 'Gunner' && tower.damage >= 20 && tower.range >= 4;
  
  // Determine attack appearance based on tower type
  const getAttackStyle = () => {
    // Special case for sniper
    if (isSniper) {
      return {
        color: '#DC2626', // bright red
        size: 8,
        speed: 0.7, // 0.7 seconds for animation
        trail: true,
        trailColor: 'rgba(220, 38, 38, 0.4)',
        bulletTrail: true,
      };
    }
    
    switch (tower.type) {
      case 'Gunner':
        return {
          color: '#3B82F6', // blue
          size: 8,
          speed: 0.7, // 0.7 seconds for animation
          trail: true,
          trailColor: 'rgba(59, 130, 246, 0.3)',
          bulletTrail: true,
        };
      case 'Frost':
        return {
          color: '#06B6D4', // cyan
          size: 10,
          speed: 0.9, // 0.9 seconds for animation
          trail: true,
          trailColor: 'rgba(6, 182, 212, 0.3)',
          iceEffect: true,
        };
      case 'Flamethrower':
        return {
          color: '#EF4444', // red
          size: 12,
          speed: 1.1, // 1.1 seconds for animation
          trail: true,
          trailColor: 'rgba(239, 68, 68, 0.4)',
          fireEffect: true,
        };
      case 'Tesla':
        return {
          color: '#EAB308', // yellow
          size: 6,
          speed: 0.5, // 0.5 seconds for animation
          trail: true,
          trailColor: 'rgba(234, 179, 8, 0.5)',
          zigzag: true,
          electricEffect: true,
        };
      default:
        return {
          color: '#3B82F6',
          size: 8,
          speed: 0.7,
          trail: true,
          trailColor: 'rgba(59, 130, 246, 0.3)',
        };
    }
  };
  
  const attackStyle = getAttackStyle();
  
  // Set up effect to trigger special effects when projectile reaches target
  useEffect(() => {
    const timer = setTimeout(() => {
      setProjectileReached(true);
    }, attackStyle.speed * 1000 * 0.9); // Trigger slightly before animation ends
    
    return () => clearTimeout(timer);
  }, [attackStyle.speed]);
  
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      {/* Attack projectile */}
      <motion.div
        className="absolute z-40"
        style={{
          width: attackStyle.size,
          height: isSniper ? attackStyle.size * 2 : attackStyle.size,
          backgroundColor: attackStyle.color,
          boxShadow: `0 0 8px ${attackStyle.color}`,
          borderRadius: isSniper ? '2px' : '50%', // Bullet shape for sniper
          transform: isSniper ? 'rotate(45deg)' : 'none',
          x: towerX - attackStyle.size / 2,
          y: towerY - attackStyle.size / 2,
        }}
        animate={{
          x: boundedTargetX - attackStyle.size / 2,
          y: boundedTargetY - attackStyle.size / 2,
          ...(attackStyle.zigzag ? {
            x: [
              towerX - attackStyle.size / 2,
              towerX + (boundedTargetX - towerX) * 0.25 + 10 - attackStyle.size / 2,
              towerX + (boundedTargetX - towerX) * 0.5 - 10 - attackStyle.size / 2,
              towerX + (boundedTargetX - towerX) * 0.75 + 10 - attackStyle.size / 2,
              boundedTargetX - attackStyle.size / 2,
            ],
            y: [
              towerY - attackStyle.size / 2,
              towerY + (boundedTargetY - towerY) * 0.25 - 10 - attackStyle.size / 2,
              towerY + (boundedTargetY - towerY) * 0.5 + 10 - attackStyle.size / 2,
              towerY + (boundedTargetY - towerY) * 0.75 - 10 - attackStyle.size / 2,
              boundedTargetY - attackStyle.size / 2,
            ],
          } : {}),
          scale: attackStyle.fireEffect ? [1, 1.2, 1, 1.2, 1] : 1,
        }}
        transition={{
          duration: attackStyle.speed,
          ease: "linear",
          scale: { repeat: Infinity, duration: 0.3 }
        }}
      />
      
      {/* Bullet trail effect (for gunner and sniper) */}
      {attackStyle.bulletTrail && (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 35, overflow: 'hidden' }}>
          <motion.line
            x1={towerX}
            y1={towerY}
            x2={towerX}
            y2={towerY}
            stroke={attackStyle.trailColor}
            strokeWidth={isSniper ? 3 : 2}
            strokeDasharray={isSniper ? "5,3" : "3,3"}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ 
              x2: boundedTargetX,
              y2: boundedTargetY,
              pathLength: 1,
            }}
            transition={{
              duration: attackStyle.speed * 0.8,
              ease: "linear",
            }}
          />
        </svg>
      )}
      
      {/* Regular trail effect (for other towers) */}
      {attackStyle.trail && !attackStyle.bulletTrail && (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 35, overflow: 'hidden' }}>
          <motion.line
            x1={towerX}
            y1={towerY}
            x2={towerX}
            y2={towerY}
            stroke={attackStyle.trailColor}
            strokeWidth={attackStyle.size / 2}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ 
              x2: boundedTargetX,
              y2: boundedTargetY,
              pathLength: [0, 1, 0],
            }}
            transition={{
              duration: attackStyle.speed * 1.2,
              ease: "easeInOut",
            }}
          />
        </svg>
      )}
      
      {/* Special effects for different tower types - only show when projectile reaches target */}
      {projectileReached && attackStyle.electricEffect && (
        <motion.div
          className="absolute z-39"
          style={{
            width: CELL_SIZE * 0.3,
            height: CELL_SIZE * 0.3,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${attackStyle.color} 0%, transparent 70%)`,
            x: boundedTargetX - CELL_SIZE * 0.15,
            y: boundedTargetY - CELL_SIZE * 0.15,
            opacity: 0,
          }}
          animate={{
            opacity: [0, 0.8, 0, 0.6, 0],
            scale: [0.8, 1.2, 1, 1.3, 0.9],
          }}
          transition={{
            duration: 0.5,
            times: [0, 0.2, 0.4, 0.6, 1],
          }}
        />
      )}
      
      {/* Ice effect for frost tower - only show when projectile reaches target */}
      {projectileReached && attackStyle.iceEffect && (
        <motion.div
          className="absolute z-39"
          style={{
            width: CELL_SIZE * 0.4,
            height: CELL_SIZE * 0.4,
            borderRadius: '50%',
            border: `2px solid ${attackStyle.color}`,
            x: boundedTargetX - CELL_SIZE * 0.2,
            y: boundedTargetY - CELL_SIZE * 0.2,
            opacity: 0,
          }}
          animate={{
            opacity: [0, 0.7, 0],
            scale: [0.5, 1.2, 1.5],
            borderWidth: ["2px", "0px"],
          }}
          transition={{
            duration: 0.6,
          }}
        />
      )}
      
      {/* Impact effect - only show when projectile reaches target */}
      {projectileReached && (
        <motion.div
          className="absolute rounded-full z-45"
          style={{
            width: 0,
            height: 0,
            backgroundColor: isSniper ? 'rgba(220, 38, 38, 0.7)' : attackStyle.color,
            opacity: 0.7,
            x: boundedTargetX,
            y: boundedTargetY,
          }}
          animate={{
            width: [0, isSniper ? CELL_SIZE * 0.6 : CELL_SIZE * 0.5],
            height: [0, isSniper ? CELL_SIZE * 0.6 : CELL_SIZE * 0.5],
            x: boundedTargetX - (isSniper ? CELL_SIZE * 0.3 : CELL_SIZE * 0.25),
            y: boundedTargetY - (isSniper ? CELL_SIZE * 0.3 : CELL_SIZE * 0.25),
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
          }}
        />
      )}
      
      {/* Sniper impact additional effect - only show when projectile reaches target */}
      {projectileReached && isSniper && (
        <motion.div
          className="absolute z-46"
          style={{
            width: CELL_SIZE * 0.8,
            height: CELL_SIZE * 0.8,
            borderRadius: '50%',
            border: '2px solid rgba(220, 38, 38, 0.7)',
            x: boundedTargetX - CELL_SIZE * 0.4,
            y: boundedTargetY - CELL_SIZE * 0.4,
            opacity: 0,
          }}
          animate={{
            opacity: [0, 0.9, 0],
            scale: [0.5, 1.3, 1.5],
            borderWidth: ["3px", "1px", "0px"],
          }}
          transition={{
            duration: 0.5,
          }}
        />
      )}
    </div>
  );
}; 