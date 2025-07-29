'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // メインゲーム画面に管理者フラグ付きでリダイレクト
    router.replace('/#admin');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#2d3748', marginBottom: '1rem' }}>🔧 管理者モードへ移行中...</h2>
        <p style={{ color: '#4a5568' }}>自動的にリダイレクトされます</p>
      </div>
    </div>
  );
}
