import React, { useState } from 'react';
import { DailyMood, Mood } from '../types';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { MOOD_ENTRIES } from '../constants/moods';

interface MoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mood: DailyMood) => void;
  currentMood?: Mood;
}

export function MoodModal({ isOpen, onClose, onSave, currentMood }: MoodModalProps) {
  const [selectedMood, setSelectedMood] = useState<Mood | undefined>(currentMood);
  const today = format(new Date(), 'yyyy-MM-dd');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMood) {
      onSave({ date: today, mood: selectedMood });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FFF9FB]/80 dark:bg-[#18181b]/80 backdrop-blur-sm no-print">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl overflow-hidden border border-pink-100 dark:border-zinc-800 flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center p-6 border-b border-pink-50 dark:border-white/5 bg-[#FFF9FB] dark:bg-zinc-800/50 shrink-0">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            How are you? ✨
          </h3>
          <button onClick={onClose} type="button" className="p-2 rounded-full hover:bg-white dark:hover:bg-zinc-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shadow-sm bg-white/50 dark:bg-zinc-800/50 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">
            Log your mood for {format(new Date(), 'MMMM do')}
          </p>
          
          <div className="grid grid-cols-4 gap-3">
            {MOOD_ENTRIES.map(m => (
              <button
                key={m.type}
                type="button"
                onClick={() => setSelectedMood(m.type)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300",
                  selectedMood === m.type 
                    ? cn(m.color, "[transform:translateY(-2px)_scale(1.05)] shadow-md") 
                    : "bg-gray-50 dark:bg-zinc-800 border-transparent hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-400 dark:text-gray-500 hover:[transform:translateY(-2px)_scale(1.05)]"
                )}
              >
                <span className="text-3xl">{m.emoji}</span>
                <span className={cn(
                  'text-[9px] uppercase font-black tracking-wide text-center opacity-70',
                  selectedMood !== m.type && 'opacity-40'
                )}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
          
          <button 
            type="submit"
            disabled={!selectedMood}
            className="w-full py-4 rounded-2xl bg-pink-500 text-white font-bold text-lg hover:bg-pink-600 shadow-lg hover:shadow-pink-300/40 transition-all active:scale-[0.98] disabled:opacity-30 disabled:shadow-none shrink-0"
          >
            Save Mood
          </button>
        </form>
      </motion.div>
    </div>
  );
}
