import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Timer, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface PomodoroTimerProps {
  onClose: () => void;
}

const PRESETS = [
  { label: 'Focus', minutes: 25, color: '#f472b6' },
  { label: 'Long Focus', minutes: 50, color: '#a78bfa' },
  { label: 'Short Break', minutes: 5, color: '#34d399' },
  { label: 'Long Break', minutes: 15, color: '#60a5fa' },
];

function playDing() {
  try {
    const ctx = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1);
  } catch {}
}

export function PomodoroTimer({ onClose }: PomodoroTimerProps) {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(PRESETS[0].minutes * 60);
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback((secs?: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setCompleted(false);
    const s = secs ?? totalSeconds;
    setSecondsLeft(s);
  }, [totalSeconds]);

  const selectPreset = (index: number) => {
    setSelectedPreset(index);
    const secs = PRESETS[index].minutes * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setRunning(false);
    setCompleted(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setCompleted(true);
            playDing();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const circumference = 2 * Math.PI * 54;
  const strokeDash = circumference * (1 - progress);
  const color = PRESETS[selectedPreset].color;

  if (minimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-white dark:bg-zinc-900 shadow-xl border border-pink-100 dark:border-zinc-700 px-4 py-2 cursor-pointer"
        onClick={() => setMinimized(false)}
      >
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: running ? color : '#d1d5db' }} />
        <span className="font-black text-sm text-gray-800 dark:text-gray-100">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <Timer className="h-4 w-4 text-gray-400" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-6 right-6 z-50 w-80 rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-pink-100 dark:border-zinc-700 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-gray-400" />
          <span className="font-bold text-sm text-gray-600 dark:text-gray-300">Pomodoro Timer</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preset tabs */}
      <div className="flex gap-1 px-4 pb-4">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => selectPreset(i)}
            className={cn(
              'flex-1 rounded-xl py-1.5 text-[10px] font-bold transition-all',
              selectedPreset === i
                ? 'text-white shadow-sm'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
            )}
            style={selectedPreset === i ? { backgroundColor: p.color } : {}}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="flex flex-col items-center px-4 pb-2">
        <div className="relative flex items-center justify-center">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r="54" stroke="#f3f4f6" strokeWidth="8" fill="none" className="dark:stroke-zinc-700" />
            <circle
              cx="70" cy="70" r="54"
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-black text-gray-800 dark:text-gray-100 tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-xs font-bold text-gray-400 mt-0.5">{PRESETS[selectedPreset].label}</span>
          </div>
        </div>

        {completed && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-bold text-green-500 mt-1"
          >
            🎉 Session complete!
          </motion.p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-4 pb-5">
        <button
          onClick={() => reset()}
          className="p-3 rounded-2xl bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={() => setRunning(r => !r)}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white shadow-md transition-all active:scale-95"
          style={{ backgroundColor: color }}
        >
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {running ? 'Pause' : 'Start'}
        </button>
      </div>
    </motion.div>
  );
}
