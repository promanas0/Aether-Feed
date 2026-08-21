import React from 'react';
import { Bell, CheckCircle2, ArrowUpCircle, Radio, X } from 'lucide-react';
import { ToastMessage } from '../../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 bg-[#1E293B] border border-[#334155] rounded-xl shadow-glow-sm text-slate-100 animate-slide-in backdrop-blur-md"
        >
          <div className="mt-0.5 text-blue-400 shrink-0">
            {toast.type === 'broadcast' && <Radio className="w-4 h-4 text-blue-400 animate-pulse" />}
            {toast.type === 'vote' && <ArrowUpCircle className="w-4 h-4 text-blue-500" />}
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
            {toast.type === 'info' && <Bell className="w-4 h-4 text-slate-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white tracking-wide">{toast.title}</p>
            {toast.description && (
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{toast.description}</p>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
