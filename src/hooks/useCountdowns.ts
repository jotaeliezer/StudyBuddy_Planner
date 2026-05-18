import { useState, useEffect } from 'react';

export interface CountdownEvent {
  id: string;
  label: string;
  emoji: string;
  date: string; // yyyy-MM-dd
  color: string;
}

function load<T>(key: string, fallback: T): T {
  try {
    const r = localStorage.getItem(key);
    return r ? (JSON.parse(r) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useCountdowns() {
  const [events, setEvents] = useState<CountdownEvent[]>(() => load('planner_countdowns', []));

  useEffect(() => {
    try { localStorage.setItem('planner_countdowns', JSON.stringify(events)); } catch {}
  }, [events]);

  const addEvent = (e: CountdownEvent) => setEvents(prev => [...prev, e]);
  const removeEvent = (id: string) => setEvents(prev => prev.filter(e => e.id !== id));

  const getDaysUntil = (dateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return { events, addEvent, removeEvent, getDaysUntil };
}
