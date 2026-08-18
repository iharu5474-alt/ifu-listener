import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'error';
  title: string;
  message?: string;
  code?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-28 sm:bottom-32 right-4 sm:right-8 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`pointer-events-auto flex items-start p-4 rounded-xl border backdrop-blur-xl shadow-2xl ${
            toast.type === 'error'
              ? 'bg-neutral-950/95 border-red-500/40 text-white'
              : toast.type === 'success'
              ? 'bg-neutral-950/95 border-[#E2FF66]/50 text-white'
              : 'bg-neutral-950/95 border-neutral-800 text-white'
          }`}
        >
          <div className="mr-3 mt-0.5 shrink-0">
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#E2FF66]" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-neutral-300" />}
          </div>

          <div className="flex-1 pr-2">
            <div className="flex items-center space-x-2">
              <h4 className="font-sans font-semibold text-sm leading-tight text-white">
                {toast.title}
              </h4>
              {toast.code !== undefined && (
                <span className="font-mono text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                  CODE {toast.code}
                </span>
              )}
            </div>
            {toast.message && (
              <p className="font-sans text-xs text-neutral-400 mt-1 leading-relaxed">
                {toast.message}
              </p>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-neutral-500 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </div>
  );
};
