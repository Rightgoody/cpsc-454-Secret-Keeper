import React from 'react';
import { Shield } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
          <Shield className="w-6 h-6 text-indigo-400" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          ZeroVault
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-xs font-mono text-slate-500 hidden sm:block">
          AES-256-GCM / AWS KMS
        </span>
        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
      </div>
    </header>
  );
}