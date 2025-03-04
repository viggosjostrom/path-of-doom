import { create } from 'zustand';
import { GameState, Minion, MinionType, Tower, TowerType, Wave } from '../types';
import { GridCell, Grid } from '../types/gridTypes';
import { 
  GRID_SIZE, 
  INITIAL_LIVES, 
  INITIAL_MONEY, 
  MINION_STATS, 
  TOWER_STATS, 
  TOWER_UPGRADE_MULTIPLIERS, 
  WAVE_CONFIGURATIONS 
} from '../core/constants';
import { 
  calculateDistance, 
  createDefaultPath, 
  createGrid, 
  extractPathFromGrid, 
  findClosestMinion, 
  generateId, 
  isValidTowerPosition,
  getCellsInTowerRange
} from '../utils';

const initialGrid = createDefaultPath(createGrid(GRID_SIZE));
const initialPath = extractPathFromGrid(initialGrid);

export const useGameStore = create<GameState & {
  // Grid Actions
  initializeGame: () => void;
  resetGame: () => void;
  
  // Tower Actions
  selectTower: (towerType: TowerType | null) => void;
  placeTower: (x: number, y: number) => void;
  upgradeTower: (towerId: string) => void;
  sellTower: (towerId: string) => void;
  
  // Game Flow Actions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  startNextWave: () => void;
  
  // Update Loop
  updateGame: (deltaTime: number) => void;
  
  // Theme
  setTheme: (theme: 'NeoHellscape' | 'AncientRuins' | 'CyberVoid' | 'NightmarePath') => void;
}>((set, get) => ({
  // Initial State
  grid: initialGrid,
  minions: [],
  towers: [],
  money: INITIAL_MONEY,
  lives: INITIAL_LIVES,
  wave: {
    number: 0,
    minions: [],
    interval: 0,
    spawned: 0,
    total: 0,
    timeSinceLastSpawn: 0,
  },
  gameStatus: 'idle',
  selectedTower: null,
  theme: 'NeoHellscape',
  
  // Grid Actions
  initializeGame: () => {
    const grid = createDefaultPath(createGrid(GRID_SIZE));
    set({
      grid,
      minions: [],
      towers: [],
      money: INITIAL_MONEY,
      lives: INITIAL_LIVES,
      wave: {
        number: 0,
        minions: [],
        interval: 0,
        spawned: 0,
        total: 0,
        timeSinceLastSpawn: 0,
      },
      gameStatus: 'idle',
      selectedTower: null,
    });
  },
  
  resetGame: () => {
    get().initializeGame();
  },
  
  // Tower Actions
  selectTower: (towerType) => {
    set({ selectedTower: towerType });
  },
  
  placeTower: (x, y) => {
    const { grid, selectedTower, money, towers } = get();
    
    if (!selectedTower || !isValidTowerPosition(grid, x, y)) {
      return;
    }
    
    const towerStats = TOWER_STATS[selectedTower];
    
    if (money < towerStats.cost) {
      return; // Not enough money
    }
    
    // Calculate cells in range
    const rangeCells = getCellsInTowerRange(x, y, towerStats.range, grid[0].length, grid.length);
    
    // Create a new tower
    const newTower: Tower = {
      id: generateId(),
      type: selectedTower,
      level: 1,
      damage: towerStats.damage,
      range: towerStats.range,
      cooldown: towerStats.cooldown,
      currentCooldown: 0,
      cost: towerStats.cost,
      position: { x, y },
      ability: towerStats.ability,
      rangeCells: rangeCells,
    };
    
    // Update the grid
    const newGrid = [...grid];
    newGrid[y][x] = {
      ...newGrid[y][x],
      type: 'Tower',
      towerId: newTower.id,
    };
    
    // Update state
    set({
      grid: newGrid,
      towers: [...towers, newTower],
      money: money - towerStats.cost,
      selectedTower: null,
    });
  },
  
  upgradeTower: (towerId) => {
    const { towers, money, grid } = get();
    
    const towerIndex = towers.findIndex((t) => t.id === towerId);
    if (towerIndex === -1) return;
    
    const tower = towers[towerIndex];
    const upgradeCost = Math.floor(tower.cost * TOWER_UPGRADE_MULTIPLIERS.cost);
    
    if (money < upgradeCost) {
      return; // Not enough money
    }
    
    // Calculate new range
    const newRange = tower.range * TOWER_UPGRADE_MULTIPLIERS.range;
    
    // Recalculate cells in range
    const rangeCells = getCellsInTowerRange(
      tower.position.x, 
      tower.position.y, 
      newRange, 
      grid[0].length, 
      grid.length
    );
    
    // Create upgraded tower
    const upgradedTower: Tower = {
      ...tower,
      level: tower.level + 1,
      damage: tower.damage * TOWER_UPGRADE_MULTIPLIERS.damage,
      range: newRange,
      cooldown: tower.cooldown * TOWER_UPGRADE_MULTIPLIERS.cooldown,
      cost: upgradeCost,
      rangeCells: rangeCells,
    };
    
    // Update towers array
    const newTowers = [...towers];
    newTowers[towerIndex] = upgradedTower;
    
    // Update state
    set({
      towers: newTowers,
      money: money - upgradeCost,
    });
  },
  
  sellTower: (towerId) => {
    const { towers, grid, money } = get();
    
    const tower = towers.find((t) => t.id === towerId);
    if (!tower) return;
    
    // Calculate sell value (half of the tower's cost)
    const sellValue = Math.floor(tower.cost / 2);
    
    // Find the tower's position in the grid
    const { x, y } = tower.position;
    
    // Update the grid
    const newGrid = [...grid];
    newGrid[y][x] = {
      ...newGrid[y][x],
      type: 'Empty',
      towerId: undefined,
    };
    
    // Remove the tower
    const newTowers = towers.filter((t) => t.id !== towerId);
    
    // Update state
    set({
      grid: newGrid,
      towers: newTowers,
      money: money + sellValue,
    });
  },
  
  // Game Flow Actions
  startGame: () => {
    set({ gameStatus: 'playing' });
    get().startNextWave();
  },
  
  pauseGame: () => {
    set({ gameStatus: 'paused' });
  },
  
  resumeGame: () => {
    set({ gameStatus: 'playing' });
  },
  
  startNextWave: () => {
    const { wave } = get();
    const nextWaveNumber = wave.number + 1;
    
    // Check if we have a configuration for this wave
    if (nextWaveNumber <= WAVE_CONFIGURATIONS.length) {
      const waveConfig = WAVE_CONFIGURATIONS[nextWaveNumber - 1];
      
      set({
        wave: {
          number: nextWaveNumber,
          minions: waveConfig.minions,
          interval: waveConfig.interval,
          spawned: 0,
          total: waveConfig.minions.length,
          timeSinceLastSpawn: 0,
        },
      });
    } else {
      // Victory - no more waves
      set({ gameStatus: 'victory' });
    }
  },
  
  // Update Loop
  updateGame: (deltaTime) => {
    const { gameStatus, minions, towers, wave, lives } = get();
    
    if (gameStatus !== 'playing') {
      return;
    }
    
    // Create a map of cell coordinates to minions for efficient tower targeting
    const minionPositions = new Map<string, Minion[]>();
    
    minions.forEach(minion => {
      if (!minion.isDead) {
        const cellX = Math.floor(minion.position.x);
        const cellY = Math.floor(minion.position.y);
        const cellKey = `${cellX},${cellY}`;
        
        if (!minionPositions.has(cellKey)) {
          minionPositions.set(cellKey, []);
        }
        
        minionPositions.get(cellKey)!.push(minion);
      }
    });
    
    // Update wave spawning
    if (wave.spawned < wave.total) {
      // Accumulate time since last spawn
      const newTimeSinceLastSpawn = (wave.timeSinceLastSpawn || 0) + (deltaTime * 1000);
      
      if (newTimeSinceLastSpawn >= wave.interval) {
        // Spawn a new minion
        const minionType = wave.minions[wave.spawned] as MinionType;
        const minionStats = MINION_STATS[minionType];
        
        const path = extractPathFromGrid(get().grid);
        
        const newMinion: Minion = {
          id: generateId(),
          type: minionType,
          health: minionStats.health,
          maxHealth: minionStats.health,
          speed: minionStats.speed,
          reward: minionStats.reward,
          abilities: minionStats.abilities,
          position: { ...path[0] },
          path,
          pathIndex: 0,
          effects: [],
          isDead: false,
        };
        
        set({
          minions: [...minions, newMinion],
          wave: {
            ...wave,
            spawned: wave.spawned + 1,
            timeSinceLastSpawn: 0,
          },
        });
      } else {
        // Update the timer
        set({
          wave: {
            ...wave,
            timeSinceLastSpawn: newTimeSinceLastSpawn,
          },
        });
      }
    }
    
    // Update minions
    const updatedMinions = minions.map((minion) => {
      if (minion.isDead) return minion;
      
      // Move minion along path
      const { pathIndex, path, speed } = minion;
      
      if (pathIndex < path.length - 1) {
        const currentPos = minion.position;
        const targetPos = path[pathIndex + 1];
        
        // Calculate direction and distance
        const dx = targetPos.x - currentPos.x;
        const dy = targetPos.y - currentPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= speed * deltaTime) {
          // Reached the next point
          return {
            ...minion,
            position: { ...targetPos },
            pathIndex: pathIndex + 1,
          };
        } else {
          // Move towards the next point
          const ratio = (speed * deltaTime) / distance;
          return {
            ...minion,
            position: {
              x: currentPos.x + dx * ratio,
              y: currentPos.y + dy * ratio,
            },
          };
        }
      } else if (pathIndex === path.length - 1) {
        // Minion reached the end of the path
        set({ lives: lives - 1 });
        
        return {
          ...minion,
          isDead: true,
        };
      }
      
      return minion;
    });
    
    // Update towers
    const updatedTowers = towers.map((tower) => {
      if (tower.currentCooldown > 0) {
        return {
          ...tower,
          currentCooldown: tower.currentCooldown - deltaTime,
        };
      }
      
      // Find a target
      const target = findClosestMinion(tower, updatedMinions);
      
      if (target) {
        // Attack the target
        const targetIndex = updatedMinions.findIndex((m) => m.id === target.id);
        
        if (targetIndex !== -1) {
          // Apply damage
          let damage = tower.damage;
          
          // Check for armor ability
          if (target.abilities.includes('Armor')) {
            damage = damage / 2;
          }
          
          updatedMinions[targetIndex] = {
            ...updatedMinions[targetIndex],
            health: Math.max(0, updatedMinions[targetIndex].health - damage),
          };
          
          // Check if minion died
          if (updatedMinions[targetIndex].health <= 0) {
            // Award money
            set({ money: get().money + target.reward });
            
            // Handle death effects
            if (target.abilities.includes('DeathExplode')) {
              // Damage nearby towers
              const explodeRange = 2;
              const explodeDamage = 10;
              
              towers.forEach((t, idx) => {
                const distance = calculateDistance(
                  t.position.x,
                  t.position.y,
                  target.position.x,
                  target.position.y
                );
                
                if (distance <= explodeRange) {
                  // Apply damage to tower (reduce its damage output)
                  const damageFactor = 0.9; // Reduce damage by 10%
                  updatedTowers[idx] = {
                    ...updatedTowers[idx],
                    damage: updatedTowers[idx].damage * damageFactor,
                  };
                }
              });
            }
            
            updatedMinions[targetIndex] = {
              ...updatedMinions[targetIndex],
              isDead: true,
            };
          }
          
          // Apply special abilities
          if (tower.ability === 'Slow' && !updatedMinions[targetIndex].isDead) {
            // Add slow effect
            updatedMinions[targetIndex] = {
              ...updatedMinions[targetIndex],
              effects: [
                ...updatedMinions[targetIndex].effects,
                { type: 'Slow', duration: 3 },
              ],
              speed: updatedMinions[targetIndex].speed * 0.5,
            };
          } else if (tower.ability === 'Burn' && !updatedMinions[targetIndex].isDead) {
            // Add burn effect
            updatedMinions[targetIndex] = {
              ...updatedMinions[targetIndex],
              effects: [
                ...updatedMinions[targetIndex].effects,
                { type: 'Burn', duration: 3 },
              ],
            };
          } else if (tower.ability === 'ChainLightning' && !updatedMinions[targetIndex].isDead) {
            // Chain lightning to nearby minions
            const chainRange = 2;
            const chainDamage = tower.damage * 0.5;
            
            updatedMinions.forEach((m, idx) => {
              if (m.id !== target.id && !m.isDead) {
                const distance = calculateDistance(
                  m.position.x,
                  m.position.y,
                  target.position.x,
                  target.position.y
                );
                
                if (distance <= chainRange) {
                  updatedMinions[idx] = {
                    ...updatedMinions[idx],
                    health: Math.max(0, updatedMinions[idx].health - chainDamage),
                    isDead: updatedMinions[idx].health - chainDamage <= 0,
                  };
                  
                  // Award money if minion died
                  if (updatedMinions[idx].health - chainDamage <= 0) {
                    set({ money: get().money + m.reward });
                  }
                }
              }
            });
          }
        }
        
        return {
          ...tower,
          currentCooldown: tower.cooldown,
          target: target.id,
        };
      }
      
      return {
        ...tower,
        target: undefined,
      };
    });
    
    // Update effects on minions
    const minionsWithUpdatedEffects = updatedMinions.map((minion) => {
      if (minion.isDead) return minion;
      
      // Update effect durations
      const updatedEffects = minion.effects
        .map((effect) => ({
          ...effect,
          duration: effect.duration - deltaTime,
        }))
        .filter((effect) => effect.duration > 0);
      
      // Reset speed if slow effect expired
      let updatedSpeed = minion.speed;
      const hadSlow = minion.effects.some((e) => e.type === 'Slow');
      const stillHasSlow = updatedEffects.some((e) => e.type === 'Slow');
      
      if (hadSlow && !stillHasSlow) {
        // Reset speed to original
        const minionStats = MINION_STATS[minion.type];
        updatedSpeed = minionStats.speed;
      }
      
      // Apply burn damage
      let updatedHealth = minion.health;
      const hasBurn = minion.effects.some((e) => e.type === 'Burn');
      
      if (hasBurn) {
        updatedHealth -= 2 * deltaTime; // 2 damage per second
      }
      
      // Check if minion died from effects
      const isDead = updatedHealth <= 0;
      
      if (isDead && !minion.isDead) {
        // Award money
        set({ money: get().money + minion.reward });
      }
      
      return {
        ...minion,
        effects: updatedEffects,
        speed: updatedSpeed,
        health: Math.max(0, updatedHealth),
        isDead: isDead,
      };
    });
    
    // Check if all minions are dead and wave is complete
    const allMinionsDead = minionsWithUpdatedEffects.every((m) => m.isDead);
    const waveComplete = wave.spawned === wave.total && allMinionsDead;
    
    if (waveComplete) {
      // Start next wave
      get().startNextWave();
    }
    
    // Check if game over
    if (lives <= 0) {
      set({ gameStatus: 'gameOver' });
    }
    
    // Update state
    set({
      minions: minionsWithUpdatedEffects,
      towers: updatedTowers,
    });
  },
  
  // Theme
  setTheme: (theme) => {
    set({ theme });
  },
})); 