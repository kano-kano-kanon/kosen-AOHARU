const GameEngine = {
  init(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "lightblue";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("ゲーム開始！", 50, 50);
  },
};

export default GameEngine;
