"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  usePractice,
  formatStopwatch,
  formatDuration,
  GOAL_MIN_MS,
  GOAL_MAX_MS,
} from "@/lib/practice";

// Slider step (UI concern only)
const GOAL_STEP_MS = 5 * 60 * 1000;

// SVG ring constants
const RADIUS = 140;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Weekday letters, oldest → newest relative to today
function last7DayLabels(): string[] {
  const letters = ["S", "M", "T", "W", "T", "F", "S"];
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
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

export default function PracticeStopwatch() {
  const { stats, user, loading, goalMs, logSession, updateGoal } = usePractice();

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;
    setElapsed(performance.now() - startTimeRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const handleStart = useCallback(() => {
    startTimeRef.current = performance.now() - elapsed;
    setRunning(true);
    frameRef.current = requestAnimationFrame(tick);
  }, [elapsed, tick]);

  const handlePause = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setRunning(false);

    if (elapsed > 5000) {
      logSession(elapsed);
    }

    setElapsed(0);
    startTimeRef.current = null;
  }, [elapsed, logSession]);

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

  // Streak visualization — today's dot lights up as soon as the session passes 5s
  const liveToday = stats.last7Days[6] || elapsed >= 5000;
  const last7Live = [...stats.last7Days.slice(0, 6), liveToday];
  const dayLabels = useMemo(() => last7DayLabels(), []);
  const liveStreak = stats.streak + (liveToday && !stats.last7Days[6] ? 1 : 0);
  const liveBest = Math.max(stats.bestStreak, liveStreak);
  const streakAtRisk =
    stats.streak > 0 && !stats.last7Days[6] && elapsed < 5000;

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
    <div className="w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-3xl p-5 sm:p-6">
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
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-xl transition-all text-sm shadow-md shadow-amber-500/20 active:scale-95"
            >
              {elapsed > 0 ? "Resume" : "Start Practice"}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-6 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl transition-all text-sm backdrop-blur-sm active:scale-95"
            >
              Pause
            </button>
          )}

          {elapsed > 0 && (
            <button
              onClick={handleReset}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white/80 font-bold rounded-xl transition-all text-sm backdrop-blur-sm active:scale-95"
            >
              Done
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Inline stats */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <div className="flex items-baseline gap-1.5">
          <span className="text-white font-semibold tabular-nums">
            {formatDuration(stats.todayMs + (running ? elapsed : 0))}
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

      {/* Week strip */}
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
        <div className="flex items-center justify-between gap-1.5">
          {last7Live.map((done, i) => {
            const isToday = i === 6;
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-full aspect-square rounded-md transition-colors ${
                    done
                      ? "bg-gradient-to-br from-amber-400 to-amber-500"
                      : "bg-white/5 border border-white/10"
                  } ${isToday && !done ? "ring-1 ring-amber-400/50" : ""}`}
                />
                <span
                  className={`text-[10px] font-medium ${
                    isToday ? "text-amber-300" : "text-white/30"
                  }`}
                >
                  {dayLabels[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Goal + level */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-xs min-w-0">
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
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            aria-expanded={showSettings}
            aria-label="Edit daily goal"
            className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              showSettings
                ? "bg-amber-500/20 text-amber-300"
                : "text-white/40 hover:text-amber-300 hover:bg-white/5"
            }`}
          >
            <span aria-hidden className="text-sm leading-none">⚙</span>
          </button>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/40 mt-1.5 tabular-nums">
          <span>{formatDuration(totalTodayMs)}</span>
          <span>{goalMins}m</span>
        </div>

        {showSettings && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-white/50 uppercase tracking-wider font-medium">
                Set daily goal
              </span>
              <span className="text-sm font-bold text-amber-300 tabular-nums">
                {formatDuration(goalMs)}
              </span>
            </div>
            <input
              type="range"
              min={GOAL_MIN_MS}
              max={GOAL_MAX_MS}
              step={GOAL_STEP_MS}
              value={goalMs}
              onChange={(e) => updateGoal(Number(e.target.value))}
              className="w-full accent-amber-400"
              aria-label="Daily practice goal"
            />
            <div className="flex gap-1.5 mt-3">
              {[15, 30, 45, 60, 90].map((m) => {
                const ms = m * 60000;
                const active = ms === goalMs;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateGoal(ms)}
                    className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
                      active
                        ? "bg-amber-500 text-stone-900"
                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
                    }`}
                  >
                    {m < 60 ? `${m}m` : `${m / 60}h`}
                  </button>
                );
              })}
            </div>
          </div>
        )}
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
