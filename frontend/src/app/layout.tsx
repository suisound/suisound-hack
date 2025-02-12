import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/cyberpunk.css';
import { WalletProvider } from '../components/WalletProvider';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="HandheldFriendly" content="true" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-black">
        <div className="fixed inset-0 overflow-hidden">
          <div className="h-full w-full overflow-auto">
            <WalletProvider>
              {children}
            </WalletProvider>
          </div>
        </div>
      </body>
    </html>
  );
} 