"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  usePractice,
  formatStopwatch,
  formatDuration,
  saveDraftSession,
  loadDraftSession,
  clearDraftSession,
  GOAL_MIN_MS,
  GOAL_MAX_MS,
} from "@/lib/practice";
import { Settings, Play, Pause, RotateCcw } from "lucide-react";

// Slider step (UI concern only)
const GOAL_STEP_MS = 5 * 60 * 1000;

// SVG ring constants
const RADIUS = 140;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Mini day-ring constants
const HISTORY_DAYS = 7;
const MINI_RADIUS = 15;
const MINI_CIRCUMFERENCE = 2 * Math.PI * MINI_RADIUS;

// Weekday letters, oldest → newest relative to today
function lastNDayLabels(days: number): string[] {
  const letters = ["S", "M", "T", "W", "T", "F", "S"];
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    labels.push(letters[d.getDay()]);
  }
  return labels;
}

// ---------- Gamification ----------

interface Level {
  name: string;
  minHours: number;
  color: string;
}

const LEVELS: Level[] = [
  { name: "Beginner", minHours: 0, color: "text-stone-400" },
  { name: "Curious", minHours: 1, color: "text-amber-400" },
  { name: "Dedicated", minHours: 5, color: "text-amber-500" },
  { name: "Focused", minHours: 15, color: "text-orange-400" },
  { name: "Committed", minHours: 30, color: "text-orange-500" },
  { name: "Devoted", minHours: 60, color: "text-red-400" },
  { name: "Riyazkaar", minHours: 100, color: "text-red-500" },
  { name: "Master", minHours: 200, color: "text-purple-400" },
  { name: "Guru", minHours: 500, color: "text-purple-500" },
];

function getLevel(totalMs: number): { level: Level; next: Level | null; progressToNext: number } {
  const totalHours = totalMs / 3600000;
  let current = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalHours >= LEVELS[i].minHours) {
      current = LEVELS[i];
      break;
    }
  }
  const idx = LEVELS.indexOf(current);
  const next = idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  const progressToNext = next
    ? (totalHours - current.minHours) / (next.minHours - current.minHours)
    : 1;
  return { level: current, next, progressToNext: Math.min(progressToNext, 1) };
}

function ProgressRing({
  progress,
  running,
}: {
  progress: number;
  running: boolean;
}) {
  const clamped = Math.min(progress, 1);
  const offset = CIRCUMFERENCE * (1 - clamped);

  return (
    <svg
      className="absolute inset-0 w-full h-full -rotate-90"
      viewBox="0 0 320 320"
    >
      {/* Background track */}
      <circle
        cx="160"
        cy="160"
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        className="text-white/10"
        strokeWidth="6"
      />
      {/* Progress arc */}
      <circle
        cx="160"
        cy="160"
        r={RADIUS}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-1000 ease-out"
      />
      {/* Glow when running */}
      {running && (
        <circle
          cx="160"
          cy="160"
          r={RADIUS}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="opacity-20 blur-sm transition-[stroke-dashoffset] duration-1000"
        />
      )}
      <defs>
        <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Compact per-day ring for the history strip — fills toward the daily goal,
// with the day's practice time shown in the center
function MiniDayRing({
  ms,
  goalMs,
  isToday,
  label,
}: {
  ms: number;
  goalMs: number;
  isToday: boolean;
  label: string;
}) {
  const hasActivity = ms > 0;
  const fill = Math.min(ms / goalMs, 1);
  const offset = MINI_CIRCUMFERENCE * (1 - fill);

  const hours = Math.floor(ms / 3600000);
  const mins = Math.round((ms % 3600000) / 60000);
  const centerText = hasActivity ? (hours > 0 ? `${hours}h` : `${mins}m`) : "";

  return (
    <div className="flex flex-col items-center gap-1 group/day">
      <div className="relative w-full aspect-square">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r={MINI_RADIUS}
            fill="none"
            stroke="currentColor"
            className={isToday ? "text-amber-400/25" : "text-white/10"}
            strokeWidth="4"
          />
          {hasActivity && (
            <circle
              cx="20"
              cy="20"
              r={MINI_RADIUS}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={MINI_CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-[9px] font-bold tabular-nums ${
              hasActivity ? "text-white" : "text-white/25"
            }`}
          >
            {centerText || "·"}
          </span>
        </div>
        {/* Hover tooltip with exact time */}
        {hasActivity && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-stone-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/day:opacity-100 pointer-events-none transition-opacity z-20">
            {formatDuration(ms)}
          </div>
        )}
      </div>
      <span
        className={`text-[9px] font-medium tabular-nums ${
          isToday ? "text-amber-300" : "text-white/30"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function PracticeStopwatch() {
  const { stats, sessions, user, loading, goalMs, logSession, updateGoal } = usePractice();

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [tempGoal, setTempGoal] = useState(goalMs);

  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastPersistRef = useRef(0);

  // Current elapsed, accurate even between animation frames
  const currentElapsed = useCallback(
    () =>
      startTimeRef.current != null
        ? performance.now() - startTimeRef.current
        : elapsed,
    [elapsed],
  );

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;
    const now = performance.now();
    const value = now - startTimeRef.current;
    setElapsed(value);
    // Persist an in-progress draft roughly every 5s so the time survives a
    // refresh / tab close even without clicking "Done"
    if (now - lastPersistRef.current > 5000) {
      lastPersistRef.current = now;
      saveDraftSession(value);
    }
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const handleStart = useCallback(() => {
    startTimeRef.current = performance.now() - elapsed;
    lastPersistRef.current = performance.now();
    setRunning(true);
    frameRef.current = requestAnimationFrame(tick);
  }, [elapsed, tick]);

  const handlePause = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setRunning(false);
    // Snapshot the accumulated time so it isn't lost while paused
    const value = currentElapsed();
    setElapsed(value);
    startTimeRef.current = null;
    saveDraftSession(value);
  }, [currentElapsed]);

  const handleReset = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setRunning(false);

    const value = currentElapsed();
    if (value > 5000) {
      logSession(value);
    }

    setElapsed(0);
    startTimeRef.current = null;
    clearDraftSession();
  }, [currentElapsed, logSession]);

  // Restore an in-progress draft on mount (e.g. after a refresh / tab close)
  useEffect(() => {
    const draft = loadDraftSession();
    if (draft > 0) setElapsed(draft);
  }, []);

  // Persist the in-progress draft when the tab is hidden or closed
  useEffect(() => {
    const persist = () => {
      const value = currentElapsed();
      if (value > 0) saveDraftSession(value);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") persist();
    };
    window.addEventListener("pagehide", persist);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", persist);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [currentElapsed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // Progress towards daily goal (include current running session)
  const totalTodayMs = stats.todayMs + elapsed;
  const progress = totalTodayMs / goalMs;
  const goalMins = Math.round(goalMs / 60000);
  const remainingMs = Math.max(0, goalMs - totalTodayMs);

  // Level info (only the name is shown — progress-to-next was too noisy)
  const totalWithCurrent = stats.totalMs + elapsed;
  const { level } = getLevel(totalWithCurrent);

  // Calculate durations for the last N days from sessions
  const dayDurations = useMemo(() => {
    const durations: number[] = [];
    for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const dayTotal = sessions
        .filter((s) => s.date === d)
        .reduce((sum, s) => sum + s.duration, 0);
      durations.push(dayTotal);
    }
    return durations;
  }, [sessions]);

  // Streak visualization — today's ring lights up as soon as the session passes 5s
  const todayIdx = HISTORY_DAYS - 1;
  const todayBaseMs = dayDurations[todayIdx];
  const liveTodayMs = todayBaseMs + elapsed;
  const dayDurationsLive = [...dayDurations.slice(0, todayIdx), liveTodayMs];
  const practicedTodayLive = liveTodayMs >= 5000;
  const dayLabels = useMemo(() => lastNDayLabels(HISTORY_DAYS), []);
  const liveStreak =
    stats.streak + (practicedTodayLive && todayBaseMs === 0 ? 1 : 0);
  const liveBest = Math.max(stats.bestStreak, liveStreak);
  const streakAtRisk =
    stats.streak > 0 && todayBaseMs === 0 && elapsed < 5000;

  // Motivational message — richer nudges
  function getMessage(): string {
    if (running && elapsed > 0) {
      if (elapsed > 1800000) return "Incredible focus! You are unstoppable.";
      if (elapsed > 600000) return "You're in the zone — keep flowing!";
      if (elapsed > 120000) return "Great rhythm, keep going!";
      return "Keep going...";
    }
    if (progress >= 1 && liveStreak >= 7) return `Daily goal + ${liveStreak}-day streak! Legend.`;
    if (progress >= 1) return "Daily goal reached! Come back tomorrow.";
    if (streakAtRisk) return `Keep your ${stats.streak}-day streak alive!`;
    if (liveStreak > 2) return `${liveStreak}-day streak — don't break it!`;
    if (stats.todayMs > 0) return `${formatDuration(remainingMs)} to daily goal`;
    if (stats.totalSessions === 0) return "Begin your musical journey";
    return "Start your practice";
  }

  if (loading) {
    return (
      <div className="w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-2xl p-3 sm:p-5">
      {/* Header with settings button */}
      <div className="flex justify-end mb-4 relative">
        <button
          type="button"
          onClick={() => {
            setShowSettings((v) => !v);
            setTempGoal(goalMs);
          }}
          aria-expanded={showSettings}
          aria-label="Edit daily goal"
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            showSettings
              ? "bg-amber-500/20 text-amber-300"
              : "text-white/50 hover:text-white/70 hover:bg-white/10"
          }`}
        >
          <Settings size={16} />
        </button>

        {/* Settings Popover */}
        {showSettings && (
          <div className="absolute top-10 right-0 w-72 bg-stone-900/95 border border-white/20 rounded-xl p-4 shadow-xl z-50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">Daily Goal</span>
              <span className="text-lg font-bold text-amber-300 tabular-nums">
                {formatDuration(tempGoal)}
              </span>
            </div>

            <input
              type="range"
              min={GOAL_MIN_MS}
              max={GOAL_MAX_MS}
              step={GOAL_STEP_MS}
              value={tempGoal}
              onChange={(e) => setTempGoal(Number(e.target.value))}
              className="w-full accent-amber-400 mb-4"
              aria-label="Daily practice goal"
            />

            <div className="flex gap-1.5 mb-4">
              {[15, 30, 45, 60, 90].map((m) => {
                const ms = m * 60000;
                const active = ms === tempGoal;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTempGoal(ms)}
                    className={`flex-1 text-xs py-2 rounded-md font-medium transition-colors ${
                      active
                        ? "bg-amber-500 text-stone-900"
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {m < 60 ? `${m}m` : `${m / 60}h`}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 font-medium rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateGoal(tempGoal);
                  setShowSettings(false);
                }}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-lg transition-colors text-sm"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ring + controls */}
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
          <ProgressRing progress={progress} running={running} />
          <div className="relative z-10 flex flex-col items-center px-4">
            <div
              className={`text-4xl sm:text-5xl font-black tabular-nums tracking-tight transition-colors ${
                running ? "text-white" : "text-white/90"
              }`}
            >
              {formatStopwatch(elapsed)}
            </div>
            <p className="text-amber-300/80 text-[11px] sm:text-xs mt-1.5 font-medium text-center leading-tight">
              {getMessage()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {!running ? (
            <button
              onClick={handleStart}
              className="flex-1 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-xl transition-all text-sm shadow-md shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <Play fill="" size={16} />
              {elapsed > 0 ? "Resume" : "Start"}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex-1 px-6 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl transition-all text-sm backdrop-blur-sm active:scale-95 flex items-center justify-center gap-2"
            >
              <Pause size={16} />
              Pause
            </button>
          )}

          {elapsed > 0 && (
            <button
              onClick={handleReset}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white/80 font-bold rounded-xl transition-all text-sm backdrop-blur-sm active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Done</span>
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Inline stats */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <div className="flex items-baseline gap-1.5">
          <span className="text-white font-semibold tabular-nums">
            {formatDuration(totalTodayMs)}
          </span>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">
            today
          </span>
        </div>
        <span className="w-px h-3 bg-white/10" />
        <div className="flex items-baseline gap-1.5">
          <span className="flex items-center gap-1 text-white font-semibold tabular-nums">
            <span aria-hidden className={liveStreak > 0 ? "" : "grayscale opacity-40"}>
              🔥
            </span>
            {liveStreak}
          </span>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">
            {liveStreak === 1 ? "day" : "days"}
          </span>
        </div>
        <span className="w-px h-3 bg-white/10" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-white font-semibold tabular-nums">
            {stats.totalSessions}
          </span>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">
            {stats.totalSessions === 1 ? "session" : "sessions"}
          </span>
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* This week */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] text-white/50 font-medium uppercase tracking-wider">
            This week
          </span>
          <span className="text-[11px] text-white/40">
            Best{" "}
            <span className="text-amber-300 font-semibold tabular-nums">
              {liveBest}d
            </span>
          </span>
        </div>
        <div className="flex items-start justify-between gap-1.5">
          {dayDurationsLive.map((ms, i) => (
            <div key={i} className="flex-1 max-w-11">
              <MiniDayRing
                ms={ms}
                goalMs={goalMs}
                isToday={i === todayIdx}
                label={dayLabels[i]}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Goal + level */}
      <div>
        <div className="flex justify-center items-center gap-2 text-xs">
          <span className="text-white/50 uppercase tracking-wider font-medium">
            Goal
          </span>
          <span className="text-white/90 font-semibold tabular-nums">
            {goalMins}m
          </span>
          <span className="text-white/20">·</span>
          <span className={`font-semibold ${level.color} truncate`}>
            {level.name}
          </span>
        </div>
      </div>

      {!user && stats.totalSessions > 0 && (
        <p className="text-[11px] text-white/40 text-center mt-4">
          <Link href="/login" className="text-amber-400/70 hover:text-amber-300 underline underline-offset-2">
            Sign in
          </Link>{" "}
          to save across devices
        </p>
      )}

    </div>
  );
}
