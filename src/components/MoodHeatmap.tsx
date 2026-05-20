import { format, subDays, eachDayOfInterval } from 'date-fns';
import type { DailyMood, Mood } from '../types';
import { getMoodEmoji } from '../constants/moods';
import { cn } from '../lib/utils';

interface MoodHeatmapProps {
  moods: DailyMood[];
  onOpenMood: () => void;
}

// Assign a "valence" score to each mood (1-5, where 5 = very positive)
const MOOD_SCORE: Record<string, number> = {
  joyful: 5, happy: 5, excited: 5, motivated: 5,
  loved: 4, grateful: 4, creative: 4, peaceful: 4,
  focused: 4,
  neutral: 3,
  tired: 2, bored: 2,
  anxious: 2, stressed: 2, overwhelmed: 2,
  sad: 1, angry: 1, sick: 1,
};

function scoreToColor(score: number | undefined): string {
  if (score === undefined) return 'bg-gray-100 dark:bg-zinc-800';
  if (score >= 5) return 'bg-emerald-400 dark:bg-emerald-500';
  if (score >= 4) return 'bg-green-300 dark:bg-green-500';
  if (score >= 3) return 'bg-yellow-200 dark:bg-yellow-500';
  if (score >= 2) return 'bg-orange-200 dark:bg-orange-400';
  return 'bg-red-300 dark:bg-red-400';
}

export function MoodHeatmap({ moods, onOpenMood }: MoodHeatmapProps) {
  const today = new Date();
  const days = eachDayOfInterval({ start: subDays(today, 29), end: today });

  const moodByDate = Object.fromEntries(moods.map(m => [m.date, m.mood]));

  // Group into rows of 7
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Find most common mood in the last 30 days
  const moodCounts: Record<string, number> = {};
  moods
    .filter(m => days.some(d => format(d, 'yyyy-MM-dd') === m.date))
    .forEach(m => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Mood | undefined;

  return (
    <div className="glass squircle rounded-3xl border border-white/40 dark:border-white/10 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Mood History</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Last 30 days</p>
        </div>
        {topMood && (
          <div className="flex items-center gap-1.5 rounded-xl bg-pink-50 dark:bg-pink-900/20 px-3 py-1.5">
            <span className="text-base">{getMoodEmoji(topMood)}</span>
            <span className="text-xs font-bold text-pink-600 dark:text-pink-300">Most felt</span>
          </div>
        )}
      </div>

      {/* Grid constrained to a sensible max-width so cells stay compact */}
      <div className="max-w-[320px]">
        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 mb-1 gap-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[9px] font-bold text-gray-300 dark:text-zinc-600">{d}</div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex flex-col gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const mood = moodByDate[dateStr] as Mood | undefined;
                const score = mood ? MOOD_SCORE[mood] : undefined;
                const emoji = getMoodEmoji(mood);
                const isToday = dateStr === format(today, 'yyyy-MM-dd');
                return (
                  <button
                    key={dateStr}
                    onClick={isToday ? onOpenMood : undefined}
                    title={mood ? `${format(day, 'MMM d')} — ${mood}` : format(day, 'MMM d')}
                    className={cn(
                      'aspect-square rounded-md transition-all flex items-center justify-center',
                      scoreToColor(score),
                      isToday && 'ring-2 ring-pink-400 ring-offset-1',
                      isToday && !mood && 'opacity-60 cursor-pointer hover:opacity-100',
                      !isToday && 'cursor-default'
                    )}
                  >
                    {emoji && score !== undefined ? (
                      <span className="text-[8px] leading-none">{emoji}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-between text-[9px] font-bold text-gray-300 dark:text-zinc-600">
          <span>Low</span>
          <div className="flex gap-0.5">
            {['bg-red-300', 'bg-orange-200', 'bg-yellow-200', 'bg-green-300', 'bg-emerald-400'].map(c => (
              <div key={c} className={cn('h-2.5 w-4 rounded-sm', c)} />
            ))}
          </div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
