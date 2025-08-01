import React from 'react';

// 共通スタイル定数（軽量化）
const STYLES = {
  statCard: {
    background: '#f7fafc',
    border: '2px solid #e2e8f0',
    borderRadius: 8,
    padding: '1rem'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#e2e8f0',
    borderRadius: 4,
    marginTop: '0.5rem',
    overflow: 'hidden'
  },
  gridThree: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem'
  },
  gridTwo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem'
  }
};

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
      
      {/* レベルと経験値表示 */}
      <div style={{ 
        ...STYLES.statCard,
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>🎓 Lv.{playerStats.level || 1}</span>
          <span style={{ fontSize: '0.9rem' }}>EXP: {playerStats.experience || 0}</span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 3,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((playerStats.experience || 0) / (gameState.getRequiredExpForNextLevel ? gameState.getRequiredExpForNextLevel() : 100)) * 100}%`,
            height: '100%',
            background: 'white',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
      
      {/* メインステータス */}
      <div style={{ 
        ...STYLES.gridTwo,
        marginBottom: '2rem'
      }}>
        {/* HP */}
        <div style={STYLES.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#2d3748' }}>HP（体力）</span>
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold',
              color: playerStats.hp > 70 ? '#38a169' : playerStats.hp > 30 ? '#d69e2e' : '#e53e3e'
            }}>
              {playerStats.hp}/{playerStats.maxHP}
            </span>
          </div>
          <div style={STYLES.progressBar}>
            <div style={{
              width: `${(playerStats.hp / playerStats.maxHP) * 100}%`,
              height: '100%',
              background: playerStats.hp > 70 ? '#38a169' : playerStats.hp > 30 ? '#d69e2e' : '#e53e3e',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* SP */}
        <div style={STYLES.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#2d3748' }}>SP（精神力）</span>
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold',
              color: playerStats.sp > 70 ? '#3182ce' : playerStats.sp > 30 ? '#d69e2e' : '#e53e3e'
            }}>
              {playerStats.sp}/{playerStats.maxSP}
            </span>
          </div>
          <div style={STYLES.progressBar}>
            <div style={{
              width: `${(playerStats.sp / playerStats.maxSP) * 100}%`,
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
        <div style={STYLES.gridThree}>
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

      {/* 習得スキル表示 */}
      {gameState.playerSkills && gameState.playerSkills.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', color: '#2d3748' }}>習得スキル</h4>
          <div style={{
            background: '#f0f8f8',
            border: '2px solid #38b2ac',
            borderRadius: 8,
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {gameState.playerSkills.map((skill, index) => (
                <span key={index} style={{
                  background: '#38b2ac',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 16,
                  fontSize: '0.875rem',
                  fontWeight: 'bold'
                }}>
                  ⭐ {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ストレス・所持金 */}
      <div style={STYLES.gridTwo}>
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
          <div style={STYLES.progressBar}>
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
        <div style={STYLES.statCard}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>📚 第{gameState.currentChapter}章</span>
          <span>📅 第{gameState.currentWeek}週目 / {gameState.totalWeeks}週</span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 3,
          marginBottom: '0.5rem',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(gameState.currentWeek / gameState.totalWeeks) * 100}%`,
            height: '100%',
            background: 'white',
            transition: 'width 0.3s ease'
          }} />
        </div>
        {gameState.chapterEvents && (
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            🎯 章進行: {gameState.chapterProgress || 0}/{gameState.chapterEvents.length || 0}
            {gameState.getCurrentChapterEvent && gameState.getCurrentChapterEvent() && (
              <span style={{ marginLeft: '1rem' }}>
                次: {gameState.getCurrentChapterEvent().name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
