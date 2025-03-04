'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export const useGameLoop = () => {
  const updateGame = useGameStore((state) => state.updateGame);
  const gameStatus = useGameStore((state) => state.gameStatus);
  
  const lastTimeRef = useRef<number | null>(null);
  const requestIdRef = useRef<number | null>(null);
  
  const loop = (time: number) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      requestIdRef.current = requestAnimationFrame(loop);
      return;
    }
    
    const deltaTime = (time - lastTimeRef.current) / 1000; // Convert to seconds
    lastTimeRef.current = time;
    
    // Update game state
    updateGame(deltaTime);
    
    // Continue the loop
    requestIdRef.current = requestAnimationFrame(loop);
  };
  
  useEffect(() => {
    if (gameStatus === 'playing') {
      // Start the game loop
      lastTimeRef.current = null;
      requestIdRef.current = requestAnimationFrame(loop);
    } else {
      // Stop the game loop
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
        requestIdRef.current = null;
      }
    }
    
    return () => {
      // Cleanup on unmount
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, [gameStatus]);
}; 