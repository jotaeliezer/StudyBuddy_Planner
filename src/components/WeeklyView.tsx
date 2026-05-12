import { useEffect, useRef, useState } from 'react';
import { format, addWeeks, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Circle, Printer, Edit2, Trash2, GripVertical, Smile } from 'lucide-react';
import { Course, Task, CategoryDef } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { CourseModal } from './CourseModal';
import { useConfirm } from '../context/ConfirmContext';
import { usePrintSheetScale } from '../hooks/usePrintSheetScale';
import { useWeekHeaderOverrides, weekHeaderKey } from '../hooks/useWeekHeaderOverrides';

const WEEK_TASK_DRAG = 'application/x-studybuddy-task';

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
  /**
   * Fired when draggable task starts/finishes dragging (clear on end for drop target hints).
   */
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
  onReorderCourses,
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
  const [[currentDate, direction], setPage] = useState([new Date(), 0]);
  const isScrolling = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | undefined>(undefined);

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

  const weekStart = startOfWeek(currentDate);
  const defaultWeekTitle = `Week of ${format(weekStart, 'MMM do, yyyy')}`;
  const displayWeekTitle = displayTitleForWeek(weekStart, defaultWeekTitle);

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

  const days = eachDayOfInterval({
    start: weekStart,
    end: addWeeks(weekStart, 1),
  }).slice(0, 7);

  const paginate = (newDirection: number) => {
    setPage([addWeeks(currentDate, newDirection), newDirection]);
  };

  const nextWeek = () => paginate(1);
  const prevWeek = () => paginate(-1);

  const handleWheel = (e: React.WheelEvent) => {
    if ((e.target as HTMLElement).closest('.overflow-y-auto')) {
      return;
    }

    if (isScrolling[0]) return;

    if (Math.abs(e.deltaY) > 20 || Math.abs(e.deltaX) > 20) {
      isScrolling[1](true);
      if (e.deltaY > 0 || e.deltaX > 0) {
        nextWeek();
      } else {
        prevWeek();
      }
      setTimeout(() => isScrolling[1](false), 400);
    }
  };

  const courseRows = [...courses];
  const hasOtherTasks = tasks.some((t) => !courses.find((c) => c.id === t.courseId));
  if (hasOtherTasks) {
    courseRows.push({ id: 'other', name: 'Other Tasks', color: '#9ca3af' } as Course);
  }

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

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <>
      <div className="relative flex h-full flex-col print-expand">
        <div className="no-print mb-6 flex flex-shrink-0 items-center justify-between">
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
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitHeader();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelHeader();
                  }
                }}
              />
            ) : null}
            {editingHeader ? (
              todaysMoodEmoji ? (
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
              )
            ) : (
              <>
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={startHeaderEdit}
                    className="truncate text-left text-3xl font-bold text-gray-800 underline-offset-4 transition-colors hover:text-pink-600 hover:underline dark:text-gray-100 dark:hover:text-pink-400"
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
              </>
            )}
          </div>
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
              onClick={() => window.print()}
              className="glass mr-2 rounded-2xl p-2 text-gray-600 transition-colors hover:bg-white dark:text-gray-300 dark:hover:bg-zinc-800"
              title="Print Planner"
            >
              <Printer className="h-6 w-6" />
            </button>
            <div className="mr-2 h-6 w-px bg-gray-300 dark:bg-zinc-700"></div>
            <button
              type="button"
              aria-label="Previous week"
              title="Previous week"
              onClick={prevWeek}
              className="planner-nav-arrow glass rounded-2xl p-2 text-gray-600 dark:text-gray-300"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Next week"
              title="Next week"
              onClick={nextWeek}
              className="planner-nav-arrow glass rounded-2xl p-2 text-gray-600 dark:text-gray-300"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="print-sheet-outer flex min-h-0 flex-1 flex-col overflow-hidden">
          <div ref={printSheetRef} className="print-sheet flex min-h-0 w-full flex-1 flex-col">
            <h2 className="print-only mb-3 text-center font-heading text-3xl font-bold text-gray-900">
              {displayWeekTitle}
            </h2>

            <div
              className="glass squircle relative flex min-h-0 flex-1 flex-col overflow-hidden border border-white/40 shadow-sm dark:border-white/10"
              onWheel={handleWheel}
            >
              <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar">
                <div className="sticky top-0 z-30 flex shrink-0 border-b border-pink-100/50 bg-white/90 backdrop-blur-md dark:border-zinc-700/50 dark:bg-zinc-800/90">
                  <div className="z-20 flex w-28 shrink-0 items-center justify-center border-r border-pink-100/50 bg-white/60 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:border-zinc-700/50 dark:bg-zinc-800/60">
                    <span className="week-print-corner text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      Courses
                    </span>
                  </div>
                  <div className="relative flex-1 overflow-hidden">
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                      <motion.div
                        key={weekStart.toISOString() + '-header'}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="grid h-full grid-cols-7"
                      >
                        {days.map((day) => (
                          <div
                            key={day.toISOString()}
                            className={cn(
                              'relative flex flex-col justify-center border-r border-pink-100/50 p-3 text-center last:border-r-0 dark:border-zinc-700/50',
                              isSameDay(day, new Date()) ? 'bg-pink-50/50 dark:bg-pink-900/10' : ''
                            )}
                          >
                            <div className="week-print-weekday text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                              {format(day, 'EEEE')}
                            </div>
                            <div
                              className={cn(
                                'mt-0.5 text-xl font-black',
                                isSameDay(day, new Date()) ? 'text-pink-500' : 'text-gray-700 dark:text-gray-200'
                              )}
                            >
                              {format(day, 'd')}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="relative flex min-h-0 flex-1">
                  <Reorder.Group
                    as="div"
                    axis="y"
                    values={courses}
                    onReorder={onReorderCourses || (() => {})}
                    className="relative flex w-28 shrink-0 flex-col border-r border-pink-100/50 bg-[#FFF9FB]/80 dark:border-zinc-700/50 dark:bg-zinc-900/80"
                  >
                    {courses.map((course) => (
                      <Reorder.Item
                        as="div"
                        key={course.id}
                        value={course}
                        className="group relative flex h-40 cursor-grab flex-col items-center justify-center overflow-hidden border-b border-pink-100/50 bg-[#FFF9FB]/80 p-3 active:cursor-grabbing dark:border-zinc-700/50 dark:bg-zinc-900/80"
                      >
                        <div className="no-print absolute left-1 top-1/2 z-20 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 text-gray-400 dark:text-gray-500">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="absolute inset-0 opacity-10 transition-opacity" style={{ backgroundColor: course.color }}></div>
                        {course.icon ? (
                          <div className="relative z-10 mb-2 text-2xl drop-shadow-sm">{course.icon}</div>
                        ) : (
                          <div
                            className="relative z-10 mb-3 h-4 w-4 rounded-full border border-black/5 shadow-sm dark:border-white/10"
                            style={{ backgroundColor: course.color }}
                          />
                        )}
                        <span className="relative z-10 text-xs font-bold leading-snug text-gray-700 pointer-events-none dark:text-gray-300">
                          {course.name}
                        </span>
                        <div className="no-print absolute top-1 right-1 z-20 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => openEditCourse(course)}
                            className="rounded bg-white/80 p-1 text-gray-600 shadow-sm hover:bg-white dark:bg-zinc-800/80 dark:text-gray-200 dark:hover:bg-zinc-700"
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
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </Reorder.Item>
                    ))}
                    {hasOtherTasks && (
                      <div className="relative flex h-40 flex-col items-center justify-center overflow-hidden border-b border-pink-100/50 dark:border-zinc-700/50">
                        <div className="absolute inset-0 opacity-10 transition-opacity" style={{ backgroundColor: '#9ca3af' }}></div>
                        <span className="relative z-10 text-xs font-bold leading-snug text-gray-700 dark:text-gray-300">Other Tasks</span>
                      </div>
                    )}
                  </Reorder.Group>

                  <div className="relative min-h-0 flex-1 overflow-hidden bg-[#FFF9FB]/30 dark:bg-zinc-900/30">
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                      <motion.div
                        key={weekStart.toISOString() + '-body'}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="absolute inset-0 grid grid-cols-7"
                      >
                        {days.map((day) => (
                          <div
                            key={day.toISOString()}
                            className="flex flex-col items-stretch overflow-visible border-r border-pink-100/50 last:border-r-0 dark:border-zinc-700/50"
                          >
                            {courseRows.map((course) => {
                              const cellTasks = tasks.filter(
                                (t) =>
                                  t.dueDate === format(day, 'yyyy-MM-dd') &&
                                  (t.courseId === course.id ||
                                    (course.id === 'other' && !courses.find((c) => c.id === t.courseId)))
                              );
                              return (
                                <div
                                  key={course.id}
                                  className={cn(
                                    'group relative flex h-40 flex-col justify-start overflow-y-auto border-b border-pink-100/50 p-1.5 no-scrollbar dark:border-zinc-700/50',
                                    enableTaskDrag &&
                                      taskDropHoverKey === taskCellDnDKey(day, course.id) &&
                                      'ring-2 ring-pink-400/70 ring-inset dark:ring-pink-500/50'
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
                                  <button
                                    type="button"
                                    onClick={() => onAddTask(day, '', course.id === 'other' ? undefined : course.id)}
                                    className={cn(
                                      'no-print relative z-20 mt-1 flex min-h-[1.5rem] w-full shrink-0 items-center justify-center rounded-[8px] border border-dashed opacity-0 transition-all group-hover:opacity-100',
                                      cellTasks.length === 0
                                        ? 'absolute inset-1.5 top-0 right-0 left-0 mt-0 max-h-[calc(100%-0.75rem)] h-full'
                                        : ''
                                    )}
                                    style={{
                                      borderColor: course.color ? `${course.color}60` : undefined,
                                      color: course.color ? course.color : undefined,
                                      backgroundColor: course.color ? `${course.color}15` : undefined,
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
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
    </>
  );
}
