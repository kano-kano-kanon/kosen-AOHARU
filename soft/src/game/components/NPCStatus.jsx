import React from 'react';

/**
 * NPCステータス表示コンポーネント
 * 設計資料に基づくNPC好感度システムを実装
 */
export default function NPCStatus({ npcs, onInteract, playerSP }) {
  const getAffectionLevel = (affection) => {
    if (affection >= 100) return { level: '最高', color: '#d69e2e', icon: '💖' };
    if (affection >= 64) return { level: '親密', color: '#38a169', icon: '💕' };
    if (affection >= 32) return { level: '友好', color: '#3182ce', icon: '😊' };
    if (affection >= 16) return { level: '普通', color: '#718096', icon: '🙂' };
    return { level: '知人', color: '#a0aec0', icon: '😐' };
  };

  const getCategoryInfo = (category) => {
    const categories = {
      professor: { label: '教授', color: '#9f7aea', icon: '👨‍🏫' },
      classmate: { label: 'クラスメイト', color: '#3182ce', icon: '👥' },
      senior: { label: '先輩', color: '#38b2ac', icon: '🎓' },
      romantic: { label: '恋愛対象', color: '#fc8181', icon: '💝' }
    };
    return categories[category] || { label: 'その他', color: '#718096', icon: '👤' };
  };

  // 旧形式の props への対応
  if (!npcs && typeof favor !== 'undefined') {
    return (
      <div className="npc-status">
        <h2>NPC好感度</h2>
        <div className="bar-container">
          <div
            className="bar"
            style={{ width: `${(favor / 128) * 100}%` }}
          ></div>
        </div>
        <p>{favor} / 128</p>
      </div>
    );
  }

  if (!npcs) {
    return <div>NPCデータを読み込み中...</div>;
  }

  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>NPC関係図</h3>
      
      <div style={{ 
        display: 'grid', 
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
      }}>
        {Object.values(npcs).map((npc) => {
          const affectionLevel = getAffectionLevel(npc.affection);
          const categoryInfo = getCategoryInfo(npc.category);
          
          return (
            <div key={npc.name} style={{
              background: 'linear-gradient(135deg, #fff 0%, #f7fafc 100%)',
              border: `2px solid ${categoryInfo.color}`,
              borderRadius: 12,
              padding: '1.5rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* カテゴリバッジ */}
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: categoryInfo.color,
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: 4,
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {categoryInfo.icon} {categoryInfo.label}
              </div>

              {/* NPC情報 */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: '#2d3748',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {affectionLevel.icon} {npc.name}
                </h4>
                <p style={{ 
                  margin: 0, 
                  color: '#4a5568', 
                  fontSize: '0.875rem',
                  lineHeight: 1.4
                }}>
                  {npc.description}
                </p>
              </div>

              {/* 好感度表示 */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#2d3748' }}>
                    好感度
                  </span>
                  <span style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 'bold',
                    color: affectionLevel.color
                  }}>
                    {npc.affection}/128 ({affectionLevel.level})
                  </span>
                </div>
                
                {/* 好感度バー */}
                <div style={{
                  width: '100%',
                  height: '10px',
                  background: '#e2e8f0',
                  borderRadius: 5,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(npc.affection / npc.maxAffection) * 100}%`,
                    height: '100%',
                    background: affectionLevel.color,
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                {/* 次の閾値まで */}
                {(() => {
                  const thresholds = [16, 32, 64, 100, 128];
                  const nextThreshold = thresholds.find(t => t > npc.affection);
                  if (nextThreshold) {
                    return (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#718096',
                        marginTop: '0.25rem'
                      }}>
                        次のレベルまで: {nextThreshold - npc.affection}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* スキル情報 */}
              {npc.skills && npc.skills.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 'bold', 
                    color: '#2d3748',
                    marginBottom: '0.25rem'
                  }}>
                    習得可能スキル:
                  </div>
                  {npc.skills.map((skill, index) => (
                    <div key={index} style={{
                      background: npc.affection >= 64 ? '#e6fffa' : '#f7fafc',
                      border: `1px solid ${npc.affection >= 64 ? '#38b2ac' : '#e2e8f0'}`,
                      borderRadius: 4,
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      color: npc.affection >= 64 ? '#2d3748' : '#718096',
                      marginBottom: '0.25rem',
                      position: 'relative'
                    }}>
                      {skill}
                      {npc.affection < 64 && (
                        <span style={{ 
                          position: 'absolute', 
                          right: '0.25rem',
                          opacity: 0.7 
                        }}>
                          🔒
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 交流ボタン */}
              <button
                onClick={() => onInteract && onInteract(npc.name)}
                disabled={!onInteract || (playerSP && playerSP < 5)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: 6,
                  background: (!onInteract || (playerSP && playerSP < 5)) ? '#e2e8f0' : categoryInfo.color,
                  color: (!onInteract || (playerSP && playerSP < 5)) ? '#a0aec0' : 'white',
                  fontWeight: 'bold',
                  cursor: (!onInteract || (playerSP && playerSP < 5)) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: (!onInteract || (playerSP && playerSP < 5)) ? 0.6 : 1
                }}
              >
                {!onInteract ? '交流機能なし' : 
                 playerSP && playerSP < 5 ? 'SP不足' : '交流する (SP -5)'}
              </button>
            </div>
          );
        })}
      </div>

      {/* 好感度システム説明 */}
      <div style={{
        marginTop: '2rem',
        background: '#f7fafc',
        border: '2px solid #e2e8f0',
        borderRadius: 8,
        padding: '1rem'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>好感度システム</h4>
        <div style={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: 1.4 }}>
          <div style={{ marginBottom: '0.25rem' }}>
            <strong>16:</strong> 提出成功率+3%、会話パターン増加
          </div>
          <div style={{ marginBottom: '0.25rem' }}>
            <strong>32:</strong> 特殊会話イベント解放
          </div>
          <div style={{ marginBottom: '0.25rem' }}>
            <strong>64:</strong> 固有スキルや特殊支援解放
          </div>
          <div style={{ marginBottom: '0.25rem' }}>
            <strong>100:</strong> ルート確定・特別エンド条件
          </div>
          <div>
            <strong>128:</strong> 隠しイベント（極秘ルート）
          </div>
        </div>
      </div>
    </div>
  );
}
