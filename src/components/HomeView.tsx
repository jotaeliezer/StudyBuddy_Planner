import { format, getDayOfYear } from 'date-fns';
import { Smile } from 'lucide-react';
import type { Course, DailyMood, Task } from '../types';
import { getMoodEmoji, getMoodLabel } from '../constants/moods';
import { COMFORT_VERSES } from '../data/comfortVerses';
import { cn } from '../lib/utils';

interface HomeViewProps {
  tasks: Task[];
  courses: Course[];
  moods: DailyMood[];
  onOpenMood: () => void;
  todaysMoodEmoji?: string;
}

export function HomeView({
  tasks,
  courses,
  moods,
  onOpenMood,
  todaysMoodEmoji,
}: HomeViewProps) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const moodEntry = moods.find((m) => m.date === todayStr);
  const moodEmoji = getMoodEmoji(moodEntry?.mood);
  const moodLabel = getMoodLabel(moodEntry?.mood);

  const todaysTasks = tasks
    .filter((t) => t.dueDate === todayStr)
    .sort((a, b) => {
      const ta = a.time ?? '';
      const tb = b.time ?? '';
      if (!ta && !tb) return a.title.localeCompare(b.title);
      if (!ta) return 1;
      if (!tb) return -1;
      if (ta === tb) return a.title.localeCompare(b.title);
      return ta.localeCompare(tb);
    });

  const dayOfYear = getDayOfYear(new Date());
  const verse = COMFORT_VERSES.length
    ? COMFORT_VERSES[dayOfYear % COMFORT_VERSES.length]
    : undefined;

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-6">
      <div className="no-print mb-2 flex shrink-0 items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Today</h2>
        {todaysMoodEmoji ? (
          <button
            type="button"
            aria-label="Update mood"
            onClick={onOpenMood}
            className="title-emoji flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-white/50 text-3xl shadow-sm transition-colors hover:bg-white dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
          >
            {todaysMoodEmoji}
          </button>
        ) : (
          <button
            type="button"
            aria-label="Open mood tracker"
            onClick={onOpenMood}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-gray-400 transition-colors hover:bg-white/50 hover:text-pink-400 dark:hover:bg-zinc-800/50"
          >
            <Smile className="h-6 w-6" />
          </button>
        )}
      </div>

      {(moodEmoji || moodLabel) && (
        <div className="glass squircle rounded-3xl border border-white/40 p-6 shadow-sm dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Mood
          </p>
          <div className="mt-2 flex items-center gap-3">
            {moodEmoji && <span className="text-4xl">{moodEmoji}</span>}
            {moodLabel && (
              <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{moodLabel}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      )}

      <div className="glass squircle rounded-3xl border border-white/40 p-6 shadow-sm dark:border-white/10">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Today&apos;s agenda
        </p>
        {todaysTasks.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Nothing scheduled yet today.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {todaysTasks.map((task) => {
              const course = courses.find((c) => c.id === task.courseId);
              return (
                <li
                  key={task.id}
                  className={cn(
                    'flex flex-col gap-0.5 rounded-2xl border border-white/50 px-4 py-3 dark:border-white/10',
                    task.completed && 'opacity-60'
                  )}
                  style={{ backgroundColor: course?.color ? `${course.color}40` : undefined }}
                >
                  <span
                    className={cn(
                      'font-bold text-gray-900 dark:text-gray-100',
                      task.completed && 'line-through'
                    )}
                  >
                    {task.title}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {[task.time, course?.name].filter(Boolean).join(' · ')}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {verse && (
        <div className="glass squircle rounded-3xl border border-white/40 p-6 shadow-sm dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Verse of the day
          </p>
          <div className="mt-4 rounded-2xl border border-pink-100/70 bg-white/60 p-6 dark:border-pink-900/40 dark:bg-zinc-900/40">
            <p className="text-sm font-semibold text-pink-600 dark:text-pink-300">{verse.reference}</p>
            <p className="mt-3 text-base leading-relaxed text-gray-700 dark:text-gray-200">
              {verse.text}
            </p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              A little encouragement for your day—rest, peace, and steady hope.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
