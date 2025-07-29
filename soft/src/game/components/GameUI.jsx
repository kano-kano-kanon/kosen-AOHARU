import React from 'react';

/**
 * ゲームUIコンポーネント
 * プレイヤーのステータス表示を担当
 */
export default function GameUI({ gameState }) {
  if (!gameState) {
    return <div>ゲーム状態を読み込み中...</div>;
  }

  const { playerStats } = gameState;

  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>プレイヤーステータス</h3>
      
      {/* メインステータス */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* HP */}
        <div style={{
          background: '#f7fafc',
          border: '2px solid #e2e8f0',
          borderRadius: 8,
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#2d3748' }}>HP（体力）</span>
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold',
              color: playerStats.hp > 70 ? '#38a169' : playerStats.hp > 30 ? '#d69e2e' : '#e53e3e'
            }}>
              {playerStats.hp}/100
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e2e8f0',
            borderRadius: 4,
            marginTop: '0.5rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${playerStats.hp}%`,
              height: '100%',
              background: playerStats.hp > 70 ? '#38a169' : playerStats.hp > 30 ? '#d69e2e' : '#e53e3e',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* SP */}
        <div style={{
          background: '#f7fafc',
          border: '2px solid #e2e8f0',
          borderRadius: 8,
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#2d3748' }}>SP（精神力）</span>
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold',
              color: playerStats.sp > 70 ? '#3182ce' : playerStats.sp > 30 ? '#d69e2e' : '#e53e3e'
            }}>
              {playerStats.sp}/100
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e2e8f0',
            borderRadius: 4,
            marginTop: '0.5rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${playerStats.sp}%`,
              height: '100%',
              background: playerStats.sp > 70 ? '#3182ce' : playerStats.sp > 30 ? '#d69e2e' : '#e53e3e',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      {/* 学業ステータス */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: '#2d3748' }}>学業関連ステータス</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '1rem'
        }}>
          {[
            { key: 'submission', label: '提出力', color: '#38b2ac', icon: '📝' },
            { key: 'theory', label: '理論力', color: '#9f7aea', icon: '🧠' },
            { key: 'social', label: '社交性', color: '#fc8181', icon: '🤝' }
          ].map(stat => (
            <div key={stat.key} style={{
              background: 'linear-gradient(135deg, #fff 0%, #f7fafc 100%)',
              border: `2px solid ${stat.color}`,
              borderRadius: 8,
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {stat.icon}
              </div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: stat.color,
                marginBottom: '0.25rem'
              }}>
                {playerStats[stat.key]}
              </div>
              <div style={{ color: '#4a5568', fontSize: '0.875rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ストレス・所持金 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '1rem'
      }}>
        {/* ストレス */}
        <div style={{
          background: playerStats.stress > 60 ? '#fed7d7' : '#f7fafc',
          border: `2px solid ${playerStats.stress > 60 ? '#fc8181' : '#e2e8f0'}`,
          borderRadius: 8,
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#2d3748' }}>ストレス</span>
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold',
              color: playerStats.stress > 60 ? '#e53e3e' : '#4a5568'
            }}>
              {playerStats.stress}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e2e8f0',
            borderRadius: 4,
            marginTop: '0.5rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(playerStats.stress, 100)}%`,
              height: '100%',
              background: playerStats.stress > 60 ? '#e53e3e' : '#d69e2e',
              transition: 'width 0.3s ease'
            }} />
          </div>
          {playerStats.stress > 60 && (
            <div style={{ 
              color: '#e53e3e', 
              fontSize: '0.875rem', 
              marginTop: '0.5rem',
              fontWeight: 'bold'
            }}>
              ⚠️ ストレス過多！休息が必要です
            </div>
          )}
        </div>

        {/* 所持金 */}
        <div style={{
          background: '#f7fafc',
          border: '2px solid #e2e8f0',
          borderRadius: 8,
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#2d3748' }}>所持金</span>
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold',
              color: '#d69e2e'
            }}>
              ¥{playerStats.money.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 進行状況 */}
      <div style={{
        marginTop: '2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 8,
        padding: '1rem'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>進行状況</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>第{gameState.currentChapter}章</span>
          <span>第{gameState.currentWeek}週目 / {gameState.totalWeeks}週</span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 3,
          marginTop: '0.5rem',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(gameState.currentWeek / gameState.totalWeeks) * 100}%`,
            height: '100%',
            background: 'white',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </div>
  );
}
