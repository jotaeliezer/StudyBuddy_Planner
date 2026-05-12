import { useState, useEffect } from 'react';
import { Course, Task, Sticker, DailyMood, CategoryDef } from '../types';

const DEFAULT_COURSES: Course[] = [
  { id: '1', name: 'Art History', color: '#FFD1DC' },
  { id: '2', name: 'Calculus', color: '#AEC6CF' },
  { id: '3', name: 'Literature', color: '#C1E1C1' },
];

export function usePlannerData() {
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('planner_courses');
    return saved ? JSON.parse(saved) : DEFAULT_COURSES;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('planner_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [stickers, setStickers] = useState<Sticker[]>(() => {
    const saved = localStorage.getItem('planner_stickers');
    return saved ? JSON.parse(saved) : [];
  });

  const [moods, setMoods] = useState<DailyMood[]>(() => {
    const saved = localStorage.getItem('planner_moods');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<CategoryDef[]>(() => {
    const saved = localStorage.getItem('planner_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate from string[] to CategoryDef[]
      return parsed.map((c: any) => {
        if (typeof c === 'string') {
          return { id: c, name: c, color: '#fbcfe8', icon: '📌' };
        }
        return c;
      });
    }
    return [
      { id: 'Homework', name: 'Homework', color: '#bfdbfe', icon: '📚' },
      { id: 'Exam', name: 'Exam', color: '#fbcfe8', icon: '📝' },
      { id: 'Project', name: 'Project', color: '#fed7aa', icon: '🚀' },
      { id: 'Reading', name: 'Reading', color: '#bbf7d0', icon: '📖' },
      { id: 'Personal', name: 'Personal', color: '#e9d5ff', icon: '🌿' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('planner_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('planner_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('planner_stickers', JSON.stringify(stickers));
  }, [stickers]);

  useEffect(() => {
    localStorage.setItem('planner_moods', JSON.stringify(moods));
  }, [moods]);

  useEffect(() => {
    localStorage.setItem('planner_categories', JSON.stringify(categories));
  }, [categories]);

  const addCategory = (category: CategoryDef) => {
    setCategories(prev => [...prev, category]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addCourse = (course: Course) => setCourses((prev) => [...prev, course]);
  const updateCourse = (updated: Course) => setCourses((prev) => prev.map(c => c.id === updated.id ? updated : c));
  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter(c => c.id !== id));
    // Also remove tasks for this course? Usually yes or set them to unassigned, let's just delete them for simplicity
    setTasks((prev) => prev.filter(t => t.courseId !== id));
  };
  const reorderCourses = (newCourses: Course[]) => setCourses(newCourses);

  const addTask = (task: Task) => setTasks((prev) => [...prev, task]);
  const updateTask = (updated: Task) => setTasks((prev) => prev.map(t => t.id === updated.id ? updated : t));
  const deleteTask = (id: string) => setTasks((prev) => prev.filter(t => t.id !== id));
  const toggleTaskCompletion = (id: string) => setTasks((prev) => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

  const addSticker = (sticker: Sticker) => setStickers((prev) => [...prev, sticker]);
  const removeSticker = (id: string) => setStickers((prev) => prev.filter(s => s.id !== id));

  const setMood = (mood: DailyMood) => {
    setMoods((prev) => {
      const existing = prev.find(m => m.date === mood.date);
      if (existing) {
        return prev.map(m => m.date === mood.date ? mood : m);
      }
      return [...prev, mood];
    });
  };

  return {
    courses, addCourse, updateCourse, deleteCourse, reorderCourses,
    tasks, addTask, updateTask, deleteTask, toggleTaskCompletion,
    stickers, addSticker, removeSticker,
    moods, setMood,
    categories, addCategory, deleteCategory,
  };
}
