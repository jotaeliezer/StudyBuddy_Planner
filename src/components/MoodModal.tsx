import React, { useState } from 'react';
import { DailyMood, Mood } from '../types';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface MoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mood: DailyMood) => void;
  currentMood?: Mood;
}

const MOODS: { type: Mood; emoji: string; label: string; color: string }[] = [
  { type: 'happy', emoji: '😊', label: 'Happy', color: 'bg-green-100 text-green-700 border-green-200' },
  { type: 'joyful', emoji: '😁', label: 'Joyful', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { type: 'excited', emoji: '🤩', label: 'Excited', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { type: 'loved', emoji: '🥰', label: 'Loved', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { type: 'creative', emoji: '✨', label: 'Creative', color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' },
  { type: 'focused', emoji: '🤓', label: 'Focused', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { type: 'neutral', emoji: '😐', label: 'Neutral', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { type: 'tired', emoji: '🥱', label: 'Tired', color: 'bg-slate-200 text-slate-700 border-slate-300' },
  { type: 'stressed', emoji: '😖', label: 'Stressed', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { type: 'anxious', emoji: '😰', label: 'Anxious', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { type: 'angry', emoji: '😠', label: 'Angry', color: 'bg-red-100 text-red-700 border-red-200' },
  { type: 'sick', emoji: '🤒', label: 'Sick', color: 'bg-lime-100 text-lime-700 border-lime-200' },
];

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
            {MOODS.map(m => (
              <button
                key={m.type}
                type="button"
                onClick={() => setSelectedMood(m.type)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300",
                  selectedMood === m.type 
                    ? cn(m.color, "scale-105 shadow-md") 
                    : "bg-gray-50 dark:bg-zinc-800 border-transparent hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-400 dark:text-gray-500 hover:scale-105"
                )}
              >
                <span className="text-3xl">{m.emoji}</span>
                <span className="text-xs font-bold">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <button 
              type="submit"
              disabled={!selectedMood}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-lg transition-transform active:scale-95 disabled:opacity-50 shadow-[0_8px_30px_rgb(236,72,153,0.3)] disabled:shadow-none"
            >
              Save Mood
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
