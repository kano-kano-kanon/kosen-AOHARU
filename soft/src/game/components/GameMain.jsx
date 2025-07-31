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
import PlayerChat from './PlayerChat';
import { getAllTutorialLogs } from '../data/tutorialLogs';

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
      currentEvent: gs.getCurrentChapterEvent(),
      gameVersion: gs.gameVersion,
      enabledFeatures: Object.entries(gs.featureFlags)
        .filter(([key, value]) => value)
        .map(([key]) => key)
    });
    return gs;
  });
  const [currentView, setCurrentView] = useState('status'); // status, action, npcs, log, shop, workspace
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
  const [showFreeActionEvent, setShowFreeActionEvent] = useState(false);
  const [currentFreeActionEvent, setCurrentFreeActionEvent] = useState(null);
  
  // ワークスペース監視用の状態
  const [workspaceStats, setWorkspaceStats] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDetails, setPlayerDetails] = useState(null);
  const [autoRefreshWorkspace, setAutoRefreshWorkspace] = useState(true);

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

  // アクティビティハートビート（ユーザーがアクティブかどうかを定期的に記録）
  useEffect(() => {
    let isActive = true;
    let lastMouseMove = Date.now();
    let lastKeyPress = Date.now();
    
    // マウス移動の検知
    const handleMouseMove = () => {
      lastMouseMove = Date.now();
      if (isActive) {
        gameState.updateCurrentView(currentView);
      }
    };
    
    // キーボード入力の検知
    const handleKeyPress = () => {
      lastKeyPress = Date.now();
      if (isActive) {
        gameState.updateCurrentView(currentView);
      }
    };
    
    // 定期的なハートビート（30秒間隔）
    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = Math.min(now - lastMouseMove, now - lastKeyPress);
      
      // 2分以内にマウスまたはキーボードの操作があった場合はアクティブとみなす
      if (timeSinceLastActivity < 120000) {
        gameState.updateCurrentView(currentView);
        isActive = true;
      } else {
        isActive = false;
      }
    }, 30000); // 30秒間隔
    
    // イベントリスナーを追加
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('click', handleMouseMove);
    
    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('click', handleMouseMove);
    };
  }, [currentView]);

  // ワークスペース監視画面の自動更新
  useEffect(() => {
    let workspaceUpdateInterval;
    
    if (currentView === 'workspace' && gameState.isAdmin && autoRefreshWorkspace) {
      // 5秒間隔でワークスペース統計を更新
      workspaceUpdateInterval = setInterval(() => {
        setWorkspaceStats(gameState.getWorkspaceStats());
      }, 5000);
    }
    
    return () => {
      if (workspaceUpdateInterval) {
        clearInterval(workspaceUpdateInterval);
      }
    };
  }, [currentView, autoRefreshWorkspace]);

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
          // ユーザーアクティビティを記録
          gameState.updateCurrentView(currentView);
          
          // 敵の情報を先に保存（endBattle前に）
          const enemyName = gameState.currentBattle?.enemy?.name || '未知の敵';
          
          gameState.endBattle(result, rewards);
          
          // 現在のイベントを完了
          if (currentEvent && (currentEvent.type === 'battle' || currentEvent.type === 'boss' || currentEvent.type === 'final-boss' || currentEvent.type === 'final_boss')) {
            console.log('event end:', currentEvent.id);
            console.log('befor state:', currentEvent);
            gameState.completeChapterEvent(currentEvent.id);
            
            // 完了後の状態を確認
            const updatedEvent = gameState.chapterEvents.find(e => e.id === currentEvent.id);
            console.log('after state:', updatedEvent);
            
            // 期末試験（final-boss）完了時の特別処理
            if (currentEvent.type === 'final-boss' && result === 'victory') {
              console.log('期末試験完了！章進行をチェック');
              
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
    // ユーザーアクティビティを記録
    gameState.updateCurrentView(currentView);
    
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
    // ユーザーアクティビティを記録
    gameState.updateCurrentView(currentView);
    
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

  // NPCイベント処理
  const handleNPCEvent = (npcName) => {
    // ユーザーアクティビティを記録
    gameState.updateCurrentView(currentView);
    
    const result = gameState.triggerNPCEvent(npcName);
    
    if (result.success) {
      setActionMessage(`🎉 ${result.message}`);
      
      // ログに追加
      const newLog = {
        id: eventLogs.length + 1,
        message: result.message,
        timestamp: Date.now()
      };
      setEventLogs(prev => [...prev, newLog]);
      
      setTimeout(() => setActionMessage(''), 4000);
      refresh();
    } else {
      setActionMessage(result.message);
      setTimeout(() => setActionMessage(''), 3000);
    }
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
    
      // 特別なイベントタイプの処理
      if (currentEvent.type === 'ceremony') {
        // 式典イベントの処理
        gameState.completeChapterEvent(currentEvent.id);
        const ceremonyReward = { exp: 200, money: 1000 };
        gameState.gainExperience(ceremonyReward.exp);
        gameState.playerStats.money += ceremonyReward.money;
        
        setActionMessage(`🎓 ${currentEvent.name}に参加しました。\n感動的な式典でした。\n経験値+${ceremonyReward.exp}、所持金+${ceremonyReward.money}円獲得！`);
        
        setEventLogs(prev => [...prev, {
          id: prev.length + 1,
          message: `🎓 ${currentEvent.name}完了`,
          timestamp: Date.now()
        }]);
        
        refresh();
        return;
      }
      
      if (currentEvent.type === 'declaration') {
        // 決意表明イベントの処理
        gameState.completeChapterEvent(currentEvent.id);
        const declarationReward = { exp: 150, motivation: 20 };
        gameState.gainExperience(declarationReward.exp);
        gameState.playerStats.motivation = Math.min(100, (gameState.playerStats.motivation || 50) + declarationReward.motivation);
        
        setActionMessage(`✨ ${currentEvent.name}を行いました。\n新たな決意を固めました！\n経験値+${declarationReward.exp}、モチベーション+${declarationReward.motivation}獲得！`);
        
        setEventLogs(prev => [...prev, {
          id: prev.length + 1,
          message: `✨ ${currentEvent.name}完了`,
          timestamp: Date.now()
        }]);
        
        refresh();
        return;
      }

      // 戦闘イベントの処理
      if (currentEvent.type === 'battle' || currentEvent.type === 'boss' || currentEvent.type === 'final-boss' || currentEvent.type === 'final_boss') {
      // バトル開始
      gameState.startBattle(currentEvent.enemy);
      refresh();
    } else if (currentEvent.type === 'choice') {
      // 選択イベントUI表示
      setCurrentChoiceEvent(currentEvent);
      setShowChoiceEvent(true);
    } else if (currentEvent.type === 'free') {
      // 自由行動フェーズ - ランダム選択イベント発生
      const choiceEvent = gameState.triggerFreeActionChoiceEvent();
      if (choiceEvent.occurred) {
        setCurrentFreeActionEvent(choiceEvent.event);
        setShowFreeActionEvent(true);
      } else {
        // 通常の自由行動完了
        gameState.completeChapterEvent(currentEvent.id);
        const message = `${currentEvent.name}を完了しました！自由な時間を過ごしました。`;
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
    
    // ユーザーアクティビティを記録
    gameState.updateCurrentView(currentView);
    
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

  // 自由行動選択イベント処理
  const handleFreeActionChoice = (choiceId) => {
    if (!currentFreeActionEvent) return;
    
    // ユーザーアクティビティを記録
    gameState.updateCurrentView(currentView);
    
    const result = gameState.processFreeActionChoice(currentFreeActionEvent.id, choiceId);
    
    if (result.success) {
      let message = result.message;
      
      // 戦闘が発生した場合
      if (result.battleTriggered && result.battleEnemy) {
        message += '\n\n⚔️ 戦闘が発生しました！';
        
        // 章イベント完了処理（自由行動フェーズ完了）
        const currentEvent = gameState.getCurrentChapterEvent();
        if (currentEvent && currentEvent.type === 'free') {
          gameState.completeChapterEvent(currentEvent.id);
        }
        
        // バトルシステムに移行
        gameState.startBattle(result.battleEnemy);
        setShowFreeActionEvent(false);
        setCurrentFreeActionEvent(null);
        
        setEventLogs(prev => [...prev, {
          id: prev.length + 1,
          message: message,
          timestamp: Date.now()
        }]);
        
        refresh();
        return;
      }
      
      setActionMessage(message);
      
      setEventLogs(prev => [...prev, {
        id: prev.length + 1,
        message: message,
        timestamp: Date.now()
      }]);
      
      // 章イベント完了処理（自由行動フェーズ完了）
      const currentEvent = gameState.getCurrentChapterEvent();
      if (currentEvent && currentEvent.type === 'free') {
        gameState.completeChapterEvent(currentEvent.id);
      }
      
      // 選択イベント終了
      setShowFreeActionEvent(false);
      setCurrentFreeActionEvent(null);
      
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
              { key: 'chat', label: 'チャット' },
              { key: 'log', label: 'ログ' },
              ...(gameState.isAdmin ? [{ key: 'workspace', label: '🔍 監視' }] : [])
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setCurrentView(tab.key);
                  // ビュー変更をゲームステートに通知
                  gameState.updateCurrentView(tab.key);
                  
                  // ワークスペース監視画面を開いた場合は統計を取得
                  if (tab.key === 'workspace' && gameState.isAdmin) {
                    setWorkspaceStats(gameState.getWorkspaceStats());
                  }
                }}
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
                     (currentEvent.type === 'battle' || currentEvent.type === 'boss' || currentEvent.type === 'final_boss' ? '⚔️ 戦闘開始' : 
                      currentEvent.type === 'ceremony' ? '🎓 式典参加' :
                      currentEvent.type === 'declaration' ? '✨ 決意表明' : '✨ イベント開始')}
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
              onNPCEvent={handleNPCEvent}
              playerSP={gameState.playerStats.sp}
              playerHP={gameState.playerStats.hp}
              gameState={gameState}
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
                        // ユーザーアクティビティを記録
                        gameState.updateCurrentView(currentView);
                        
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
                          <span>{purchase.itemName || purchase.name || '不明なアイテム'}</span>
                          <span>¥{(purchase.price || purchase.cost || 0).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                          {new Date(purchase.purchaseDate || purchase.timestamp || Date.now()).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ガチャセクション（機能フラグで制御） */}
              {gameState.isFeatureEnabled('gachaSystem') && (
                <div style={{ marginTop: '3rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: '#4a5568', borderBottom: '2px solid #f39c12', paddingBottom: '0.5rem' }}>
                    🎰 ガチャシステム
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {[
                      { type: 'normal', name: 'ノーマルガチャ', cost: 300, color: '#17a2b8', description: '基本的なアイテムが出現' },
                      { type: 'premium', name: 'プレミアムガチャ', cost: 1500, color: '#6f42c1', description: 'レアアイテムの確率UP' },
                      { 
                        type: 'special', 
                        name: 'スペシャルガチャ', 
                        cost: 3000, 
                        color: '#fd7e14', 
                        description: gameState.isFeatureEnabled('superRareItems') 
                          ? '伝説級・神話級アイテムが狙える！' 
                          : 'エピック級アイテムが狙える！'
                      }
                    ].map(gacha => (
                      <div key={gacha.type} style={{
                        background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
                        border: `3px solid ${gacha.color}`,
                        borderRadius: 12,
                        padding: '1.5rem',
                        textAlign: 'center',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        <h5 style={{ margin: '0 0 0.5rem 0', color: gacha.color, fontSize: '1.1rem' }}>
                          {gacha.name}
                        </h5>
                        <p style={{ margin: '0 0 1rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                          {gacha.description}
                        </p>
                        <div style={{ 
                          background: gacha.color, 
                          color: 'white', 
                          padding: '0.5rem', 
                          borderRadius: 8, 
                          marginBottom: '1rem',
                          fontWeight: 'bold'
                        }}>
                          ¥{gacha.cost.toLocaleString()}
                        </div>
                        <button
                          onClick={() => {
                            const result = gameState.performGacha(gacha.type);
                            if (result.success) {
                              setActionMessage(`🎉 ${result.message}`);
                              setTimeout(() => setActionMessage(''), 4000);
                              refresh();
                            } else {
                              alert(result.message);
                            }
                          }}
                          disabled={gameState.playerStats.money < gacha.cost}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: gameState.playerStats.money >= gacha.cost ? gacha.color : '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: gameState.playerStats.money >= gacha.cost ? 'pointer' : 'not-allowed',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                          }}
                        >
                          {gameState.playerStats.money >= gacha.cost ? '🎰 ガチャを引く' : '💰 所持金不足'}
                        </button>
                        {gacha.type === 'special' && (
                          <div style={{
                            marginTop: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            background: gameState.isFeatureEnabled('superRareItems') ? '#d4edda' : '#f8d7da',
                            color: gameState.isFeatureEnabled('superRareItems') ? '#155724' : '#721c24',
                            borderRadius: 4,
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                           
                          </div>
                        )}
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
                        // ユーザーアクティビティを記録
                        gameState.updateCurrentView(currentView);
                        
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
                                  // ユーザーアクティビティを記録
                                  gameState.updateCurrentView(currentView);
                                  
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
                                  // ユーザーアクティビティを記録
                                  gameState.updateCurrentView(currentView);
                                  
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
                      // ユーザーアクティビティを記録
                      gameState.updateCurrentView(currentView);
                      
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
                        // ユーザーアクティビティを記録
                        gameState.updateCurrentView(currentView);
                        
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
              
              {/* チャット管理セクション */}
              {gameState.isFeatureEnabled('playerChat') && (
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ marginBottom: '0.75rem', color: '#4a5568', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    💬 チャット管理
                  </h4>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <button
                      onClick={() => {
                        const result = gameState.getChatStats();
                        if (result.success) {
                          const stats = result.stats;
                          alert(`チャット統計:\n総メッセージ: ${stats.totalMessages}\n1時間以内: ${stats.messagesLastHour}\n1日以内: ${stats.messagesLastDay}\nブロック済みユーザー: ${stats.blockedUsers}\n報告済みメッセージ: ${stats.reportedMessages}\nアクティブユーザー: ${stats.activeUsers}`);
                        }
                      }}
                      style={{
                        padding: '0.75rem',
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      📊 チャット統計表示
                    </button>
                    
                    <button
                      onClick={() => {
                        const playerId = prompt('ブロックするプレイヤーIDを入力してください:');
                        if (playerId) {
                          const result = gameState.blockPlayerFromChat(playerId);
                          setActionMessage(result.success ? result.message : `❌ ${result.message}`);
                          setTimeout(() => setActionMessage(''), 3000);
                        }
                      }}
                      style={{
                        padding: '0.75rem',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🚫 ユーザーブロック
                    </button>
                    
                    <button
                      onClick={() => {
                        const playerId = prompt('ブロック解除するプレイヤーIDを入力してください:');
                        if (playerId) {
                          const result = gameState.unblockPlayerFromChat(playerId);
                          setActionMessage(result.success ? result.message : `❌ ${result.message}`);
                          setTimeout(() => setActionMessage(''), 3000);
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
                      ✅ ブロック解除
                    </button>
                  </div>
                </div>
              )}
              
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

              {/* 機能フラグ管理セクション */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '0.75rem', color: '#4a5568', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  🚩 機能フラグ管理 (大規模アップデート用)
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '0.5rem',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  background: '#f8f9fa'
                }}>
                  {Object.entries(gameState.getFeatureFlags()).map(([feature, enabled]) => (
                    <div key={feature} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem',
                      background: enabled ? '#d4edda' : '#f8d7da',
                      borderRadius: 4,
                      border: `1px solid ${enabled ? '#c3e6cb' : '#f5c6cb'}`
                    }}>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold',
                        color: enabled ? '#155724' : '#721c24'
                      }}>
                        {feature}
                      </span>
                      <button
                        onClick={() => {
                          if (gameState.toggleFeatureFlag(feature)) {
                            setActionMessage(`${feature}を${gameState.featureFlags[feature] ? '有効' : '無効'}にしました`);
                            setTimeout(() => setActionMessage(''), 2000);
                            refresh();
                          }
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: enabled ? '#dc3545' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: 3,
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {enabled ? 'OFF' : 'ON'}
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6c757d' }}>
                  ⚠️ 注意: 機能フラグの変更は既存プレイヤーのゲーム進行に影響する可能性があります
                </div>
                
                {/* 機能フラグ強制更新 */}
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: 4 }}>
                  <h6 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>🔄 既存プレイヤー向け機能フラグ更新</h6>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#856404' }}>
                    既存のセーブデータを持つプレイヤーの機能フラグを最新のデフォルト設定に強制更新します。
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('既存プレイヤーの機能フラグを最新設定に更新しますか？\n\n通常機能は全て有効になり、チート系機能の設定は保持されます。')) {
                        gameState.upgradeFeatureFlags();
                        setActionMessage('機能フラグを最新設定に更新しました！');
                        setTimeout(() => setActionMessage(''), 3000);
                        refresh();
                      }
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#ffc107',
                      color: '#000',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}
                  >
                    🚀 機能フラグを最新に更新
                  </button>
                </div>
                
                {/* ロールアウト計画表示 */}
                <div style={{ marginTop: '1rem' }}>
                  <h5 style={{ margin: '0.5rem 0', color: '#495057' }}>📋 段階的ロールアウト計画</h5>
                  <div style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    border: '1px solid #dee2e6',
                    borderRadius: 4,
                    background: '#ffffff'
                  }}>
                    {Object.entries(gameState.planFeatureRollout()).map(([phaseKey, phase]) => (
                      <div key={phaseKey} style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid #e9ecef',
                        background: phase.riskLevel === 'high' ? '#fff3cd' : 
                                   phase.riskLevel === 'medium' ? '#d4edda' : '#d1ecf1'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {phase.name} ({phase.estimatedTime})
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                          リスク: {phase.riskLevel} | 機能: {phase.features.join(', ')}
                        </div>
                        {phase.status === 'completed' ? (
                          <div style={{
                            padding: '0.25rem 0.5rem',
                            background: '#28a745',
                            color: 'white',
                            borderRadius: 3,
                            fontSize: '0.7rem',
                            textAlign: 'center'
                          }}>
                            ✅ 全機能有効
                          </div>
                        ) : phase.status === 'manual_only' ? (
                          <div style={{
                            padding: '0.25rem 0.5rem',
                            background: '#dc3545',
                            color: 'white',
                            borderRadius: 3,
                            fontSize: '0.7rem',
                            textAlign: 'center'
                          }}>
                            🔒 手動有効化のみ
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              let enabledCount = 0;
                              phase.features.forEach(feature => {
                                if (gameState.enableFeatureSafely(feature, true)) {
                                  enabledCount++;
                                }
                              });
                              if (enabledCount > 0) {
                                setActionMessage(`${phase.name}の${enabledCount}個の機能を有効化しました`);
                                setTimeout(() => setActionMessage(''), 3000);
                                refresh();
                              }
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: 3,
                              cursor: 'pointer',
                              fontSize: '0.7rem'
                            }}
                          >
                            このフェーズを有効化
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 章進行デバッグ情報 */}
                <div style={{ marginTop: '1rem' }}>
                  <h5 style={{ margin: '0.5rem 0', color: '#495057' }}>🔍 章進行デバッグ情報</h5>
                  <div style={{ 
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: 4,
                    padding: '1rem',
                    fontSize: '0.85rem'
                  }}>
                    {(() => {
                      const debugInfo = gameState.getChapterDebugInfo();
                      return (
                        <div>
                          <div><strong>現在の章:</strong> {debugInfo.currentChapter}</div>
                          <div><strong>進路選択:</strong> {debugInfo.playerPath || '未選択'}</div>
                          <div><strong>完了イベント:</strong> {debugInfo.completedEvents}/{debugInfo.totalEvents}</div>
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>機能フラグ状態:</strong>
                            <ul style={{ marginTop: '0.25rem', paddingLeft: '1rem' }}>
                              <li>第3章: {debugInfo.featureFlags.chapter3 ? '✅ 有効' : '❌ 無効'}</li>
                              <li>第4章: {debugInfo.featureFlags.chapter4 ? '✅ 有効' : '❌ 無効'}</li>
                              <li>第5章: {debugInfo.featureFlags.chapter5 ? '✅ 有効' : '❌ 無効'}</li>
                              <li>第6章: {debugInfo.featureFlags.chapter6 ? '✅ 有効' : '❌ 無効'}</li>
                              <li>第7章: {debugInfo.featureFlags.chapter7 ? '✅ 有効' : '❌ 無効'}</li>
                              <li>第8章: {debugInfo.featureFlags.chapter8 ? '✅ 有効' : '❌ 無効'}</li>
                            </ul>
                          </div>
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>進路別利用可能性:</strong>
                            <ul style={{ marginTop: '0.25rem', paddingLeft: '1rem' }}>
                              <li>第4章(高専): {debugInfo.pathAvailability?.chapter4_kosen ? '✅ 利用可能' : '❌ 利用不可'}</li>
                              <li>第4章(大学): {debugInfo.pathAvailability?.chapter4_university ? '✅ 利用可能' : '❌ 利用不可'}</li>
                              <li>第5章(高専): {debugInfo.pathAvailability?.chapter5_kosen ? '✅ 利用可能' : '❌ 利用不可'}</li>
                              <li>第5章(大学): {debugInfo.pathAvailability?.chapter5_university ? '✅ 利用可能' : '❌ 利用不可'}</li>
                            </ul>
                          </div>
                          {debugInfo.chapterEvents && debugInfo.chapterEvents.length > 0 && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <strong>章イベント状況:</strong>
                              <ul style={{ marginTop: '0.25rem', paddingLeft: '1rem' }}>
                                {debugInfo.chapterEvents.map((event, index) => (
                                  <li key={index}>
                                    {event.completed ? '✅' : '⏳'} {event.name} ({event.type})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              console.log('章デバッグ情報:', debugInfo);
                              setActionMessage('章デバッグ情報をコンソールに出力しました');
                              setTimeout(() => setActionMessage(''), 3000);
                            }}
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.25rem 0.5rem',
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: 3,
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              marginRight: '0.5rem'
                            }}
                          >
                            詳細をコンソールに出力
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('本当に次の章に強制的に進みますか？これは緊急時のみ使用してください。')) {
                                gameState.currentChapter += 1;
                                gameState.currentWeek = 1;
                                gameState.initializeChapter(gameState.currentChapter);
                                gameState.performAutoSave();
                                setActionMessage(`第${gameState.currentChapter}章に強制進行しました`);
                                setTimeout(() => setActionMessage(''), 3000);
                                refresh();
                              }
                            }}
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.25rem 0.5rem',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: 3,
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              marginRight: '0.5rem'
                            }}
                          >
                            🚨 強制次章進行
                          </button>
                          <button
                            onClick={() => {
                              const path = prompt('進路を設定してください (kosen/university):');
                              if (path === 'kosen' || path === 'university') {
                                gameState.playerPath = path;
                                gameState.performAutoSave();
                                setActionMessage(`進路を${path}に設定しました`);
                                setTimeout(() => setActionMessage(''), 3000);
                                refresh();
                              } else if (path !== null) {
                                setActionMessage('無効な進路です');
                                setTimeout(() => setActionMessage(''), 3000);
                              }
                            }}
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.25rem 0.5rem',
                              background: '#ffc107',
                              color: '#000',
                              border: 'none',
                              borderRadius: 3,
                              cursor: 'pointer',
                              fontSize: '0.7rem'
                            }}
                          >
                            🎓 進路強制設定
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'chat' && (
            <div style={{ height: '85vh' }}>
              <PlayerChat 
                gameState={gameState}
                onActionMessage={setActionMessage}
              />
            </div>
          )}

          {currentView === 'log' && (
            <div>
              {/* 操作説明セクション（機能フラグで制御） */}
              {gameState.isFeatureEnabled('tutorialLogs') && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ 
                    color: '#495057', 
                    borderBottom: '2px solid #007bff', 
                    paddingBottom: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    📚 操作説明・ガイド
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {getAllTutorialLogs().map(tutorial => (
                      <details key={tutorial.id} style={{
                        border: '1px solid #dee2e6',
                        borderRadius: 6,
                        padding: '1rem',
                        background: '#f8f9fa'
                      }}>
                        <summary style={{
                          fontWeight: 'bold',
                          color: '#495057',
                          cursor: 'pointer',
                          marginBottom: '0.5rem'
                        }}>
                          {tutorial.title}
                        </summary>
                        <div style={{
                          fontSize: '0.9rem',
                          lineHeight: '1.6',
                          color: '#6c757d',
                          whiteSpace: 'pre-line',
                          marginTop: '0.5rem'
                        }}>
                          {tutorial.content}
                        </div>
                      </details>
                    ))}
                  </div>
                  <div style={{
                    margin: '1rem 0',
                    height: '2px',
                    background: 'linear-gradient(to right, #007bff, transparent)',
                    borderRadius: 1
                  }}></div>
                </div>
              )}
              
              {/* 機能フラグが無効の場合の表示 */}
              {!gameState.isFeatureEnabled('tutorialLogs') && (
                <div style={{
                  marginBottom: '2rem',
                  padding: '1rem',
                  background: '#e9ecef',
                  borderRadius: 6,
                  textAlign: 'center',
                  color: '#6c757d'
                }}>
                  💡 操作説明機能は準備中です（管理者モードで有効化可能）
                </div>
              )}

              <EventLog events={eventLogs} />
            </div>
          )}

          {currentView === 'workspace' && gameState.isAdmin && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(220, 53, 69, 0.1)',
                borderRadius: 8,
                border: '2px solid #dc3545'
              }}>
                <h3 style={{ margin: 0, color: '#dc3545' }}>
                  🔍 ワークスペース監視システム
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                    <input
                      type="checkbox"
                      checked={autoRefreshWorkspace}
                      onChange={(e) => setAutoRefreshWorkspace(e.target.checked)}
                      style={{ marginRight: '0.25rem' }}
                    />
                    自動更新
                  </label>
                  <button
                    onClick={() => {
                      setWorkspaceStats(gameState.getWorkspaceStats());
                      setSelectedPlayer(null);
                      setPlayerDetails(null);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    🔄 更新
                  </button>
                </div>
              </div>

              {workspaceStats && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {/* 概要統計 */}
                  <div style={{
                    background: '#f8f9fa',
                    border: '2px solid #dee2e6',
                    borderRadius: 8,
                    padding: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
                      📊 接続状況概要
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <div style={{ textAlign: 'center', padding: '0.75rem', background: '#e3f2fd', borderRadius: 6 }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>
                          {workspaceStats.overview.totalActivePlayers}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#424242' }}>総接続数</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '0.75rem', background: '#fff3e0', borderRadius: 6 }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f57c00' }}>
                          {workspaceStats.overview.adminSessions}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#424242' }}>管理者</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f3e5f5', borderRadius: 6 }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7b1fa2' }}>
                          {workspaceStats.overview.regularSessions}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#424242' }}>一般ユーザー</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '0.75rem', background: '#ffebee', borderRadius: 6 }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d32f2f' }}>
                          {workspaceStats.suspiciousActivity.highRiskPlayers}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#424242' }}>高リスク</div>
                      </div>
                    </div>
                  </div>

                  {/* 不正行為統計 */}
                  <div style={{
                    background: '#fff8e1',
                    border: '2px solid #ffb74d',
                    borderRadius: 8,
                    padding: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#e65100' }}>
                      ⚠️ セキュリティ状況
                    </h4>
                    <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>総不正行為検知数:</span>
                        <span style={{ fontWeight: 'bold', color: '#d84315' }}>
                          {workspaceStats.suspiciousActivity.totalSuspiciousActivities}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>不正行為者数:</span>
                        <span style={{ fontWeight: 'bold', color: '#f57c00' }}>
                          {workspaceStats.suspiciousActivity.playersWithSuspiciousActivity}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>高リスクプレイヤー:</span>
                        <span style={{ fontWeight: 'bold', color: '#d32f2f' }}>
                          {workspaceStats.suspiciousActivity.highRiskPlayers}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* チャット統計 */}
                  {gameState.isFeatureEnabled('playerChat') && (() => {
                    const chatStatsResult = gameState.getChatStats();
                    return chatStatsResult.success ? (
                      <div style={{
                        background: '#e3f2fd',
                        border: '2px solid #2196f3',
                        borderRadius: 8,
                        padding: '1rem'
                      }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>
                          💬 チャット統計
                        </h4>
                        <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>総メッセージ数:</span>
                            <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                              {chatStatsResult.stats.totalMessages}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>1時間以内メッセージ:</span>
                            <span style={{ fontWeight: 'bold', color: '#388e3c' }}>
                              {chatStatsResult.stats.messagesLastHour}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>1日以内メッセージ:</span>
                            <span style={{ fontWeight: 'bold', color: '#388e3c' }}>
                              {chatStatsResult.stats.messagesLastDay}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>アクティブチャットユーザー:</span>
                            <span style={{ fontWeight: 'bold', color: '#7b1fa2' }}>
                              {chatStatsResult.stats.activeUsers}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>ブロック済みユーザー:</span>
                            <span style={{ fontWeight: 'bold', color: '#d32f2f' }}>
                              {chatStatsResult.stats.blockedUsers}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>報告済みメッセージ:</span>
                            <span style={{ fontWeight: 'bold', color: '#f57c00' }}>
                              {chatStatsResult.stats.reportedMessages}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* アクティブセッション一覧 */}
                  <div style={{
                    background: '#f8f9fa',
                    border: '2px solid #dee2e6',
                    borderRadius: 8,
                    padding: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
                      👥 アクティブセッション ({workspaceStats.activeSessions.length}件)
                    </h4>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {workspaceStats.activeSessions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1rem', color: '#6c757d' }}>
                          アクティブセッションがありません
                        </div>
                      ) : (
                        workspaceStats.activeSessions.map((session, index) => (
                          <div key={index} style={{
                            background: session.isAdmin ? '#e8f5e8' : 
                                       session.suspiciousActivity >= 5 ? '#ffebee' : 
                                       session.suspiciousActivity > 2 ? '#fff3e0' : 'white',
                            border: `1px solid ${session.isAdmin ? '#4caf50' : 
                                                session.suspiciousActivity >= 5 ? '#f44336' : 
                                                session.suspiciousActivity > 2 ? '#ff9800' : '#e0e0e0'}`,
                            borderRadius: 6,
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => {
                            setSelectedPlayer(session.sessionId);
                            setPlayerDetails(gameState.getPlayerDetails(session.sessionId));
                          }}
                          onMouseOver={(e) => e.target.style.transform = 'scale(1.01)'}
                          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                {session.isAdmin ? '👑 ' : '👤 '}
                                Player {session.sessionId.substring(0, 8)}...
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                                {session.currentView}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                              接続: {session.startTime} | 最終活動: {session.lastActivity}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.8rem' }}>
                                画面: {session.screenInfo}
                              </div>
                              {session.suspiciousActivity > 0 && (
                                <div style={{
                                  background: session.suspiciousActivity >= 5 ? '#f44336' : '#ff9800',
                                  color: 'white',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: 8,
                                  fontSize: '0.7rem'
                                }}>
                                  不正: {session.suspiciousActivity}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* プレイヤー詳細表示 */}
                  {selectedPlayer && playerDetails && !playerDetails.error && (
                    <div style={{
                      background: '#e3f2fd',
                      border: '2px solid #2196f3',
                      borderRadius: 8,
                      padding: '1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0, color: '#1976d2' }}>
                          🔍 プレイヤー詳細: {playerDetails.playerId.substring(0, 12)}...
                        </h4>
                        <button
                          onClick={() => {
                            setSelectedPlayer(null);
                            setPlayerDetails(null);
                          }}
                          style={{
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer'
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      <div style={{ display: 'grid', gap: '1rem' }}>
                        {/* セッション情報 */}
                        <div style={{ background: 'white', padding: '0.75rem', borderRadius: 6 }}>
                          <h5 style={{ margin: '0 0 0.5rem 0', color: '#424242' }}>セッション情報</h5>
                          <div style={{ fontSize: '0.9rem', color: '#616161' }}>
                            <div>開始時刻: {playerDetails.sessionInfo.startTime}</div>
                            <div>最終活動: {playerDetails.sessionInfo.lastActivity}</div>
                            <div>現在のビュー: {playerDetails.sessionInfo.currentView}</div>
                            <div>管理者: {playerDetails.sessionInfo.isAdmin ? 'はい' : 'いいえ'}</div>
                            <div>リスクレベル: 
                              <span style={{
                                color: playerDetails.riskLevel === 'HIGH' ? '#d32f2f' : 
                                      playerDetails.riskLevel === 'MEDIUM' ? '#f57c00' : '#388e3c',
                                fontWeight: 'bold',
                                marginLeft: '0.25rem'
                              }}>
                                {playerDetails.riskLevel}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 活動ログ */}
                        <div style={{ background: 'white', padding: '0.75rem', borderRadius: 6 }}>
                          <h5 style={{ margin: '0 0 0.5rem 0', color: '#424242' }}>
                            最近の活動 ({playerDetails.activityLogs.length}件)
                          </h5>
                          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {playerDetails.activityLogs.slice(-10).map((log, index) => (
                              <div key={index} style={{
                                fontSize: '0.8rem',
                                padding: '0.25rem 0',
                                borderBottom: index < 9 ? '1px solid #e0e0e0' : 'none',
                                color: log.type === 'suspicious_activity' ? '#d32f2f' : '#616161'
                              }}>
                                <span style={{ fontWeight: 'bold' }}>{log.timestamp}</span> - {log.type}
                                {log.details && (
                                  <div style={{ marginLeft: '1rem', color: '#9e9e9e' }}>
                                    {JSON.stringify(log.details)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 管理アクション */}
                        <div style={{ background: '#ffebee', padding: '0.75rem', borderRadius: 6 }}>
                          <h5 style={{ margin: '0 0 0.5rem 0', color: '#d32f2f' }}>管理アクション</h5>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => {
                                if (confirm(`プレイヤー ${playerDetails.playerId} をキックしますか？`)) {
                                  const result = gameState.executeSecurityAction('kick_player', playerDetails.playerId);
                                  if (result.success) {
                                    alert(result.message);
                                    setWorkspaceStats(gameState.getWorkspaceStats());
                                    setSelectedPlayer(null);
                                    setPlayerDetails(null);
                                  } else {
                                    alert(result.error);
                                  }
                                }
                              }}
                              style={{
                                background: '#d32f2f',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                padding: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              🚫 キック
                            </button>
                            <button
                              onClick={() => {
                                const result = gameState.executeSecurityAction('clear_suspicious', playerDetails.playerId);
                                if (result.success) {
                                  alert(result.message);
                                  setPlayerDetails(gameState.getPlayerDetails(playerDetails.playerId));
                                  setWorkspaceStats(gameState.getWorkspaceStats());
                                } else {
                                  alert(result.error);
                                }
                              }}
                              style={{
                                background: '#ff9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                padding: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              🧹 不正履歴クリア
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* セキュリティログ */}
                  <div style={{
                    background: '#f8f9fa',
                    border: '2px solid #dee2e6',
                    borderRadius: 8,
                    padding: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
                      📋 最近のセキュリティログ
                    </h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.8rem' }}>
                      {workspaceStats.recentSecurityLogs.map((log, index) => (
                        <div key={index} style={{
                          padding: '0.5rem',
                          borderBottom: index < workspaceStats.recentSecurityLogs.length - 1 ? '1px solid #e0e0e0' : 'none',
                          background: log.type === 'security_alert' ? '#ffebee' : 
                                     log.type === 'admin_access' ? '#e8f5e8' : 'transparent'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 'bold' }}>{log.timestamp}</span>
                            <span style={{
                              background: log.type === 'security_alert' ? '#f44336' : 
                                         log.type === 'admin_access' ? '#4caf50' : '#2196f3',
                              color: 'white',
                              padding: '0.125rem 0.375rem',
                              borderRadius: 8,
                              fontSize: '0.7rem'
                            }}>
                              {log.type}
                            </span>
                          </div>
                          <div style={{ color: '#616161' }}>
                            Player: {log.playerId?.substring(0, 8)}...
                          </div>
                          {log.details && (
                            <div style={{ color: '#9e9e9e', marginTop: '0.25rem' }}>
                              {JSON.stringify(log.details, null, 1)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!workspaceStats && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#6c757d',
                  background: '#f8f9fa',
                  borderRadius: 8,
                  border: '2px dashed #dee2e6'
                }}>
                  <p style={{ margin: 0, fontSize: '1.1rem' }}>🔄 データを読み込み中...</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                    更新ボタンをクリックして監視データを取得してください
                  </p>
                </div>
              )}
            </div>
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

      {/* 自由行動選択イベントモーダル */}
      {showFreeActionEvent && currentFreeActionEvent && (
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
              marginBottom: '1rem'
            }}>
              🎲 {currentFreeActionEvent.name}
            </h2>
            
            <div style={{ 
              marginBottom: '1.5rem',
              color: '#4a5568',
              textAlign: 'center',
              lineHeight: '1.6',
              background: '#f7fafc',
              padding: '1rem',
              borderRadius: 8,
              border: '1px solid #e2e8f0'
            }}>
              {currentFreeActionEvent.description}
            </div>

            {currentFreeActionEvent.isBattle && (
              <div style={{ 
                marginBottom: '1rem',
                color: '#d69e2e',
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: 'bold'
              }}>
                ⚠️ 一部の選択肢では戦闘が発生する可能性があります
              </div>
            )}

            <div style={{ 
              marginBottom: '1.5rem',
              color: '#2d3748',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              どうしますか？
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentFreeActionEvent.choices?.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => handleFreeActionChoice(choice.id)}
                  style={{
                    padding: '1rem',
                    background: choice.battleEnemy ? 
                      'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)' :
                      'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
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
                    {choice.battleEnemy && ' ⚔️'}
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