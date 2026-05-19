import { useState, useEffect } from 'react';
import { format, getDayOfYear } from 'date-fns';
import { Smile, CalendarCheck, BookOpen, Sparkles } from 'lucide-react';
import type { Course, DailyMood, Task } from '../types';
import { getMoodEmoji, getMoodLabel } from '../constants/moods';
import { COMFORT_VERSES } from '../data/comfortVerses';
import { AFFIRMATIONS } from '../data/affirmations';
import { HabitStrip } from './HabitStrip';
import { CountdownCards } from './CountdownCards';
import { MoodHeatmap } from './MoodHeatmap';
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

  const completedToday = todaysTasks.filter(t => t.completed).length;

  const dayOfYear = getDayOfYear(new Date());
  const verse = COMFORT_VERSES.length
    ? COMFORT_VERSES[dayOfYear % COMFORT_VERSES.length]
    : undefined;
  const affirmation = AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];

  const intentionKey = `planner_intention_${todayStr}`;
  const [intention, setIntention] = useState<string>(() => {
    try { return localStorage.getItem(intentionKey) ?? ''; } catch { return ''; }
  });
  const [intentionInput, setIntentionInput] = useState(intention);
  const [editingIntention, setEditingIntention] = useState(!intention);

  useEffect(() => {
    try { localStorage.setItem(intentionKey, intention); } catch {}
  }, [intention, intentionKey]);

  const saveIntention = () => {
    const trimmed = intentionInput.trim();
    setIntention(trimmed);
    setEditingIntention(!trimmed);
  };

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col gap-4 pb-8">

      {/* ── Header bar ── */}
      <div className="no-print flex shrink-0 items-center justify-between py-1">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 leading-tight">Today</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <button
          type="button"
          aria-label={todaysMoodEmoji ? 'Update mood' : 'Log mood'}
          onClick={onOpenMood}
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all',
            todaysMoodEmoji
              ? 'text-3xl bg-white/60 dark:bg-zinc-800/60 shadow-sm hover:bg-white dark:hover:bg-zinc-800'
              : 'text-gray-400 hover:bg-white/60 hover:text-pink-400 dark:hover:bg-zinc-800/60'
          )}
        >
          {todaysMoodEmoji ? todaysMoodEmoji : <Smile className="h-6 w-6" />}
        </button>
      </div>

      {/* ── Bento grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">

        {/* ① Verse of the day ── full width at top */}
        {verse && (
          <div className="glass squircle border border-white/40 dark:border-white/10 p-5 shadow-sm md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-3.5 w-3.5 text-pink-300" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Verse of the Day
              </p>
            </div>
            <div className="rounded-2xl border border-pink-100/70 bg-white/60 dark:border-pink-900/30 dark:bg-zinc-900/40 px-5 py-4 flex gap-4 items-start">
              <div className="text-3xl select-none">🕊️</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-pink-500 dark:text-pink-300 mb-1">{verse.reference}</p>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">{verse.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* ② Intention ── col 1 */}
        <div className="glass squircle border border-white/40 dark:border-white/10 p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Today&apos;s Intention
            </p>
          </div>
          {intention && !editingIntention ? (
            <div
              className="cursor-pointer group flex-1"
              onClick={() => { setIntentionInput(intention); setEditingIntention(true); }}
            >
              <p className="text-[15px] font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
                &ldquo;{intention}&rdquo;
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 group-hover:text-pink-400 transition-colors">
                Tap to edit
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                autoFocus={editingIntention}
                type="text"
                value={intentionInput}
                onChange={e => setIntentionInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveIntention();
                  if (e.key === 'Escape' && intention) { setIntentionInput(intention); setEditingIntention(false); }
                }}
                placeholder="What do you want to focus on today?"
                className="w-full rounded-xl bg-gray-50 dark:bg-zinc-800 px-3 py-2.5 text-sm font-medium outline-none border-2 border-transparent focus:border-pink-300 dark:focus:border-pink-500/50 text-gray-800 dark:text-gray-200"
              />
              <button
                onClick={saveIntention}
                className="w-full py-2 rounded-xl bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 text-sm font-bold"
              >
                Set Intention
              </button>
            </div>
          )}
        </div>

        {/* ② Affirmation ── cols 2–3 */}
        <div className="glass squircle border border-white/40 dark:border-white/10 p-5 shadow-sm lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Daily Affirmation
            </p>
          </div>
          <p className="text-[15px] font-semibold leading-relaxed text-gray-700 dark:text-gray-200 flex-1">
            {affirmation}
          </p>
          {/* Mood strip at bottom of affirmation card */}
          {moodEmoji && (
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 mt-1 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: 'rgba(236,72,153,0.06)' }}
              onClick={onOpenMood}
            >
              <span className="text-2xl">{moodEmoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{moodLabel}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Feeling today · tap to update</p>
              </div>
            </div>
          )}
        </div>

        {/* ③ Today's Agenda ── cols 1–2 */}
        <div className="glass squircle border border-white/40 dark:border-white/10 p-5 shadow-sm md:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-3.5 w-3.5 text-pink-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Today&apos;s Agenda
              </p>
            </div>
            {todaysTasks.length > 0 && (
              <span className="text-xs font-bold text-pink-500 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 px-2.5 py-0.5 rounded-full">
                {completedToday}/{todaysTasks.length} done
              </span>
            )}
          </div>
          {todaysTasks.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
              Nothing scheduled yet today. Enjoy the breathing room! 🌸
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {todaysTasks.map((task) => {
                const course = courses.find((c) => c.id === task.courseId);
                return (
                  <li
                    key={task.id}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border border-white/50 px-4 py-3 dark:border-white/10',
                      task.completed && 'opacity-55'
                    )}
                    style={{ backgroundColor: course?.color ? `${course.color}35` : 'rgba(249,250,251,0.6)' }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: course?.color ?? '#f9a8d4' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn('font-bold text-sm text-gray-900 dark:text-gray-100 truncate', task.completed && 'line-through')}>
                        {task.title}
                      </p>
                      {(task.time || course?.name) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {[task.time, course?.name].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    {task.completed && <span className="text-[10px] font-black text-emerald-500">✓</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ④ Habits ── col 3 */}
        <div className="md:col-span-2 lg:col-span-1">
          <HabitStrip />
        </div>

        {/* ⑤ Countdowns ── col 1 */}
        <div>
          <CountdownCards />
        </div>

        {/* ⑥ Mood Heatmap ── cols 2–3 */}
        <div className="md:col-span-2 lg:col-span-2">
          <MoodHeatmap moods={moods} onOpenMood={onOpenMood} />
        </div>

      </div>
    </div>
  );
}
