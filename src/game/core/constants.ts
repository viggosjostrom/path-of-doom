// Grid Constants
export const GRID_SIZE = 16; // 16x16 grid
export const CELL_SIZE = 32; // 32px per cell

// Game Constants
export const INITIAL_MONEY = 100;
export const INITIAL_LIVES = 20;
export const WAVE_DELAY = 5000; // 5 seconds between waves

// Minion Constants
export const MINION_STATS: Record<MinionType, MinionStats> = {
  Grunt: {
    health: 50,
    speed: 1,
    reward: 5,
    abilities: ['None'],
  },
  Runner: {
    health: 30,
    speed: 2,
    reward: 3,
    abilities: ['Fast'],
  },
  Tank: {
    health: 200,
    speed: 0.5,
    reward: 20,
    abilities: ['Armor'],
  },
  Cursed: {
    health: 100,
    speed: 1,
    reward: 15,
    abilities: ['DeathExplode'],
  },
};

// Tower Constants
export const TOWER_STATS: Record<TowerType, TowerStats> = {
  Gunner: {
    damage: 10,
    range: 3,
    cooldown: 1,
    cost: 50,
    ability: 'None',
  },
  Frost: {
    damage: 5,
    range: 2,
    cooldown: 2,
    cost: 75,
    ability: 'Slow',
  },
  Flamethrower: {
    damage: 15,
    range: 2,
    cooldown: 0.5,
    cost: 100,
    ability: 'Burn',
  },
  Tesla: {
    damage: 20,
    range: 4,
    cooldown: 3,
    cost: 150,
    ability: 'ChainLightning',
  },
};

// Tower Upgrade Multipliers
export const TOWER_UPGRADE_MULTIPLIERS = {
  damage: 1.5,
  range: 1.2,
  cooldown: 0.8,
  cost: 1.75,
};

// Wave Configurations
export const WAVE_CONFIGURATIONS = [
  { minions: ['Grunt', 'Grunt', 'Grunt'], interval: 1000 },
  { minions: ['Grunt', 'Grunt', 'Runner'], interval: 1000 },
  { minions: ['Grunt', 'Runner', 'Runner'], interval: 900 },
  { minions: ['Runner', 'Runner', 'Runner', 'Grunt'], interval: 900 },
  { minions: ['Grunt', 'Tank'], interval: 2000 },
  { minions: ['Grunt', 'Grunt', 'Tank', 'Runner'], interval: 800 },
  { minions: ['Runner', 'Runner', 'Tank', 'Grunt'], interval: 800 },
  { minions: ['Tank', 'Tank', 'Grunt'], interval: 1500 },
  { minions: ['Cursed', 'Grunt', 'Grunt'], interval: 1000 },
  { minions: ['Cursed', 'Runner', 'Runner'], interval: 900 },
  { minions: ['Cursed', 'Tank', 'Grunt'], interval: 1500 },
  { minions: ['Cursed', 'Cursed', 'Runner'], interval: 1200 },
  { minions: ['Tank', 'Cursed', 'Grunt', 'Runner'], interval: 1000 },
  { minions: ['Tank', 'Tank', 'Cursed'], interval: 1500 },
  { minions: ['Cursed', 'Cursed', 'Tank', 'Tank'], interval: 1200 },
] as { minions: MinionType[], interval: number }[];

// Theme Colors
export const THEME_COLORS: Record<string, ThemeColors> = {
  NeoHellscape: {
    primary: '#2D0A31',
    secondary: '#8B0000',
    accent: '#00FFFF',
    background: '#1A0A1F',
    path: '#4A0000',
    tower: '#00FFFF',
    minion: '#FF0000',
  },
  AncientRuins: {
    primary: '#3A2E1F',
    secondary: '#5D4C3A',
    accent: '#00FFAA',
    background: '#2A1F17',
    path: '#5D4C3A',
    tower: '#00FFAA',
    minion: '#AA5500',
  },
  CyberVoid: {
    primary: '#0A0A1F',
    secondary: '#1A1A3A',
    accent: '#FF00FF',
    background: '#000011',
    path: '#1A1A3A',
    tower: '#00AAFF',
    minion: '#FF00FF',
  },
  NightmarePath: {
    primary: '#1A1A1A',
    secondary: '#2A2A2A',
    accent: '#00FF00',
    background: '#0A0A0A',
    path: '#2A2A2A',
    tower: '#00FF00',
    minion: '#AA0000',
  },
}; 