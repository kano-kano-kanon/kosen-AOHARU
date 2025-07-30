'use client';
import React, { useState } from 'react';
import TitleScreen from '../game/components/TitleScreen';
import GameMain from '../game/components/GameMain';

export default function Page() {
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = () => {
    console.log('push.start button');
    setIsStarted(true);
  };

  console.log('state:', { isStarted });

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
