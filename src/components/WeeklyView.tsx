import { useState } from 'react';
import { format, addWeeks, subWeeks, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Circle, Printer, Edit2, Trash2, GripVertical, Settings2 } from 'lucide-react';
import { Course, Task, CategoryDef } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { CourseModal } from './CourseModal';
import { useConfirm } from '../context/ConfirmContext';

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
}

const WeeklyTaskBlock = ({ task, courses, categories, onToggle, onEdit, compact }: any) => {
  const course = courses.find((c: any) => c.id === task.courseId);
  const categoryDef = categories?.find((c: any) => c.id === task.category);
  const categoryIcon = categoryDef?.icon || '📌';
  const categoryColor = categoryDef?.color || '#cbd5e1';
  
  // Format time if present
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
      className={cn(
        "rounded-xl flex items-start gap-1.5 shadow-sm border border-white/40 dark:border-white/10 transition-all overflow-hidden group relative",
        compact ? "p-1.5 min-h-[4rem]" : "p-2",
        task.completed ? "opacity-60 bg-gray-100/80 dark:bg-zinc-800/80 grayscale-[50%]" : ""
      )}
      style={{ backgroundColor: task.completed ? undefined : course?.color || '#e2e8f0' }}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        className="mt-[2px] shrink-0 text-gray-700/80 hover:text-black transition-colors z-10"
      >
        {task.completed ? <CheckCircle2 className="w-4 h-4 text-green-700" /> : <Circle className="w-4 h-4 opacity-60" />}
      </button>
      <div className="flex flex-col min-w-0 flex-grow pt-[1px] relative">
        <div className="flex items-start gap-1 pr-5">
          <span className="text-xs w-5 h-5 flex items-center justify-center rounded-md flex-shrink-0" style={{ backgroundColor: `${categoryColor}30`, color: categoryColor, border: `1px solid ${categoryColor}50` }}>
            <span className="opacity-90">{categoryIcon}</span>
          </span>
          <span className={cn(
            "font-semibold leading-tight text-gray-800 break-words drop-shadow-sm mt-0.5",
            compact ? "text-[12px]" : "text-sm",
            task.completed && "line-through opacity-70"
          )}>
            {task.title}
          </span>
        </div>
        {displayTime && (
          <span className="text-[10px] text-gray-700/90 font-bold mt-0.5 whitespace-nowrap">{displayTime}</span>
        )}
      </div>
      
      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white/50 hover:bg-white dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-gray-700 transition-all z-10 no-print backdrop-blur-sm"
          title="Edit Task"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export function WeeklyView({ tasks, courses, categories, onAddTask, onToggleTaskCompletion, onEditTask, onAddCourse, onUpdateCourse, onDeleteCourse, onReorderCourses, todaysMoodEmoji }: WeeklyViewProps) {
  const confirm = useConfirm();
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
    // Let overflow containers handle their own scroll
    if ((e.target as HTMLElement).closest('.overflow-y-auto')) {
      return;
    }

    if (isScrolling[0]) return;
    
    // Only handle horizontal or vertical scroll if big enough, to avoid jitter
    if (Math.abs(e.deltaY) > 20 || Math.abs(e.deltaX) > 20) {
      isScrolling[1](true);
      if (e.deltaY > 0 || e.deltaX > 0) {
        nextWeek();
      } else {
        prevWeek();
      }
      setTimeout(() => isScrolling[1](false), 400); // Prevent scrolling too fast
    }
  };

  // Compute course rows
  const courseRows = [...courses];
  const hasOtherTasks = tasks.some(t => !courses.find(c => c.id === t.courseId));
  if (hasOtherTasks) {
    courseRows.push({ id: 'other', name: 'Other Tasks', color: '#9ca3af' } as Course);
  }

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.95
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.95
      };
    }
  };

  return (
    <>
      <div className="flex flex-col h-full print-expand relative">
      <div className="flex items-center justify-between mb-6 no-print flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Week of {format(weekStart, 'MMM do, yyyy')}
          </h2>
          {todaysMoodEmoji && <div className="text-3xl title-emoji bg-white/50 dark:bg-zinc-800/50 w-12 h-12 flex items-center justify-center rounded-[1rem] shadow-sm">{todaysMoodEmoji}</div>}
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={openAddCourse} className="px-4 py-2 mr-2 rounded-xl bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/40 dark:hover:bg-pink-900/60 text-pink-600 dark:text-pink-300 font-bold transition-colors">
            + Add Course
          </button>
          <button onClick={() => window.print()} className="p-2 mr-2 rounded-2xl glass hover:bg-white dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-colors" title="Print Planner">
            <Printer className="w-6 h-6" />
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-zinc-700 mr-2"></div>
          <button onClick={prevWeek} className="p-2 rounded-2xl glass hover:bg-white dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={nextWeek} className="p-2 rounded-2xl glass hover:bg-white dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-grow glass squircle overflow-hidden shadow-sm flex flex-col border border-white/40 dark:border-white/10 relative" onWheel={handleWheel}>
        <div className="flex-grow overflow-y-auto no-scrollbar relative flex flex-col">
          {/* Header Row (Sticky) */}
          <div className="sticky top-0 z-30 flex shrink-0 border-b border-pink-100/50 dark:border-zinc-700/50 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md">
            {/* Top Left Cell */}
            <div className="w-28 shrink-0 border-r border-pink-100/50 dark:border-zinc-700/50 flex items-center justify-center bg-white/60 dark:bg-zinc-800/60 z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
               <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Courses</span>
            </div>
            
            {/* Day Headers (Animated independently to keep them synced with body) */}
            <div className="flex-grow overflow-hidden relative">
               <AnimatePresence initial={false} custom={direction} mode="popLayout">
                 <motion.div 
                   key={weekStart.toISOString() + "-header"}
                   custom={direction}
                   variants={variants}
                   initial="enter"
                   animate="center"
                   exit="exit"
                   transition={{ type: "spring", stiffness: 300, damping: 30 }}
                   className="grid grid-cols-7 h-full"
                 >
                   {days.map(day => (
                     <div key={day.toISOString()} className={cn(
                       "p-3 text-center border-r border-pink-100/50 dark:border-zinc-700/50 last:border-r-0 relative flex flex-col justify-center",
                       isSameDay(day, new Date()) ? "bg-pink-50/50 dark:bg-pink-900/10" : ""
                     )}>
                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{format(day, 'EEEE')}</div>
                        <div className={cn("text-xl font-black mt-0.5", isSameDay(day, new Date()) ? "text-pink-500" : "text-gray-700 dark:text-gray-200")}>{format(day, 'd')}</div>
                     </div>
                   ))}
                 </motion.div>
               </AnimatePresence>
            </div>
          </div>

          {/* Body Grid */}
          <div className="flex flex-grow relative">
            {/* Courses Left Column */}
            <Reorder.Group as="div" axis="y" values={courses} onReorder={onReorderCourses || (() => {})} className="w-28 shrink-0 flex flex-col border-r border-pink-100/50 dark:border-zinc-700/50 bg-[#FFF9FB]/80 dark:bg-zinc-900/80 z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] text-center relative">
               {courses.map(course => (
                 <Reorder.Item as="div" key={course.id} value={course} className="h-40 border-b border-pink-100/50 dark:border-zinc-700/50 flex flex-col items-center justify-center p-3 relative overflow-hidden group cursor-grab active:cursor-grabbing bg-[#FFF9FB]/80 dark:bg-zinc-900/80">
                    {/* Drag Handle */}
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-gray-500 z-20">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="absolute inset-0 opacity-10 transition-opacity" style={{ backgroundColor: course.color }}></div>
                    {course.icon ? (
                      <div className="text-2xl mb-2 relative z-10 drop-shadow-sm pointer-events-none">{course.icon}</div>
                    ) : (
                      <div className="w-4 h-4 rounded-full mb-3 shadow-sm border border-black/5 dark:border-white/10 pointer-events-none" style={{ backgroundColor: course.color }}></div>
                    )}
                    <span className="font-bold text-xs leading-snug text-gray-700 dark:text-gray-300 relative z-10 pointer-events-none">{course.name}</span>
                    
                    {/* Hover Actions */}
                    <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button 
                        onPointerDown={(e) => e.stopPropagation()} 
                        onClick={() => openEditCourse(course)} 
                        className="p-1 rounded bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-gray-600 shadow-sm"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
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
                        className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-500 shadow-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                 </Reorder.Item>
               ))}
               {hasOtherTasks && (
                 <div key="other" className="h-40 border-b border-pink-100/50 dark:border-zinc-700/50 flex flex-col items-center justify-center p-3 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-10 transition-opacity" style={{ backgroundColor: '#9ca3af' }}></div>
                    <span className="font-bold text-xs leading-snug text-gray-700 dark:text-gray-300 relative z-10">Other Tasks</span>
                 </div>
               )}
            </Reorder.Group>

            {/* Animatable Grid Cells */}
            <div className="flex-grow overflow-hidden relative bg-[#FFF9FB]/30 dark:bg-zinc-900/30">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                 <motion.div 
                   key={weekStart.toISOString() + "-body"}
                   custom={direction}
                   variants={variants}
                   initial="enter"
                   animate="center"
                   exit="exit"
                   transition={{ type: "spring", stiffness: 300, damping: 30 }}
                   className="absolute inset-0 grid grid-cols-7"
                 >
                   {days.map(day => (
                     <div key={day.toISOString()} className="border-r border-pink-100/50 dark:border-zinc-700/50 last:border-r-0 flex flex-col overflow-visible items-stretch">
                        {courseRows.map(course => {
                          const cellTasks = tasks.filter(t => 
                            t.dueDate === format(day, 'yyyy-MM-dd') && 
                            // Either matches this course, or we're in 'other' and task matches no known course
                            (t.courseId === course.id || (course.id === 'other' && !courses.find(c => c.id === t.courseId)))
                          );
                          return (
                            <div key={course.id} className="h-40 border-b border-pink-100/50 dark:border-zinc-700/50 relative p-1.5 group overflow-y-auto no-scrollbar flex flex-col justify-start">
                               {/* Tasks */}
                               <div className="flex flex-col gap-1.5 z-10 relative">
                                 {cellTasks
                                   .sort((a,b) => (a.time || '24:00').localeCompare(b.time || '24:00'))
                                   .map(task => (
                                   <WeeklyTaskBlock key={task.id} task={task} courses={courses} categories={categories} onToggle={onToggleTaskCompletion} onEdit={onEditTask} compact />
                                 ))}
                               </div>
                               
                               {/* Add Button */}
                               <button 
                                  onClick={() => onAddTask(day, '', course.id === 'other' ? undefined : course.id)}
                                  className={cn(
                                    "w-full min-h-[1.5rem] mt-1 shrink-0 rounded-[8px] border border-dashed flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 relative",
                                    cellTasks.length === 0 ? "h-full absolute inset-1.5 mt-0 top-0 left-0 right-0 max-h-[calc(100%-0.75rem)]" : "",
                                  )}
                                  style={{
                                    borderColor: course.color ? `${course.color}60` : undefined,
                                    color: course.color ? course.color : undefined,
                                    backgroundColor: course.color ? `${course.color}15` : undefined
                                  }}
                               >
                                  <Plus className="w-4 h-4" />
                               </button>
                            </div>
                          )
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
      <CourseModal 
        isOpen={isCourseModalOpen} 
        onClose={() => setIsCourseModalOpen(false)} 
        onSave={handleSaveCourse}
        existingCourse={editingCourse}
      />
    </>
  );
}
