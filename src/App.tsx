import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { MonthlyView } from './components/MonthlyView';
import { WeeklyView } from './components/WeeklyView';
import { HomeView } from './components/HomeView';
import { CourseManager } from './components/CourseManager';
import { TaskModal } from './components/TaskModal';
import { MoodModal } from './components/MoodModal';
import { PomodoroTimer } from './components/PomodoroTimer';
import { usePlannerData } from './hooks/usePlannerData';
import { useConfirm } from './context/ConfirmContext';
import { ThemeProvider, useTheme, THEMES, FONTS } from './context/ThemeContext';
import { Task } from './types';
import { format } from 'date-fns';
import type { AppView } from './types/view';
import { getMoodEmoji } from './constants/moods';
import { createId, cn } from './lib/utils';
import { safeLocalStorageGet } from './lib/safeStorage';

function AppInner() {
  const confirm = useConfirm();
  const { themeId, fontId, setTheme, setFont } = useTheme();
  const [currentView, setCurrentView] = useState<AppView>('week');

  const {
    courses, addCourse, updateCourse, deleteCourse, reorderCourses,
    tasks, addTask, updateTask, deleteTask, toggleTaskCompletion,
    moods, setMood,
    categories, addCategory, deleteCategory
  } = usePlannerData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const [modalTime, setModalTime] = useState<string | undefined>(undefined);
  const [modalCourseId, setModalCourseId] = useState<string | undefined>(undefined);

  const handleOpenModalForNewTask = (date: Date, time?: string, courseId?: string) => {
    setModalDate(date);
    setModalTime(time);
    setModalCourseId(courseId);
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Title', 'Date', 'Time', 'Course', 'Category', 'Completed'];

    const rows = tasks.map((t) => {
      const courseName = courses.find((c) => c.id === t.courseId)?.name || 'None';
      const catId = typeof t.category === 'string' ? t.category : t.category?.id ?? '';
      const categoryName =
        categories.find((c) => c.id === catId)?.name || String(catId);
      return [
        t.id,
        t.title.replace(/,/g, ''),
        t.dueDate,
        t.time || '',
        courseName.replace(/,/g, ''),
        String(categoryName).replace(/,/g, ''),
        t.completed ? 'Yes' : 'No'
      ];
    });

    const csvContent = [headers, ...rows]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planner_tasks_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportData = () => {
    let weekHeaders: Record<string, string> = {};
    try {
      const raw = safeLocalStorageGet('planner_week_headers');
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            if (typeof k === 'string' && typeof v === 'string') {
              weekHeaders[k] = v;
            }
          }
        }
      }
    } catch {
      weekHeaders = {};
    }
    const data = {
      courses,
      tasks,
      moods,
      categories,
      weekHeaders,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planner_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'completed'>) => {
    if (editingTask) {
      updateTask({ ...editingTask, ...taskData });
    } else {
      addTask({
        ...taskData,
        id: createId(),
        completed: false
      });
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysMood = moods.find((m) => m.date === todayStr)?.mood;
  const todaysMoodEmoji = getMoodEmoji(todaysMood);

  return (
    <div className="app-layout flex h-screen bg-[#FFF9FB] dark:bg-[#18181b] overflow-hidden font-sans p-4 gap-4 transition-colors duration-300">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenPomodoro={() => setIsPomodoroOpen(true)}
      />

      <main className="planner-main flex-1 overflow-y-auto no-scrollbar glass squircle p-6 shadow-sm border border-white/40 dark:border-white/10 relative z-10 w-full">
        {currentView === 'home' && (
          <HomeView
            tasks={tasks}
            courses={courses}
            moods={moods}
            onOpenMood={() => setIsMoodModalOpen(true)}
            todaysMoodEmoji={todaysMoodEmoji}
          />
        )}

        {currentView === 'month' && (
          <MonthlyView
            tasks={tasks}
            courses={courses}
            categories={categories}
            onAddTask={handleOpenModalForNewTask}
            onTaskClick={handleOpenModalForEdit}
            todaysMoodEmoji={todaysMoodEmoji}
            onOpenMood={() => setIsMoodModalOpen(true)}
          />
        )}

        {currentView === 'week' && (
          <WeeklyView
            tasks={tasks}
            courses={courses}
            categories={categories}
            onAddTask={handleOpenModalForNewTask}
            onToggleTaskCompletion={toggleTaskCompletion}
            onEditTask={handleOpenModalForEdit}
            onAddCourse={addCourse}
            onUpdateCourse={updateCourse}
            onDeleteCourse={deleteCourse}
            onReorderCourses={reorderCourses}
            todaysMoodEmoji={todaysMoodEmoji}
            onOpenMood={() => setIsMoodModalOpen(true)}
            onRescheduleTask={(taskId, next) => {
              const task = tasks.find((t) => t.id === taskId);
              if (!task) return;
              updateTask({ ...task, ...next });
            }}
          />
        )}

        {currentView === 'courses' && (
          <CourseManager
            courses={courses}
            onAddCourse={addCourse}
            onDeleteCourse={deleteCourse}
            onUpdateCourse={updateCourse}
            onReorderCourses={reorderCourses}
            todaysMoodEmoji={todaysMoodEmoji}
          />
        )}

        {currentView === 'settings' && (
          <div className="py-8 w-full max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Settings ⚙️</h2>
              {todaysMoodEmoji && <div className="text-3xl title-emoji bg-white/50 dark:bg-zinc-800/50 w-12 h-12 flex items-center justify-center rounded-[1rem] shadow-sm">{todaysMoodEmoji}</div>}
            </div>

            {/* Theme Panel */}
            <div className="glass squircle p-6 mb-8 border border-white/40 dark:border-white/10 shadow-sm">
              <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 mb-4">🎨 Theme</h3>
              <div className="grid grid-cols-4 gap-3">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all',
                      themeId === theme.id
                        ? 'border-pink-400 shadow-md'
                        : 'border-transparent hover:border-pink-200 dark:hover:border-pink-800'
                    )}
                    style={{ backgroundColor: theme.preview }}
                  >
                    <span className="text-2xl">{theme.emoji}</span>
                    <span
                      className="text-[10px] font-bold text-center leading-tight"
                      style={{ color: theme.id === 'noir' ? '#e9d5ff' : '#374151' }}
                    >
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Panel */}
            <div className="glass squircle p-6 mb-8 border border-white/40 dark:border-white/10 shadow-sm">
              <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 mb-4">✍️ Font</h3>
              <div className="flex flex-col gap-2">
                {FONTS.map(font => (
                  <button
                    key={font.id}
                    onClick={() => setFont(font.id)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all text-left',
                      fontId === font.id
                        ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-transparent bg-white/50 dark:bg-zinc-800/50 hover:border-pink-200'
                    )}
                  >
                    <div>
                      <p
                        className="font-bold text-gray-800 dark:text-gray-100 text-base"
                        style={{ fontFamily: font.cssValue }}
                      >
                        {font.label}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{font.name}</p>
                    </div>
                    {fontId === font.id && <span className="text-pink-500 font-black">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass squircle p-6 mb-8 border border-white/40 dark:border-white/10 shadow-sm">
              <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 mb-4">Task Categories</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Create and manage the categories you can assign to your tasks.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-1 bg-pink-50 dark:bg-pink-900/20 px-3 py-1.5 rounded-xl text-sm font-bold border border-pink-100 dark:border-pink-900/50 shadow-sm"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color, borderColor: `${cat.color}40` }}
                  >
                    <span className="mr-1 opacity-80">{cat.icon}</span>
                    <span>{cat.name}</span>
                    {categories.length > 1 && (
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="ml-1 w-5 h-5 rounded-md flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition"
                      >
                        <span className="text-[12px] leading-none mb-0.5">&times;</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.elements.namedItem('newCategory') as HTMLInputElement;
                  if (input.value.trim()) {
                    const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#a3e635'];
                    const emojis = ['📌', '⭐', '🔥', '💡', '🚀', '🎯', '🌿', '🍎', '🎨', '💻', '🧘', '⚡'];
                    addCategory({
                      id: input.value.trim(),
                      name: input.value.trim(),
                      color: colors[Math.floor(Math.random() * colors.length)],
                      icon: emojis[Math.floor(Math.random() * emojis.length)]
                    });
                    input.value = '';
                  }
                }}
                className="flex gap-2 text-sm"
              >
                <input
                  type="text"
                  name="newCategory"
                  placeholder="New Category..."
                  className="flex-grow px-4 py-2 rounded-xl bg-gray-50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-800 border-2 border-transparent focus:border-pink-300 dark:focus:border-pink-500/50 outline-none font-medium text-gray-800 dark:text-gray-200 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 rounded-xl font-bold hover:bg-pink-200 dark:hover:bg-pink-900/60 transition shadow-sm border border-pink-200 dark:border-pink-800"
                >
                  Add
                </button>
              </form>
            </div>

            <div className="glass squircle p-6 mb-8 shadow-sm border border-white/40 dark:border-white/10">
              <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 mb-2">Data Management</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Export your planner data or perform a hard reset.
              </p>

              <ul className="list-none space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center justify-between bg-white/50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-500 text-xl">📥</div>
                    <div>
                      <strong className="block text-gray-800 dark:text-gray-200 text-base">Export Data</strong>
                      <span className="text-gray-500 dark:text-gray-400">Download your planner content as JSON or CSV.</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportCsv}
                      className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 rounded-xl font-bold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm border border-green-100 dark:border-green-900/30 text-sm whitespace-nowrap"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportData}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-sm border border-blue-100 dark:border-blue-900/30 text-sm whitespace-nowrap"
                    >
                      Export JSON
                    </button>
                  </div>
                </li>
              </ul>

              <div className="mt-8 pt-6 border-t border-pink-100/50 dark:border-zinc-800 text-center">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Clear all planner data?',
                      message:
                        'Are you sure you want to delete all planner data? This cannot be undone.',
                      variant: 'danger',
                      confirmLabel: 'Clear everything',
                      cancelLabel: 'Cancel',
                    });
                    if (ok) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="px-6 py-3 bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-2xl font-bold transition-colors shadow-sm border border-red-100 dark:border-red-900/30"
                >
                  Clear All Data (Hard Reset)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTask}
          onDelete={deleteTask}
          courses={courses}
          categories={categories}
          initialDate={modalDate}
          initialTime={modalTime}
          initialCourseId={modalCourseId}
          existingTask={editingTask}
        />
      )}

      {isMoodModalOpen && (
        <MoodModal
          isOpen={isMoodModalOpen}
          onClose={() => setIsMoodModalOpen(false)}
          currentMood={todaysMood}
          onSave={setMood}
        />
      )}

      <AnimatePresence>
        {isPomodoroOpen && (
          <PomodoroTimer onClose={() => setIsPomodoroOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
