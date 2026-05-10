"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { PracticeLog } from "@/types/supabase";

// ---------- Types ----------

export interface PracticeSession {
  duration: number; // ms
  date: string; // ISO date string (YYYY-MM-DD)
  created_at: string; // ISO datetime
}

export interface DailyStats {
  todayMs: number;
  streak: number;
  bestStreak: number;
  totalSessions: number;
  totalMs: number;
  last7Days: boolean[]; // index 0 = 6 days ago, index 6 = today
}

// ---------- Constants ----------

const STORAGE_KEY = "maa-flutes-practice";
const GOAL_STORAGE_KEY = "maa-flutes-daily-goal-ms";
const today = () => new Date().toISOString().slice(0, 10);

export const GOAL_MIN_MS = 10 * 60 * 1000;
export const GOAL_MAX_MS = 120 * 60 * 1000;
export const GOAL_DEFAULT_MS = 30 * 60 * 1000;

function clampGoal(ms: number): number {
  return Math.min(GOAL_MAX_MS, Math.max(GOAL_MIN_MS, ms));
}

function loadLocalGoal(): number | null {
  try {
    const raw = localStorage.getItem(GOAL_STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= GOAL_MIN_MS && n <= GOAL_MAX_MS) return n;
  } catch {
    // ignore
  }
  return null;
}

function saveLocalGoal(ms: number) {
  try {
    localStorage.setItem(GOAL_STORAGE_KEY, String(ms));
  } catch {
    // ignore
  }
}

function clearLocalGoal() {
  try {
    localStorage.removeItem(GOAL_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ---------- localStorage helpers ----------

function loadLocal(): PracticeSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(sessions: PracticeSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 200)));
  } catch {
    // quota exceeded, private mode, etc.
  }
}

// ---------- Streak calculation ----------

function calcStreak(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0;

  // Get unique practice dates, sorted descending
  const dates = [...new Set(sessions.map((s) => s.date))].sort().reverse();

  const todayStr = today();
  const yesterdayStr = new Date(Date.now() - 86400000)
    .toISOString()
    .slice(0, 10);

  // Streak must include today or yesterday
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diffDays) === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calcBestStreak(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0;
  const dates = [...new Set(sessions.map((s) => s.date))].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / 86400000,
    );
    if (diffDays === 1) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }
  return best;
}

function calcLast7Days(sessions: PracticeSession[]): boolean[] {
  const practiced = new Set(sessions.map((s) => s.date));
  const result: boolean[] = [];
  // Fill oldest → newest so index 6 is today
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
      .toISOString()
      .slice(0, 10);
    result.push(practiced.has(d));
  }
  return result;
}

function calcStats(sessions: PracticeSession[]): DailyStats {
  const todayStr = today();
  const todayMs = sessions
    .filter((s) => s.date === todayStr)
    .reduce((sum, s) => sum + s.duration, 0);

  return {
    todayMs,
    streak: calcStreak(sessions),
    bestStreak: calcBestStreak(sessions),
    totalSessions: sessions.length,
    totalMs: sessions.reduce((sum, s) => sum + s.duration, 0),
    last7Days: calcLast7Days(sessions),
  };
}

// ---------- Hook ----------

export function usePractice() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [stats, setStats] = useState<DailyStats>({
    todayMs: 0,
    streak: 0,
    bestStreak: 0,
    totalSessions: 0,
    totalMs: 0,
    last7Days: [false, false, false, false, false, false, false],
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalMs, setGoalMs] = useState<number>(GOAL_DEFAULT_MS);
  const supabase = useRef(createClient());
  const userRef = useRef<User | null>(null);
  const sessionsRef = useRef<PracticeSession[]>([]);

  // Keep refs in sync with state
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

  // Load auth state + sessions on mount
  useEffect(() => {
    const sb = supabase.current;

    async function init() {
      // Check auth
      const {
        data: { user: authUser },
      } = await sb.auth.getUser();
      setUser(authUser);
      userRef.current = authUser;

      if (authUser) {
        // Load sessions + goal in parallel
        const [logsRes, profileRes] = await Promise.all([
          sb
            .from("practice_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(200) as unknown as Promise<{ data: PracticeLog[] | null }>,
          sb
            .from("profiles")
            .select("daily_goal_ms")
            .eq("id", authUser.id)
            .maybeSingle() as unknown as Promise<{
              data: { daily_goal_ms: number | null } | null;
              error: { message: string } | null;
            }>,
        ]);

        if (profileRes.error) {
          console.error("Failed to load practice goal:", profileRes.error.message);
        }

        // --- Sessions ---
        const data = logsRes.data;
        if (data && data.length > 0) {
          const remote: PracticeSession[] = data.map((row) => ({
            duration: row.duration,
            date: row.date,
            created_at: row.created_at,
          }));
          setSessions(remote);
          setStats(calcStats(remote));
        } else {
          // User is logged in but no remote data — check for local data to migrate
          const local = loadLocal();
          if (local.length > 0) {
            await migrateLocalToRemote(authUser.id, local);
            setSessions(local);
            setStats(calcStats(local));
          }
        }

        // --- Goal ---
        const localGoal = loadLocalGoal();
        const remoteGoal = profileRes.data?.daily_goal_ms ?? null;
        let resolvedGoal = remoteGoal;
        if (remoteGoal == null && localGoal != null) {
          // First-time sign-in with a local preference — push it to the profile
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (sb.from("profiles") as any)
            .update({ daily_goal_ms: localGoal })
            .eq("id", authUser.id) as { error: { message: string } | null };
          if (!error) resolvedGoal = localGoal;
        }
        setGoalMs(resolvedGoal ?? GOAL_DEFAULT_MS);
        // Goal lives in the DB now — drop the local copy so they can't diverge
        if (localGoal != null) clearLocalGoal();
      } else {
        // Anonymous — use localStorage
        const local = loadLocal();
        setSessions(local);
        setStats(calcStats(local));
        setGoalMs(loadLocalGoal() ?? GOAL_DEFAULT_MS);
      }

      setLoading(false);
    }

    init();

    // Listen for auth changes
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      userRef.current = u;
    });

    return () => subscription.unsubscribe();
  }, []);

  async function migrateLocalToRemote(userId: string, local: PracticeSession[]) {
    const sb = supabase.current;
    const rows = local.map((s) => ({
      user_id: userId,
      duration: Math.round(s.duration),
      date: s.date,
    }));

    // Batch insert (Supabase handles up to 1000 rows)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb.from("practice_logs") as any).insert(rows) as { error: { message: string } | null };

    if (error) {
      console.error("Failed to migrate practice data:", error.message);
      return; // Keep local data if migration fails
    }

    // Clear local after successful migration
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  const logSession = useCallback(
    async (durationMs: number) => {
      if (durationMs < 5000) return; // Ignore sessions < 5s

      const session: PracticeSession = {
        duration: durationMs,
        date: today(),
        created_at: new Date().toISOString(),
      };

      const currentSessions = sessionsRef.current;
      const updated = [session, ...currentSessions].slice(0, 200);
      setSessions(updated);
      setStats(calcStats(updated));

      const currentUser = userRef.current;
      if (currentUser) {
        // Save to Supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.current.from("practice_logs") as any).insert({
          user_id: currentUser.id,
          duration: Math.round(durationMs),
          date: today(),
        }) as { error: { message: string } | null };
        if (error) {
          console.error("Failed to save practice session:", error.message);
          // Fall back to localStorage so data isn't lost
          saveLocal(updated);
        }
      } else {
        // Save to localStorage
        saveLocal(updated);
      }
    },
    []
  );

  const clearAll = useCallback(async () => {
    setSessions([]);
    setStats({
      todayMs: 0,
      streak: 0,
      bestStreak: 0,
      totalSessions: 0,
      totalMs: 0,
      last7Days: [false, false, false, false, false, false, false],
    });

    const currentUser = userRef.current;
    if (currentUser) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.current.from("practice_logs") as any).delete().eq("user_id", currentUser.id) as { error: { message: string } | null };
      if (error) {
        console.error("Failed to clear practice logs:", error.message);
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  const updateGoal = useCallback(async (ms: number) => {
    const clamped = clampGoal(ms);
    setGoalMs(clamped);

    const currentUser = userRef.current;
    if (currentUser) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.current.from("profiles") as any)
        .update({ daily_goal_ms: clamped })
        .eq("id", currentUser.id) as { error: { message: string } | null };
      if (error) {
        console.error("Failed to save practice goal:", error.message);
        // Preference would otherwise be lost on reload
        saveLocalGoal(clamped);
      }
    } else {
      saveLocalGoal(clamped);
    }
  }, []);

  return { sessions, stats, user, loading, goalMs, logSession, clearAll, updateGoal };
}

// ---------- Formatting helpers ----------

export function formatStopwatch(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 1) return `${Math.floor(ms / 1000)}s`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
