#!/usr/bin/env node

/**
 * 本番環境用サーバー起動スクリプト
 * Next.jsアプリとチャットサーバーを同時に起動し、常時稼働させる
 */

const { spawn } = require('child_process');
const path = require('path');

class ProductionServer {
  constructor() {
    this.processes = [];
    this.isShuttingDown = false;
  }

  start() {
    console.log('🚀 本番サーバーを起動しています...');
    
    // Next.jsアプリを起動 (ポート3000)
    this.startNextApp();
    
    // チャットサーバーを起動 (ポート3005)
    this.startChatServer();
    
    // プロセス終了時のクリーンアップ
    this.setupCleanup();
    
    console.log('✅ 全てのサーバーが起動完了しました');
    console.log('📡 Next.js App: http://localhost:3000');
    console.log('💬 Chat Server: ws://localhost:3005');
  }

  startNextApp() {
    console.log('🌐 Next.jsアプリを起動中...');
    const nextProcess = spawn('npm', ['run', 'start'], {
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: '3000',
        NODE_ENV: 'production'
      }
    });

    nextProcess.stdout.on('data', (data) => {
      console.log(`[Next.js] ${data.toString().trim()}`);
    });

    nextProcess.stderr.on('data', (data) => {
      console.error(`[Next.js Error] ${data.toString().trim()}`);
    });

    nextProcess.on('close', (code) => {
      if (!this.isShuttingDown) {
        console.error(`❌ Next.jsプロセスが終了しました (コード: ${code})`);
        // 自動再起動
        setTimeout(() => this.startNextApp(), 5000);
      }
    });

    this.processes.push(nextProcess);
  }

  startChatServer() {
    console.log('💬 チャットサーバーを起動中...');
    const chatProcess = spawn('node', ['chat-server.js'], {
      stdio: 'pipe'
    });

    chatProcess.stdout.on('data', (data) => {
      console.log(`[Chat] ${data.toString().trim()}`);
    });

    chatProcess.stderr.on('data', (data) => {
      console.error(`[Chat Error] ${data.toString().trim()}`);
    });

    chatProcess.on('close', (code) => {
      if (!this.isShuttingDown) {
        console.error(`❌ チャットサーバープロセスが終了しました (コード: ${code})`);
        // 自動再起動
        setTimeout(() => this.startChatServer(), 5000);
      }
    });

    this.processes.push(chatProcess);
  }

  setupCleanup() {
    const cleanup = () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      
      console.log('\n🛑 サーバーを停止しています...');
      
      this.processes.forEach((process, index) => {
        if (process && !process.killed) {
          console.log(`プロセス ${index + 1} を終了中...`);
          process.kill('SIGTERM');
        }
      });

      setTimeout(() => {
        process.exit(0);
      }, 3000);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', (error) => {
      console.error('未処理のエラー:', error);
      cleanup();
    });
  }
}

// サーバー起動
const server = new ProductionServer();
server.start();
