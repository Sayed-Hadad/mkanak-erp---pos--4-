import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotificationStore } from '../store';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ToastContainer = () => {
  const { toasts, removeToast } = useNotificationStore();

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />,
    info: <Info className="text-indigo-500" size={20} />,
  };

  const bgColors = {
    success: "bg-emerald-50 border-emerald-100",
    error: "bg-red-50 border-red-100",
    warning: "bg-amber-50 border-amber-100",
    info: "bg-indigo-50 border-indigo-100",
  };

  return (
    <div className="fixed bottom-8 left-8 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "pointer-events-auto min-w-[320px] max-w-md p-4 rounded-2xl border shadow-xl flex gap-3 items-start",
              bgColors[toast.type]
            )}
          >
            <div className="shrink-0 mt-0.5">
              {icons[toast.type]}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">{toast.title}</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors text-slate-400"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
