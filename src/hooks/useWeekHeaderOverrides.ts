import { format } from 'date-fns';
import { useCallback, useState } from 'react';
import { safeLocalStorageGet, safeLocalStorageSet } from '../lib/safeStorage';

const STORAGE_KEY = 'planner_week_headers';

/** Uses the same calendar week anchor as WeeklyView (date-fns startOfWeek, Sunday start in en-US). */
export function weekHeaderKey(weekStart: Date): string {
  return format(weekStart, 'yyyy-MM-dd');
}

function loadMap(): Record<string, string> {
  try {
    const raw = safeLocalStorageGet(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof k === 'string' && typeof v === 'string') {
          out[k] = v;
        }
      }
      return out;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function useWeekHeaderOverrides() {
  const [map, setMap] = useState<Record<string, string>>(loadMap);

  const persist = useCallback((next: Record<string, string>) => {
    safeLocalStorageSet(STORAGE_KEY, JSON.stringify(next));
    setMap(next);
  }, []);

  const displayTitleForWeek = useCallback(
    (weekStart: Date, defaultTitle: string) => {
      const key = weekHeaderKey(weekStart);
      const v = map[key];
      const trimmed = v?.trim();
      return trimmed ? trimmed : defaultTitle;
    },
    [map]
  );

  const setTitleForWeek = useCallback(
    (weekStart: Date, defaultTitle: string, value: string) => {
      const key = weekHeaderKey(weekStart);
      const trimmed = value.trim();
      const next = { ...map };
      if (!trimmed || trimmed === defaultTitle) {
        delete next[key];
      } else {
        next[key] = trimmed;
      }
      persist(next);
    },
    [map, persist]
  );

  return { displayTitleForWeek, setTitleForWeek };
}
