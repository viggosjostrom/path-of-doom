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
    if (minion.health <= 0 && !isDying) {
      console.log(`Minion ${minion.id} is dying, starting animation`);
      setIsDying(true);
      // Wait for death animation to complete before hiding
      setTimeout(() => {
        console.log(`Minion ${minion.id} death animation complete, hiding`);
        setIsVisible(false);
      }, 1000);
    }
  }, [minion.health, isDying, minion.id]);
  
  // Reset animation state if minion is revived
  useEffect(() => {
    if (minion.health > 0 && isDying) {
      console.log(`Minion ${minion.id} was revived, resetting animation state`);
      setIsDying(false);
      setIsVisible(true);
    }
  }, [minion.health, isDying, minion.id]);
  
  // Skip rendering if minion is dead and animation completed
  if (minion.isDead && !isVisible) {
    return null;
  }
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="absolute"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          left: x,
          top: y,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={isDying 
          ? { 
              opacity: 0, 
              scale: 0, 
              rotate: 360,
              y: y - 20 
            } 
          : { 
              opacity: 1, 
              scale: 1 
            }
        }
        exit={{ opacity: 0, scale: 0, rotate: 360 }}
        transition={{ 
          duration: isDying ? 1 : 0.3,
          ease: isDying ? "backIn" : "easeOut"
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
              }
          }
          transition={isDying 
            ? { 
                duration: 0.8 
              } 
            : {
                repeat: Infinity,
                duration: 2,
              }
          }
        >
          {/* Eyes */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full" />
          <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white rounded-full" />
          
          {/* Death particles */}
          {isDying && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    top: '50%',
                    left: '50%',
                    zIndex: 31,
                    backgroundColor: i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#f97316' : '#fbbf24',
                  }}
                  animate={{
                    x: Math.cos(i * Math.PI / 6) * CELL_SIZE * 0.8,
                    y: Math.sin(i * Math.PI / 6) * CELL_SIZE * 0.8,
                    opacity: [1, 0],
                    scale: [1, 0],
                  }}
                  transition={{
                    duration: 1,
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
      </motion.div>
    </AnimatePresence>
  );
}; 