import { useState } from 'react';
import { Edit2, GripVertical, Trash2 } from 'lucide-react';
import { Course } from '../types';
import { CourseModal } from './CourseModal';
import { Reorder } from 'motion/react';
import { cn } from '../lib/utils';
import { useConfirm } from '../context/ConfirmContext';

interface CourseManagerProps {
  courses: Course[];
  onAddCourse: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
  onUpdateCourse: (course: Course) => void;
  onReorderCourses: (courses: Course[]) => void;
  todaysMoodEmoji?: string;
}

export function CourseManager({
  courses,
  onAddCourse,
  onDeleteCourse,
  onUpdateCourse,
  onReorderCourses,
  todaysMoodEmoji,
}: CourseManagerProps) {
  const confirm = useConfirm();
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
    if (editingCourse) {
      onUpdateCourse(course);
    } else {
      onAddCourse(course);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Courses</h2>
            {todaysMoodEmoji && (
              <div className="text-3xl title-emoji bg-white/50 dark:bg-zinc-800/50 w-12 h-12 flex items-center justify-center rounded-[1rem] shadow-sm">
                {todaysMoodEmoji}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={openAddCourse}
            className="px-4 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/40 dark:hover:bg-pink-900/60 text-pink-600 dark:text-pink-300 font-bold transition-colors"
          >
            + Add Course
          </button>
        </div>

        <div className="glass squircle p-4 sm:p-6 shadow-sm border border-white/40 dark:border-white/10 flex-1 min-h-0 flex flex-col">
          {courses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">
              No courses yet. Add a course to see it in your week view.
            </p>
          ) : (
            <Reorder.Group
              axis="y"
              values={courses}
              onReorder={onReorderCourses}
              className="flex flex-col gap-3 overflow-y-auto no-scrollbar pb-2"
            >
              {courses.map((course) => (
                <Reorder.Item
                  key={course.id}
                  value={course}
                  className={cn(
                    'relative flex items-center gap-4 p-4 rounded-2xl border border-pink-100/50 dark:border-zinc-700/50',
                    'bg-white/60 dark:bg-zinc-900/60 cursor-grab active:cursor-grabbing',
                    'group overflow-hidden'
                  )}
                >
                  <div className="text-gray-400 dark:text-gray-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div
                    className="absolute inset-0 opacity-[0.08] pointer-events-none"
                    style={{ backgroundColor: course.color }}
                  />
                  {course.icon ? (
                    <div className="text-3xl relative z-10 shrink-0">{course.icon}</div>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl shrink-0 shadow-sm border border-black/5 dark:border-white/10 relative z-10"
                      style={{ backgroundColor: course.color }}
                    />
                  )}
                  <div className="flex-1 min-w-0 relative z-10">
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate">{course.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{course.color}</p>
                  </div>
                  <div className="flex items-center gap-1 relative z-10 shrink-0">
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => openEditCourse(course)}
                      className="p-2 rounded-xl bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-gray-600 shadow-sm"
                      title="Edit course"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Delete this course?',
                          message:
                            'Are you sure you want to delete this course? Tasks linked to it will be removed.',
                          variant: 'danger',
                          confirmLabel: 'Delete',
                          cancelLabel: 'Cancel',
                        });
                        if (ok) onDeleteCourse(course.id);
                      }}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-500 shadow-sm"
                      title="Delete course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
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
