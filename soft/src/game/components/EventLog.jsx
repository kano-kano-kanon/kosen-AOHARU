import React from 'react';

/**
 * イベントログコンポーネント
 * ゲーム内で発生したイベントや行動の履歴を表示
 */
export default function EventLog({ events }) {
  if (!events || events.length === 0) {
    return (
      <div>
        <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>イベントログ</h3>
        <p style={{ color: '#718096' }}>まだイベントが発生していません。</p>
      </div>
    );
  }

  // 日時フォーマット関数
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // ログエントリのタイプを判定する関数
  const getLogType = (message) => {
    if (message.includes('好感度')) return 'affection';
    if (message.includes('スキル')) return 'skill';
    if (message.includes('講義') || message.includes('課題') || message.includes('研究')) return 'academic';
    if (message.includes('交流')) return 'social';
    if (message.includes('休息')) return 'rest';
    if (message.includes('バイト')) return 'work';
    return 'system';
  };

  // ログタイプに応じたスタイルを取得
  const getLogStyle = (type) => {
    const styles = {
      affection: { color: '#fc8181', icon: '💕' },
      skill: { color: '#9f7aea', icon: '⭐' },
      academic: { color: '#3182ce', icon: '📚' },
      social: { color: '#38b2ac', icon: '🤝' },
      rest: { color: '#68d391', icon: '😴' },
      work: { color: '#f6ad55', icon: '💰' },
      system: { color: '#718096', icon: 'ℹ️' }
    };
    return styles[type] || styles.system;
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>イベントログ</h3>
      
      <div style={{
        maxHeight: '500px',
        overflowY: 'auto',
        border: '2px solid #e2e8f0',
        borderRadius: 8,
        background: '#f7fafc'
      }}>
        {/* ログエントリを逆順（最新が上）で表示 */}
        {events
          .slice()
          .reverse()
          .map((event) => {
            const logType = getLogType(event.message);
            const style = getLogStyle(logType);
            
            return (
              <div
                key={event.id}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #e2e8f0',
                  background: '#fff',
                  margin: '0.5rem',
                  borderRadius: 6,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  {/* アイコン */}
                  <div style={{
                    fontSize: '1.25rem',
                    minWidth: '1.5rem',
                    textAlign: 'center'
                  }}>
                    {style.icon}
                  </div>
                  
                  {/* メッセージ内容 */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: '#2d3748',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      marginBottom: '0.25rem'
                    }}>
                      {event.message}
                    </div>
                    
                    {/* タイムスタンプ */}
                    <div style={{
                      color: '#718096',
                      fontSize: '0.75rem'
                    }}>
                      {formatTime(event.timestamp)}
                    </div>
                  </div>
                  
                  {/* ログタイプバッジ */}
                  <div style={{
                    background: style.color,
                    color: 'white',
                    padding: '0.125rem 0.5rem',
                    borderRadius: 12,
                    fontSize: '0.625rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}>
                    {logType}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      
      {/* ログ統計情報 */}
      <div style={{
        marginTop: '1rem',
        background: '#f7fafc',
        border: '2px solid #e2e8f0',
        borderRadius: 8,
        padding: '1rem'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>ログ統計</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '0.5rem',
          fontSize: '0.875rem'
        }}>
          {(() => {
            const stats = events.reduce((acc, event) => {
              const type = getLogType(event.message);
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {});
            
            return Object.entries(stats).map(([type, count]) => {
              const style = getLogStyle(type);
              return (
                <div key={type} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: style.color
                }}>
                  <span>{style.icon}</span>
                  <span style={{ textTransform: 'capitalize' }}>{type}:</span>
                  <span style={{ fontWeight: 'bold' }}>{count}</span>
                </div>
              );
            });
          })()}
        </div>
        
        <div style={{
          marginTop: '0.5rem',
          color: '#718096',
          fontSize: '0.75rem'
        }}>
          総イベント数: {events.length}
        </div>
      </div>
    </div>
  );
}
