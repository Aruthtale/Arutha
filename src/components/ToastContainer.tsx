import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../hooks/useToast';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[300px] max-w-sm",
              toast.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-100",
              toast.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-100",
              toast.type === 'info' && "bg-rpg-border/20 border-rpg-border/50 text-rpg-text"
            )}
          >
            <div className="shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-jiwa" />}
            </div>
            
            <p className="flex-1 text-sm font-medium leading-snug">
              {toast.message}
            </p>

            <button 
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors opacity-50 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
