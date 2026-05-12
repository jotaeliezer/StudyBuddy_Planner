import { CalendarDays, CalendarRange, BookOpen, Settings, Smile, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type ViewType = 'month' | 'week' | 'settings';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onOpenMood: () => void;
}

export function Sidebar({ currentView, onViewChange, isDarkMode, toggleDarkMode, onOpenMood }: SidebarProps) {
  const navItems = [
    { id: 'week' as ViewType, label: 'Weekly', icon: CalendarRange },
    { id: 'month' as ViewType, label: 'Monthly', icon: CalendarDays },
  ];

  return (
    <div className="w-[88px] glass squircle py-6 flex flex-col items-center gap-8 no-print shrink-0 shadow-sm border border-white/40 dark:border-white/10 shadow-pink-100/50 dark:shadow-none relative z-[100]">
      <div className="flex justify-center w-full px-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-200 to-purple-200 shadow-inner flex items-center justify-center text-2xl font-bold text-white shrink-0 relative group cursor-default">
          ✨
          <div className="absolute left-full ml-4 px-4 py-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-pink-100 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-gray-200 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] translate-x-[-10px] group-hover:translate-x-0">
            Study<span className="text-pink-400">Buddy</span>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-4 flex-grow w-full items-center mt-4">
        {navItems.map((item) => (
          <div key={item.id} className="relative group w-full flex justify-center">
            <button
              onClick={() => onViewChange(item.id)}
              className={cn(
                "p-3.5 rounded-2xl transition-all duration-300 font-medium flex items-center justify-center",
                currentView === item.id 
                  ? "bg-white dark:bg-zinc-800 text-pink-500 shadow-sm scale-110" 
                  : "text-gray-400 hover:bg-white/50 dark:hover:bg-zinc-800/50 hover:text-pink-400"
              )}
            >
              <item.icon className="w-6 h-6" />
            </button>
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-pink-100 dark:border-white/10 text-sm font-bold text-pink-500 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] translate-x-[-10px] group-hover:translate-x-0">
              {item.label}
            </div>
          </div>
        ))}
        
        <div className="relative group w-full flex justify-center">
          <button 
            onClick={onOpenMood}
            className="p-3.5 rounded-2xl text-gray-400 hover:bg-white/50 dark:hover:bg-zinc-800/50 hover:text-pink-400 transition-all duration-300 flex items-center justify-center"
          >
            <Smile className="w-6 h-6" />
          </button>
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-pink-100 dark:border-white/10 text-sm font-bold text-pink-500 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] translate-x-[-10px] group-hover:translate-x-0">
            Mood Tracker
          </div>
        </div>
      </nav>

      <div className="mt-auto w-full flex flex-col gap-4 items-center">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => onViewChange('settings')}
            className={cn(
              "p-3.5 rounded-2xl transition-all duration-300 font-medium flex items-center justify-center shadow-sm",
              currentView === 'settings'
                ? "bg-white dark:bg-zinc-800 text-pink-500 scale-110" 
                : "bg-white/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 text-gray-400 hover:text-pink-500"
            )}
          >
            <Settings className="w-6 h-6" />
          </button>
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-pink-100 dark:border-white/10 text-sm font-bold text-pink-500 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] translate-x-[-10px] group-hover:translate-x-0">
            Settings
          </div>
        </div>

        <div className="relative group w-full flex justify-center">
          <button 
            onClick={toggleDarkMode}
            className="p-3.5 rounded-2xl bg-white/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 text-gray-400 hover:text-pink-500 transition-all shadow-sm"
          >
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-pink-100 dark:border-white/10 text-sm font-bold text-pink-500 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] translate-x-[-10px] group-hover:translate-x-0">
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </div>
        </div>
      </div>
    </div>
  );
}
