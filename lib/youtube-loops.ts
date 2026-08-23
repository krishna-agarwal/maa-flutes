"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, VideoLoopRow } from "@/types/supabase";

// ---------- Types ----------

export interface VideoLoop {
  id: string;
  video_id: string;
  title: string;
  start_seconds: number;
  end_seconds: number;
  playback_rate: number;
  created_at: string;
}

export type NewVideoLoop = Omit<VideoLoop, "id" | "created_at">;

// ---------- URL / id parsing ----------

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YT_HOSTS = ["youtube.com", "youtu.be", "youtube-nocookie.com"];

/** "90", "90s", "1m30s", "1h2m3s" — the formats YouTube uses for `t` / `start`. */
function parseTimeParam(raw: string | null): number | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (/^\d+(\.\d+)?$/.test(v)) return Number(v);
  const match = v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match || (!match[1] && !match[2] && !match[3])) return null;
  return (
    Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
  );
}

/**
 * Accepts a bare video id or any common YouTube URL (watch, youtu.be, embed,
 * shorts, live) and returns the id plus a start time if the link carries one.
 */
export function parseYouTubeInput(
  raw: string,
): { videoId: string; start: number | null } | null {
  const input = raw.trim();
  if (!input) return null;
  if (VIDEO_ID.test(input)) return { videoId: input, start: null };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  if (!YT_HOSTS.includes(host)) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  let videoId: string | undefined;

  if (host === "youtu.be") {
    videoId = segments[0];
  } else if (segments[0] === "watch") {
    videoId = url.searchParams.get("v") ?? undefined;
  } else if (["embed", "shorts", "live", "v"].includes(segments[0] ?? "")) {
    videoId = segments[1];
  }

  if (!videoId || !VIDEO_ID.test(videoId)) return null;

  return {
    videoId,
    start:
      parseTimeParam(url.searchParams.get("t")) ??
      parseTimeParam(url.searchParams.get("start")),
  };
}

// ---------- Time formatting ----------

/** Accepts "83", "83.5", "1:23", "1:23.5", "1:02:03". Returns seconds. */
export function parseTimeInput(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;
  const parts = v.split(":");
  if (parts.length > 3) return null;

  let seconds = 0;
  for (const part of parts) {
    if (!/^\d+(\.\d+)?$/.test(part)) return null;
    seconds = seconds * 60 + Number(part);
  }
  return Number.isFinite(seconds) ? seconds : null;
}

export function formatTime(seconds: number, tenths = false): string {
  const safe = Math.max(0, seconds);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const secStr = tenths
    ? secs.toFixed(1).padStart(4, "0")
    : String(Math.floor(secs)).padStart(2, "0");

  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, "0")}:${secStr}`;
  return `${mins}:${secStr}`;
}

// ---------- localStorage ----------

const STORAGE_KEY = "maa-flutes-video-loops";
const MAX_LOOPS = 200;

function loadLocal(): VideoLoop[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(loops: VideoLoop[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loops.slice(0, MAX_LOOPS)));
  } catch {
    // quota exceeded, private mode, etc.
  }
}

function clearLocal() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function rowToLoop(row: VideoLoopRow): VideoLoop {
  return {
    id: row.id,
    video_id: row.video_id,
    title: row.title,
    start_seconds: row.start_seconds,
    end_seconds: row.end_seconds,
    playback_rate: row.playback_rate,
    created_at: row.created_at,
  };
}

// Our hand-written Database type doesn't satisfy supabase-js's generated
// insert/update generics, so writes go through an untyped builder — the same
// escape hatch lib/practice.ts uses. Reads stay typed via `VideoLoopRow`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedBuilder = any;

function loopsTable(sb: SupabaseClient<Database>): UntypedBuilder {
  return sb.from("video_loops");
}

/** Pushes anonymously-saved loops into the account on first sign-in. */
async function migrateLocalToRemote(
  sb: SupabaseClient<Database>,
  userId: string,
  local: VideoLoop[],
): Promise<VideoLoop[] | null> {
  const rows = local.map((l) => ({
    user_id: userId,
    video_id: l.video_id,
    title: l.title,
    start_seconds: l.start_seconds,
    end_seconds: l.end_seconds,
    playback_rate: l.playback_rate,
  }));

  const { data, error } = (await loopsTable(sb).insert(rows).select()) as {
    data: VideoLoopRow[] | null;
    error: { message: string } | null;
  };

  if (error) {
    console.error("Failed to migrate saved loops:", error.message);
    return null; // keep the local copy so nothing is lost
  }

  clearLocal();
  return (data ?? []).map(rowToLoop);
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `loop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- Hook ----------

/**
 * Saved loops for the current visitor: localStorage while signed out, the
 * `video_loops` table once signed in (local loops migrate up on first sign-in).
 * Mirrors the storage strategy in `lib/practice.ts`.
 */
export function useVideoLoops() {
  const [loops, setLoops] = useState<VideoLoop[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useRef(createClient());
  const userRef = useRef<User | null>(null);
  const loopsRef = useRef<VideoLoop[]>([]);
  // Which account the current list was loaded for — `undefined` = nothing yet.
  const loadedForRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    loopsRef.current = loops;
  }, [loops]);

  useEffect(() => {
    const sb = supabase.current;

    async function bootstrap(authUser: User | null) {
      const key = authUser?.id ?? null;
      if (loadedForRef.current === key) return; // already loaded for this account
      loadedForRef.current = key;
      setLoading(true);

      if (!authUser) {
        setLoops(loadLocal());
        setLoading(false);
        return;
      }

      const { data, error } = (await sb
        .from("video_loops")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(MAX_LOOPS)) as unknown as {
        data: VideoLoopRow[] | null;
        error: { message: string } | null;
      };

      if (error) {
        console.error("Failed to load saved loops:", error.message);
        setLoops(loadLocal());
        setLoading(false);
        return;
      }

      const remote = (data ?? []).map(rowToLoop);
      const local = loadLocal();

      if (remote.length === 0 && local.length > 0) {
        // First sign-in with loops saved anonymously — push them up.
        const migrated = await migrateLocalToRemote(sb, authUser.id, local);
        setLoops(migrated ?? local);
      } else {
        setLoops(remote);
      }

      setLoading(false);
    }

    sb.auth.getUser().then(({ data }) => {
      setUser(data.user);
      userRef.current = data.user;
      bootstrap(data.user);
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      userRef.current = u;
      bootstrap(u);
    });

    return () => subscription.unsubscribe();
  }, []);

  const saveLoop = useCallback(async (input: NewVideoLoop) => {
    const currentUser = userRef.current;

    const optimistic: VideoLoop = {
      ...input,
      id: newId(),
      created_at: new Date().toISOString(),
    };
    setLoops([optimistic, ...loopsRef.current].slice(0, MAX_LOOPS));

    if (!currentUser) {
      saveLocal([optimistic, ...loopsRef.current].slice(0, MAX_LOOPS));
      return optimistic;
    }

    const { data, error } = (await loopsTable(supabase.current)
      .insert({
        user_id: currentUser.id,
        video_id: input.video_id,
        title: input.title,
        start_seconds: input.start_seconds,
        end_seconds: input.end_seconds,
        playback_rate: input.playback_rate,
      })
      .select()
      .single()) as {
      data: VideoLoopRow | null;
      error: { message: string } | null;
    };

    if (error || !data) {
      console.error("Failed to save loop:", error?.message);
      // Fall back to localStorage so the loop isn't lost
      saveLocal([optimistic, ...loopsRef.current].slice(0, MAX_LOOPS));
      return optimistic;
    }

    // Swap the optimistic row for the stored one (real id)
    const saved = rowToLoop(data);
    setLoops((prev) => prev.map((l) => (l.id === optimistic.id ? saved : l)));
    return saved;
  }, []);

  const deleteLoop = useCallback(async (id: string) => {
    const remaining = loopsRef.current.filter((l) => l.id !== id);
    setLoops(remaining);

    const currentUser = userRef.current;
    if (!currentUser) {
      saveLocal(remaining);
      return;
    }

    const { error } = (await loopsTable(supabase.current)
      .delete()
      .eq("id", id)) as {
      error: { message: string } | null;
    };
    if (error) console.error("Failed to delete loop:", error.message);
  }, []);

  return { loops, user, loading, saveLoop, deleteLoop };
}
