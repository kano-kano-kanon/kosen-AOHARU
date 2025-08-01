import React from 'react';

/**
 * バトルシステムコンポーネント
 * 設計資料に基づく課題・試験バトルを実装
 */
export default function BattleSystem({ onBattleEnd, enemy, playerStats }) {
  const [battleState, setBattleState] = React.useState({
    playerHP: playerStats?.hp || 100,
    playerSP: playerStats?.sp || 100,
    playerMaxHP: playerStats?.maxHP || 100,
    playerMaxSP: playerStats?.maxSP || 100,
    enemyHP: enemy?.maxHP || 50,
    enemyMaxHP: enemy?.maxHP || 50,
    turn: 1,
    round: 1,
    maxRounds: enemy?.name === '期末試験：総合評価' ? 3 : 1, // 期末試験は3ラウンド
    phase: 'player', // player, enemy, result
    actionLog: [],
    isPlayerTurn: true,
    isFinalExam: enemy?.name === '期末試験：総合評価'
  });

  // 戦闘アクション
  const performAction = (action) => {
    if (battleState.phase !== 'player') return;

    let newState = { ...battleState };
    // 即座にフェーズを変更して重複実行を防ぐ
    newState.phase = 'processing';
    setBattleState(newState);

    let logMessage = '';
    let damage = 0;

    switch (action) {
      case 'consider': // 考察する（通常攻撃）
        damage = Math.floor(Math.random() * 10) + 5 + Math.floor((playerStats?.theory || 25) / 5);
        newState.enemyHP = Math.max(0, newState.enemyHP - damage);
        logMessage = `考察して${damage}ダメージを与えた！`;
        break;
      
      case 'present': // 発表する（スキル技）
        if (newState.playerSP >= 15) {
          damage = Math.floor(Math.random() * 15) + 10 + Math.floor((playerStats?.social || 20) / 3);
          newState.enemyHP = Math.max(0, newState.enemyHP - damage);
          newState.playerSP -= 15;
          logMessage = `発表して${damage}ダメージを与えた！（SP -15）`;
        } else {
          logMessage = 'SPが足りません！';
        }
        break;
      
      case 'bluff': // ごまかす
        damage = Math.floor(Math.random() * 8) + 2 + Math.floor((playerStats?.social || 20) / 4);
        newState.enemyHP = Math.max(0, newState.enemyHP - damage);
        logMessage = `うまくごまかして${damage}ダメージ！`;
        break;
      
      case 'reference': // 参考資料
        const heal = Math.floor(Math.random() * 15) + 10;
        newState.playerHP = Math.min(100, newState.playerHP + heal);
        logMessage = `参考資料でHP ${heal}回復！`;
        break;
      
      default:
        logMessage = '無効なアクションです';
    }

    // ログに追加
    newState.actionLog = [...newState.actionLog, logMessage];
    
    // 敵が倒れた場合
    if (newState.enemyHP <= 0) {
      if (newState.isFinalExam && newState.round < newState.maxRounds) {
        // 期末試験の次のラウンドへ
        newState.round++;
        newState.enemyHP = newState.enemyMaxHP; // HP全回復
        newState.phase = 'round-clear';
        newState.actionLog = [...newState.actionLog, 
          `ラウンド${newState.round - 1}クリア！`, 
          `ラウンド${newState.round}開始！難易度が上昇しました！`
        ];
        setBattleState(newState);
        
        // 1秒後に次のラウンド開始
        setTimeout(() => {
          setBattleState(prev => ({ ...prev, phase: 'player' }));
        }, 1000);
        return;
      } else {
        // 完全勝利
        newState.phase = 'victory';
        newState.actionLog = [...newState.actionLog, 
          newState.isFinalExam ? 
            '期末試験完全制覇！素晴らしい成果です！' : 
            `${enemy?.name || '敵'}を倒した！`
        ];
        setBattleState(newState);
        
        if (onBattleEnd) {
          //console.log('win.onBattleEnd.call');
          const expBonus = newState.isFinalExam ? newState.round * 50 : 0; // 期末試験はラウンドボーナス
          onBattleEnd('victory', {
            exp: (enemy?.expReward || 50) + expBonus,
            submissionBonus: enemy?.submissionBonus || 2,
            finalPlayerHP: newState.playerHP,
            finalPlayerSP: newState.playerSP
          });
        } else {
          console.log('警告：onBattleEndが定義されていません');
        }
        return; // 早期リターンで以降の処理をスキップ
      }
    } else {
      // 敵のターン
      newState.phase = 'enemy';
      setBattleState(newState);
      setTimeout(() => performEnemyAction(newState), 1500);
    }
  };

  // 敵のアクション
  const performEnemyAction = (currentState) => {
    let newState = { ...currentState };
    let damage = 0;
    let logMessage = '';

    // 期末試験はラウンドごとに強化
    const roundMultiplier = newState.isFinalExam ? newState.round : 1;
    
    // 敵の行動パターン
    const actions = ['attack', 'pressure', 'confuse'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    switch (action) {
      case 'attack':
        damage = Math.floor(Math.random() * 12) + 8;
        damage = Math.floor(damage * roundMultiplier); // ラウンド補正
        newState.playerHP = Math.max(0, newState.playerHP - damage);
        logMessage = `${enemy?.name || '敵'}の攻撃！${damage}ダメージを受けた！`;
        if (roundMultiplier > 1) logMessage += `（R${newState.round}強化版）`;
        break;
      
      case 'pressure':
        damage = Math.floor(Math.random() * 8) + 5;
        damage = Math.floor(damage * roundMultiplier); // ラウンド補正
        newState.playerSP = Math.max(0, newState.playerSP - damage);
        logMessage = `${enemy?.name || '敵'}のプレッシャー！SP ${damage}減少！`;
        if (roundMultiplier > 1) logMessage += `（R${newState.round}強化版）`;
        break;
      
      case 'confuse':
        damage = Math.floor(Math.random() * 6) + 3;
        damage = Math.floor(damage * roundMultiplier); // ラウンド補正
        newState.playerHP = Math.max(0, newState.playerHP - damage);
        logMessage = `${enemy?.name || '敵'}の混乱攻撃！${damage}ダメージ！`;
        if (roundMultiplier > 1) logMessage += `（R${newState.round}強化版）`;
        break;
    }

    newState.actionLog = [...newState.actionLog, logMessage];
    newState.turn += 1;

    // プレイヤーが倒れた場合
    if (newState.playerHP <= 0) {
      newState.phase = 'defeat';
      newState.actionLog = [...newState.actionLog, '敗北...'];
      setBattleState(newState);
      
      // 即座に敗北処理を呼び出す（setTimeout削除）
      if (onBattleEnd) {
        onBattleEnd('defeat', { 
          stressPenalty: 10,
          finalPlayerHP: newState.playerHP,
          finalPlayerSP: newState.playerSP
        });
      }
      return; // 早期リターンで以降の処理をスキップ
    } else {
      newState.phase = 'player';
    }

    setBattleState(newState);
  };

  // 逃走
  const runAway = () => {
    const currentState = battleState;
    setBattleState(prev => ({
      ...prev,
      phase: 'escape',
      actionLog: [...prev.actionLog, '戦闘から逃走した...']
    }));
    
    // 即座に逃走処理を呼び出す（setTimeout削除）
    if (onBattleEnd) {
      onBattleEnd('escape', { 
        stressPenalty: 5,
        finalPlayerHP: currentState.playerHP,
        finalPlayerSP: currentState.playerSP
      });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
      color: 'white',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* バトル画面ヘッダー */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 8,
        padding: '1rem',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
          ⚔️ 課題バトル - Turn {battleState.turn}
          {battleState.isFinalExam && (
            <span style={{ color: '#ffd700', marginLeft: '0.5rem' }}>
              Round {battleState.round}/{battleState.maxRounds}
            </span>
          )}
        </h1>
        <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
          {enemy?.name || '謎の課題'} と戦闘中
          {battleState.isFinalExam && (
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginTop: '0.25rem' }}>
              🔥 期末試験 - 最終決戦！
            </div>
          )}
        </div>
      </div>

      {/* バトル状況表示 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        {/* プレイヤー状態 */}
        <div style={{
          background: 'rgba(56, 178, 172, 0.2)',
          border: '2px solid #38b2ac',
          borderRadius: 8,
          padding: '1rem'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>🎓 プレイヤー</h3>
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>HP:</span>
              <span>{battleState.playerHP}/{battleState.playerMaxHP}</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 4,
              overflow: 'hidden',
              marginTop: '0.25rem'
            }}>
              <div style={{
                width: `${(battleState.playerHP / battleState.playerMaxHP) * 100}%`,
                height: '100%',
                background: battleState.playerHP > (battleState.playerMaxHP * 0.3) ? '#38a169' : '#e53e3e',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SP:</span>
              <span>{battleState.playerSP}/{battleState.playerMaxSP}</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 4,
              overflow: 'hidden',
              marginTop: '0.25rem'
            }}>
              <div style={{
                width: `${(battleState.playerSP / battleState.playerMaxSP) * 100}%`,
                height: '100%',
                background: '#3182ce',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* 敵状態 */}
        <div style={{
          background: 'rgba(252, 129, 129, 0.2)',
          border: '2px solid #fc8181',
          borderRadius: 8,
          padding: '1rem'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>📝 {enemy?.name || '謎の課題'}</h3>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>HP:</span>
              <span>{battleState.enemyHP}/{battleState.enemyMaxHP}</span>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              overflow: 'hidden',
              marginTop: '0.25rem'
            }}>
              <div style={{
                width: `${(battleState.enemyHP / battleState.enemyMaxHP) * 100}%`,
                height: '100%',
                background: '#e53e3e',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.8 }}>
            {enemy?.description || '手強い課題が立ちはだかっている...'}
          </div>
        </div>
      </div>

      {/* アクションログ */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 8,
        padding: '1rem',
        height: '200px',
        overflowY: 'auto',
        marginBottom: '1rem',
        border: '2px solid #4a5568'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>📋 戦闘ログ</h4>
        {battleState.actionLog.map((log, index) => (
          <div key={index} style={{
            padding: '0.25rem 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.9rem'
          }}>
            {log}
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      {battleState.phase === 'player' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          <button
            onClick={() => performAction('consider')}
            style={{
              padding: '1rem',
              background: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🤔 考察する
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>通常攻撃</div>
          </button>
          
          <button
            onClick={() => performAction('present')}
            disabled={battleState.playerSP < 15}
            style={{
              padding: '1rem',
              background: battleState.playerSP >= 15 ? '#9f7aea' : '#4a5568',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: battleState.playerSP >= 15 ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              opacity: battleState.playerSP >= 15 ? 1 : 0.6
            }}
          >
            📢 発表する
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>SP -15</div>
          </button>
          
          <button
            onClick={() => performAction('bluff')}
            style={{
              padding: '1rem',
              background: '#38b2ac',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            😅 ごまかす
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>社交性依存</div>
          </button>
          
          <button
            onClick={() => performAction('reference')}
            style={{
              padding: '1rem',
              background: '#68d391',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📚 参考資料
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>HP回復</div>
          </button>
          
          <button
            onClick={runAway}
            style={{
              padding: '1rem',
              background: '#f6ad55',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🏃 諦める
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>逃走</div>
          </button>
        </div>
      )}

      {/* 待機中表示 */}
      {battleState.phase === 'enemy' && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(252, 129, 129, 0.2)',
          borderRadius: 8,
          border: '2px solid #fc8181'
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            {enemy?.name || '課題'}が行動中...
          </div>
          <div style={{ opacity: 0.7 }}>
            しばらくお待ちください
          </div>
        </div>
      )}

      {/* 結果表示 */}
      {(battleState.phase === 'victory' || battleState.phase === 'defeat' || battleState.phase === 'escape') && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: battleState.phase === 'victory' ? 'rgba(56, 161, 105, 0.2)' : 'rgba(229, 62, 62, 0.2)',
          borderRadius: 8,
          border: `2px solid ${battleState.phase === 'victory' ? '#38a169' : '#e53e3e'}`
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            {battleState.phase === 'victory' ? '🎉' : battleState.phase === 'escape' ? '💨' : '💥'}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {battleState.phase === 'victory' ? '課題クリア！' : 
             battleState.phase === 'escape' ? '課題から逃走...' : '課題に敗北...'}
          </div>
        </div>
      )}
    </div>
  );
}
