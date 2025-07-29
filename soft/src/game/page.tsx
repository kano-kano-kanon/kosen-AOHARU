'use client';

import React from 'react';
import GameMain from '../game/components/GameMain';

export default function GamePage() {
  return (
    <main style={{ padding: '20px', textAlign: 'center' }}>
      <h1>高専RPG:青春オーバードライブ</h1>
      <GameMain />
    </main>
  );
}
