/**
 * チャットサーバー起動スクリプト
 */

const ChatServer = require('./src/server/chat-server.js');

const server = new ChatServer(5000);

// サーバー起動
server.start();

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  console.log('\nサーバーを停止しています...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nサーバーを停止しています...');
  server.stop();
  process.exit(0);
});
