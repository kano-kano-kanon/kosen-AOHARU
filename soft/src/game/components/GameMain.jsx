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
    
    // オートセーブからの復元を試行
    const hasAutoSave = gs.loadFromLocalStorage('autosave');
    if (!hasAutoSave) {
      // オートセーブがない場合は第1章開始
      gs.initializeChapter(1);
    }
    
    console.log('GameMain初期化:', {
      autoRestored: hasAutoSave,
      chapterEvents: gs.chapterEvents,
      currentEvent: gs.getCurrentChapterEvent()
    });
    return gs;
  });
  const [currentView, setCurrentView] = useState('status'); // status, action, npcs, log, shop
  const [actionMessage, setActionMessage] = useState('');
  const [eventLogs, setEventLogs] = useState([
    { id: 1, message: '高専RPG「青春オーバードライブ」へようこそ！', timestamp: Date.now() },
    { id: 2, message: '第1章：新入生編が始まりました。', timestamp: Date.now() }
  ]);
  const [, forceUpdate] = useState({});
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showChoiceEvent, setShowChoiceEvent] = useState(false);
  const [currentChoiceEvent, setCurrentChoiceEvent] = useState(null);

  // URLパス監視で /admin アクセスを検知
  useEffect(() => {
    const checkAdminPath = () => {
      // ハッシュフラグメント #admin をチェック
      if (window.location.hash === '#admin') {
        setShowAdminAuth(true);
        // URLを綺麗にする（ハッシュを残す）
        window.history.replaceState(null, '', window.location.pathname + '#admin');
      }
    };
    
    checkAdminPath();
    
    // ハッシュ変更を監視
    window.addEventListener('hashchange', checkAdminPath);
    
    // ページロード時にもチェック
    window.addEventListener('load', checkAdminPath);
    
    return () => {
      window.removeEventListener('hashchange', checkAdminPath);
      window.removeEventListener('load', checkAdminPath);
    };
  }, []);

  // 強制的にコンポーネントを再描画するための関数
  const refresh = () => forceUpdate({});

  // 現在の章イベントを取得
  const currentEvent = gameState.getCurrentChapterEvent();

  // デバッグ情報をコンソールに出力（開発時のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('章進行デバッグ:', {
      currentChapter: gameState.currentChapter,
      chapterProgress: gameState.chapterProgress,
      totalEvents: gameState.chapterEvents?.length,
      currentEvent: currentEvent,
      allEvents: gameState.chapterEvents
    });
  }

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
          if (currentEvent && (currentEvent.type === 'battle' || currentEvent.type === 'boss' || currentEvent.type === 'final-boss')) {
            console.log('イベント完了:', currentEvent.id);
            console.log('完了前のイベント状態:', currentEvent);
            gameState.completeChapterEvent(currentEvent.id);
            
            // 完了後の状態を確認
            const updatedEvent = gameState.chapterEvents.find(e => e.id === currentEvent.id);
            console.log('完了後のイベント状態:', updatedEvent);
            
            // 期末試験（final-boss）完了時の特別処理
            if (currentEvent.type === 'final-boss' && result === 'victory') {
              console.log('期末試験完了！章進行をチェック...');
              
              // 章完了チェック
              const canAdvance = gameState.canAdvanceToNextChapter();
              console.log('章進行可能性:', canAdvance);
              if (canAdvance.canAdvance) {
                console.log('次章への進行が可能です');
                
                // 次章進行の確認メッセージを表示
                setTimeout(() => {
                  const shouldAdvance = confirm('期末試験に合格しました！次の章に進みますか？');
                  if (shouldAdvance) {
                    const advanceResult = gameState.advanceToNextChapter();
                    if (advanceResult.success) {
                      setActionMessage(`🎉 ${advanceResult.message}`);
                      refresh();
                    } else {
                      setActionMessage(`❌ ${advanceResult.message}`);
                    }
                  }
                }, 1000);
              } else {
                console.log('章進行要件未達:', canAdvance.message);
                setActionMessage(`期末試験は完了しましたが、進級要件が不足しています: ${canAdvance.message}`);
              }
            }
            
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
          
          // バトル終了後にオートセーブ
          if (result === 'victory') {
            gameState.saveToLocalStorage('autosave');
          }
          
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

  // 管理者認証処理
  const handleAdminAuth = () => {
    if (gameState.authenticateAdmin(adminPassword)) {
      setShowAdminAuth(false);
      setAdminPassword('');
      setCurrentView('admin');
      
      // URLからハッシュを削除して綺麗にする
      if (window.location.hash === '#admin') {
        window.history.replaceState(null, '', window.location.pathname);
      }
      
      setEventLogs(prev => [...prev, {
        id: prev.length + 1,
        message: '⚙️ 開発モードが有効になりました',
        timestamp: Date.now()
      }]);
      
      refresh();
    } else {
      alert('認証に失敗しました');
      setAdminPassword('');
    }
  };

  // 管理者モード終了処理
  const handleAdminLogout = () => {
    gameState.disableAdmin();
    setCurrentView('status');
    
    setEventLogs(prev => [...prev, {
      id: prev.length + 1,
      message: '開発モードを終了しました',
      timestamp: Date.now()
    }]);
    
    refresh();
  };

  // NPC交流処理
  const interactWithNPC = (npcName) => {
    // HP/SP不足チェック
    if (gameState.playerStats.hp <= 0) {
      setActionMessage('HP不足のため交流できません。休息を取ってください。');
      return;
    }
    
    if (gameState.playerStats.sp < 5) {
      setActionMessage('SP不足のため交流できません。(必要SP: 5)');
      return;
    }
    
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

    // 技術コンテストなどの要件チェック
    if (currentEvent.requirements) {
      const requirementCheck = gameState.checkEventRequirements(currentEvent.id);
      if (!requirementCheck.canAccess) {
        alert(requirementCheck.message);
        return;
      }
    }
    
    if (currentEvent.type === 'battle' || currentEvent.type === 'boss' || currentEvent.type === 'final-boss') {
      // バトル開始
      gameState.startBattle(currentEvent.enemy);
      refresh();
    } else if (currentEvent.type === 'choice') {
      // 選択イベントUI表示
      setCurrentChoiceEvent(currentEvent);
      setShowChoiceEvent(true);
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
      
      // オートセーブ実行
      gameState.saveToLocalStorage('autosave');
      
      refresh();
    }
  };

  // 選択肢処理
  const handleChoice = (choiceId) => {
    if (!currentChoiceEvent) return;
    
    const result = gameState.processChoiceEvent(currentChoiceEvent.id, choiceId);
    
    if (result.success) {
      const message = result.message;
      setActionMessage(message);
      
      setEventLogs(prev => [...prev, {
        id: prev.length + 1,
        message: message,
        timestamp: Date.now()
      }]);
      
      // 選択イベント終了
      setShowChoiceEvent(false);
      setCurrentChoiceEvent(null);
      
      // オートセーブ実行
      gameState.saveToLocalStorage('autosave');
      
      refresh();
    } else {
      setActionMessage(`❌ ${result.message}`);
    }
  };

  // 管理者認証画面表示
  if (showAdminAuth) {
    return (
      <div style={{
        padding: '2rem',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 12,
          padding: '2rem',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h2 style={{ 
            margin: '0 0 1rem 0', 
            color: '#2d3748', 
            textAlign: 'center',
            fontSize: '1.5rem'
          }}>
            � 特別認証
          </h2>
          <p style={{ 
            margin: '0 0 1.5rem 0', 
            color: '#4a5568', 
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            認証キーを入力してください
          </p>
          
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdminAuth()}
            placeholder="認証キー"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: 8,
              fontSize: '1rem',
              marginBottom: '1rem',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleAdminAuth}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              認証
            </button>
            <button
              onClick={() => {
                setShowAdminAuth(false);
                setAdminPassword('');
                // ハッシュがある場合は削除
                if (window.location.hash === '#admin') {
                  window.history.replaceState(null, '', window.location.pathname);
                }
              }}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#4a5568',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              { key: 'shop', label: 'ショップ' },
              { key: 'rematch', label: '再戦' },
              { key: 'save', label: 'セーブ&ロード' },
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
                  { key: 'lecture', label: '講義', desc: '提出力・理論力上昇', color: '#4299e1', spCost: 5 },
                  { key: 'assignment', label: '課題', desc: '提出力大幅上昇', color: '#38b2ac', spCost: 10 },
                  { key: 'research', label: '研究', desc: '理論力・特殊スキル', color: '#9f7aea', spCost: 8 },
                  { key: 'parttime', label: 'バイト', desc: '所持金獲得', color: '#f6ad55', spCost: 5 },
                  { key: 'social', label: '交流', desc: 'NPC関係構築', color: '#fc8181', spCost: 5 },
                  { key: 'rest', label: '休息', desc: 'HP/SP回復', color: '#68d391', spCost: 0 }
                ].map(action => {
                  const canPerform = (gameState.playerStats.hp > 0) && 
                                   (action.spCost === 0 || gameState.playerStats.sp >= action.spCost);
                  
                  let disabledReason = '';
                  if (gameState.playerStats.hp <= 0) {
                    disabledReason = 'HP不足';
                  } else if (gameState.playerStats.sp < action.spCost) {
                    disabledReason = `SP不足(${action.spCost}必要)`;
                  }
                  
                  return (
                    <button
                      key={action.key}
                      onClick={() => performAction(action.key)}
                      disabled={!canPerform}
                      style={{
                        padding: '1rem',
                        border: 'none',
                        borderRadius: 8,
                        background: canPerform ? action.color : '#a0aec0',
                        color: 'white',
                        cursor: canPerform ? 'pointer' : 'not-allowed',
                        opacity: canPerform ? 1 : 0.6,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {action.label} {action.spCost > 0 && `(SP${action.spCost})`}
                      </div>
                      <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                        {canPerform ? action.desc : disabledReason}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentView === 'npcs' && (
            <NPCStatus 
              npcs={gameState.npcs} 
              onInteract={interactWithNPC}
              playerSP={gameState.playerStats.sp}
              playerHP={gameState.playerStats.hp}
            />
          )}

          {currentView === 'shop' && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>
                🛒 ショップ
                <span style={{ fontSize: '1rem', fontWeight: 'normal', marginLeft: '1rem', color: '#4a5568' }}>
                  所持金: ¥{gameState.playerStats.money.toLocaleString()}
                </span>
              </h3>
              
              {/* ショップアイテム一覧 */}
              <div style={{ display: 'grid', gap: '1rem' }}>
                {gameState.getShopItems().map(item => (
                  <div key={item.id} style={{
                    background: item.isPurchased ? '#f0f8f0' : '#f8f9fa',
                    border: `2px solid ${item.isPurchased ? '#28a745' : '#e9ecef'}`,
                    borderRadius: 8,
                    padding: '1rem',
                    opacity: item.isPurchased && (item.category === 'upgrade' || item.category === 'rare') ? 0.7 : 1
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: '#495057', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                          {item.name}
                          {item.isPurchased && (
                            <span style={{ 
                              background: '#28a745', 
                              color: 'white', 
                              padding: '0.125rem 0.375rem', 
                              borderRadius: 8, 
                              fontSize: '0.7rem' 
                            }}>
                              購入済み
                            </span>
                          )}
                        </h4>
                        <p style={{ margin: '0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                          {item.description}
                        </p>
                        <div style={{ fontSize: '0.8rem', color: '#495057' }}>
                          <span style={{ 
                            background: item.category === 'consumable' ? '#ffc107' : 
                                      item.category === 'upgrade' ? '#17a2b8' : '#6f42c1',
                            color: 'white',
                            padding: '0.125rem 0.375rem',
                            borderRadius: 4,
                            marginRight: '0.5rem'
                          }}>
                            {item.category === 'consumable' ? '消耗品' : 
                             item.category === 'upgrade' ? '永続強化' : 'レア'}
                          </span>
                          ¥{item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const result = gameState.purchaseItem(item.id);
                        if (result.success) {
                          setActionMessage(result.message);
                          refresh();
                        } else {
                          alert(result.message);
                        }
                      }}
                      disabled={!item.canPurchase}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: item.canPurchase ? '#007bff' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: item.canPurchase ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold'
                      }}
                    >
                      {item.isPurchased && (item.category === 'upgrade' || item.category === 'rare') ? 
                        '購入済み' : 
                        gameState.playerStats.money < item.price ? 
                          '所持金不足' : 
                          '購入する'
                      }
                    </button>
                  </div>
                ))}
              </div>

              {/* 購入履歴 */}
              {gameState.getPurchaseHistory().length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: '#4a5568' }}>📋 購入履歴</h4>
                  <div style={{ 
                    background: '#f8f9fa', 
                    border: '1px solid #dee2e6', 
                    borderRadius: 6, 
                    maxHeight: '200px', 
                    overflowY: 'auto' 
                  }}>
                    {gameState.getPurchaseHistory().slice(0, 10).map((purchase, index) => (
                      <div key={index} style={{
                        padding: '0.5rem 1rem',
                        borderBottom: index < 9 ? '1px solid #e9ecef' : 'none',
                        fontSize: '0.9rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{purchase.itemName}</span>
                          <span>¥{purchase.price.toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                          {new Date(purchase.purchaseDate).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

          {currentView === 'save' && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>セーブ&ロード</h3>
              
              {/* セーブセクション */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '0.75rem', color: '#4a5568', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  💾 ゲームをセーブ
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {['slot1', 'slot2', 'slot3'].map(slot => (
                    <button
                      key={slot}
                      onClick={() => {
                        if (gameState.saveToLocalStorage(slot)) {
                          alert(`スロット ${slot} にセーブしました！`);
                          refresh();
                        } else {
                          alert('セーブに失敗しました');
                        }
                      }}
                      style={{
                        padding: '0.75rem',
                        background: '#38a169',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'background 0.2s'
                      }}
                    >
                      {slot.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* ロードセクション */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '0.75rem', color: '#4a5568', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  📁 セーブデータ一覧
                </h4>
                
                {(() => {
                  const saves = GameState.getSaveDataList();
                  return saves.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#718096',
                      background: '#f7fafc',
                      borderRadius: 8,
                      border: '2px dashed #e2e8f0'
                    }}>
                      <p style={{ margin: 0, fontSize: '1.1rem' }}>💤 セーブデータがありません</p>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                        上のボタンでゲームをセーブしてください
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {saves.map(save => (
                        <div key={save.slotName} style={{
                          background: '#f8f9fa',
                          border: '2px solid #e9ecef',
                          borderRadius: 8,
                          padding: '1rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div>
                              <h5 style={{ margin: 0, color: '#495057', fontSize: '1rem' }}>
                                {save.slotName.toUpperCase()} - {save.playerName}
                              </h5>
                              <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                                {save.chapterTitle} | Lv.{save.level}
                              </p>
                              <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.8rem' }}>
                                {save.progress}
                              </p>
                            </div>
                            <span style={{ 
                              background: '#17a2b8', 
                              color: 'white', 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: 12, 
                              fontSize: '0.75rem' 
                            }}>
                              {new Date(save.savedAt).toLocaleString('ja-JP')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => {
                                if (confirm(`スロット ${save.slotName} からロードしますか？\n現在の進行状況は失われます。`)) {
                                  if (gameState.loadFromLocalStorage(save.slotName)) {
                                    setGameState(new gameState.constructor(gameState));
                                    alert('ロードしました！');
                                    refresh();
                                  } else {
                                    alert('ロードに失敗しました');
                                  }
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                              }}
                            >
                              📥 ロード
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`スロット ${save.slotName} のセーブデータを削除しますか？`)) {
                                  if (GameState.deleteSaveData(save.slotName)) {
                                    alert('削除しました');
                                    refresh();
                                  } else {
                                    alert('削除に失敗しました');
                                  }
                                }
                              }}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* クイックセーブ・オートセーブ */}
              <div>
                <h4 style={{ marginBottom: '0.75rem', color: '#4a5568', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  ⚡ クイック操作
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      if (gameState.saveToLocalStorage('quicksave')) {
                        setActionMessage('クイックセーブしました！');
                        setTimeout(() => setActionMessage(''), 2000);
                      }
                    }}
                    style={{
                      padding: '0.75rem',
                      background: '#fd7e14',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ⚡ クイックセーブ
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('クイックセーブからロードしますか？')) {
                        if (gameState.loadFromLocalStorage('quicksave')) {
                          setGameState(new gameState.constructor(gameState));
                          setActionMessage('クイックロードしました！');
                          setTimeout(() => setActionMessage(''), 2000);
                          refresh();
                        } else {
                          alert('クイックセーブデータがありません');
                        }
                      }
                    }}
                    style={{
                      padding: '0.75rem',
                      background: '#6610f2',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ⚡ クイックロード
                  </button>
                </div>
              </div>
            </div>
          )}

          {gameState.isAdmin && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem',
                padding: '0.75rem',
                background: 'rgba(229, 62, 62, 0.1)',
                borderRadius: 8,
                border: '2px solid #e53e3e'
              }}>
                <h3 style={{ margin: 0, color: '#e53e3e' }}>⚙️ 開発ツール</h3>
                <button
                  onClick={handleAdminLogout}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#4a5568',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  開発モード終了
                </button>
              </div>
              
              {/* チート機能セクション */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '0.75rem', color: '#4a5568', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  ⚡ チート機能
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      if (gameState.cheatMaxStats()) {
                        setActionMessage('ステータス最大化完了！');
                        setTimeout(() => setActionMessage(''), 2000);
                        refresh();
                      }
                    }}
                    style={{
                      padding: '0.75rem',
                      background: '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    💪 ステータス最大化
                  </button>
                  
                  <button
                    onClick={() => {
                      if (gameState.cheatMaxAffection()) {
                        setActionMessage('NPC好感度最大化完了！');
                        setTimeout(() => setActionMessage(''), 2000);
                        refresh();
                      }
                    }}
                    style={{
                      padding: '0.75rem',
                      background: '#fd7e14',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    💖 NPC好感度MAX
                  </button>
                  
                  <button
                    onClick={() => {
                      if (gameState.cheatCompleteAllEvents()) {
                        setActionMessage('全イベント完了！');
                        setTimeout(() => setActionMessage(''), 2000);
                        refresh();
                      }
                    }}
                    style={{
                      padding: '0.75rem',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ✅ 全イベント完了
                  </button>
                  
                  <button
                    onClick={() => {
                      if (gameState.cheatResetChapter()) {
                        setActionMessage('章進行リセット完了！');
                        setTimeout(() => setActionMessage(''), 2000);
                        refresh();
                      }
                    }}
                    style={{
                      padding: '0.75rem',
                      background: '#6f42c1',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    🔄 章進行リセット
                  </button>
                </div>
              </div>

              {/* レベル設定 */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '0.75rem', color: '#4a5568', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  📊 レベル設定
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    defaultValue={gameState.playerStats.level}
                    id="levelInput"
                    style={{
                      padding: '0.5rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: 4,
                      width: '80px'
                    }}
                  />
                  <button
                    onClick={() => {
                      const level = parseInt(document.getElementById('levelInput').value);
                      if (gameState.cheatSetLevel(level)) {
                        setActionMessage(`レベルを${level}に設定しました！`);
                        setTimeout(() => setActionMessage(''), 2000);
                        refresh();
                      }
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    レベル設定
                  </button>
                </div>
              </div>

              {/* デバッグ敵追加 */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '0.75rem', color: '#4a5568', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  👾 デバッグ敵追加
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {[
                    { name: 'デバッグ雑魚', hp: 10, exp: 50, bonus: 1 },
                    { name: 'デバッグボス', hp: 200, exp: 500, bonus: 10 },
                    { name: 'テスト用強敵', hp: 500, exp: 1000, bonus: 20 }
                  ].map(enemy => (
                    <button
                      key={enemy.name}
                      onClick={() => {
                        if (gameState.cheatAddEnemyToRematch({
                          name: enemy.name,
                          hp: enemy.hp,
                          expReward: enemy.exp,
                          submissionBonus: enemy.bonus,
                          description: `デバッグ用の敵 (HP:${enemy.hp})`
                        })) {
                          setActionMessage(`${enemy.name}を追加しました！`);
                          setTimeout(() => setActionMessage(''), 2000);
                          refresh();
                        }
                      }}
                      style={{
                        padding: '0.5rem',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {enemy.name}
                    </button>
                  ))}
                </div>
              </div>
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
                  {value}{key === 'hp' ? `/${gameState.playerStats.maxHP}` : key === 'sp' ? `/${gameState.playerStats.maxSP}` : ''}
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

          {/* 体調状況アラート */}
          {(gameState.playerStats.hp <= 0 || gameState.playerStats.sp < 10) && (
            <div style={{ 
              marginBottom: '1rem',
              padding: '0.75rem',
              background: gameState.playerStats.hp <= 0 ? '#fed7d7' : '#fef5e7',
              border: `2px solid ${gameState.playerStats.hp <= 0 ? '#e53e3e' : '#d69e2e'}`,
              borderRadius: 8
            }}>
              <h4 style={{ 
                margin: '0 0 0.5rem 0', 
                color: gameState.playerStats.hp <= 0 ? '#e53e3e' : '#d69e2e',
                fontSize: '0.9rem'
              }}>
                ⚠️ 体調注意
              </h4>
              <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>
                {gameState.playerStats.hp <= 0 && (
                  <div>HP不足で行動不可 - 休息が必要です</div>
                )}
                {gameState.playerStats.sp < 10 && (
                  <div>SP残量少 (残り{gameState.playerStats.sp}) - 休息推奨</div>
                )}
              </div>
            </div>
          )}

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
                  
                  {/* 章完了時の次章進行ボタン */}
                  {!currentEvent && gameState.chapterProgress >= gameState.chapterEvents.length && (
                    <div style={{ marginTop: '0.75rem' }}>
                      {(() => {
                        const advanceCheck = gameState.canAdvanceToNextChapter();
                        return (
                          <div>
                            <div style={{ 
                              fontSize: '0.8rem', 
                              color: advanceCheck.canAdvance ? '#28a745' : '#dc3545',
                              marginBottom: '0.5rem' 
                            }}>
                              {advanceCheck.message}
                            </div>
                            {advanceCheck.canAdvance && (
                              <button
                                onClick={() => {
                                  const result = gameState.advanceToNextChapter();
                                  if (result.success) {
                                    setActionMessage(`🎉 ${result.message}`);
                                    refresh();
                                  } else {
                                    setActionMessage(`📝 ${result.message}`);
                                  }
                                }}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  fontSize: '0.9rem'
                                }}
                              >
                                🚀 第{gameState.currentChapter + 1}章に進む
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 進級判定状況 */}
          <div style={{ marginBottom: '1rem' }}>
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

          {/* デバッグ情報 (開発時のみ) */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ 
              marginTop: '1rem',
              padding: '0.5rem',
              background: '#f7fafc',
              borderRadius: 4,
              border: '1px solid #e2e8f0'
            }}>
              
            </div>
          )}

          {/* 管理者ステータス表示 */}
          {gameState.isAdmin && (
            <div>
              <div style={{
                background: '#e53e3e',
                color: 'white',
                padding: '0.75rem',
                borderRadius: 6,
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: 'bold'
              }}>
                ⚙️ 開発モード
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* 選択イベントモーダル */}
      {showChoiceEvent && currentChoiceEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ 
              marginTop: 0, 
              color: '#2d3748',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              {currentChoiceEvent.name}
            </h2>
            
            <div style={{ 
              marginBottom: '2rem',
              color: '#4a5568',
              textAlign: 'center',
              lineHeight: '1.6'
            }}>
              選択してください：
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentChoiceEvent.choices?.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice.id)}
                  style={{
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'transform 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {choice.name}
                  </div>
                  {choice.effect && (
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                      効果: {Object.entries(choice.effect).map(([key, value]) => 
                        `${key}${value > 0 ? '+' : ''}${value}`
                      ).join(', ')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}