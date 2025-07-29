/**
 * ゲームのメイン画面コンポーネント
 * 高専RPG「青春オーバードライブ」のメインゲーム画面
 * 設計資料に基づくゲームシステムを実装
 */
import React, { useState, useEffect } from 'react';
import GameState from '../models/GameState';
import GameUI from './GameUI';
import NPCStatus from './NPCStatus';
import EventLog from './EventLog';
import BattleSystem from './BattleSystem';

export default function GameMain() {
  const [gameState, setGameState] = useState(() => {
    const gs = new GameState();
    gs.initializeChapter(1); // 第1章開始
    return gs;
  });
  const [currentView, setCurrentView] = useState('status'); // status, action, npcs, log
  const [actionMessage, setActionMessage] = useState('');
  const [eventLogs, setEventLogs] = useState([
    { id: 1, message: '高専RPG「青春オーバードライブ」へようこそ！', timestamp: Date.now() },
    { id: 2, message: '第1章：新入生編が始まりました。', timestamp: Date.now() }
  ]);
  const [, forceUpdate] = useState({});

  // 強制的にコンポーネントを再描画するための関数
  const refresh = () => forceUpdate({});

  // 現在の章イベントを取得
  const currentEvent = gameState.getCurrentChapterEvent();

  // デバッグ情報をコンソールに出力
  console.log('章進行デバッグ:', {
    currentChapter: gameState.currentChapter,
    chapterProgress: gameState.chapterProgress,
    totalEvents: gameState.chapterEvents?.length,
    currentEvent: currentEvent,
    allEvents: gameState.chapterEvents
  });

  // バトル中かどうかをチェック
  if (gameState.gamePhase === 'battle' && gameState.currentBattle) {
    return (
      <BattleSystem
        enemy={gameState.currentBattle.enemy}
        playerStats={gameState.playerStats}
        onBattleEnd={(result, rewards) => {
          // 敵の情報を先に保存（endBattle前に）
          const enemyName = gameState.currentBattle?.enemy?.name || '未知の敵';
          
          gameState.endBattle(result, rewards);
          
          // 現在のイベントを完了
          if (currentEvent && (currentEvent.type === 'battle' || currentEvent.type === 'boss')) {
            console.log('イベント完了:', currentEvent.id);
            gameState.completeChapterEvent(currentEvent.id);
            
            // 強制的に状態を更新
            refresh();
          }
          
          // ログ追加
          let resultMessage = '';
          if (result === 'victory') {
            resultMessage = `${enemyName}に勝利しました！`;
          } else if (result === 'defeat') {
            resultMessage = '敗北しました...';
          } else {
            resultMessage = '戦闘から逃走しました';
          }
          
          setEventLogs(prev => [...prev, {
            id: prev.length + 1,
            message: resultMessage,
            timestamp: Date.now()
          }]);
          
          setActionMessage(resultMessage);
          refresh();
        }}
      />
    );
  }

  // 行動処理
  const performAction = (actionType) => {
    const result = gameState.performAction(actionType);
    setActionMessage(result);
    
    // イベントログに追加
    const newLog = {
      id: eventLogs.length + 1,
      message: result,
      timestamp: Date.now()
    };
    setEventLogs(prev => [...prev, newLog]);
    
    // ゲーム状態を更新
    refresh();
    
    // 3秒後にメッセージをクリア
    setTimeout(() => setActionMessage(''), 3000);
  };

  // NPC交流処理
  const interactWithNPC = (npcName) => {
    const affectionGain = Math.floor(Math.random() * 6) + 2; // 2-7の間でランダム
    const newAffection = gameState.changeAffection(npcName, affectionGain);
    
    const message = `${npcName}と交流しました。好感度が${affectionGain}上昇！（現在: ${newAffection}）`;
    setActionMessage(message);
    
    // ログに追加
    const newLog = {
      id: eventLogs.length + 1,
      message: message,
      timestamp: Date.now()
    };
    setEventLogs(prev => [...prev, newLog]);
    
    // SP消費
    gameState.changeStats({ sp: -5 });
    refresh();
  };

  // 章イベント開始
  const startChapterEvent = () => {
    if (!currentEvent) return;
    
    // 期末試験の場合は要件チェック
    if (currentEvent.id === 'finalExam') {
      const requirementCheck = gameState.checkEventRequirements('finalExam');
      if (!requirementCheck.canAccess) {
        alert(requirementCheck.message);
        return;
      } else {
        alert(requirementCheck.message);
      }
    }
    
    if (currentEvent.type === 'battle' || currentEvent.type === 'boss' || currentEvent.type === 'final-boss') {
      // バトル開始
      gameState.startBattle(currentEvent.enemy);
      refresh();
    } else {
      // その他のイベント
      gameState.completeChapterEvent(currentEvent.id);
      const message = `${currentEvent.name}を完了しました！`;
      setActionMessage(message);
      
      setEventLogs(prev => [...prev, {
        id: prev.length + 1,
        message: message,
        timestamp: Date.now()
      }]);
      
      refresh();
    }
  };

  return (
    <div style={{ 
      padding: '1rem', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* ヘッダー */}
      <header style={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: '1rem',
        marginBottom: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ margin: 0, color: '#2d3748', fontSize: '1.8rem' }}>
          高専RPG：青春オーバードライブ
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#4a5568' }}>
          第{gameState.currentChapter}章 - 第{gameState.currentWeek}週目
        </p>
      </header>

      {/* メインコンテンツエリア */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem' }}>
        
        {/* 左側：メインコンテンツ */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 12,
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          
          {/* ナビゲーションタブ */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '1.5rem',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '1rem'
          }}>
            {[
              { key: 'status', label: 'ステータス' },
              { key: 'action', label: '行動選択' },
              { key: 'npcs', label: 'NPC' },
              { key: 'rematch', label: '再戦' },
              { key: 'log', label: 'ログ' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: 6,
                  background: currentView === tab.key ? '#4299e1' : '#e2e8f0',
                  color: currentView === tab.key ? 'white' : '#4a5568',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* アクションメッセージ */}
          {actionMessage && (
            <div style={{
              background: '#48bb78',
              color: 'white',
              padding: '0.75rem',
              borderRadius: 6,
              marginBottom: '1rem',
              animation: 'fadeIn 0.3s ease-in'
            }}>
              {actionMessage}
            </div>
          )}

          {/* メインコンテンツ表示 */}
          {currentView === 'status' && (
            <GameUI gameState={gameState} />
          )}

          {currentView === 'action' && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>行動を選択してください</h3>
              
              {/* 章イベント表示 */}
              {currentEvent && !currentEvent.completed && (
                <div style={{
                  background: '#ffd700',
                  color: '#8b4513',
                  padding: '1rem',
                  borderRadius: 8,
                  marginBottom: '1rem',
                  border: '2px solid #daa520'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    📚 第{gameState.currentChapter}章イベント
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    {currentEvent.name}
                  </div>
                  <button
                    onClick={startChapterEvent}
                    style={{
                      padding: '0.5rem 1rem',
                      background: currentEvent.id === 'finalExam' ? '#e53e3e' : 
                                 (currentEvent.type === 'boss' ? '#d69e2e' : '#ff6b35'),
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {currentEvent.id === 'finalExam' ? '🔥 期末試験に挑戦' :
                     (currentEvent.type === 'battle' || currentEvent.type === 'boss' ? '⚔️ 戦闘開始' : '✨ イベント開始')}
                  </button>
                </div>
              )}

              {/* 章完了メッセージ */}
              {!currentEvent && gameState.chapterEvents && gameState.chapterProgress >= gameState.chapterEvents.length && (
                <div style={{
                  background: '#38a169',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: 8,
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>🎉 第{gameState.currentChapter}章完了！</h3>
                  <p style={{ margin: 0 }}>お疲れ様でした。自由行動で次の章に備えましょう。</p>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {[
                  { key: 'lecture', label: '講義', desc: '提出力・理論力上昇', color: '#4299e1' },
                  { key: 'assignment', label: '課題', desc: '提出力大幅上昇', color: '#38b2ac' },
                  { key: 'research', label: '研究', desc: '理論力・特殊スキル', color: '#9f7aea' },
                  { key: 'parttime', label: 'バイト', desc: '所持金獲得', color: '#f6ad55' },
                  { key: 'social', label: '交流', desc: 'NPC関係構築', color: '#fc8181' },
                  { key: 'rest', label: '休息', desc: 'HP/SP回復', color: '#68d391' }
                ].map(action => (
                  <button
                    key={action.key}
                    onClick={() => performAction(action.key)}
                    disabled={gameState.playerStats.sp < 5 && action.key !== 'rest'}
                    style={{
                      padding: '1rem',
                      border: 'none',
                      borderRadius: 8,
                      background: action.color,
                      color: 'white',
                      cursor: gameState.playerStats.sp < 5 && action.key !== 'rest' ? 'not-allowed' : 'pointer',
                      opacity: gameState.playerStats.sp < 5 && action.key !== 'rest' ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {action.label}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                      {action.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentView === 'npcs' && (
            <NPCStatus 
              npcs={gameState.npcs} 
              onInteract={interactWithNPC}
              playerSP={gameState.playerStats.sp}
            />
          )}

          {currentView === 'rematch' && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>撃破した敵との再戦</h3>
              
              {gameState.defeatedEnemies.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#718096',
                  background: '#f7fafc',
                  borderRadius: 8,
                  border: '2px dashed #e2e8f0'
                }}>
                  <p style={{ margin: 0, fontSize: '1.1rem' }}>📚 まだ敵を倒していません</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                    課題や試験をクリアすると、ここに再戦可能な敵が表示されます
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {gameState.getAvailableRematches().map(enemy => (
                    <div key={enemy.name} style={{
                      background: '#f8f9fa',
                      border: '2px solid #e9ecef',
                      borderRadius: 8,
                      padding: '1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, color: '#495057' }}>{enemy.name}</h4>
                        <span style={{ 
                          background: '#17a2b8', 
                          color: 'white', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: 12, 
                          fontSize: '0.8rem' 
                        }}>
                          撃破回数: {enemy.defeatedCount}
                        </span>
                      </div>
                      <p style={{ margin: '0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                        {enemy.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                          <span>HP: {enemy.hp}</span>
                          <span style={{ margin: '0 0.5rem' }}>|</span>
                          <span>EXP: {enemy.expReward}</span>
                          <span style={{ margin: '0 0.5rem' }}>|</span>
                          <span>提出力+{enemy.submissionBonus}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (gameState.startRematch(enemy.name)) {
                            refresh();
                          }
                        }}
                        disabled={gameState.playerStats.sp < 20}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: gameState.playerStats.sp >= 20 ? '#28a745' : '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          cursor: gameState.playerStats.sp >= 20 ? 'pointer' : 'not-allowed',
                          fontWeight: 'bold',
                          transition: 'background 0.2s'
                        }}
                      >
                        {gameState.playerStats.sp >= 20 ? '🔄 再戦開始' : '💤 SP不足 (20必要)'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === 'log' && (
            <EventLog events={eventLogs} />
          )}
        </div>

        {/* 右側：サイドバー */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 12,
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          height: 'fit-content'
        }}>
          <h3 style={{ marginTop: 0, color: '#2d3748' }}>プレイヤー情報</h3>
          
          {/* 基本ステータス */}
          <div style={{ marginBottom: '1rem' }}>
            {Object.entries(gameState.playerStats).map(([key, value]) => (
              <div key={key} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                padding: '0.25rem',
                borderRadius: 4,
                background: key === 'stress' && value > 60 ? '#fed7d7' : 'transparent'
              }}>
                <span style={{ color: '#4a5568' }}>{key.toUpperCase()}:</span>
                <span style={{ 
                  fontWeight: 'bold',
                  color: key === 'stress' && value > 60 ? '#e53e3e' : '#2d3748'
                }}>
                  {value}{key === 'hp' || key === 'sp' ? '/100' : ''}
                </span>
              </div>
            ))}
          </div>

          {/* 習得スキル */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>習得スキル</h4>
            {gameState.playerSkills.length > 0 ? (
              gameState.playerSkills.map((skill, index) => (
                <div key={index} style={{
                  background: '#e6fffa',
                  border: '1px solid #38b2ac',
                  borderRadius: 4,
                  padding: '0.25rem 0.5rem',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  color: '#2d3748'
                }}>
                  {skill}
                </div>
              ))
            ) : (
              <p style={{ color: '#718096', fontSize: '0.875rem', margin: 0 }}>
                まだスキルを習得していません
              </p>
            )}
          </div>

          {/* 章進行状況 */}
          {gameState.chapterEvents && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>
                第{gameState.currentChapter}章進行状況
              </h4>
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{
                  background: '#f7fafc',
                  borderRadius: 4,
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    進行度: {gameState.chapterProgress}/{gameState.chapterEvents.length}
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: '#e2e8f0',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(gameState.chapterProgress / gameState.chapterEvents.length) * 100}%`,
                      height: '100%',
                      background: '#38b2ac',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  {currentEvent && (
                    <div style={{ marginTop: '0.5rem', color: '#2d3748' }}>
                      次: {currentEvent.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 進級判定状況 */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>進級状況</h4>
            {(() => {
              const advancement = gameState.canAdvanceToNextSemester();
              return (
                <div style={{ fontSize: '0.875rem' }}>
                  <div style={{ 
                    color: advancement.reasons.submission ? '#38a169' : '#e53e3e',
                    marginBottom: '0.25rem'
                  }}>
                    ✓ 提出力: {advancement.reasons.submission ? '達成' : '未達成'}
                  </div>
                  <div style={{ 
                    color: advancement.reasons.stress ? '#38a169' : '#e53e3e',
                    marginBottom: '0.25rem'
                  }}>
                    ✓ ストレス管理: {advancement.reasons.stress ? '良好' : '要注意'}
                  </div>
                  <div style={{ 
                    color: advancement.reasons.relationships ? '#38a169' : '#e53e3e'
                  }}>
                    ✓ 人間関係: {advancement.reasons.relationships ? '良好' : '要改善'}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}