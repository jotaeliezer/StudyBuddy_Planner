import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#FFF9FB]/80 dark:bg-[#18181b]/80 backdrop-blur-sm no-print"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCancel();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl overflow-hidden border border-pink-100 dark:border-zinc-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-pink-50 dark:border-white/5 bg-[#FFF9FB] dark:bg-zinc-800/50 shrink-0">
              <h3
                id="confirm-dialog-title"
                className="text-xl font-bold text-gray-800 dark:text-gray-100 pr-4"
              >
                {title}
              </h3>
              <button
                type="button"
                onClick={onCancel}
                className="p-2 rounded-full hover:bg-white dark:hover:bg-zinc-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shadow-sm bg-white/50 dark:bg-zinc-800/50 flex-shrink-0"
                aria-label={cancelLabel}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p
                id="confirm-dialog-desc"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed"
              >
                {message}
              </p>
            </div>
            <div className="p-6 pt-0 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-3 rounded-2xl font-bold border border-pink-200 dark:border-zinc-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-800 hover:bg-pink-50 dark:hover:bg-zinc-700 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={cn(
                  'px-5 py-3 rounded-2xl font-bold transition-colors shadow-sm',
                  variant === 'danger'
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50'
                    : 'bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white shadow-[0_8px_30px_rgb(236,72,153,0.25)]'
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
