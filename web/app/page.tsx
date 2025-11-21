'use client';
import { useState } from 'react';
import SecretForm from '../components/SecretForm'; // Changed from @/components/SecretForm to relative path
import { Check, Copy, RefreshCw } from 'lucide-react';

// We include the "SuccessView" logic inside this page component or as a sub-component
// to keep the file structure exactly as requested in the image (which only listed SecretForm/SecretReveal).

function SuccessView({ noteId, onReset }: { noteId: string; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/${noteId}` : noteId;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto text-center animate-in zoom-in-95 duration-500">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-8">
        <Check className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Secret Secured</h2>
      <p className="text-slate-400 mb-8">
        Your secret has been encrypted with AES-256 and stored securely. 
        Share this link to allow one-time access.
      </p>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between mb-8 group hover:border-slate-700 transition-colors">
        <code className="text-indigo-400 font-mono truncate mr-4 text-sm">{shareUrl}</code>
        <button onClick={handleCopy} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>

      <button onClick={onReset} className="text-slate-400 hover:text-white transition-colors flex items-center justify-center mx-auto">
        <RefreshCw className="w-4 h-4 mr-2" /> Encrypt another secret
      </button>
    </div>
  );
}

export default function HomePage() {
  const [createdId, setCreatedId] = useState<string | null>(null);

  return (
    <>
      {!createdId ? (
        <SecretForm onCreated={(id) => setCreatedId(id)} />
      ) : (
        <SuccessView 
          noteId={createdId} 
          onReset={() => setCreatedId(null)} 
        />
      )}
    </>
  );
}