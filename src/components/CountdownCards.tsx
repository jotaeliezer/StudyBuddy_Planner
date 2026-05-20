import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useCountdowns, CountdownEvent } from '../hooks/useCountdowns';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const COLORS = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fb923c', '#facc15', '#e879f9'];
const EMOJIS = ['📅', '🎓', '✈️', '🎉', '📝', '💼', '🎯', '❤️', '🏆', '🎪', '🌍', '🩺'];

export function CountdownCards() {
  const { events, addEvent, removeEvent, getDaysUntil } = useCountdowns();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [color, setColor] = useState(COLORS[0]);

  const handleAdd = () => {
    if (!label.trim() || !date) return;
    const ev: CountdownEvent = {
      id: `cd-${Date.now()}`,
      label: label.trim(),
      emoji,
      date,
      color,
    };
    addEvent(ev);
    setLabel('');
    setDate('');
    setAdding(false);
  };

  const upcoming = events
    .map(e => ({ ...e, days: getDaysUntil(e.date) }))
    .filter(e => e.days >= 0)
    .sort((a, b) => a.days - b.days);

  function renderForm() {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-3"
      >
        <div className="flex gap-2">
          <select
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            className="w-14 rounded-xl bg-gray-50 dark:bg-zinc-800 text-center text-lg border-0 outline-none cursor-pointer"
          >
            {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <input
            autoFocus
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') setAdding(false);
            }}
            placeholder="Event name..."
            className="flex-1 rounded-xl bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-sm font-medium outline-none border-2 border-transparent focus:border-pink-300 text-gray-800 dark:text-gray-200"
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-xl bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-sm font-medium outline-none text-gray-800 dark:text-gray-200 border-2 border-transparent focus:border-pink-300"
        />
        <div className="flex gap-1.5">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn('h-6 w-6 rounded-full transition-transform', color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : '')}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAdding(false)}
            className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-sm font-bold text-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 py-2 rounded-xl bg-pink-500 text-sm font-bold text-white"
          >
            Add
          </button>
        </div>
      </motion.div>
    );
  }

  if (upcoming.length === 0 && !adding) {
    return (
      <div className="glass squircle rounded-3xl border border-white/40 dark:border-white/10 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Countdowns</p>
          <button
            onClick={() => setAdding(true)}
            className="p-2 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-500 hover:bg-pink-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">Add countdowns for exams, trips, and events.</p>
        {adding && renderForm()}
      </div>
    );
  }

  return (
    <div className="glass squircle rounded-3xl border border-white/40 dark:border-white/10 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Countdowns</p>
        <button
          onClick={() => setAdding(a => !a)}
          className="p-2 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-500 hover:bg-pink-100 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {upcoming.map(ev => (
          <motion.div
            key={ev.id}
            layout
            className="group relative flex flex-col items-center justify-center rounded-2xl px-3 py-4 border border-transparent text-center gap-1"
            style={{ backgroundColor: `${ev.color}18`, borderColor: `${ev.color}30` }}
          >
            <span className="text-2xl">{ev.emoji}</span>
            <p className="text-[11px] font-bold text-gray-800 dark:text-gray-100 leading-tight line-clamp-1 w-full text-center">
              {ev.label}
            </p>
            <p className="text-3xl font-black leading-none" style={{ color: ev.color }}>
              {ev.days === 0 ? '🎉' : ev.days}
            </p>
            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              {ev.days === 0 ? 'Today!' : ev.days === 1 ? 'day left' : 'days left'}
            </p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500">
              {format(new Date(ev.date + 'T12:00:00'), 'MMM d')}
            </p>
            <button
              onClick={() => removeEvent(ev.id)}
              className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-300 hover:text-red-400 transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </div>
      {adding && renderForm()}
    </div>
  );
}
