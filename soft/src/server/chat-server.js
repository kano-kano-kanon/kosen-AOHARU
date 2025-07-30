/**
 * リアルタイムチャットサーバー
 * WebSocketを使用した本格的なマルチプレイヤー通信
 */

const { Server } = require('socket.io');
const { createServer } = require('http');

class ChatServer {
  constructor(port = 3001) {
    this.port = port;
    this.connectedUsers = new Map(); // socketId -> userInfo
    this.chatRooms = new Map(); // roomId -> { users: Set, messages: [] }
    this.bannedUsers = new Set();
    this.messageHistory = [];
    this.maxMessages = 1000;
    
    this.setupServer();
  }

  setupServer() {
    // HTTPサーバーを作成
    this.httpServer = createServer();
    
    // Socket.IOサーバーを作成
    this.io = new Server(this.httpServer, {
      cors: {
        origin: ["http://localhost:3000", "https://localhost:3000"],
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`新しいユーザーが接続しました: ${socket.id}`);

      // ユーザー参加処理
      socket.on('join_chat', (userData) => {
        this.handleUserJoin(socket, userData);
      });

      // メッセージ送信処理
      socket.on('send_message', (messageData) => {
        this.handleMessage(socket, messageData);
      });

      // ユーザー名変更処理
      socket.on('change_username', (newUsername) => {
        this.handleUsernameChange(socket, newUsername);
      });

      // プライベートメッセージ
      socket.on('send_private_message', (data) => {
        this.handlePrivateMessage(socket, data);
      });

      // メッセージ報告
      socket.on('report_message', (messageId) => {
        this.handleMessageReport(socket, messageId);
      });

      // ユーザーブロック（管理者のみ）
      socket.on('block_user', (userId) => {
        this.handleUserBlock(socket, userId);
      });

      // 切断処理
      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket);
      });

      // タイピング状態
      socket.on('typing_start', () => {
        this.handleTyping(socket, true);
      });

      socket.on('typing_stop', () => {
        this.handleTyping(socket, false);
      });
    });
  }

  handleUserJoin(socket, userData) {
    // ユーザー情報を保存
    const userInfo = {
      id: socket.id,
      username: userData.username || this.generateRandomUsername(),
      isAdmin: userData.isAdmin || false,
      joinTime: new Date(),
      lastActivity: new Date(),
      isTyping: false
    };

    this.connectedUsers.set(socket.id, userInfo);

    // 全体ルームに参加
    socket.join('general');

    // 既存のメッセージ履歴を送信（最新50件）
    const recentMessages = this.messageHistory.slice(-50);
    socket.emit('message_history', recentMessages);

    // オンラインユーザーリストを送信
    socket.emit('online_users', this.getOnlineUsersList());

    // 他のユーザーに参加通知
    socket.to('general').emit('user_joined', {
      username: userInfo.username,
      userId: socket.id,
      timestamp: new Date()
    });

    // 参加成功を通知
    socket.emit('join_success', {
      userId: socket.id,
      username: userInfo.username,
      message: 'チャットに参加しました'
    });

    console.log(`${userInfo.username} がチャットに参加しました`);
  }

  handleMessage(socket, messageData) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    // バンされたユーザーはメッセージ送信不可
    if (this.bannedUsers.has(socket.id)) {
      socket.emit('error', { message: 'あなたはチャットから一時的にブロックされています' });
      return;
    }

    // メッセージ検証
    if (!messageData.content || messageData.content.trim().length === 0) {
      socket.emit('error', { message: 'メッセージが空です' });
      return;
    }

    if (messageData.content.length > 500) {
      socket.emit('error', { message: 'メッセージが長すぎます（最大500文字）' });
      return;
    }

    // 不適切な内容をフィルタリング
    const filteredContent = this.filterMessage(messageData.content);

    // メッセージオブジェクトを作成
    const message = {
      id: this.generateMessageId(),
      senderId: socket.id,
      senderName: user.username,
      content: filteredContent,
      timestamp: new Date(),
      isAdmin: user.isAdmin,
      type: 'public'
    };

    // メッセージ履歴に追加
    this.messageHistory.push(message);

    // 履歴サイズ制限
    if (this.messageHistory.length > this.maxMessages) {
      this.messageHistory = this.messageHistory.slice(-this.maxMessages);
    }

    // 全ユーザーにメッセージを配信
    this.io.to('general').emit('new_message', message);

    // ユーザーアクティビティを更新
    user.lastActivity = new Date();

    console.log(`${user.username}: ${filteredContent}`);
  }

  handleUsernameChange(socket, newUsername) {
    const user = this.connectedUsers.get(socket.id);
    if (!user || user.isAdmin) return; // 管理者は名前変更不可

    // 名前検証
    if (!newUsername || newUsername.trim().length === 0) {
      socket.emit('error', { message: '名前が空です' });
      return;
    }

    if (newUsername.length > 20) {
      socket.emit('error', { message: '名前が長すぎます（最大20文字）' });
      return;
    }

    // 名前の重複チェック
    const existingUser = Array.from(this.connectedUsers.values())
      .find(u => u.username === newUsername && u.id !== socket.id);
    
    if (existingUser) {
      socket.emit('error', { message: 'その名前は既に使用されています' });
      return;
    }

    const oldUsername = user.username;
    user.username = newUsername;

    // 名前変更を通知
    this.io.to('general').emit('username_changed', {
      userId: socket.id,
      oldUsername: oldUsername,
      newUsername: newUsername,
      timestamp: new Date()
    });

    socket.emit('username_change_success', {
      newUsername: newUsername,
      message: `名前を「${newUsername}」に変更しました`
    });

    console.log(`${oldUsername} が ${newUsername} に名前を変更しました`);
  }

  handlePrivateMessage(socket, data) {
    const sender = this.connectedUsers.get(socket.id);
    const recipient = this.connectedUsers.get(data.recipientId);

    if (!sender || !recipient) {
      socket.emit('error', { message: '送信先ユーザーが見つかりません' });
      return;
    }

    const message = {
      id: this.generateMessageId(),
      senderId: socket.id,
      senderName: sender.username,
      recipientId: data.recipientId,
      recipientName: recipient.username,
      content: this.filterMessage(data.content),
      timestamp: new Date(),
      type: 'private'
    };

    // 送信者と受信者にのみメッセージを送信
    socket.emit('private_message', message);
    socket.to(data.recipientId).emit('private_message', message);

    console.log(`プライベートメッセージ: ${sender.username} -> ${recipient.username}`);
  }

  handleMessageReport(socket, messageId) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    // 管理者に報告を通知
    const adminUsers = Array.from(this.connectedUsers.entries())
      .filter(([id, user]) => user.isAdmin);

    adminUsers.forEach(([adminId, admin]) => {
      this.io.to(adminId).emit('message_reported', {
        messageId: messageId,
        reportedBy: user.username,
        timestamp: new Date()
      });
    });

    socket.emit('report_success', { message: 'メッセージを報告しました' });

    console.log(`メッセージ報告: ${messageId} by ${user.username}`);
  }

  handleUserBlock(socket, userId) {
    const admin = this.connectedUsers.get(socket.id);
    if (!admin || !admin.isAdmin) {
      socket.emit('error', { message: '管理者権限が必要です' });
      return;
    }

    const targetUser = this.connectedUsers.get(userId);
    if (!targetUser) {
      socket.emit('error', { message: 'ユーザーが見つかりません' });
      return;
    }

    this.bannedUsers.add(userId);

    // ブロックされたユーザーに通知
    this.io.to(userId).emit('user_blocked', {
      message: 'あなたは一時的にチャットからブロックされました'
    });

    socket.emit('block_success', {
      message: `${targetUser.username}をブロックしました`
    });

    console.log(`${admin.username} が ${targetUser.username} をブロックしました`);
  }

  handleUserDisconnect(socket) {
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      // 他のユーザーに退出通知
      socket.to('general').emit('user_left', {
        username: user.username,
        userId: socket.id,
        timestamp: new Date()
      });

      this.connectedUsers.delete(socket.id);
      this.bannedUsers.delete(socket.id);

      console.log(`${user.username} がチャットから退出しました`);
    }
  }

  handleTyping(socket, isTyping) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    user.isTyping = isTyping;

    socket.to('general').emit('user_typing', {
      userId: socket.id,
      username: user.username,
      isTyping: isTyping
    });
  }

  // ユーティリティメソッド
  generateRandomUsername() {
    const adjectives = ['元気な', 'クールな', '優秀な', '明るい', '真面目な'];
    const nouns = ['高専生', 'エンジニア', '学生', 'プログラマー', '研究者'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 999) + 1;
    return `${adj}${noun}${num}`;
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  filterMessage(content) {
    // 基本的な不適切語フィルタリング
    const bannedWords = ['spam', '荒らし', '不適切'];
    let filtered = content;
    
    bannedWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    });

    return filtered;
  }

  getOnlineUsersList() {
    return Array.from(this.connectedUsers.values()).map(user => ({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      isTyping: user.isTyping,
      joinTime: user.joinTime
    }));
  }

  start() {
    this.httpServer.listen(this.port, () => {
      console.log(`🚀 チャットサーバーが http://localhost:${this.port} で起動しました`);
      console.log('💬 リアルタイムマルチプレイヤーチャットシステム稼働中');
    });
  }

  stop() {
    this.httpServer.close();
    console.log('チャットサーバーが停止しました');
  }
}

module.exports = ChatServer;
