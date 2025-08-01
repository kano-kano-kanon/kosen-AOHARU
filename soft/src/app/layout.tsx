import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: '青春オーバードライブ',
  description: 'Game project using Next.js + React',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
