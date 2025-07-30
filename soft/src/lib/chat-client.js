/**
 * リアルタイムチャットクライアント
 * Socket.IOを使用したWebSocket通信管理
 */

import { io } from 'socket.io-client';

class ChatClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentUser = null;
    this.messageCallbacks = new Set();
    this.connectionCallbacks = new Set();
    this.onlineUsers = [];
    this.typingUsers = new Set();
    
    this.initializeConnection();
  }

  initializeConnection() {
    const SERVER_URL = 'http://localhost:5000';
    
    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // 接続イベント
    this.socket.on('connect', () => {
      console.log('チャットサーバーに接続しました');
      this.isConnected = true;
      this.notifyConnectionChange('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('チャットサーバーから切断されました');
      this.isConnected = false;
      this.notifyConnectionChange('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('接続エラー:', error);
      this.notifyConnectionChange('error', error.message);
    });

    // チャットイベント
    this.socket.on('join_success', (data) => {
      this.currentUser = data;
      console.log('チャット参加成功:', data);
    });

    this.socket.on('message_history', (messages) => {
      this.notifyMessage('history', { messages });
    });

    this.socket.on('new_message', (message) => {
      this.notifyMessage('new_message', message);
    });

    this.socket.on('private_message', (message) => {
      this.notifyMessage('private_message', message);
    });

    // ユーザーイベント
    this.socket.on('user_joined', (userData) => {
      this.notifyMessage('user_joined', userData);
    });

    this.socket.on('user_left', (userData) => {
      this.notifyMessage('user_left', userData);
    });

    this.socket.on('username_changed', (data) => {
      this.notifyMessage('username_changed', data);
    });

    this.socket.on('online_users', (users) => {
      this.onlineUsers = users;
      this.notifyMessage('online_users', { users });
    });

    // タイピングイベント
    this.socket.on('user_typing', (data) => {
      if (data.isTyping) {
        this.typingUsers.add(data.username);
      } else {
        this.typingUsers.delete(data.username);
      }
      this.notifyMessage('typing_update', { 
        username: data.username, 
        isTyping: data.isTyping,
        typingUsers: Array.from(this.typingUsers)
      });
    });

    // 管理系イベント
    this.socket.on('message_reported', (data) => {
      this.notifyMessage('message_reported', data);
    });

    this.socket.on('user_blocked', (data) => {
      this.notifyMessage('user_blocked', data);
    });

    // エラーイベント
    this.socket.on('error', (error) => {
      this.notifyMessage('error', error);
    });

    // 成功イベント
    this.socket.on('username_change_success', (data) => {
      this.currentUser.username = data.newUsername;
      this.notifyMessage('username_change_success', data);
    });

    this.socket.on('report_success', (data) => {
      this.notifyMessage('report_success', data);
    });

    this.socket.on('block_success', (data) => {
      this.notifyMessage('block_success', data);
    });
  }

  // チャット参加
  joinChat(userData = {}) {
    if (!this.isConnected) {
      throw new Error('サーバーに接続されていません');
    }

    const joinData = {
      username: userData.username || null,
      isAdmin: userData.isAdmin || false,
      ...userData
    };

    this.socket.emit('join_chat', joinData);
  }

  // メッセージ送信
  sendMessage(content) {
    if (!this.isConnected) {
      throw new Error('サーバーに接続されていません');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('メッセージが空です');
    }

    this.socket.emit('send_message', { content: content.trim() });
  }

  // プライベートメッセージ送信
  sendPrivateMessage(recipientId, content) {
    if (!this.isConnected) {
      throw new Error('サーバーに接続されていません');
    }

    this.socket.emit('send_private_message', {
      recipientId,
      content: content.trim()
    });
  }

  // ユーザー名変更
  changeUsername(newUsername) {
    if (!this.isConnected) {
      throw new Error('サーバーに接続されていません');
    }

    this.socket.emit('change_username', newUsername.trim());
  }

  // メッセージ報告
  reportMessage(messageId) {
    if (!this.isConnected) {
      throw new Error('サーバーに接続されていません');
    }

    this.socket.emit('report_message', messageId);
  }

  // ユーザーブロック（管理者のみ）
  blockUser(userId) {
    if (!this.isConnected) {
      throw new Error('サーバーに接続されていません');
    }

    this.socket.emit('block_user', userId);
  }

  // タイピング状態送信
  startTyping() {
    if (this.isConnected) {
      this.socket.emit('typing_start');
    }
  }

  stopTyping() {
    if (this.isConnected) {
      this.socket.emit('typing_stop');
    }
  }

  // イベントリスナー管理
  onMessage(callback) {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onConnectionChange(callback) {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  // 内部通知メソッド
  notifyMessage(type, data) {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('メッセージコールバックエラー:', error);
      }
    });
  }

  notifyConnectionChange(status, message = null) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(status, message);
      } catch (error) {
        console.error('接続コールバックエラー:', error);
      }
    });
  }

  // ゲッター
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getOnlineUsers() {
    return this.onlineUsers;
  }

  getTypingUsers() {
    return Array.from(this.typingUsers);
  }

  // 切断
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentUser = null;
  }

  // 再接続
  reconnect() {
    this.disconnect();
    this.initializeConnection();
  }
}

// シングルトンインスタンス
let chatClientInstance = null;

export const getChatClient = () => {
  if (!chatClientInstance) {
    chatClientInstance = new ChatClient();
  }
  return chatClientInstance;
};

export default ChatClient;
