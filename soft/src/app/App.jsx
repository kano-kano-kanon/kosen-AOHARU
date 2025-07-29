import React, { useState } from "react";
import TitleScreen from "../game/components/TitleScreen";
import GameMain from "../game/components/GameMain";

const App = () => {
  const [isStarted, setIsStarted] = useState(false);

  return (
    <div className="container">
      {isStarted ? (
        <GameMain />
      ) : (
        <TitleScreen onStart={() => setIsStarted(true)} />
      )}
    </div>
  );
};

export default App;
