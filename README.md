# Path of Doom

A modern, web-based tower defense game built with Next.js, React, TypeScript, and React Three Fiber.

## Features

- Dynamic grid system with procedural level creation
- Four unique tower types with special abilities
- Four different minion types with varying stats and abilities
- Wave-based gameplay with increasing difficulty
- Four visual themes to choose from
- Responsive design that works on desktop and mobile

## Tech Stack

- **Frontend Framework**: Next.js + React + TypeScript
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS
- **Persistence**: LocalStorage (for game progress and high scores)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/path-of-doom.git
cd path-of-doom
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to play the game.

## How to Play

1. **Start the Game**: Click the "Start Game" button to begin.
2. **Place Towers**: Select a tower type from the bottom menu and click on an empty grid cell to place it.
3. **Upgrade Towers**: Click on an existing tower to upgrade it.
4. **Survive Waves**: Defend against waves of minions by strategically placing and upgrading towers.
5. **Win the Game**: Complete all waves to win!

## Tower Types

- **Gunner**: Basic tower with balanced stats
- **Frost Tower**: Slows down minions
- **Flamethrower**: Deals damage over time with burn effect
- **Tesla Coil**: Chain lightning that can hit multiple minions

## Minion Types

- **Grunt**: Basic minion with balanced stats
- **Runner**: Fast but weak minion
- **Tank**: Slow but high health minion with armor
- **Cursed**: Explodes on death, damaging nearby towers

## Game Mechanics

- Each tower can be upgraded to increase its damage, range, and special abilities
- Minions follow a predefined path from the entrance to the exit
- If a minion reaches the exit, you lose a life
- When you run out of lives, the game is over
- Complete all waves to win the game

## Development

### Project Structure

- `src/game/components`: React components for the game UI
- `src/game/core`: Core game logic and constants
- `src/game/hooks`: Custom React hooks
- `src/game/store`: Zustand state management
- `src/game/types`: TypeScript type definitions
- `src/game/utils`: Utility functions

### Adding New Content

- **New Tower Types**: Add to the `TowerType` type in `src/game/types/index.ts` and add stats in `src/game/core/constants.ts`
- **New Minion Types**: Add to the `MinionType` type in `src/game/types/index.ts` and add stats in `src/game/core/constants.ts`
- **New Themes**: Add to the `THEME_COLORS` object in `src/game/core/constants.ts`

## License

MIT

## Credits

Created by [Your Name]
