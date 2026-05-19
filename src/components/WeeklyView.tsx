import { useEffect, useRef, useState } from 'react';
import { format, addWeeks, addDays, startOfWeek, eachDayOfInterval, isSameDay, differenceInCalendarWeeks, parseISO, isValid } from 'date-fns';
import { ChevronUp, ChevronDown, Plus, CheckCircle2, Circle, Printer, Edit2, Trash2, Smile, BookOpen } from 'lucide-react';
import { Course, Task, CategoryDef } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { CourseModal } from './CourseModal';
import { useConfirm } from '../context/ConfirmContext';
import { usePrintSheetScale } from '../hooks/usePrintSheetScale';
import { useWeekHeaderOverrides, weekHeaderKey } from '../hooks/useWeekHeaderOverrides';

/** Smooth spring-like scroll animation using rAF */
function smoothScrollTo(container: HTMLElement, target: number, duration = 420) {
  const start = container.scrollTop;
  const change = target - start;
  if (Math.abs(change) < 2) return;
  const startTime = performance.now();
  const easeInOutQuart = (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  const step = (now: number) => {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    container.scrollTop = start + change * easeInOutQuart(t);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const WEEK_TASK_DRAG = 'application/x-studybuddy-task';

// How many weeks to render above and below the current week
const WEEKS_BEFORE = 1;
const WEEKS_AFTER = 2;

interface WeekLabelConfig {
  startDate: string; // yyyy-MM-dd of the Monday that is Week 1
  totalWeeks: number;
}

interface WeeklyViewProps {
  tasks: Task[];
  courses: Course[];
  categories: CategoryDef[];
  onAddTask: (date: Date, time?: string, courseId?: string) => void;
  onToggleTaskCompletion: (id: string) => void;
  onEditTask?: (task: Task) => void;
  onAddCourse?: (course: Course) => void;
  onUpdateCourse?: (course: Course) => void;
  onDeleteCourse?: (id: string) => void;
  onReorderCourses?: (courses: Course[]) => void;
  todaysMoodEmoji?: string;
  onOpenMood: () => void;
  onRescheduleTask?: (taskId: string, next: { dueDate: string; courseId?: string }) => void;
}

function canReceiveTaskDrop(task: Task, courses: Course[], rowCourseId: string): boolean {
  if (rowCourseId === 'other') {
    return !courses.some((c) => c.id === task.courseId);
  }
  return true;
}

const WeeklyTaskBlock = ({
  task,
  courses,
  categories,
  onToggle,
  onEdit,
  compact,
  enableDrag,
  onDraggingChange,
}: {
  task: Task;
  courses: Course[];
  categories: CategoryDef[];
  onToggle: (id: string) => void;
  onEdit?: (task: Task) => void;
  compact?: boolean;
  enableDrag?: boolean;
  onDraggingChange?: (taskIdOrNull: string | null) => void;
}) => {
  const course = courses.find((c: any) => c.id === task.courseId);
  const categoryDef = categories?.find((c: any) => c.id === task.category);
  const categoryIcon = categoryDef?.icon || '📌';
  const categoryColor = categoryDef?.color || '#cbd5e1';

  let displayTime = '';
  if (task.time) {
    const [h, m] = task.time.split(':');
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    displayTime = `${displayHour}:${m} ${suffix}`;
  }

  return (
    <div
      draggable={Boolean(enableDrag && !task.completed)}
      onDragStart={(e) => {
        if (!enableDrag || task.completed) return;
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData(WEEK_TASK_DRAG, task.id);
        onDraggingChange?.(task.id);
      }}
      onDragEnd={() => {
        if (!enableDrag) return;
        onDraggingChange?.(null);
      }}
      className={cn(
        'group relative flex items-start gap-1.5 overflow-hidden rounded-xl border border-white/40 shadow-sm transition-all dark:border-white/10',
        enableDrag && !task.completed && 'cursor-grab active:cursor-grabbing',
        compact ? 'min-h-[4rem] p-1.5' : 'p-2',
        task.completed ? 'cursor-default bg-gray-100/80 opacity-60 grayscale-[50%] dark:bg-zinc-800/80' : ''
      )}
      style={{ backgroundColor: task.completed ? undefined : course?.color || '#e2e8f0' }}
    >
      <button
        type="button"
        onDragStart={(e) => e.preventDefault()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className="no-print mt-[2px] shrink-0 text-gray-700/80 transition-colors hover:text-black z-10"
      >
        {task.completed ? <CheckCircle2 className="h-4 w-4 text-green-700" /> : <Circle className="h-4 w-4 opacity-60" />}
      </button>
      <div className="relative min-w-0 flex-grow pt-[1px]">
        <div className="flex items-start gap-1 pr-5">
          <span
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-xs"
            style={{ backgroundColor: `${categoryColor}30`, color: categoryColor, border: `1px solid ${categoryColor}50` }}
          >
            <span className="opacity-90">{categoryIcon}</span>
          </span>
          <span
            className={cn(
              'mt-0.5 font-semibold leading-tight break-words text-gray-800 drop-shadow-sm print-week-task-title',
              compact ? 'text-[12px]' : 'text-sm',
              task.completed && 'line-through opacity-70'
            )}
          >
            {task.title}
          </span>
        </div>
        {displayTime && (
          <span className="mt-0.5 whitespace-nowrap text-[10px] font-bold text-gray-700/90 print-week-task-time">{displayTime}</span>
        )}
      </div>

      {onEdit && (
        <button
          type="button"
          onDragStart={(e) => e.preventDefault()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="no-print absolute top-1 right-1 z-10 rounded-lg bg-white/50 p-1.5 opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white dark:bg-zinc-800/50 dark:text-gray-200 dark:hover:bg-zinc-800"
          title="Edit Task"
        >
          <Edit2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export function WeeklyView({
  tasks,
  courses,
  categories,
  onAddTask,
  onToggleTaskCompletion,
  onEditTask,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onReorderCourses: _onReorderCourses,
  todaysMoodEmoji,
  onOpenMood,
  onRescheduleTask,
}: WeeklyViewProps) {
  const confirm = useConfirm();
  const enableTaskDrag = Boolean(onRescheduleTask);
  const draggingTaskRef = useRef<string | null>(null);
  const [taskDropHoverKey, setTaskDropHoverKey] = useState<string | null>(null);
  const printSheetRef = useRef<HTMLDivElement>(null);
  usePrintSheetScale(printSheetRef);
  const { displayTitleForWeek, setTitleForWeek } = useWeekHeaderOverrides();
  const [editingHeader, setEditingHeader] = useState(false);
  const [draftHeader, setDraftHeader] = useState('');
  const skipHeaderBlurCommit = useRef(false);
  const [[currentDate, navDirection], setPage] = useState<[Date, number]>([new Date(), 0]);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | undefined>(undefined);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // ── Week label config ──
  const [weekLabelConfig, setWeekLabelConfigState] = useState<WeekLabelConfig | null>(() => {
    try {
      const r = localStorage.getItem('planner_week_labels');
      return r ? JSON.parse(r) : null;
    } catch { return null; }
  });
  const setWeekLabelConfig = (cfg: WeekLabelConfig | null) => {
    setWeekLabelConfigState(cfg);
    try {
      if (cfg) localStorage.setItem('planner_week_labels', JSON.stringify(cfg));
      else localStorage.removeItem('planner_week_labels');
    } catch {}
  };
  const [weekLabelsOpen, setWeekLabelsOpen] = useState(false);
  const [draftLabelStart, setDraftLabelStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [draftTotalWeeks, setDraftTotalWeeks] = useState(12);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const defaultWeekTitle = `Week of ${format(weekStart, 'MMM do, yyyy')}`;
  const displayWeekTitle = displayTitleForWeek(weekStart, defaultWeekTitle);

  // Scroll to the current week block whenever navigation changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    // Give AnimatePresence one frame to mount the new week before measuring
    const raf = requestAnimationFrame(() => {
      const weekEl = container.querySelector(`[data-week="${weekKey}"]`) as HTMLElement | null;
      if (!weekEl) return;
      const target = weekEl.offsetTop - 12;
      if (isFirstRender.current) {
        container.scrollTop = target;
        isFirstRender.current = false;
      } else {
        smoothScrollTo(container, target);
      }
    });
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format(weekStart, 'yyyy-MM-dd')]);

  useEffect(() => {
    setEditingHeader(false);
  }, [weekHeaderKey(weekStart)]);

  const startHeaderEdit = () => {
    setDraftHeader(displayWeekTitle);
    setEditingHeader(true);
  };

  const commitHeader = () => {
    setTitleForWeek(weekStart, defaultWeekTitle, draftHeader);
    setEditingHeader(false);
  };

  const cancelHeader = () => {
    skipHeaderBlurCommit.current = true;
    setDraftHeader('');
    setEditingHeader(false);
    queueMicrotask(() => {
      skipHeaderBlurCommit.current = false;
    });
  };

  const today = new Date();
  const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const isOnCurrentWeek = weekStart.getTime() === todayWeekStart.getTime();

  const navigate = (dir: number) => {
    setPage(([d]) => [addWeeks(d, dir), dir]);
  };

  const goToCurrentWeek = () => {
    const dir = weekStart < todayWeekStart ? 1 : -1;
    setPage([today, dir]);
  };

  const isPastDay = (day: Date) =>
    !isSameDay(day, today) && day < today;

  const getWeekNumber = (ws: Date): number | null => {
    if (!weekLabelConfig) return null;
    const sd = parseISO(weekLabelConfig.startDate);
    if (!isValid(sd)) return null;
    const diff = differenceInCalendarWeeks(ws, sd, { weekStartsOn: 1 });
    if (diff < 0 || diff >= weekLabelConfig.totalWeeks) return null;
    return diff + 1;
  };

  const openAddCourse = () => {
    setEditingCourse(undefined);
    setIsCourseModalOpen(true);
  };

  const openEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (course: Course) => {
    if (editingCourse && onUpdateCourse) {
      onUpdateCourse(course);
    } else if (onAddCourse) {
      onAddCourse(course);
    }
  };

  // Build the list of weeks to render
  const weeksToRender = Array.from({ length: WEEKS_BEFORE + 1 + WEEKS_AFTER }, (_, i) => {
    const offset = i - WEEKS_BEFORE;
    const ws = addWeeks(weekStart, offset);
    const days = eachDayOfInterval({ start: ws, end: addDays(ws, 6) });
    return { ws, days, isCurrentWeek: offset === 0, offset };
  });

  // Course rows — append "Other Tasks" bucket if needed
  const hasOtherTasks = tasks.some((t) => !courses.find((c) => c.id === t.courseId));
  const courseRows: Course[] = [
    ...courses,
    ...(hasOtherTasks ? [{ id: 'other', name: 'Other Tasks', color: '#d1d5db', icon: '📋' } as Course] : []),
  ];

  const taskCellDnDKey = (day: Date, courseId: string) => `${format(day, 'yyyy-MM-dd')}__${courseId}`;

  const handleDraggingTaskChange = (id: string | null) => {
    if (!enableTaskDrag) return;
    draggingTaskRef.current = id;
    if (id === null) setTaskDropHoverKey(null);
  };

  const handleTaskCellDragOver = (e: React.DragEvent, day: Date, course: Course) => {
    if (!enableTaskDrag) return;
    const draggedId = draggingTaskRef.current;
    if (!draggedId) return;
    const dragged = tasks.find((t) => t.id === draggedId);
    if (!dragged || !canReceiveTaskDrop(dragged, courses, course.id)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setTaskDropHoverKey(taskCellDnDKey(day, course.id));
  };

  const handleTaskCellDragLeave = (e: React.DragEvent, day: Date, course: Course) => {
    if (!enableTaskDrag) return;
    const key = taskCellDnDKey(day, course.id);
    const rt = e.relatedTarget as Node | null;
    if (!rt || !e.currentTarget.contains(rt)) {
      setTaskDropHoverKey((prev) => (prev === key ? null : prev));
    }
  };

  const handleTaskCellDrop = (e: React.DragEvent, day: Date, course: Course) => {
    if (!enableTaskDrag || !onRescheduleTask) return;
    e.preventDefault();
    const taskId = e.dataTransfer.getData(WEEK_TASK_DRAG);
    setTaskDropHoverKey(null);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const dueDate = format(day, 'yyyy-MM-dd');
    if (!canReceiveTaskDrop(task, courses, course.id)) return;

    const taskInOtherRow = !courses.some((c) => c.id === task.courseId);
    const isSameCell =
      task.dueDate === dueDate &&
      (course.id === 'other' ? taskInOtherRow : task.courseId === course.id);
    if (isSameCell) return;

    if (course.id === 'other') {
      onRescheduleTask(taskId, { dueDate });
      return;
    }
    onRescheduleTask(taskId, { dueDate, courseId: course.id });
  };

  return (
    <>
      <div className="relative flex h-full flex-col print-expand">
        {/* ── Top bar ── */}
        <div className="no-print mb-4 flex flex-shrink-0 items-center justify-between gap-2">
          {/* Title */}
          <div className="screen-only flex min-w-0 flex-1 items-center gap-3">
            {editingHeader ? (
              <input
                aria-label="Week title"
                className="min-w-0 flex-1 rounded-xl border border-pink-200 bg-white px-3 py-2 text-3xl font-bold text-gray-800 shadow-inner outline-none focus:border-pink-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-gray-100 dark:focus:border-pink-500/50"
                value={draftHeader}
                autoFocus
                onChange={(e) => setDraftHeader(e.target.value)}
                onBlur={() => {
                  if (skipHeaderBlurCommit.current) return;
                  commitHeader();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commitHeader(); }
                  if (e.key === 'Escape') { e.preventDefault(); cancelHeader(); }
                }}
              />
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={startHeaderEdit}
                  className="truncate text-left text-3xl font-bold text-gray-800 underline-offset-4 transition-colors hover:text-pink-600 hover:underline dark:text-white dark:hover:text-pink-400"
                >
                  {displayWeekTitle}
                </button>
                <button
                  type="button"
                  onClick={startHeaderEdit}
                  className="shrink-0 rounded-xl p-2 text-gray-400 transition-colors hover:bg-white/70 hover:text-pink-500 dark:hover:bg-zinc-800"
                  title="Edit week title"
                  aria-label="Edit week title"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Mood button */}
            {todaysMoodEmoji ? (
              <button
                type="button"
                onClick={onOpenMood}
                className="title-emoji flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-white/50 text-3xl shadow-sm transition-colors hover:bg-white dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
                aria-label="Update mood"
              >
                {todaysMoodEmoji}
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenMood}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-gray-400 transition-colors hover:bg-white/50 hover:text-pink-400 dark:hover:bg-zinc-800/50"
                aria-label="Open mood tracker"
              >
                <Smile className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openAddCourse}
              className="mr-2 rounded-xl bg-pink-100 px-4 py-2 font-bold text-pink-600 transition-colors hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:hover:bg-pink-900/60"
            >
              + Add Course
            </button>
            <button
              type="button"
              onClick={() => {
                if (weekLabelConfig) {
                  const sd = parseISO(weekLabelConfig.startDate);
                  setDraftLabelStart(isValid(sd) ? sd : startOfWeek(new Date(), { weekStartsOn: 1 }));
                  setDraftTotalWeeks(weekLabelConfig.totalWeeks);
                } else {
                  setDraftLabelStart(todayWeekStart);
                  setDraftTotalWeeks(12);
                }
                setWeekLabelsOpen(true);
              }}
              className={`mr-2 flex items-center gap-1.5 rounded-xl px-4 py-2 font-bold transition-colors ${weekLabelConfig ? 'bg-violet-100 text-violet-600 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-900/60' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-700'}`}
              title="Set Week Labels"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Week Labels</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="glass mr-2 rounded-2xl p-2 text-gray-600 transition-colors hover:bg-white dark:text-gray-300 dark:hover:bg-zinc-800"
              title="Print Planner"
            >
              <Printer className="h-6 w-6" />
            </button>
            <div className="mr-2 h-6 w-px bg-gray-300 dark:bg-zinc-700" />
            {!isOnCurrentWeek && (
              <button
                type="button"
                onClick={goToCurrentWeek}
                className="mr-1 rounded-xl bg-pink-100 px-3 py-1.5 text-sm font-bold text-pink-600 transition-colors hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:hover:bg-pink-900/60"
                title="Jump to current week"
              >
                This Week
              </button>
            )}
            <button
              type="button"
              aria-label="Previous week"
              title="Previous week"
              onClick={() => navigate(-1)}
              className="planner-nav-arrow glass rounded-2xl p-2 text-gray-600 dark:text-gray-300"
            >
              <ChevronUp className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Next week"
              title="Next week"
              onClick={() => navigate(1)}
              className="planner-nav-arrow glass rounded-2xl p-2 text-gray-600 dark:text-gray-300"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* ── Print-only title ── */}
        <h2 className="print-only mb-3 text-center font-heading text-3xl font-bold text-gray-900">
          {displayWeekTitle}
        </h2>

        {/* ── Multi-week scroll area ── */}
        <div className="print-sheet-outer flex min-h-0 flex-1 flex-col overflow-hidden">
          <div ref={printSheetRef} className="print-sheet flex min-h-0 w-full flex-1 flex-col">
            <div className="glass squircle relative flex min-h-0 flex-1 flex-col overflow-hidden border border-white/40 shadow-sm dark:border-white/10">
              {/* ── Empty state: no courses yet ── */}
              {courses.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
                  <div className="text-6xl">🗓️</div>
                  <div>
                    <p className="text-xl font-bold text-gray-700 dark:text-gray-200">Welcome to StudyBuddy Planner!</p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Add your first course to get started planning your week.</p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddCourse}
                    className="rounded-2xl bg-pink-500 px-6 py-3 font-bold text-white shadow-md transition-colors hover:bg-pink-600"
                  >
                    + Add your first course
                  </button>
                </div>
              )}

              <div
                ref={scrollContainerRef}
                className={cn(
                  'flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto p-3 no-scrollbar',
                  courses.length === 0 && 'hidden'
                )}
              >
                <AnimatePresence initial={false} custom={navDirection} mode="popLayout">
                {weeksToRender.map(({ ws, days, isCurrentWeek }) => {
                  const weekKey = format(ws, 'yyyy-MM-dd');
                  const weekLabel =
                    isCurrentWeek
                      ? displayTitleForWeek(ws, `Week of ${format(ws, 'MMM do, yyyy')}`)
                      : `Week of ${format(ws, 'MMM do, yyyy')}`;
                  const weekNum = getWeekNumber(ws);

                  return (
                    <motion.div
                      key={weekKey}
                      data-week={weekKey}
                      custom={navDirection}
                      layout="position"
                      initial={(dir: number) => ({ opacity: 0, y: dir >= 0 ? 72 : -72, scale: 0.97 })}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={(dir: number) => ({ opacity: 0, y: dir >= 0 ? -72 : 72, scale: 0.97 })}
                      transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
                      className={cn(
                        'shrink-0 overflow-hidden rounded-2xl border',
                        isCurrentWeek
                          ? 'border-pink-300/70 shadow-md dark:border-pink-500/30'
                          : 'border-pink-100/50 dark:border-zinc-700/50'
                      )}
                    >
                      {/* Week label bar */}
                      <div
                        className={cn(
                          'flex items-center gap-2 border-b px-4 py-2',
                          isCurrentWeek
                            ? 'border-pink-200 bg-pink-50 dark:border-pink-500/40 dark:bg-zinc-800'
                            : 'border-pink-100/50 bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/80'
                        )}
                      >
                        <span
                          className={cn(
                            'text-sm font-bold',
                            isCurrentWeek ? 'text-pink-600 dark:text-pink-300' : 'text-gray-500 dark:text-gray-300'
                          )}
                        >
                          {isCurrentWeek && '✦ '}
                          {weekLabel}
                        </span>
                        {weekNum !== null && (
                          <span className="ml-auto rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-600 dark:bg-violet-900/50 dark:text-violet-200">
                            Week {weekNum}
                          </span>
                        )}
                      </div>

                      {/* Week grid */}
                      <div
                        className={cn(
                          'grid',
                          isCurrentWeek
                            ? 'bg-white/60 dark:bg-zinc-900/60'
                            : 'bg-white/30 dark:bg-zinc-900/30'
                        )}
                        style={{ gridTemplateColumns: '7rem repeat(7, 1fr)' }}
                      >
                        {/* ── Header row ── */}
                        {/* Corner cell */}
                        <div className="flex items-center justify-center border-b border-r border-pink-100/50 bg-white/60 px-2 py-3 dark:border-zinc-700 dark:bg-zinc-800">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400">
                            Courses
                          </span>
                        </div>
                        {/* Day header cells */}
                        {days.map((day) => {
                          const isToday = isSameDay(day, today);
                          const isPast = isPastDay(day);
                          return (
                            <div
                              key={day.toISOString()}
                              className={cn(
                                'flex flex-col items-center justify-center border-b border-r border-pink-100/50 py-2 text-center last:border-r-0 dark:border-zinc-700',
                                isToday
                                  ? 'bg-pink-50/60 dark:bg-pink-950/50'
                                  : isPast
                                  ? 'bg-gray-100/80 dark:bg-zinc-800/50'
                                  : 'bg-white/40 dark:bg-zinc-900/50'
                              )}
                            >
                              <div className={cn(
                                'text-[10px] font-bold uppercase tracking-wider',
                                isPast ? 'text-gray-300 dark:text-zinc-500' : 'text-gray-400 dark:text-gray-400'
                              )}>
                                {format(day, 'EEE')}
                              </div>
                              <div
                                className={cn(
                                  'text-lg font-black',
                                  isToday
                                    ? 'text-pink-500 dark:text-pink-400'
                                    : isPast
                                    ? 'text-gray-300 dark:text-zinc-500'
                                    : 'text-gray-700 dark:text-gray-100'
                                )}
                              >
                                {format(day, 'd')}
                              </div>
                            </div>
                          );
                        })}

                        {/* ── Course rows ── */}
                        {courseRows.flatMap((course) => [
                          /* Course label cell */
                          <div
                            key={`${weekKey}-${course.id}-label`}
                            className="group relative flex h-36 flex-col items-center justify-center border-b border-r border-white/30 px-2 py-3 dark:border-zinc-900/30"
                            style={{ backgroundColor: course.color || '#e2e8f0' }}
                          >
                            {course.icon && (
                              <div className="relative z-10 mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 text-xl shadow-sm backdrop-blur-sm">
                                {course.icon}
                              </div>
                            )}
                            <span className="relative z-10 text-center text-[11px] font-bold leading-snug text-gray-800">
                              {course.name}
                            </span>

                            {/* Edit / Delete buttons — only for real courses */}
                            {course.id !== 'other' && (
                              <div className="no-print absolute right-1 top-1 z-20 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  type="button"
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={() => openEditCourse(course)}
                                  className="rounded bg-white/80 p-1 text-gray-600 shadow-sm hover:bg-white dark:bg-zinc-800/80 dark:text-gray-200 dark:hover:bg-zinc-700"
                                  title="Edit course"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={async () => {
                                    const ok = await confirm({
                                      title: 'Delete this course?',
                                      message:
                                        'Are you sure you want to delete this course? This will also remove its tasks.',
                                      variant: 'danger',
                                      confirmLabel: 'Delete',
                                      cancelLabel: 'Cancel',
                                    });
                                    if (ok) onDeleteCourse?.(course.id);
                                  }}
                                  className="rounded bg-red-50 p-1 text-red-500 shadow-sm hover:bg-red-100"
                                  title="Delete course"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>,

                          /* Day task cells for this course */
                          ...days.map((day) => {
                            const isPast = isPastDay(day);
                            const cellTasks = tasks.filter(
                              (t) =>
                                t.dueDate === format(day, 'yyyy-MM-dd') &&
                                (t.courseId === course.id ||
                                  (course.id === 'other' && !courses.find((c) => c.id === t.courseId)))
                            );
                            const dropKey = taskCellDnDKey(day, course.id);
                            return (
                              <div
                                key={`${weekKey}-${course.id}-${format(day, 'yyyyMMdd')}`}
                                className={cn(
                                  'group relative flex h-36 flex-col justify-start overflow-y-auto border-b border-r border-pink-100/50 p-1.5 last:border-r-0 no-scrollbar dark:border-zinc-700/50',
                                  isPast
                                    ? 'bg-gray-100/60 dark:bg-zinc-800/60'
                                    : '',
                                  enableTaskDrag &&
                                    taskDropHoverKey === dropKey &&
                                    'ring-2 ring-inset ring-pink-400/70 dark:ring-pink-500/50'
                                )}
                                onDragOver={(e) => handleTaskCellDragOver(e, day, course)}
                                onDragLeave={(e) => handleTaskCellDragLeave(e, day, course)}
                                onDrop={(e) => handleTaskCellDrop(e, day, course)}
                              >
                                <div className="relative z-10 flex flex-col gap-1.5">
                                  {cellTasks
                                    .sort((a, b) => (a.time || '24:00').localeCompare(b.time || '24:00'))
                                    .map((task) => (
                                      <WeeklyTaskBlock
                                        key={task.id}
                                        task={task}
                                        courses={courses}
                                        categories={categories}
                                        onToggle={onToggleTaskCompletion}
                                        onEdit={onEditTask}
                                        compact
                                        enableDrag={enableTaskDrag && !task.completed}
                                        onDraggingChange={handleDraggingTaskChange}
                                      />
                                    ))}
                                </div>
                                {/* + button: absolute-fills the cell when empty, sits below tasks when not */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAddTask(day, '', course.id === 'other' ? undefined : course.id)
                                  }
                                  className={cn(
                                    'no-print z-20 flex w-full shrink-0 items-center justify-center rounded-[8px] border border-dashed opacity-0 transition-all group-hover:opacity-100',
                                    cellTasks.length === 0
                                      ? 'absolute inset-1.5 h-[calc(100%-0.75rem)]'
                                      : 'mt-1 min-h-[1.5rem]'
                                  )}
                                  style={{
                                    borderColor: course.color ? `${course.color}80` : undefined,
                                    color: course.color ? '#374151' : undefined,
                                    backgroundColor: course.color ? `${course.color}25` : undefined,
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          }),
                        ])}
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSave={handleSaveCourse}
        existingCourse={editingCourse}
      />

      {/* ── Set Week Labels modal ── */}
      {weekLabelsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Set Week Labels</h2>
              <button
                type="button"
                onClick={() => setWeekLabelsOpen(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Week 1 start picker */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Week 1 starts on
                </label>
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 p-3">
                  <button
                    type="button"
                    onClick={() => setDraftLabelStart((d) => addWeeks(d, -1))}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-700 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"
                  >
                    <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  <div className="flex-1 text-center">
                    <div className="font-bold text-gray-800 dark:text-gray-100">
                      {format(draftLabelStart, 'MMM do, yyyy')}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {format(draftLabelStart, 'EEEE')} — {format(addDays(draftLabelStart, 6), 'MMM do')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftLabelStart((d) => addWeeks(d, 1))}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-700 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Total weeks picker */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Number of Weeks
                </label>
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 p-3">
                  <button
                    type="button"
                    onClick={() => setDraftTotalWeeks((w) => Math.max(1, w - 1))}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-700 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors text-lg font-black text-gray-500 dark:text-gray-400 w-10 h-10 flex items-center justify-center"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center text-3xl font-black text-gray-800 dark:text-gray-100">
                    {draftTotalWeeks}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftTotalWeeks((w) => Math.min(52, w + 1))}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-700 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors text-lg font-black text-gray-500 dark:text-gray-400 w-10 h-10 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  Ends on {format(addWeeks(addDays(draftLabelStart, 6), draftTotalWeeks - 1), 'MMM do, yyyy')}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                {weekLabelConfig && (
                  <button
                    type="button"
                    onClick={() => { setWeekLabelConfig(null); setWeekLabelsOpen(false); }}
                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-gray-400 font-bold transition-colors"
                  >
                    Clear Labels
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setWeekLabelConfig({
                      startDate: format(draftLabelStart, 'yyyy-MM-dd'),
                      totalWeeks: draftTotalWeeks,
                    });
                    setWeekLabelsOpen(false);
                  }}
                  className="flex-1 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
