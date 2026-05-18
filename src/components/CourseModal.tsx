import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Course } from '../types';
import { cn, createId } from '../lib/utils';
import { motion } from 'motion/react';

const COLORS = [
  '#FFD1DC',
  '#C1E1C1',
  '#AEC6CF',
  '#C3B1E1',
  '#FDFD96',
  '#FFDAC1',
  '#FFB7B2',
  '#E2F0CB',
  '#B5EAD7',
  '#FF9AA2',
];

const EMOJIS = [
  // Science & Nature
  '🔬', '🧬', '🧪', '⚗️', '🔭', '🌡️', '🌿', '🌊', '🌋', '🐾',
  // Technology & Engineering
  '💻', '🖥️', '📱', '⌨️', '🤖', '🔧', '⚙️', '🛠️', '💡', '🔌',
  // Arts & Creativity
  '🎨', '🖌️', '🎭', '🎬', '📸', '✏️', '🖊️', '🎪', '🪄', '🎠',
  // Literature & Language
  '📚', '📖', '✍️', '📝', '🗣️', '📰', '🗞️', '📜', '📑', '🔖',
  // Math & Logic
  '📐', '📏', '🔢', '📊', '📈', '🧮', '♾️', '🎯', '🔣', '🧩',
  // Sports & Wellness
  '⚽', '🏃', '🏋️', '🧘', '🏊', '🚴', '🎾', '🏀', '⚾', '🥊',
  // Music & Performance
  '🎵', '🎸', '🎹', '🥁', '🎺', '🎻', '🎤', '🎧', '🎼', '🪗',
  // Geography & Social Studies
  '🌎', '🗺️', '🏛️', '⚔️', '🌍', '🗼', '🏙️', '🧭', '🌐', '🏺',
  // General Academic
  '🎓', '🏫', '📋', '🗂️', '🔑', '💎', '🌟', '🦋', '🌸', '🍀',
];

export interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => void;
  existingCourse?: Course;
}

export function CourseModal({ isOpen, onClose, onSave, existingCourse }: CourseModalProps) {
  const [name, setName] = useState(existingCourse?.name || '');
  const [color, setColor] = useState(existingCourse?.color || COLORS[0]);
  const [icon, setIcon] = useState(existingCourse?.icon || EMOJIS[0]);

  useEffect(() => {
    if (isOpen) {
      setName(existingCourse?.name || '');
      setColor(existingCourse?.color || COLORS[Math.floor(Math.random() * COLORS.length)]);
      setIcon(existingCourse?.icon || EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
    }
  }, [isOpen, existingCourse]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: existingCourse?.id || createId(),
      name: name.trim(),
      color,
      icon,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {existingCourse ? 'Edit Course' : 'Add Course'}
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Course Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Biology"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-700 border-2 border-transparent focus:border-pink-300 dark:focus:border-pink-500 outline-none font-medium transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full shadow-sm hover:scale-110 transition-transform',
                    color === c ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-gray-400' : ''
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Icon</label>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 dark:border-zinc-700 p-1 scrollbar-thin">
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(e)}
                    className={cn(
                      'w-10 h-10 rounded-xl text-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors',
                      icon === e ? 'bg-pink-100 dark:bg-pink-900/40 ring-2 ring-pink-400 shadow-inner' : ''
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold transition-colors mt-4"
          >
            {existingCourse ? 'Save Changes' : 'Add Course'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
