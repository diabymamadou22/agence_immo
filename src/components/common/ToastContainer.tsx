import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { removeToast } from '../../store/uiSlice';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  React.useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        dispatch(removeToast(toasts[0].id));
      }, toasts[0].duration || 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts, dispatch]);

  return (
    <div id="toast-container" className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          let bg = 'bg-slate-900 text-white border-slate-700';
          let Icon = Info;
          if (t.type === 'success') {
            bg = 'bg-emerald-900/95 text-white border-emerald-700';
            Icon = CheckCircle2;
          } else if (t.type === 'warning') {
            bg = 'bg-amber-900/95 text-white border-amber-700';
            Icon = AlertTriangle;
          } else if (t.type === 'error') {
            bg = 'bg-rose-900/95 text-white border-rose-700';
            Icon = AlertCircle;
          }

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md ${bg}`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm font-medium leading-snug">{t.message}</div>
              <button
                id={`close-toast-${t.id}`}
                onClick={() => dispatch(removeToast(t.id))}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
