import React from 'react';

/**
 * タイトル画面コンポーネント
 * 高専RPG「青春オーバードライブ」のタイトル画面
 */
export default function TitleScreen({ onStart }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      <div style={{
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: 20,
        padding: '3rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxWidth: '600px',
        width: '90%'
      }}>
        {/* ゲームタイトル */}
        <h1 style={{
          fontSize: '3rem',
          margin: '0 0 1rem 0',
          background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
          fontWeight: 'bold'
        }}>
          高専RPG
        </h1>
        
        <h2 style={{
          fontSize: '1.8rem',
          margin: '0 0 2rem 0',
          color: '#e2e8f0',
          fontWeight: 'normal'
        }}>
          青春オーバードライブ
        </h2>

        {/* 説明文 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            color: '#ffd700',
            fontSize: '1.2rem'
          }}>
            ゲーム概要
          </h3>
          <p style={{
            margin: '0 0 1rem 0',
            lineHeight: 1.6,
            color: '#e2e8f0'
          }}>
            高専生活をRPGで体験！講義、課題、研究、人間関係...
            <br />
            すべてがあなたの選択にかかっています。
          </p>
          <div style={{ fontSize: '0.9rem', color: '#cbd5e0' }}>
            <div>📚 学業システム：提出力・理論力・社交性を育成</div>
            <div>💕 好感度システム：NPCとの関係を深めよう</div>
            <div>⚔️ バトルシステム：課題や試験を戦闘で表現</div>
            <div>🎓 進級システム：条件を満たして次の章へ</div>
          </div>
        </div>

        {/* 操作説明 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 8,
          padding: '1rem',
          marginBottom: '2rem',
          fontSize: '0.9rem',
          color: '#cbd5e0'
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>基本操作:</strong>
          </div>
          <div>• 行動選択でステータスを成長させよう</div>
          <div>• NPCと交流して好感度を上げよう</div>
          <div>• ストレス管理を忘れずに！</div>
        </div>

        {/* スタートボタン */}
        <button
          onClick={onStart}
          style={{
            background: 'linear-gradient(45deg, #4299e1, #3182ce)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(66, 153, 225, 0.4)',
            transform: 'scale(1)',
            minWidth: '200px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 20px rgba(66, 153, 225, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 15px rgba(66, 153, 225, 0.4)';
            }}
          >
            <img
            src="/favicon.ico"
            alt="ゲームアイコン"
            style={{
              width: '1.5rem',
              height: '1.5rem',
              verticalAlign: 'middle',
              marginRight: '0.5rem'
            }}
            />
            ゲームスタート
          </button>

          {/* バージョン情報 */}
        <div style={{
          marginTop: '2rem',
          fontSize: '0.8rem',
          color: '#a0aec0',
          opacity: 0.7
        }}>
          Version 3.0.0 - γ版
        </div>
      </div>

      {/* 背景アニメーション用のスタイル */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
