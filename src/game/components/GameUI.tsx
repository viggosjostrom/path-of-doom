'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { TowerType } from '../types';
import { THEME_COLORS, TOWER_STATS } from '../core/constants';
import { formatMoney } from '../utils';

export const GameUI: React.FC = () => {
  const money = useGameStore((state) => state.money);
  const lives = useGameStore((state) => state.lives);
  const wave = useGameStore((state) => state.wave);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const theme = useGameStore((state) => state.theme);
  const selectedTower = useGameStore((state) => state.selectedTower);
  
  const selectTower = useGameStore((state) => state.selectTower);
  const startGame = useGameStore((state) => state.startGame);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const resetGame = useGameStore((state) => state.resetGame);
  const setTheme = useGameStore((state) => state.setTheme);
  
  const themeColors = THEME_COLORS[theme];
  
  // Render tower selection buttons
  const renderTowerButtons = () => {
    const towerTypes: TowerType[] = ['Gunner', 'Frost', 'Flamethrower', 'Tesla'];
    
    return (
      <div className="flex space-x-2">
        {towerTypes.map((type) => {
          const towerStats = TOWER_STATS[type];
          const isSelected = selectedTower === type;
          const canAfford = money >= towerStats.cost;
          
          return (
            <motion.button
              key={type}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isSelected ? 'ring-2 ring-offset-2' : ''
              } ${
                canAfford ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                backgroundColor: isSelected ? themeColors.accent : themeColors.secondary,
                color: isSelected ? themeColors.background : themeColors.accent,
                borderColor: themeColors.accent,
                ...(isSelected && { boxShadow: `0 0 0 2px ${themeColors.accent}` })
              }}
              onClick={() => selectTower(isSelected ? null : type)}
              whileHover={{ scale: canAfford ? 1.05 : 1 }}
              whileTap={{ scale: canAfford ? 0.95 : 1 }}
              disabled={!canAfford}
            >
              <div className="flex flex-col items-center">
                <span>{type}</span>
                <span className="text-xs">{formatMoney(towerStats.cost)}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  };
  
  // Render game controls
  const renderGameControls = () => {
    switch (gameStatus) {
      case 'idle':
        return (
          <motion.button
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              backgroundColor: themeColors.accent,
              color: themeColors.background,
            }}
            onClick={startGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Game
          </motion.button>
        );
      case 'playing':
        return (
          <motion.button
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              backgroundColor: themeColors.secondary,
              color: themeColors.accent,
            }}
            onClick={pauseGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Pause
          </motion.button>
        );
      case 'paused':
        return (
          <motion.button
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              backgroundColor: themeColors.accent,
              color: themeColors.background,
            }}
            onClick={resumeGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Resume
          </motion.button>
        );
      case 'gameOver':
        return (
          <motion.button
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              backgroundColor: themeColors.accent,
              color: themeColors.background,
            }}
            onClick={resetGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        );
      case 'victory':
        return (
          <motion.button
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              backgroundColor: themeColors.accent,
              color: themeColors.background,
            }}
            onClick={resetGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Play Again
          </motion.button>
        );
      default:
        return null;
    }
  };
  
  // Render theme selection
  const renderThemeSelection = () => {
    const themes = ['NeoHellscape', 'AncientRuins', 'CyberVoid', 'NightmarePath'];
    
    return (
      <div className="flex space-x-2">
        {themes.map((themeName) => (
          <motion.button
            key={themeName}
            className={`px-2 py-1 rounded-md text-xs font-medium ${
              theme === themeName ? `ring-2 ring-offset-2 ring-[${THEME_COLORS[themeName].accent}]` : ''
            }`}
            style={{
              backgroundColor: THEME_COLORS[themeName].primary,
              color: THEME_COLORS[themeName].accent,
            }}
            onClick={() => setTheme(themeName as any)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {themeName}
          </motion.button>
        ))}
      </div>
    );
  };
  
  // Render game status overlay
  const renderGameStatusOverlay = () => {
    if (gameStatus === 'gameOver') {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <motion.div
            className="bg-red-900 p-8 rounded-lg text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <h2 className="text-4xl font-bold text-red-500 mb-4">Game Over</h2>
            <p className="text-white mb-6">You survived {wave.number} waves</p>
            {renderGameControls()}
          </motion.div>
        </div>
      );
    }
    
    if (gameStatus === 'victory') {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <motion.div
            className="bg-green-900 p-8 rounded-lg text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <h2 className="text-4xl font-bold text-green-500 mb-4">Victory!</h2>
            <p className="text-white mb-6">You completed all {wave.number} waves</p>
            {renderGameControls()}
          </motion.div>
        </div>
      );
    }
    
    if (gameStatus === 'paused') {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <motion.div
            className="bg-gray-900 p-8 rounded-lg text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">Paused</h2>
            {renderGameControls()}
          </motion.div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <>
      {/* Top Bar */}
      <div 
        className="flex justify-between items-center p-4"
        style={{
          backgroundColor: themeColors.primary,
          color: themeColors.accent,
        }}
      >
        <div className="flex space-x-4">
          <div className="font-bold">{formatMoney(money)}</div>
          <div className="font-bold">Lives: {lives}</div>
          <div className="font-bold">Wave: {wave.number}</div>
        </div>
        
        <div className="flex space-x-4">
          {renderGameControls()}
          {renderThemeSelection()}
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4"
        style={{
          backgroundColor: themeColors.primary,
          color: themeColors.accent,
        }}
      >
        <div className="flex justify-center">
          {renderTowerButtons()}
        </div>
      </div>
      
      {/* Game Status Overlay */}
      {renderGameStatusOverlay()}
    </>
  );
}; 