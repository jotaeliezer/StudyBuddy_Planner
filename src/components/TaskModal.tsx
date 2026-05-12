import React, { useState, useEffect, useRef } from 'react';
import { Course, Task, TaskCategory } from '../types';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, isValid } from 'date-fns';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { CategoryDef } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'completed'>) => void;
  onDelete?: (id: string) => void;
  courses: Course[];
  categories: CategoryDef[];
  initialDate?: Date;
  initialTime?: string;
  initialCourseId?: string;
  existingTask?: Task;
}

const DatePicker = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  
  const parsedDate = value ? parseISO(value) : new Date();
  const selectedDate = isValid(parsedDate) ? parsedDate : new Date();
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="relative z-20">
      <div 
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 border-2 border-transparent focus-within:border-pink-300 dark:focus-within:border-pink-500/50 outline-none font-medium text-gray-800 dark:text-gray-200 transition-all shadow-inner cursor-pointer flex justify-between items-center"
      >
        <span>{format(selectedDate, 'MMM do, yyyy')}</span>
        <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      </div>
      
      <AnimatePresence>
        {open && (
           <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-14 left-0 w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-pink-100 dark:border-zinc-700 overflow-hidden z-50 p-4"
            >
               <div className="flex justify-between items-center mb-4">
                 <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-pink-50 dark:hover:bg-zinc-800 rounded-full text-pink-500 transition-colors">
                   <ChevronLeft className="w-5 h-5" />
                 </button>
                 <span className="font-bold text-gray-700 dark:text-gray-200">{format(currentMonth, 'MMMM yyyy')}</span>
                 <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-pink-50 dark:hover:bg-zinc-800 rounded-full text-pink-500 transition-colors">
                   <ChevronRight className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="grid grid-cols-7 text-center mb-2">
                 {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                   <div key={d} className="text-xs font-bold text-pink-300 dark:text-pink-600">{d}</div>
                 ))}
               </div>
               
               <div className="grid grid-cols-7 gap-1">
                 {days.map(day => {
                   const isSelected = isSameDay(day, selectedDate);
                   const inMonth = isSameMonth(day, currentMonth);
                   return (
                     <button
                       key={day.toISOString()}
                       type="button"
                       onClick={() => { onChange(format(day, 'yyyy-MM-dd')); setOpen(false); }}
                       className={cn(
                         "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors mx-auto",
                         isSelected ? "bg-pink-400 text-white shadow-md hover:bg-pink-500" : 
                         inMonth ? "text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-zinc-800" : "text-gray-300 dark:text-zinc-600"
                       )}
                     >
                       {format(day, 'd')}
                     </button>
                   )
                 })}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

const CourseSelect = ({ courses, value, onChange }: { courses: Course[], value: string, onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const selectedCourse = courses.find(c => c.id === value);
  
  return (
    <div className="relative z-10">
      <div 
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 border-2 border-transparent focus-within:border-pink-300 dark:focus-within:border-pink-500/50 outline-none font-medium text-gray-800 dark:text-gray-200 transition-all shadow-inner cursor-pointer flex justify-between items-center"
      >
        <span>{selectedCourse ? selectedCourse.name : (courses.length === 0 ? 'Please add a course first' : 'Select a course...')}</span>
        <div className="flex items-center gap-2">
          {selectedCourse && (
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: selectedCourse.color }} />
          )}
          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
      
      <AnimatePresence>
        {open && courses.length > 0 && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-14 left-0 w-full bg-white dark:bg-zinc-900 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-pink-100 dark:border-zinc-700 overflow-hidden z-50 flex flex-col max-h-[200px] overflow-y-auto no-scrollbar"
            >
              {courses.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => { onChange(c.id); setOpen(false); }}
                  className="px-4 py-3 hover:bg-pink-50 dark:hover:bg-zinc-800 cursor-pointer flex justify-between items-center transition-colors border-b border-pink-50/50 dark:border-zinc-800/50 last:border-b-0"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-200">{c.name}</span>
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: c.color }} />
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const TimeSelect = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [hStr, mStr] = (value || '12:00').split(':');
  let hour24 = parseInt(hStr, 10);
  if (isNaN(hour24)) hour24 = 12;
  const minute = parseInt(mStr, 10) || 0;
  
  const isPM = hour24 >= 12;
  const displayHour = hour24 % 12 === 0 ? 12 : hour24 % 12;

  const displayValue = value ? `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}` : 'Select time';

  const formatHourString = (h: number, pm: boolean) => {
     let h24 = h === 12 ? (pm ? 12 : 0) : (pm ? h + 12 : h);
     return `${h24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const formatMinuteString = (m: number) => {
     return `${hour24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const setAmPmValue = (pm: boolean) => {
     let h24 = hour24;
     if (pm && hour24 < 12) h24 += 12;
     else if (!pm && hour24 >= 12) h24 -= 12;
     return `${h24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative z-20 w-full" ref={ref}>
      <div 
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 rounded-2xl bg-gray-50/80 dark:bg-zinc-900/50 hover:bg-[#FFF9FB] dark:hover:bg-zinc-800 border-2 border-transparent focus-within:border-pink-300 dark:focus-within:border-pink-500/50 outline-none font-bold text-gray-800 dark:text-gray-200 transition-all shadow-inner cursor-pointer flex justify-between items-center"
      >
        <span className={!value ? "text-gray-400 font-medium" : "text-pink-600 dark:text-pink-300"}>{displayValue}</span>
        <Clock className={cn("w-5 h-5 transition-colors", open ? "text-pink-500" : "text-gray-400 dark:text-gray-500")} />
      </div>
      
      <AnimatePresence>
        {open && (
           <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-14 left-0 w-full bg-[#FFF9FB] dark:bg-zinc-900 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border-2 border-pink-100 dark:border-zinc-700 overflow-hidden z-50 p-4"
            >
              <div className="flex justify-between items-center bg-white dark:bg-zinc-800/50 rounded-[20px] p-2 mb-3 shadow-sm border border-pink-50 dark:border-zinc-700/50">
                 <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="w-full text-center text-sm font-bold text-gray-500 hover:text-pink-500 py-1.5 transition-colors">
                    Make it All Day
                 </button>
              </div>

              <div className="flex justify-between gap-3 h-40 mb-3">
                 {/* HOURS LIST */}
                 <div className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory rounded-[20px] bg-white dark:bg-zinc-800/30 border border-pink-50 dark:border-zinc-700/50 shadow-inner scroll-smooth">
                    {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                       <div key={h} className="snap-center h-12 w-full flex items-center justify-center p-1.5">
                          <button 
                            type="button" 
                            onClick={() => { onChange(formatHourString(h, isPM)); }}
                            className={cn("w-full h-full rounded-2xl text-sm font-bold transition-all", displayHour === h ? "bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300 shadow-sm scale-110" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700")}
                          >
                             {h.toString().padStart(2, '0')}
                          </button>
                       </div>
                    ))}
                 </div>
                 
                 {/* COLON SEPARATOR */}
                 <div className="flex items-center justify-center text-pink-200 dark:text-zinc-600 font-black text-xl mb-2">:</div>
                 
                 {/* MINUTES LIST */}
                 <div className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory rounded-[20px] bg-white dark:bg-zinc-800/30 border border-pink-50 dark:border-zinc-700/50 shadow-inner scroll-smooth">
                    {Array.from({length: 12}, (_, i) => i * 5).map(m => (
                       <div key={m} className="snap-center h-12 w-full flex items-center justify-center p-1.5">
                          <button 
                            type="button" 
                            onClick={() => { onChange(formatMinuteString(m)); }}
                            className={cn("w-full h-full rounded-2xl text-sm font-bold transition-all", minute === m ? "bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300 shadow-sm scale-110" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700")}
                          >
                             {m.toString().padStart(2, '0')}
                          </button>
                       </div>
                    ))}
                 </div>
              </div>

              {/* AM/PM SELECTOR (Side by side at bottom) */}
              <div className="flex gap-2 h-14 bg-white dark:bg-zinc-800/30 rounded-[20px] p-2 border border-pink-50 dark:border-zinc-700/50 shadow-sm">
                <button 
                  type="button"
                  onClick={() => onChange(setAmPmValue(false))}
                  className={cn("flex-1 rounded-2xl text-[15px] font-black transition-all", !isPM ? "bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300 shadow-sm" : "text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700")}
                >
                  AM
                </button>
                <button 
                  type="button"
                  onClick={() => onChange(setAmPmValue(true))}
                  className={cn("flex-1 rounded-2xl text-[15px] font-black transition-all", isPM ? "bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300 shadow-sm" : "text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700")}
                >
                  PM
                </button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function TaskModal({ isOpen, onClose, onSave, onDelete, courses, categories, initialDate, initialTime, initialCourseId, existingTask }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('');
  const [courseId, setCourseId] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Homework');

  useEffect(() => {
    if (isOpen) {
      if (existingTask) {
        setTitle(existingTask.title);
        setDate(existingTask.dueDate);
        setTime(existingTask.time || '');
        setCourseId(existingTask.courseId);
        setCategory(existingTask.category);
      } else {
        setTitle('');
        setDate(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
        setTime(initialTime || '');
        setCourseId(initialCourseId || courses[0]?.id || '');
        setCategory('Homework');
      }
    }
  }, [isOpen, existingTask, initialDate, initialTime, courses]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseId) return;
    onSave({
      title: title.trim(),
      dueDate: date,
      time: time || undefined,
      courseId,
      category,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FFF9FB]/80 dark:bg-[#18181b]/80 backdrop-blur-sm no-print">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl overflow-hidden border border-pink-100 dark:border-zinc-800"
      >
        <div className="flex justify-between items-center p-6 border-b border-pink-50 dark:border-white/5 bg-[#FFF9FB] dark:bg-zinc-800/50">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {existingTask ? 'Edit Task ✍️' : 'New Task ✨'}
          </h3>
          <button onClick={onClose} type="button" className="p-2 rounded-full hover:bg-white dark:hover:bg-zinc-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shadow-sm bg-white/50 dark:bg-zinc-800/50">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">What needs to be done?</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Read Chapter 4"
              className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-800 border-2 border-transparent focus:border-pink-300 dark:focus:border-pink-500/50 outline-none font-medium text-gray-800 dark:text-gray-200 transition-all shadow-inner"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-grow">
              <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">When is it due?</label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div className="flex flex-col gap-2 w-1/3">
              <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</label>
              <TimeSelect value={time} onChange={setTime} />
            </div>
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Which course?</label>
            <CourseSelect courses={courses} value={courseId} onChange={setCourseId} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</label>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    category === cat.id 
                      ? 'shadow-md scale-105' 
                      : 'bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-transparent'
                  }`}
                  style={category === cat.id ? { backgroundColor: `${cat.color}20`, color: cat.color, borderColor: `${cat.color}40`, borderWidth: '1px' } : {}}
                >
                  <span className="opacity-80">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50 dark:border-white/5">
            {existingTask && onDelete ? (
              <button 
                type="button"
                onClick={() => { onDelete(existingTask.id); onClose(); }}
                className="text-red-400 hover:text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete 🗑️
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 rounded-2xl text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!title.trim() || !courseId}
                className="px-6 py-3 rounded-2xl bg-pink-400 hover:bg-pink-500 text-white font-bold transition-transform active:scale-95 disabled:opacity-50 shadow-md hover:shadow-lg disabled:hover:shadow-md"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
