import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export interface HabitDef {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export interface HabitLog {
  date: string; // yyyy-MM-dd
  habitId: string;
  done: boolean;
}

const DEFAULT_HABITS: HabitDef[] = [
  { id: 'water', label: 'Drink water', emoji: '💧', color: '#60a5fa' },
  { id: 'read', label: 'Read 20 min', emoji: '📖', color: '#a78bfa' },
  { id: 'move', label: 'Move body', emoji: '🏃', color: '#34d399' },
  { id: 'sleep', label: 'Sleep 8hrs', emoji: '😴', color: '#fb923c' },
];

function load<T>(key: string, fallback: T): T {
  try {
    const r = localStorage.getItem(key);
    return r ? (JSON.parse(r) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useHabits() {
  const [habits, setHabits] = useState<HabitDef[]>(() => load('planner_habits', DEFAULT_HABITS));
  const [logs, setLogs] = useState<HabitLog[]>(() => load('planner_habit_logs', []));

  useEffect(() => {
    try { localStorage.setItem('planner_habits', JSON.stringify(habits)); } catch {}
  }, [habits]);

  useEffect(() => {
    try { localStorage.setItem('planner_habit_logs', JSON.stringify(logs)); } catch {}
  }, [logs]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const toggleHabit = (habitId: string) => {
    setLogs(prev => {
      const existing = prev.find(l => l.date === todayStr && l.habitId === habitId);
      if (existing) {
        return prev.map(l =>
          l.date === todayStr && l.habitId === habitId ? { ...l, done: !l.done } : l
        );
      }
      return [...prev, { date: todayStr, habitId, done: true }];
    });
  };

  const isChecked = (habitId: string): boolean => {
    return logs.find(l => l.date === todayStr && l.habitId === habitId)?.done ?? false;
  };

  const addHabit = (habit: HabitDef) => setHabits(prev => [...prev, habit]);
  const removeHabit = (id: string) => setHabits(prev => prev.filter(h => h.id !== id));

  // Return streak count for a given habit (consecutive days including today)
  const getStreakForHabit = (habitId: string): number => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const done = logs.find(l => l.date === dateStr && l.habitId === habitId)?.done;
      if (done) {
        streak++;
      } else if (i > 0) {
        // Only break after day 0 (today might not be done yet)
        break;
      }
    }
    return streak;
  };

  return { habits, logs, toggleHabit, isChecked, addHabit, removeHabit, getStreakForHabit };
}
