import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Serverless Secret Keeper',
  description: 'Zero-trust encrypted note sharing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-200 min-h-screen selection:bg-indigo-500/30`}>
        <Header />
        <main className="container mx-auto px-4 py-12">
          {children}
        </main>
      </body>
    </html>
  );
}