import { useState, useEffect } from 'react';
import { Course, Task, Sticker, DailyMood, CategoryDef } from '../types';
import { safeLocalStorageGet, safeLocalStorageSet } from '../lib/safeStorage';

const DEFAULT_COURSES: Course[] = [];

const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: 'Homework', name: 'Homework', color: '#bfdbfe', icon: '📚' },
  { id: 'Exam', name: 'Exam', color: '#fbcfe8', icon: '📝' },
  { id: 'Project', name: 'Project', color: '#fed7aa', icon: '🚀' },
  { id: 'Reading', name: 'Reading', color: '#bbf7d0', icon: '📖' },
  { id: 'Personal', name: 'Personal', color: '#e9d5ff', icon: '🌿' },
];

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isCourse(v: unknown): v is Course {
  return isRecord(v) && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.color === 'string';
}

function isTaskCategory(v: unknown): boolean {
  if (typeof v === 'string') return true;
  return isRecord(v) && typeof v.id === 'string';
}

function isTask(v: unknown): v is Task {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.dueDate === 'string' &&
    typeof v.courseId === 'string' &&
    typeof v.completed === 'boolean' &&
    (v.time === undefined || typeof v.time === 'string') &&
    isTaskCategory(v.category)
  );
}

function isSticker(v: unknown): v is Sticker {
  return isRecord(v) && typeof v.id === 'string' && typeof v.emoji === 'string' && typeof v.date === 'string';
}

function isDailyMood(v: unknown): v is DailyMood {
  return isRecord(v) && typeof v.date === 'string' && typeof v.mood === 'string';
}

function isCategoryDef(v: unknown): v is CategoryDef {
  return isRecord(v) && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.color === 'string';
}

function loadCourses(): Course[] {
  try {
    const raw = safeLocalStorageGet('planner_courses');
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCourse);
  } catch {
    return [];
  }
}

function loadTasks(): Task[] {
  try {
    const raw = safeLocalStorageGet('planner_tasks');
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTask);
  } catch {
    return [];
  }
}

function loadStickers(): Sticker[] {
  try {
    const raw = safeLocalStorageGet('planner_stickers');
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSticker);
  } catch {
    return [];
  }
}

function loadMoods(): DailyMood[] {
  try {
    const raw = safeLocalStorageGet('planner_moods');
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDailyMood);
  } catch {
    return [];
  }
}

function loadCategories(): CategoryDef[] {
  try {
    const raw = safeLocalStorageGet('planner_categories');
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_CATEGORIES;
    const mapped: unknown[] = parsed.map((c: unknown) => {
      if (typeof c === 'string') {
        return { id: c, name: c, color: '#fbcfe8', icon: '📌' };
      }
      return c;
    });
    const filtered = mapped.filter(isCategoryDef);
    return filtered.length > 0 ? filtered : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function usePlannerData() {
  const [courses, setCourses] = useState<Course[]>(loadCourses);
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [stickers, setStickers] = useState<Sticker[]>(loadStickers);
  const [moods, setMoods] = useState<DailyMood[]>(loadMoods);
  const [categories, setCategories] = useState<CategoryDef[]>(loadCategories);

  useEffect(() => {
    safeLocalStorageSet('planner_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    safeLocalStorageSet('planner_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    safeLocalStorageSet('planner_stickers', JSON.stringify(stickers));
  }, [stickers]);

  useEffect(() => {
    safeLocalStorageSet('planner_moods', JSON.stringify(moods));
  }, [moods]);

  useEffect(() => {
    safeLocalStorageSet('planner_categories', JSON.stringify(categories));
  }, [categories]);

  const addCategory = (category: CategoryDef) => {
    setCategories((prev) => [...prev, category]);
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const addCourse = (course: Course) => setCourses((prev) => [...prev, course]);
  const updateCourse = (updated: Course) =>
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setTasks((prev) => prev.filter((t) => t.courseId !== id));
  };
  const reorderCourses = (newCourses: Course[]) => setCourses(newCourses);

  const addTask = (task: Task) => setTasks((prev) => [...prev, task]);
  const updateTask = (updated: Task) => setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  const deleteTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const toggleTaskCompletion = (id: string) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

  const addSticker = (sticker: Sticker) => setStickers((prev) => [...prev, sticker]);
  const removeSticker = (id: string) => setStickers((prev) => prev.filter((s) => s.id !== id));

  const setMood = (mood: DailyMood) => {
    setMoods((prev) => {
      const existing = prev.find((m) => m.date === mood.date);
      if (existing) {
        return prev.map((m) => (m.date === mood.date ? mood : m));
      }
      return [...prev, mood];
    });
  };

  return {
    courses,
    addCourse,
    updateCourse,
    deleteCourse,
    reorderCourses,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    stickers,
    addSticker,
    removeSticker,
    moods,
    setMood,
    categories,
    addCategory,
    deleteCategory,
  };
}
