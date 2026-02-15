
import React from 'react';
import { AlertTriangle, X, ShieldAlert, CreditCard, LifeBuoy, Key, Trash2 } from 'lucide-react';

interface ErrorModalProps {
  title: string;
  message: string;
  onClose: () => void;
  onRetryKey?: () => void;
  onClearCache?: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ title, message, onClose, onRetryKey, onClearCache }) => {
  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#15100E] border-2 border-[#8A1C1C]/50 w-full max-w-lg p-10 rounded-[3rem] relative shadow-[0_0_50px_rgba(138,28,28,0.2)]">
        <button onClick={onClose} className="absolute top-8 right-8 text-[#5D4E45] hover:text-[#FDF0C9]">
          <X size={28} />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/40">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{title}</h2>
        </div>

        <p className="text-[#8C7A70] text-sm leading-relaxed mb-10 font-medium">{message}</p>

        <div className="grid grid-cols-1 gap-3">
          {onRetryKey && (
            <button onClick={onRetryKey} className="w-full bg-[#C6934B] text-[#15100E] py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#FDF0C9] transition-all">
              <Key size={18} /> Update Studio Key
            </button>
          )}
          {onClearCache && (
            <button onClick={onClearCache} className="w-full bg-red-600/10 text-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600/20 border border-red-500/30 flex items-center justify-center gap-3 transition-all">
              <Trash2 size={18} /> Wipe Studio Cache
            </button>
          )}
          <button onClick={() => window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank')} className="w-full bg-white/5 text-[#8C7A70] py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 border border-white/10 flex items-center justify-center gap-3">
            <CreditCard size={18} /> Documentation
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
          <button onClick={onClose} className="text-[10px] font-black uppercase text-[#5D4E45] hover:text-[#C6934B] tracking-[0.4em]">Dismiss Alert</button>
        </div>
      </div>
    </div>
  );
};
