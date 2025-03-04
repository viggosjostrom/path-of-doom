'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled for the Game component
// This is necessary because the game uses browser APIs
const Game = dynamic(() => import('../game/components/Game').then(mod => ({ default: mod.Game })), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Game />
    </div>
  );
}
