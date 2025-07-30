import React, { useState, useEffect, useRef } from 'react';
import { getChatClient } from '../../lib/chat-client.js';

/**
 * リアルタイムマルチプレイヤーチャットコンポーネント
 * WebSocketを使用した本格的なプレイヤー間通信
 */
export default function PlayerChat({ gameState, onActionMessage }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [currentPlayerName, setCurrentPlayerName] = useState('');
  const [showNameChange, setShowNameChange] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatClient = useRef(null);
  const typingTimeoutRef = useRef(null);

  // WebSocketチャットクライアント初期化
  useEffect(() => {
    chatClient.current = getChatClient();

    // 接続状態の監視
    const unsubscribeConnection = chatClient.current.onConnectionChange((status, message) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        if (onActionMessage) {
          onActionMessage('✅ チャットサーバーに接続しました');
        }
        // チャットに参加
        chatClient.current.joinChat({
          username: gameState.isAdmin ? '管理者' : null,
          isAdmin: gameState.isAdmin
        });
      } else if (status === 'disconnected') {
        if (onActionMessage) {
          onActionMessage('❌ チャットサーバーから切断されました');
        }
      } else if (status === 'error') {
        if (onActionMessage) {
          onActionMessage(`❌ 接続エラー: ${message}`);
        }
      }
    });

    // メッセージイベントの監視
    const unsubscribeMessages = chatClient.current.onMessage((type, data) => {
      switch (type) {
        case 'history':
          setMessages(data.messages || []);
          break;
          
        case 'new_message':
          setMessages(prev => [...prev, data]);
          break;
          
        case 'private_message':
          setMessages(prev => [...prev, data]);
          break;
          
        case 'user_joined':
          if (onActionMessage) {
            onActionMessage(`👋 ${data.username} がチャットに参加しました`);
          }
          break;
          
        case 'user_left':
          if (onActionMessage) {
            onActionMessage(`👋 ${data.username} がチャットから退出しました`);
          }
          break;
          
        case 'username_changed':
          if (onActionMessage) {
            onActionMessage(`✏️ ${data.oldUsername} が ${data.newUsername} に名前を変更しました`);
          }
          break;
          
        case 'online_users':
          setOnlineUsers(data.users || []);
          break;
          
        case 'typing_update':
          setTypingUsers(data.typingUsers || []);
          break;
          
        case 'username_change_success':
          setCurrentPlayerName(data.newUsername);
          setShowNameChange(false);
          setNewPlayerName('');
          if (onActionMessage) {
            onActionMessage(data.message);
          }
          break;
          
        case 'error':
          if (onActionMessage) {
            onActionMessage(`❌ ${data.message}`);
          }
          break;
          
        case 'report_success':
        case 'block_success':
          if (onActionMessage) {
            onActionMessage(`✅ ${data.message}`);
          }
          break;
          
        default:
          console.log('未処理のメッセージタイプ:', type, data);
      }
    });

    // クリーンアップ
    return () => {
      unsubscribeConnection();
      unsubscribeMessages();
    };
  }, [gameState.isAdmin, onActionMessage]);

  // 現在のユーザー名を更新
  useEffect(() => {
    const user = chatClient.current?.getCurrentUser();
    if (user) {
      setCurrentPlayerName(user.username);
    }
  }, [connectionStatus]);

  // 自動スクロール
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // スクロール位置監視
  const handleScroll = (e) => {
    const container = e.target;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
    setAutoScroll(isAtBottom);
  };

  // メッセージ送信
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || connectionStatus !== 'connected') return;

    setIsLoading(true);
    
    try {
      await chatClient.current.sendMessage(inputMessage.trim());
      setInputMessage('');
      
      // タイピング停止
      if (isTyping) {
        chatClient.current.stopTyping();
        setIsTyping(false);
      }
      
      if (onActionMessage) {
        onActionMessage('📤 メッセージを送信しました');
      }
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      if (onActionMessage) {
        onActionMessage(`❌ ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 入力変更時の処理
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // タイピング状態の管理
    if (connectionStatus === 'connected') {
      if (!isTyping && e.target.value.trim()) {
        chatClient.current.startTyping();
        setIsTyping(true);
      }
      
      // タイピング停止のタイマーリセット
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          chatClient.current.stopTyping();
          setIsTyping(false);
        }
      }, 1000);
    }
  };

  // エンターキーでメッセージ送信
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // メッセージ報告
  const reportMessage = (messageId) => {
    try {
      chatClient.current.reportMessage(messageId);
    } catch (error) {
      if (onActionMessage) {
        onActionMessage(`❌ ${error.message}`);
      }
    }
  };

  // ユーザー名変更
  const changePlayerName = () => {
    if (!newPlayerName.trim()) {
      if (onActionMessage) {
        onActionMessage('❌ 名前を入力してください');
      }
      return;
    }

    try {
      chatClient.current.changeUsername(newPlayerName.trim());
    } catch (error) {
      if (onActionMessage) {
        onActionMessage(`❌ ${error.message}`);
      }
    }
  };

  // 時刻フォーマット
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // チャット機能が無効な場合
  if (!gameState.isFeatureEnabled('playerChat')) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: '#f8f9fa',
        borderRadius: 8,
        color: '#6c757d'
      }}>
        <h3>💬 プレイヤーチャット</h3>
        <p>チャット機能は現在無効になっています。</p>
       </div>
    );
  }

  // 接続状態の表示
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connecting':
        return { text: '🔄 接続中...', color: '#ffc107' };
      case 'connected':
        return { text: '🟢 オンライン', color: '#28a745' };
      case 'disconnected':
        return { text: '🔴 切断', color: '#dc3545' };
      case 'error':
        return { text: '⚠️ エラー', color: '#fd7e14' };
      default:
        return { text: '❓ 不明', color: '#6c757d' };
    }
  };

  const connectionDisplay = getConnectionStatusDisplay();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '1rem',
        borderBottom: '2px solid #e2e8f0',
        background: '#f8f9fa'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <h3 style={{ margin: '0', color: '#2d3748' }}>
            💬 リアルタイムチャット
          </h3>
          
          {/* 接続状態とオンラインユーザー数 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ 
              fontSize: '0.8rem', 
              color: connectionDisplay.color,
              fontWeight: 'bold'
            }}>
              {connectionDisplay.text}
            </span>
            {connectionStatus === 'connected' && (
              <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                👥 オンライン: {onlineUsers.length}人
              </span>
            )}
          </div>
        </div>
        
        {/* 現在のユーザー名表示と変更ボタン */}
        {connectionStatus === 'connected' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                現在の名前: <strong style={{ color: '#2d3748' }}>{currentPlayerName}</strong>
              </span>
              {!gameState.isAdmin && (
                <button
                  onClick={() => {
                    setShowNameChange(!showNameChange);
                    setNewPlayerName('');
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  名前変更
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* 名前変更フォーム */}
        {showNameChange && !gameState.isAdmin && (
          <div style={{
            background: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: 4,
            padding: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="新しい名前を入力 (最大20文字)"
                maxLength={20}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: '0.9rem'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    changePlayerName();
                  }
                }}
              />
              <button
                onClick={changePlayerName}
                disabled={!newPlayerName.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  background: newPlayerName.trim() ? '#28a745' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: newPlayerName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '0.8rem'
                }}
              >
                変更
              </button>
              <button
                onClick={() => {
                  setShowNameChange(false);
                  setNewPlayerName('');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                キャンセル
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
              {newPlayerName.length}/20文字
            </div>
          </div>
        )}
        
        {/* タイピング表示 */}
        {typingUsers.length > 0 && (
          <div style={{
            background: '#e8f4fd',
            border: '1px solid #bee5eb',
            borderRadius: 4,
            padding: '0.5rem',
            fontSize: '0.85rem',
            color: '#0c5460',
            marginBottom: '0.5rem'
          }}>
            ✏️ {typingUsers.join(', ')} がタイピング中...
          </div>
        )}
        
        <div style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.5rem' }}>
          {connectionStatus === 'connected' 
            ? 'リアルタイムでプレイヤーと会話できます' 
            : 'サーバーに接続してチャットを開始してください'
          }
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          background: '#ffffff'
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#6c757d',
            padding: '2rem'
          }}>
            {connectionStatus === 'connected' ? (
              <>
                まだメッセージがありません。<br />
                最初のメッセージを送信してみましょう！
              </>
            ) : (
              <>
                サーバーに接続中です...<br />
                しばらくお待ちください。
              </>
            )}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={msg.id} 
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                background: msg.isAdmin ? '#fff3cd' : '#f8f9fa',
                border: `1px solid ${msg.isAdmin ? '#ffeaa7' : '#e9ecef'}`,
                borderRadius: 8,
                borderLeft: `4px solid ${msg.isAdmin ? '#fd7e14' : (msg.type === 'private' ? '#dc3545' : '#6c757d')}`
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    fontWeight: 'bold',
                    color: msg.isAdmin ? '#fd7e14' : '#495057'
                  }}>
                    {msg.isAdmin ? '👑 ' : ''}{msg.senderName}
                  </span>
                  {msg.type === 'private' && (
                    <span style={{
                      background: '#dc3545',
                      color: 'white',
                      padding: '0.125rem 0.375rem',
                      borderRadius: 12,
                      fontSize: '0.75rem'
                    }}>
                      DM
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
              
              <div style={{
                color: '#212529',
                lineHeight: 1.4,
                marginBottom: '0.5rem'
              }}>
                {msg.content || msg.message}
              </div>
              
              {/* 報告ボタン（自分のメッセージ以外） */}
              {!msg.isAdmin && chatClient.current?.getCurrentUser()?.id !== msg.senderId && (
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => reportMessage(msg.id)}
                    style={{
                      background: 'none',
                      border: '1px solid #dc3545',
                      color: '#dc3545',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    🚨 報告
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* スクロール制御ボタン */}
      {!autoScroll && (
        <div style={{
          padding: '0.5rem',
          textAlign: 'center',
          background: '#e3f2fd'
        }}>
          <button
            onClick={() => {
              setAutoScroll(true);
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              background: '#2196f3',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            ⬇️ 最新メッセージまでスクロール
          </button>
        </div>
      )}

      {/* メッセージ入力エリア */}
      <div style={{
        padding: '1rem',
        borderTop: '2px solid #e2e8f0',
        background: '#f8f9fa'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1 }}>
            <textarea
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={connectionStatus === 'connected' 
                ? "メッセージを入力してください... (最大500文字)" 
                : "サーバーに接続中..."
              }
              disabled={isLoading || connectionStatus !== 'connected'}
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: 6,
                fontSize: '0.9rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                opacity: connectionStatus === 'connected' ? 1 : 0.6
              }}
              maxLength={500}
            />
            <div style={{
              fontSize: '0.75rem',
              color: '#6c757d',
              textAlign: 'right',
              marginTop: '0.25rem'
            }}>
              {inputMessage.length}/500
            </div>
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || connectionStatus !== 'connected'}
            style={{
              padding: '0.75rem 1.5rem',
              background: (!inputMessage.trim() || isLoading || connectionStatus !== 'connected') ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: (!inputMessage.trim() || isLoading || connectionStatus !== 'connected') ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              minHeight: '60px'
            }}
          >
            {isLoading ? '送信中...' : (connectionStatus === 'connected' ? '📤 送信' : '⏳ 接続中')}
          </button>
        </div>
        
        <div style={{
          fontSize: '0.75rem',
          color: '#6c757d',
          marginTop: '0.5rem'
        }}>
          {connectionStatus === 'connected' ? (
            <>💡 Enterキーで送信 | 不適切なメッセージは報告できます</>
          ) : (
            <>🔄 リアルタイムチャットサーバーに接続中です...</>
          )}
        </div>
      </div>
    </div>
  );
}
