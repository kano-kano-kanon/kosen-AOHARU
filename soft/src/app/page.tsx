'use client';
import React, { useState } from 'react';
import TitleScreen from '../game/components/TitleScreen';
import GameMain from '../game/components/GameMain';

export default function Page() {
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = () => {
    console.log('ゲーム開始ボタンがクリックされました');
    setIsStarted(true);
  };

  console.log('現在の状態:', { isStarted });

  return (
    <main>
      {isStarted ? (
        <GameMain />
      ) : (
        <TitleScreen onStart={handleStart} />
      )}
    </main>
  );
}
