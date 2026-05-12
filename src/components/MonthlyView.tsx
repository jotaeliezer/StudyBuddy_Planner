import { useRef, useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronUp, ChevronDown, Plus, Printer, Smile } from 'lucide-react';
import { Course, Task, CategoryDef } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { usePrintSheetScale } from '../hooks/usePrintSheetScale';

interface MonthlyViewProps {
  tasks: Task[];
  courses: Course[];
  categories: CategoryDef[];
  onAddTask: (date: Date) => void;
  onTaskClick: (task: Task) => void;
  todaysMoodEmoji?: string;
  onOpenMood: () => void;
}

export function MonthlyView({ tasks, courses, categories, onAddTask, onTaskClick, todaysMoodEmoji, onOpenMood }: MonthlyViewProps) {
  const [[currentDate, direction], setPage] = useState([new Date(), 0]);
  const isScrolling = useState(false);
  const printSheetRef = useRef<HTMLDivElement>(null);
  usePrintSheetScale(printSheetRef);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const paginate = (newDirection: number) => {
    setPage([addMonths(currentDate, newDirection), newDirection]);
  };

  const nextMonth = () => paginate(1);
  const prevMonth = () => paginate(-1);

  const handleWheel = (e: React.WheelEvent) => {
    if ((e.target as HTMLElement).closest('.overflow-y-auto')) {
      return;
    }

    if (isScrolling[0]) return;

    if (Math.abs(e.deltaY) > 20) {
      isScrolling[1](true);
      if (e.deltaY > 0) {
        nextMonth();
      } else {
        prevMonth();
      }
      setTimeout(() => isScrolling[1](false), 400);
    }
  };

  const variants = {
    enter: (direction: number) => {
      return {
        y: direction > 0 ? 800 : -800,
        opacity: 0,
        scale: 0.95
      };
    },
    center: {
      zIndex: 1,
      y: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        y: direction < 0 ? 800 : -800,
        opacity: 0,
        scale: 0.95
      };
    }
  };

  const titleText = format(currentDate, 'MMMM yyyy');

  return (
    <div className="flex flex-col h-full print-expand relative">
      <div className="flex items-center justify-between mb-6 no-print flex-shrink-0">
        <div className="flex items-center gap-3 screen-only">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {titleText}
          </h2>
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
        <div className="flex gap-2 items-center">
          <button onClick={() => window.print()} className="p-2 mr-2 rounded-2xl glass hover:bg-white dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-colors" title="Print Planner">
            <Printer className="w-6 h-6" />
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-zinc-700 mr-2"></div>
          <button
            type="button"
            onClick={prevMonth}
            className="planner-nav-arrow p-2 rounded-2xl glass text-gray-600 dark:text-gray-300"
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="planner-nav-arrow p-2 rounded-2xl glass text-gray-600 dark:text-gray-300"
            aria-label="Next month"
            title="Next month"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="print-sheet-outer flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref={printSheetRef} className="print-sheet flex min-h-0 flex-1 flex-col w-full">
          <h2 className="print-only mb-3 text-center text-3xl font-bold text-gray-900">{titleText}</h2>

          <div className="flex-grow glass squircle overflow-hidden flex flex-col shadow-sm border border-white/40 dark:border-white/10 relative min-h-0" onWheel={handleWheel}>
            <div className="monthly-day-head-row z-20 grid grid-cols-7 border-b border-pink-100/50 bg-white/40 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-gray-400">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                <div key={d} className="hidden sm:block">{d}</div>
              ))}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="sm:hidden">{d}</div>
              ))}
            </div>

            <div className="flex-grow relative bg-[#FFF9FB]/50 dark:bg-zinc-900/50 overflow-hidden">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={monthStart.toISOString()}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="grid grid-cols-7 h-full absolute inset-0 auto-rows-fr"
                >
                  {days.map((day, idx) => {
                    const dayTasks = tasks.filter((t) => t.dueDate === format(day, 'yyyy-MM-dd'));
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          'month-day-cell border-b border-r border-pink-100/50 dark:border-zinc-800/50 p-2 relative group flex flex-col gap-1 transition-colors hover:bg-white/40 dark:hover:bg-zinc-800/40',
                          !isCurrentMonth && 'opacity-40',
                          idx % 7 === 6 && 'border-r-0'
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <span className={cn(
                            'w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold month-day-num',
                            isToday ? 'bg-pink-400 text-white shadow-md' : 'text-gray-600 dark:text-gray-400'
                          )}>
                            {format(day, 'd')}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddTask(day)}
                            className="no-print opacity-0 group-hover:opacity-100 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-pink-100 transition-all hover:bg-pink-200 dark:bg-pink-900/40 dark:hover:bg-pink-900/60 dark:text-pink-400 text-pink-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="no-scrollbar flex max-h-[80px] flex-col gap-1 overflow-y-auto z-10 monthly-task-stack">
                          {dayTasks.map((task) => {
                            const course = courses.find((c) => c.id === task.courseId);
                            const categoryDef = categories?.find((c) => c.id === task.category);
                            const categoryIcon = categoryDef?.icon || '📌';
                            const categoryColor = categoryDef?.color || '#cbd5e1';
                            return (
                              <div
                                key={task.id}
                                onClick={() => onTaskClick(task)}
                                className={cn(
                                  'monthly-task-chip flex cursor-pointer items-center gap-1 rounded-md border border-white/40 px-1 py-1 font-semibold shadow-sm truncate transition-transform hover:scale-[1.02] dark:border-white/10 print-monthly-chip',
                                  task.completed ? 'line-through grayscale-[50%] opacity-50' : ''
                                )}
                                style={{ backgroundColor: course?.color || '#e2e8f0', color: '#18181b' }}
                              >
                                <span
                                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[4px] opacity-90"
                                  style={{
                                    backgroundColor: `${categoryColor}30`,
                                    color: categoryColor,
                                    border: `1px solid ${categoryColor}50`
                                  }}
                                >
                                  {categoryIcon}
                                </span>
                                {course?.icon && <span className="text-[10px] leading-none opacity-80">{course.icon}</span>}
                                <span className="min-w-0 flex-1 truncate">{task.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
