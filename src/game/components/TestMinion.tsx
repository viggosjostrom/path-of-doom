'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CELL_SIZE } from '../core/gridConstants';
import { Minion } from '../types';

interface TestMinionProps {
  minion: Minion;
}

export const TestMinion: React.FC<TestMinionProps> = ({ minion }) => {
  // State to track if minion is dying (for animation)
  const [isDying, setIsDying] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Calculate position based on the minion's position
  const x = minion.position.x * CELL_SIZE;
  const y = minion.position.y * CELL_SIZE;
  
  // Calculate health percentage
  const healthPercentage = (minion.health / minion.maxHealth) * 100;
  
  // Determine color based on health percentage
  const getHealthColor = () => {
    if (healthPercentage > 70) return '#22c55e'; // Green
    if (healthPercentage > 40) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };
  
  // Handle death animation
  useEffect(() => {
    if ((minion.health <= 0 || minion.isDead) && !isDying) {
      console.log(`Minion ${minion.id} is dying, starting animation`);
      setIsDying(true);
      // Wait for death animation to complete before hiding
      setTimeout(() => {
        console.log(`Minion ${minion.id} death animation complete, hiding`);
        setIsVisible(false);
      }, 2000);
    }
  }, [minion.health, minion.isDead, isDying, minion.id]);
  
  // Reset animation state if minion is revived
  useEffect(() => {
    if (minion.health > 0 && !minion.isDead && isDying) {
      console.log(`Minion ${minion.id} was revived, resetting animation state`);
      setIsDying(false);
      setIsVisible(true);
    }
  }, [minion.health, minion.isDead, isDying, minion.id]);
  
  // Skip rendering if minion is dead and animation completed
  if (minion.isDead && !isVisible) {
    return null;
  }
  
  // Determine if the minion is moving to the right or down/up
  const getMovementDirection = () => {
    const pathIndex = Math.floor(minion.pathIndex);
    if (pathIndex + 1 >= minion.path.length) return 'right'; // Default to right at the end
    
    const currentPos = minion.path[pathIndex];
    const nextPos = minion.path[pathIndex + 1];
    
    if (nextPos.x > currentPos.x) return 'right';
    if (nextPos.x < currentPos.x) return 'left';
    if (nextPos.y > currentPos.y) return 'down';
    return 'up';
  };
  
  const direction = getMovementDirection();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="absolute"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: isDying ? [1, 0.8, 0.6, 0.4, 0.2, 0] : 1, 
          scale: isDying ? [1, 1.5, 0] : 1,
          rotate: isDying ? [0, 180, 360] : 0,
          left: x,
          top: isDying ? y - 30 : y
        }}
        exit={{ opacity: 0, scale: 0, rotate: 360 }}
        transition={{ 
          duration: isDying ? 2 : 0.3,
          ease: isDying ? "easeOut" : "easeOut",
          left: { duration: 0.2, ease: "linear" },
          top: { duration: 0.2, ease: "linear" }
        }}
      >
        {/* Minion body */}
        <motion.div
          className="rounded-full relative"
          style={{
            width: CELL_SIZE * 0.7,
            height: CELL_SIZE * 0.7,
            backgroundColor: getHealthColor(),
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
          }}
          animate={isDying 
            ? { 
                scale: 0,
                backgroundColor: 'rgba(239, 68, 68, 0.8)'
              } 
            : {
                scale: [1, 1.05, 1],
                rotate: direction === 'right' ? 0 : 
                        direction === 'left' ? 180 : 
                        direction === 'down' ? 90 : -90
              }
          }
          transition={isDying 
            ? { 
                duration: 0.8 
              } 
            : {
                repeat: Infinity,
                duration: 2,
                rotate: { duration: 0.3 }
              }
          }
        >
          {/* Eyes */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full" />
          <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white rounded-full" />
          
          {/* Death particles */}
          {isDying && (
            <>
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: i % 2 === 0 ? 8 : 6,
                    height: i % 2 === 0 ? 8 : 6,
                    top: '50%',
                    left: '50%',
                    zIndex: 31,
                    backgroundColor: i % 4 === 0 ? '#ef4444' : i % 4 === 1 ? '#f97316' : i % 4 === 2 ? '#fbbf24' : '#22c55e',
                  }}
                  animate={{
                    x: Math.cos(i * Math.PI / 8) * CELL_SIZE * 1.2,
                    y: Math.sin(i * Math.PI / 8) * CELL_SIZE * 1.2,
                    opacity: [1, 0.8, 0.6, 0.4, 0.2, 0],
                    scale: [1, 1.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}
        </motion.div>
        
        {/* Health bar */}
        {!isDying && (
          <div 
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-3/4 h-1 bg-gray-800 rounded-full overflow-hidden"
            style={{ zIndex: 31 }}
          >
            <motion.div 
              className="h-full rounded-full"
              style={{ backgroundColor: getHealthColor() }}
              initial={{ width: '100%' }}
              animate={{ width: `${healthPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        
        {/* Movement trail effect */}
        {!isDying && minion.speed > 0 && (
          <motion.div
            className="absolute rounded-full opacity-30"
            style={{
              width: CELL_SIZE * 0.4,
              height: CELL_SIZE * 0.4,
              backgroundColor: getHealthColor(),
              zIndex: 29,
            }}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 0.2
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}; 