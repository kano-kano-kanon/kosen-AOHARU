import React, { useEffect } from "react";
import GameEngine from "../core/GameEngine";

const GameUI = () => {
  useEffect(() => {
    const canvas = document.getElementById("gameCanvas");
    GameEngine.init(canvas);
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <canvas id="gameCanvas" width="480" height="320" style={{ border: "1px solid #000" }}></canvas>
    </div>
  );
};

export default GameUI;
