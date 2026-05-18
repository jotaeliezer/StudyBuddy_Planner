import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useHabits, HabitDef } from '../hooks/useHabits';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const HABIT_EMOJIS = ['💧', '📖', '🏃', '😴', '🧘', '🍎', '✍️', '🧴', '🌿', '☀️', '💊', '🎵', '🧹', '🐾', '🥗'];
const HABIT_COLORS = ['#60a5fa', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15', '#2dd4bf', '#e879f9'];

export function HabitStrip() {
  const { habits, toggleHabit, isChecked, addHabit, removeHabit, getStreakForHabit } = useHabits();
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('💧');
  const [newColor, setNewColor] = useState(HABIT_COLORS[0]);

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const habit: HabitDef = {
      id: `habit-${Date.now()}`,
      label: newLabel.trim(),
      emoji: newEmoji,
      color: newColor,
    };
    addHabit(habit);
    setNewLabel('');
    setAdding(false);
  };

  const todayDone = habits.filter(h => isChecked(h.id)).length;

  return (
    <div className="glass squircle rounded-3xl border border-white/40 dark:border-white/10 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Daily Habits</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{todayDone}/{habits.length} done today</p>
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          className="p-2 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-500 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      {habits.length > 0 && (
        <div className="mb-4 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-pink-400 to-violet-400"
            animate={{ width: `${(todayDone / habits.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {habits.map(habit => {
          const done = isChecked(habit.id);
          const streak = getStreakForHabit(habit.id);
          return (
            <motion.div
              key={habit.id}
              layout
              className={cn(
                'group flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all cursor-pointer select-none',
                done
                  ? 'border-transparent'
                  : 'border-gray-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-800/30 hover:bg-white dark:hover:bg-zinc-800/60'
              )}
              style={done ? { backgroundColor: `${habit.color}20`, borderColor: `${habit.color}30` } : {}}
              onClick={() => toggleHabit(habit.id)}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base transition-all',
                  done ? 'scale-110' : 'grayscale opacity-60'
                )}
                style={done ? { backgroundColor: `${habit.color}30` } : {}}
              >
                {habit.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-bold truncate', done ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400')}>
                  {habit.label}
                </p>
                {streak > 1 && (
                  <p className="text-[10px] font-bold" style={{ color: habit.color }}>🔥 {streak} day streak</p>
                )}
              </div>
              <div
                className={cn(
                  'h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all',
                  done ? 'border-transparent' : 'border-gray-300 dark:border-zinc-600'
                )}
                style={done ? { backgroundColor: habit.color } : {}}
              >
                {done && <span className="text-white text-[10px] font-black">✓</span>}
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeHabit(habit.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-300 hover:text-red-400 transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Add habit form */}
      {adding && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-3"
        >
          <div className="flex gap-2">
            <select
              value={newEmoji}
              onChange={e => setNewEmoji(e.target.value)}
              className="w-14 rounded-xl bg-gray-50 dark:bg-zinc-800 text-center text-lg border-0 outline-none cursor-pointer"
            >
              {HABIT_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input
              autoFocus
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setAdding(false);
              }}
              placeholder="Habit name..."
              className="flex-1 rounded-xl bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-sm font-medium outline-none border-2 border-transparent focus:border-pink-300 dark:focus:border-pink-500/50 text-gray-800 dark:text-gray-200"
            />
          </div>
          <div className="flex gap-1.5">
            {HABIT_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={cn('h-6 w-6 rounded-full transition-transform', newColor === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : '')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAdding(false)}
              className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-sm font-bold text-gray-500 dark:text-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 py-2 rounded-xl bg-pink-500 text-sm font-bold text-white"
            >
              Add Habit
            </button>
          </div>
        </motion.div>
      )}

      {habits.length === 0 && !adding && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">No habits yet — add one!</p>
      )}
    </div>
  );
}
