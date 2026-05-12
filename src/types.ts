export type Course = {
  id: string;
  name: string;
  color: string;
  icon?: string;
};

export type TaskCategory = string | { id: string; name: string; color: string };

export type CategoryDef = {
  id: string;
  name: string;
  color: string;
  icon?: string;
};

export type Task = {
  id: string;
  title: string;
  dueDate: string; // ISO string YYYY-MM-DD
  time?: string; // HH:mm format
  courseId: string;
  category: TaskCategory;
  completed: boolean;
};

export type Sticker = {
  id: string;
  emoji: string;
  date: string;
};

export type Mood = 'happy' | 'neutral' | 'sad' | 'stressed' | 'excited' | 'joyful' | 'creative' | 'tired' | 'focused' | 'anxious' | 'sick' | 'loved' | 'angry';

export type DailyMood = {
  date: string;
  mood: Mood;
};
