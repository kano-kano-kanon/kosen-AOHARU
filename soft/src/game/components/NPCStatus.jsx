import React, { useState } from 'react';

/**
 * NPCステータス表示コンポーネント
 * 設計資料に基づくNPC好感度システムを実装
 */
export default function NPCStatus({ npcs, onInteract, playerSP, playerHP, gameState, onNPCEvent }) {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (npcName) => {
    setImageErrors(prev => ({ ...prev, [npcName]: true }));
  };
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

  // 一時的なデバッグ：NPCデータの確認
  /*if (process.env.NODE_ENV === 'development') {
    console.log('NPCデータ:', npcs);
    console.log('最初のNPC:', Object.values(npcs)[0]);
    Object.values(npcs).forEach(npc => {
      console.log(`${npc.name}: icon = "${npc.icon}"`);
    });
  }*/ 

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
                {/* NPCアイコン画像 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  {/* デバッグ情報表示 */}
                  {/*<div style={{ fontSize: '10px', color: '#666', marginBottom: '5px', textAlign: 'center' }}>
                    icon: {npc.icon || 'undefined'} | error: {imageErrors[npc.name] ? 'true' : 'false'}
                  </div>*/}
                  
                  {/* 強制的に赤峰教授の画像をテスト */}
                  {npc.name === '赤峰教授' ? (
                    <img 
                      src="/akamine.png"
                      alt={`${npc.name}のアイコン`}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `3px solid ${categoryInfo.color}`,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        backgroundColor: '#f7fafc'
                      }}
                      onError={() => {
                        //console.warn(`強制テスト画像失敗: ${npc.name}`);
                        handleImageError(npc.name);
                      }}
                      /*onLoad={() => {
                        console.log(`強制テスト画像成功: ${npc.name}`);
                      }}*/
                    />
                  ) : npc.name === '真田翔' ? (
                    <img 
                      src="/syou.png"
                      alt={`${npc.name}のアイコン`}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `3px solid ${categoryInfo.color}`,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        backgroundColor: '#f7fafc'
                      }}
                      onError={() => {
                        //console.warn(`強制テスト画像失敗: ${npc.name}`);
                        handleImageError(npc.name);
                      }}
                      /*onLoad={() => {
                        console.log(`強制テスト画像成功: ${npc.name}`);
                      }}*/
                    />
                  ) : npc.icon && !imageErrors[npc.name] ? (
                    <img 
                      src={npc.icon}
                      alt={`${npc.name}のアイコン`}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `3px solid ${categoryInfo.color}`,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        backgroundColor: '#f7fafc'
                      }}
                      onError={() => {
                        console.warn(`画像読み込み失敗: ${npc.name} - ${npc.icon}`);
                        handleImageError(npc.name);
                      }}
                      onLoad={() => {
                        console.log(`画像読み込み成功: ${npc.name} - ${npc.icon}`);
                      }}
                    />
                  ) : npc.name === '美濃玲' ? (
                    <img 
                      src="/rei.png"
                      alt={`${npc.name}のアイコン`}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `3px solid ${categoryInfo.color}`,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        backgroundColor: '#f7fafc'
                      }}
                      onError={() => {
                        //console.warn(`強制テスト画像失敗: ${npc.name}`);
                        handleImageError(npc.name);
                      }}
                      /*onLoad={() => {
                        console.log(`強制テスト画像成功: ${npc.name}`);
                      }}*/
                    />
                  ) :  npc.name === '佐伯美和' ? (
                    <img 
                      src="miwa.png"
                      alt={`${npc.name}のアイコン`}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `3px solid ${categoryInfo.color}`,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        backgroundColor: '#f7fafc'
                      }}
                      onError={() => {
                        //console.warn(`強制テスト画像失敗: ${npc.name}`);
                        handleImageError(npc.name);
                      }}
                      /*onLoad={() => {
                        console.log(`強制テスト画像成功: ${npc.name}`);
                      }}*/
                    />
                  ) : npc.name === '七海美月' ? (
                    <img 
                      src="nanami.png"
                      alt={`${npc.name}のアイコン`}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `3px solid ${categoryInfo.color}`,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        backgroundColor: '#f7fafc'
                      }}
                      onError={() => {
                        //console.warn(`強制テスト画像失敗: ${npc.name}`);
                        handleImageError(npc.name);
                      }}
                      /*onLoad={() => {
                        console.log(`強制テスト画像成功: ${npc.name}`);
                      }}*/
                    />
                  ) : (
                    // 画像がない場合またはエラーの場合のデフォルト表示
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: categoryInfo.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      color: 'white',
                      border: `3px solid ${categoryInfo.color}`,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}>
                      {categoryInfo.icon}
                    </div>
                  )}
                </div>
                
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: '#2d3748',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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

              {/* 交流・イベントボタン */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => onInteract && onInteract(npc.name)}
                  disabled={!onInteract || (playerHP && playerHP <= 0) || (playerSP && playerSP < 5)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: 6,
                    background: (!onInteract || (playerHP && playerHP <= 0) || (playerSP && playerSP < 5)) ? '#e2e8f0' : categoryInfo.color,
                    color: (!onInteract || (playerHP && playerHP <= 0) || (playerSP && playerSP < 5)) ? '#a0aec0' : 'white',
                    fontWeight: 'bold',
                    cursor: (!onInteract || (playerHP && playerHP <= 0) || (playerSP && playerSP < 5)) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: (!onInteract || (playerHP && playerHP <= 0) || (playerSP && playerSP < 5)) ? 0.6 : 1
                  }}
                >
                  {!onInteract ? '交流機能なし' : 
                   (playerHP && playerHP <= 0) ? 'HP不足' :
                   (playerSP && playerSP < 5) ? 'SP不足' : '💬 交流する (SP -5)'}
                </button>

                {/* NPCイベントボタン（機能フラグで制御） */}
                {gameState && gameState.isFeatureEnabled && gameState.isFeatureEnabled('npcEvents') && npc.affection >= 32 && (
                  <button
                    onClick={() => onNPCEvent && onNPCEvent(npc.name)}
                    style={{
                      padding: '0.75rem',
                      background: npc.affection >= 100 ? '#f39c12' : 
                                 npc.affection >= 64 ? '#28a745' : '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      minWidth: '60px'
                    }}
                    title={`NPCイベント（好感度${npc.affection}）`}
                  >
                    {npc.affection >= 100 ? '✨' : 
                     npc.affection >= 64 ? '🎁' : '💫'}
                  </button>
                )}
              </div>
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
