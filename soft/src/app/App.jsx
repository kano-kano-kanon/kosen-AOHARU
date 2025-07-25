import React, { useState } from "react";
import TitleScreen from "./components/TitleScreen";
import GameMain from "./components/GameMain";

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
