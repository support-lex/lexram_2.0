'use client';

import { useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
  info: <Info className="w-4 h-4 text-[var(--accent)] shrink-0" />,
};

const BORDERS = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  info: 'border-l-[var(--accent)]',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className={`toast flex items-center gap-3 bg-[var(--bg-sidebar)] text-[var(--text-on-sidebar)] px-4 py-3 rounded-xl shadow-2xl border-l-4 font-sans ${BORDERS[toast.type]} min-w-[280px] max-w-[380px]`}>
      {ICONS[toast.type]}
      <p className="flex-1 font-sans text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-[var(--text-muted)] hover:text-white transition-colors ml-1 shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function Toaster({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => {
      const next = [...prev, { id, message, type }];
      return next.length > 4 ? next.slice(next.length - 4) : next;
    });
  }, []);

  return {
    toasts,
    dismiss,
    success: useCallback((msg: string) => addToast(msg, 'success'), [addToast]),
    error: useCallback((msg: string) => addToast(msg, 'error'), [addToast]),
    info: useCallback((msg: string) => addToast(msg, 'info'), [addToast]),
  };
}
