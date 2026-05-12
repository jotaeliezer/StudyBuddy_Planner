import type { Mood } from '../types';

export type MoodDisplayEntry = {
  type: Mood;
  emoji: string;
  label: string;
  color: string;
};

/** Single source for mood picker and emoji/title lookups. */
export const MOOD_ENTRIES: MoodDisplayEntry[] = [
  { type: 'happy', emoji: '😊', label: 'Happy', color: 'bg-green-100 text-green-700 border-green-200' },
  { type: 'joyful', emoji: '😁', label: 'Joyful', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { type: 'excited', emoji: '🤩', label: 'Excited', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { type: 'loved', emoji: '🥰', label: 'Loved', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { type: 'creative', emoji: '✨', label: 'Creative', color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' },
  { type: 'focused', emoji: '🤓', label: 'Focused', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { type: 'neutral', emoji: '😐', label: 'Neutral', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { type: 'tired', emoji: '🥱', label: 'Tired', color: 'bg-slate-200 text-slate-700 border-slate-300' },
  { type: 'stressed', emoji: '😖', label: 'Stressed', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { type: 'anxious', emoji: '😰', label: 'Anxious', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { type: 'angry', emoji: '😠', label: 'Angry', color: 'bg-red-100 text-red-700 border-red-200' },
  { type: 'sick', emoji: '🤒', label: 'Sick', color: 'bg-lime-100 text-lime-700 border-lime-200' },
];

export function getMoodEmoji(mood?: Mood): string | undefined {
  return MOOD_ENTRIES.find((m) => m.type === mood)?.emoji;
}

export function getMoodLabel(mood?: Mood): string | undefined {
  return MOOD_ENTRIES.find((m) => m.type === mood)?.label;
}
