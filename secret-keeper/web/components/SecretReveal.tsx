'use client';
import React, { useState } from 'react';
import { Lock, Clock, AlertTriangle, RefreshCw, Key } from 'lucide-react';
import { createSecret } from '../lib/api'; // Changed from @/lib/api to relative path

interface SecretFormProps {
  onCreated: (id: string) => void;
}

export default function SecretForm({ onCreated }: SecretFormProps) {
  const [message, setMessage] = useState('');
  const [ttl, setTtl] = useState(3600);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const result = await createSecret(message, ttl);
      onCreated(result.noteId);
    } catch (err) {
      console.error(err);
      alert("Failed to create secret");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-1000"></div>

        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
          <Lock className="w-5 h-5 mr-3 text-indigo-400" />
          Encrypt a New Secret
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Secret Content</label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste your API key, password, or confidential note here..."
                className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-mono text-sm resize-none placeholder:text-slate-700"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Self-Destruct Timer</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={ttl}
                  onChange={(e) => setTtl(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-slate-300 focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                >
                  <option value={300}>5 Minutes</option>
                  <option value={3600}>1 Hour</option>
                  <option value={86400}>24 Hours</option>
                  <option value={604800}>7 Days</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-end">
               <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center text-xs text-amber-500">
                  <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                  Once viewed or expired, data is permanently wiped.
               </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !message}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-4 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-indigo-900/20 active:scale-[0.98]"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : (
              <div className="flex items-center"><Key className="w-5 h-5 mr-2" /> Encrypt & Generate Link</div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}