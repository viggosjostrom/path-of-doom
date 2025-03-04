// Grid Types
export type CellType = 'Path' | 'Tower' | 'Empty';
export type CellEffect = 'Slow' | 'DamageBoost' | 'None';

export interface GridCell {
  x: number;
  y: number;
  type: CellType;
  effect?: CellEffect;
  towerId?: string;
}

export type Grid = GridCell[][];

// Minion Types
export type MinionType = 'Grunt' | 'Runner' | 'Tank' | 'Cursed';
export type MinionAbility = 'None' | 'Fast' | 'Armor' | 'DeathExplode';

export interface MinionStats {
  health: number;
  speed: number;
  reward: number;
  abilities: MinionAbility[];
}

export interface Minion {
  id: string;
  type: MinionType;
  health: number;
  maxHealth: number;
  speed: number;
  reward: number;
  abilities: MinionAbility[];
  position: { x: number; y: number };
  path: { x: number; y: number }[];
  pathIndex: number;
  effects: { type: string; duration: number }[];
  isDead: boolean;
}

// Tower Types
export type TowerType = 'Gunner' | 'Frost' | 'Flamethrower' | 'Tesla';
export type TowerAbility = 'None' | 'Slow' | 'Burn' | 'ChainLightning';

export interface TowerStats {
  damage: number;
  range: number;
  cooldown: number;
  cost: number;
  ability: TowerAbility;
}

export interface Tower {
  id: string;
  type: TowerType;
  level: number;
  damage: number;
  range: number;
  cooldown: number;
  currentCooldown: number;
  cost: number;
  position: { x: number; y: number };
  target?: string;
  ability: TowerAbility;
}

// Wave Types
export interface Wave {
  number: number;
  minions: MinionType[];
  interval: number;
  spawned: number;
  total: number;
  timeSinceLastSpawn: number;
}

// Game State
export interface GameState {
  grid: Grid;
  minions: Minion[];
  towers: Tower[];
  money: number;
  lives: number;
  wave: Wave;
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver' | 'victory';
  selectedTower: TowerType | null;
  theme: 'NeoHellscape' | 'AncientRuins' | 'CyberVoid' | 'NightmarePath';
}

// Theme Types
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  path: string;
  tower: string;
  minion: string;
}

export interface Theme {
  name: string;
  description: string;
  colors: ThemeColors;
} 