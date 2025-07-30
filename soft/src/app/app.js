// app.js
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/app", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ゲーム画面</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background: #f4f4f4;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .game-container {
          text-align: center;
          background: white;
          padding: 20px 40px;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .back-btn {
          margin-top: 20px;
          display: inline-block;
          padding: 8px 16px;
          background: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 6px;
        }
        .back-btn:hover {
          background: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="game-container">
        <h1>ゲーム画面（仮）</h1>
        <p>ここにNPCや好感度のUIを表示予定。</p>
        <a class="back-btn" href="/">← タイトルへ戻る</a>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`running on http://localhost:${PORT}`);
});
