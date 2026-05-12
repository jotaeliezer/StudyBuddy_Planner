import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MonthlyView } from './components/MonthlyView';
import { WeeklyView } from './components/WeeklyView';
import { TaskModal } from './components/TaskModal';
import { MoodModal } from './components/MoodModal';
import { usePlannerData } from './hooks/usePlannerData';
import { Task, Mood } from './types';
import { format } from 'date-fns';

const MOODS = [
  { type: 'happy', emoji: '😊' },
  { type: 'joyful', emoji: '😁' },
  { type: 'excited', emoji: '🤩' },
  { type: 'loved', emoji: '🥰' },
  { type: 'creative', emoji: '✨' },
  { type: 'focused', emoji: '🤓' },
  { type: 'neutral', emoji: '😐' },
  { type: 'tired', emoji: '🥱' },
  { type: 'stressed', emoji: '😖' },
  { type: 'anxious', emoji: '😰' },
  { type: 'sad', emoji: '😢' },
  { type: 'angry', emoji: '😠' },
  { type: 'sick', emoji: '🤒' }
];

export default function App() {
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'courses' | 'settings'>('week');
  
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
    
    // Create rows
    const rows = tasks.map(t => {
      const courseName = courses.find(c => c.id === t.courseId)?.name || 'None';
      const categoryName = categories.find(c => c.id === t.category)?.name || t.category;
      return [
        t.id,
        t.title.replace(/,/g, ''), // escape commas
        t.dueDate,
        t.time || '',
        courseName.replace(/,/g, ''),
        categoryName,
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
    const data = {
      courses,
      tasks,
      moods,
      categories
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
        id: crypto.randomUUID(),
        completed: false
      });
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysMood = moods.find(m => m.date === todayStr)?.mood;
  const todaysMoodEmoji = MOODS.find(m => m.type === todaysMood)?.emoji;

  return (
    <div className="flex h-screen bg-[#FFF9FB] dark:bg-[#18181b] overflow-hidden font-sans p-4 gap-4 transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenMood={() => setIsMoodModalOpen(true)}
      />
      
      <main className="flex-1 overflow-y-auto no-scrollbar glass squircle p-6 shadow-sm border border-white/40 dark:border-white/10 relative z-10 w-full">
        {currentView === 'month' && (
          <MonthlyView 
            tasks={tasks} 
            courses={courses} 
            categories={categories}
            onAddTask={handleOpenModalForNewTask}
            onTaskClick={handleOpenModalForEdit}
            todaysMoodEmoji={todaysMoodEmoji}
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
          />
        )}
        
        {currentView === 'courses' && (
          <CourseManager 
            courses={courses} 
            onAddCourse={addCourse} 
            onDeleteCourse={deleteCourse}
            onUpdateCourse={updateCourse}
            todaysMoodEmoji={todaysMoodEmoji}
          />
        )}

        {currentView === 'settings' && (
          <div className="py-8 w-full max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Settings ⚙️</h2>
              {todaysMoodEmoji && <div className="text-3xl title-emoji bg-white/50 dark:bg-zinc-800/50 w-12 h-12 flex items-center justify-center rounded-[1rem] shadow-sm">{todaysMoodEmoji}</div>}
            </div>

            <div className="glass squircle p-6 mb-8 border border-white/40 dark:border-white/10 shadow-sm">
              <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 mb-4">Task Categories</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Create and manage the categories you can assign to your tasks.
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-1 bg-pink-50 dark:bg-pink-900/20 px-3 py-1.5 rounded-xl text-sm font-bold border border-pink-100 dark:border-pink-900/50 shadow-sm" style={{ backgroundColor: `${cat.color}20`, color: cat.color, borderColor: `${cat.color}40` }}>
                    <span className="mr-1 opacity-80">{cat.icon}</span>
                    <span>{cat.name}</span>
                    {categories.length > 1 && (
                      <button onClick={() => deleteCategory(cat.id)} className="ml-1 w-5 h-5 rounded-md flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition">
                        <span className="text-[12px] leading-none mb-0.5">&times;</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <form onSubmit={e => {
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
              }} className="flex gap-2 text-sm">
                <input 
                  type="text" 
                  name="newCategory"
                  placeholder="New Category..." 
                  className="flex-grow px-4 py-2 rounded-xl bg-gray-50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-800 border-2 border-transparent focus:border-pink-300 dark:focus:border-pink-500/50 outline-none font-medium text-gray-800 dark:text-gray-200 transition-all shadow-inner"
                />
                <button type="submit" className="px-5 py-2 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 rounded-xl font-bold hover:bg-pink-200 dark:hover:bg-pink-900/60 transition shadow-sm border border-pink-200 dark:border-pink-800">
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
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete all planner data? This cannot be undone.")) {
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
    </div>
  );
}

