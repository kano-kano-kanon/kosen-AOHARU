'use client';

import React from 'react';
import GameMain from '../game/components/GameMain';

export default function GamePage() {
  return (
    <main style={{ padding: '20px', textAlign: 'center' }}>
      <h1>高専RPG:青春オーバードライブ</h1>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
        全8章の壮大な青春ストーリー！進路・恋愛・研究・社会人生活まで
      </p>
      <GameMain />
    </main>
  );
}
