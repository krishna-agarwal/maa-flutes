"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Repeat,
  Repeat1,
  Minus,
  Plus,
  Trash2,
  Bookmark,
  RotateCcw,
} from "lucide-react";
import {
  loadYouTubeIframeApi,
  PlayerState,
  type YTPlayer,
} from "@/lib/youtube-iframe";
import {
  formatTime,
  parseTimeInput,
  parseYouTubeInput,
  useVideoLoops,
  type VideoLoop,
} from "@/lib/youtube-loops";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5];
const MIN_LOOP_SECONDS = 0.5;
// How early we jump back — YouTube's clock is polled, not exact.
const LOOP_EPSILON = 0.05;
const POLL_MS = 100;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function YouTubeLooper() {
  const { loops, user, loading, saveLoop, deleteLoop } = useVideoLoops();

  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [startText, setStartText] = useState("0:00.0");
  const [endText, setEndText] = useState("0:00.0");
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [rate, setRate] = useState(1);
  const [reps, setReps] = useState(0);

  const [loopName, setLoopName] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  // The API swaps the element we hand it for an <iframe>, so the player lives
  // in a container React never renders children into.
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  // Read by the polling loop, which outlives the render that created it.
  const loopRef = useRef({ start: 0, end: 0, enabled: true });
  const durationRef = useRef(0);
  // The player reports the pre-seek time for a while after a jump, so a loop
  // only re-fires once the clock is back inside the range.
  const armedRef = useRef(true);
  // A range to apply as soon as the current video reports its duration.
  const pendingRangeRef = useRef<{ start: number; end: number } | null>(null);

  useEffect(() => {
    loopRef.current = { start, end, enabled: loopEnabled };
  }, [start, end, loopEnabled]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // ---------- Range helpers ----------

  const applyRange = useCallback(
    (nextStart: number, nextEnd: number, max: number) => {
      const limit = max > 0 ? max : Math.max(nextEnd, nextStart + MIN_LOOP_SECONDS);
      const s = clamp(nextStart, 0, Math.max(0, limit - MIN_LOOP_SECONDS));
      const e = clamp(nextEnd, s + MIN_LOOP_SECONDS, limit);
      setStart(s);
      setEnd(e);
      setStartText(formatTime(s, true));
      setEndText(formatTime(e, true));
      return { start: s, end: e };
    },
    [],
  );

  // ---------- Player ----------

  useEffect(() => {
    if (!videoId || playerRef.current || !hostRef.current) return;
    let cancelled = false;
    const host = hostRef.current;
    const pending = pendingRangeRef.current;

    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled) return;
        const mount = document.createElement("div");
        host.appendChild(mount);

        playerRef.current = new YT.Player(mount, {
          host: "https://www.youtube-nocookie.com",
          videoId,
          playerVars: {
            controls: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            start: pending ? Math.floor(pending.start) : 0,
            autoplay: pending ? 1 : 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              readyRef.current = true;
              setVideoTitle(e.target.getVideoData().title);
              // Duration settles in the polling effect, which also applies any
              // pending range once it knows how long the video is.
              if (pending) {
                e.target.seekTo(pending.start, true);
                e.target.playVideo();
              }
            },
            onStateChange: (e) => {
              const state = e.target.getPlayerState();
              setIsPlaying(state === PlayerState.PLAYING);
              if (state === PlayerState.PLAYING) {
                setVideoTitle(e.target.getVideoData().title);
              }

              // A loop ending at the very end of the video never trips the
              // polling check, so restart it here too.
              if (
                state === PlayerState.ENDED &&
                loopRef.current.enabled &&
                armedRef.current
              ) {
                armedRef.current = false;
                e.target.seekTo(loopRef.current.start, true);
                e.target.playVideo();
                setReps((n) => n + 1);
              }
            },
            onError: () => {
              setPlayerError(
                "This video can't be played here — the owner may have disabled embedding.",
              );
            },
          },
        });
      })
      .catch((err: Error) => setPlayerError(err.message));

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // Destroy the player only when the tool unmounts
  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      readyRef.current = false;
    };
  }, []);

  // Playhead polling + loop enforcement
  useEffect(() => {
    if (!videoId) return;
    const id = setInterval(() => {
      const player = playerRef.current;
      if (!player || !readyRef.current) return;

      // A freshly loaded video reports its duration asynchronously; once it
      // lands, settle the loop range (either the saved one or the whole video).
      if (durationRef.current <= 0) {
        const dur = player.getDuration();
        if (dur <= 0) return;
        durationRef.current = dur;
        setDuration(dur);
        const pending = pendingRangeRef.current;
        pendingRangeRef.current = null;
        applyRange(pending?.start ?? 0, pending?.end || dur, dur);
        return; // start looping from the next tick
      }

      const t = player.getCurrentTime();
      setCurrentTime(t);

      const { start: s, end: e, enabled } = loopRef.current;
      if (!enabled || e <= s) return;

      if (t < e - LOOP_EPSILON) {
        armedRef.current = true; // back inside the range — ready to loop again
      } else if (armedRef.current) {
        armedRef.current = false;
        player.seekTo(s, true);
        setReps((n) => n + 1);
      }
    }, POLL_MS);

    return () => clearInterval(id);
  }, [videoId, applyRange]);

  // ---------- Actions ----------

  function loadVideo(rawInput: string, range?: { start: number; end: number }) {
    const parsed = parseYouTubeInput(rawInput);
    if (!parsed) {
      setUrlError("That doesn't look like a YouTube link or video id.");
      return;
    }

    setUrlError(null);
    setPlayerError(null);
    setReps(0);
    setJustSaved(false);
    setCurrentTime(0);

    const nextRange = range ?? { start: parsed.start ?? 0, end: 0 };

    if (parsed.videoId === videoId && playerRef.current && readyRef.current) {
      // Same video already loaded — just move the loop points
      const dur = durationRef.current || playerRef.current.getDuration();
      const applied = applyRange(nextRange.start, nextRange.end || dur, dur);
      playerRef.current.seekTo(applied.start, true);
      playerRef.current.playVideo();
      return;
    }

    // A new video: park the range until the player reports the new duration.
    pendingRangeRef.current = nextRange;
    durationRef.current = 0;
    setDuration(0);
    setVideoTitle("");
    if (!range) setLoopName("");

    if (playerRef.current && readyRef.current) {
      playerRef.current.loadVideoById({
        videoId: parsed.videoId,
        startSeconds: nextRange.start,
      });
    }

    setVideoId(parsed.videoId);
  }

  function togglePlay() {
    const player = playerRef.current;
    if (!player || !readyRef.current) return;
    if (player.getPlayerState() === PlayerState.PLAYING) player.pauseVideo();
    else player.playVideo();
  }

  function seekTo(seconds: number) {
    playerRef.current?.seekTo(seconds, true);
    setCurrentTime(seconds);
  }

  function changeRate(next: number) {
    setRate(next);
    playerRef.current?.setPlaybackRate(next);
  }

  function setPointToCurrent(point: "start" | "end") {
    const t = playerRef.current?.getCurrentTime() ?? currentTime;
    if (point === "start") applyRange(t, Math.max(end, t + MIN_LOOP_SECONDS), duration);
    else applyRange(Math.min(start, t - MIN_LOOP_SECONDS), t, duration);
  }

  function nudge(point: "start" | "end", delta: number) {
    if (point === "start") applyRange(start + delta, end, duration);
    else applyRange(start, end + delta, duration);
  }

  function commitText(point: "start" | "end", text: string) {
    const parsed = parseTimeInput(text);
    if (parsed == null) {
      // Invalid entry — snap the field back to the live value
      setStartText(formatTime(start, true));
      setEndText(formatTime(end, true));
      return;
    }
    if (point === "start") applyRange(parsed, end, duration);
    else applyRange(start, parsed, duration);
  }

  async function handleSave() {
    if (!videoId || end <= start) return;
    await saveLoop({
      video_id: videoId,
      title: (loopName.trim() || videoTitle || "Untitled loop").slice(0, 120),
      start_seconds: Number(start.toFixed(2)),
      end_seconds: Number(end.toFixed(2)),
      playback_rate: rate,
    });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }

  function playSavedLoop(loop: VideoLoop) {
    setLoopEnabled(true);
    changeRate(loop.playback_rate);
    setLoopName(loop.title);
    loadVideo(loop.video_id, {
      start: loop.start_seconds,
      end: loop.end_seconds,
    });
  }

  // ---------- Derived ----------

  const pct = (seconds: number) =>
    duration > 0 ? clamp((seconds / duration) * 100, 0, 100) : 0;
  const canSave = Boolean(videoId) && end > start;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
      {/* ---------- Player column ---------- */}
      <div className="min-w-0 space-y-2.5">
        {/* URL bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadVideo(urlInput);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            inputMode="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste a YouTube link or video id"
            aria-label="YouTube video link"
            className="h-10 min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          />
          <button
            type="submit"
            className="h-10 flex-none rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700 active:bg-amber-800"
          >
            Load
          </button>
        </form>

        {(urlError || playerError) && (
          <p className="text-xs text-red-600" role="alert">
            {urlError ?? playerError}
          </p>
        )}

        {/* Player */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-950">
          {/* The API replaces its mount node with an iframe — keep this host
              free of React-rendered children so React never touches it. */}
          <div
            ref={hostRef}
            className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full"
          />
          {!videoId && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-6 text-center">
              <span className="text-3xl">🪈</span>
              <p className="text-sm font-medium text-stone-300">
                Paste a YouTube link to start looping
              </p>
              <p className="text-xs text-stone-500">
                Mark A and B, then repeat that phrase until it sits in your
                fingers.
              </p>
            </div>
          )}
        </div>

        {/* Control bar */}
        <div className="space-y-2.5 rounded-xl border border-stone-200 bg-white p-2.5 shadow-sm">
          {/* Transport + timeline */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={togglePlay}
              disabled={!videoId}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-stone-900 text-white transition-colors hover:bg-stone-800 disabled:opacity-40"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
              )}
            </button>

            <div className="relative flex h-5 min-w-0 flex-1 items-center">
              <div className="absolute inset-x-0 h-1.5 rounded-full bg-stone-200" />
              {duration > 0 && end > start && (
                <div
                  className="absolute h-1.5 rounded-full bg-amber-400"
                  style={{
                    left: `${pct(start)}%`,
                    width: `${Math.max(pct(end) - pct(start), 0.5)}%`,
                  }}
                />
              )}
              <div
                className="absolute h-3.5 w-1 rounded-full bg-stone-900"
                style={{ left: `calc(${pct(currentTime)}% - 2px)` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={clamp(currentTime, 0, duration || 0)}
                onChange={(e) => seekTo(Number(e.target.value))}
                disabled={!videoId || duration === 0}
                aria-label="Seek video"
                className="absolute inset-0 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
            </div>

            <span className="flex-none text-xs font-medium tabular-nums text-stone-500">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* A / B points + options */}
          <div className="flex flex-wrap items-center gap-2">
            {(["start", "end"] as const).map((point) => (
              <div
                key={point}
                className="flex items-center gap-0.5 rounded-lg border border-stone-200 p-0.5"
              >
                <label
                  htmlFor={`loop-${point}`}
                  className="px-1.5 text-[11px] font-bold uppercase text-amber-700"
                >
                  {point === "start" ? "A" : "B"}
                </label>
                <button
                  onClick={() => nudge(point, -1)}
                  disabled={!videoId}
                  aria-label={`Move ${point} back one second`}
                  className="flex h-7 w-7 items-center justify-center rounded text-stone-500 transition-colors hover:bg-stone-100 disabled:opacity-40"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  id={`loop-${point}`}
                  type="text"
                  inputMode="numeric"
                  value={point === "start" ? startText : endText}
                  onChange={(e) =>
                    point === "start"
                      ? setStartText(e.target.value)
                      : setEndText(e.target.value)
                  }
                  onBlur={(e) => commitText(point, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitText(point, e.currentTarget.value);
                    }
                  }}
                  disabled={!videoId}
                  className="w-16 rounded bg-stone-50 py-1 text-center font-mono text-xs tabular-nums text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                />
                <button
                  onClick={() => nudge(point, 1)}
                  disabled={!videoId}
                  aria-label={`Move ${point} forward one second`}
                  className="flex h-7 w-7 items-center justify-center rounded text-stone-500 transition-colors hover:bg-stone-100 disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPointToCurrent(point)}
                  disabled={!videoId}
                  title={`Set ${point} to the current position`}
                  className="h-7 rounded bg-stone-900 px-2 text-[11px] font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-40"
                >
                  Set
                </button>
              </div>
            ))}

            <button
              onClick={() => setLoopEnabled((v) => !v)}
              aria-pressed={loopEnabled}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                loopEnabled
                  ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}
            >
              {loopEnabled ? (
                <Repeat1 className="h-3.5 w-3.5" />
              ) : (
                <Repeat className="h-3.5 w-3.5" />
              )}
              {loopEnabled ? "On" : "Off"}
            </button>

            <select
              value={rate}
              onChange={(e) => changeRate(Number(e.target.value))}
              aria-label="Playback speed"
              className="h-8 rounded-lg border border-stone-200 bg-white px-1.5 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}×
                </option>
              ))}
            </select>

            <button
              onClick={() => setReps(0)}
              title="Reset rep counter"
              className="ml-auto flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-stone-500 transition-colors hover:bg-stone-100"
            >
              <span className="tabular-nums">
                <span className="font-bold text-stone-900">{reps}</span> reps
              </span>
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Save */}
          <div className="flex gap-2 border-t border-stone-100 pt-2.5">
            <input
              type="text"
              value={loopName}
              onChange={(e) => setLoopName(e.target.value)}
              placeholder={videoTitle || "Name this loop"}
              aria-label="Loop name"
              disabled={!videoId}
              className="h-9 min-w-0 flex-1 rounded-lg border border-stone-200 px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-stone-50"
            />
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex h-9 flex-none items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-40"
            >
              <Bookmark className="h-3.5 w-3.5" />
              {justSaved ? "Saved" : "Save loop"}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Saved loops ---------- */}
      <aside className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold text-stone-900">Saved loops</h2>
          <span className="text-[11px] text-stone-400">
            {user ? "Synced" : "This device"}
          </span>
        </div>

        {loading ? (
          <div className="h-16 animate-pulse rounded-lg bg-stone-100" />
        ) : loops.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-200 px-3 py-6 text-center text-xs leading-relaxed text-stone-500">
            No loops yet. Mark A and B, then hit{" "}
            <span className="font-semibold text-stone-700">Save loop</span>.
          </p>
        ) : (
          <ul className="max-h-[24rem] space-y-1.5 overflow-y-auto lg:max-h-[30rem]">
            {loops.map((loop) => (
              <li
                key={loop.id}
                className="group flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-stone-50"
              >
                <button
                  onClick={() => playSavedLoop(loop)}
                  aria-label={`Play loop ${loop.title}`}
                  className="relative h-10 w-16 flex-none overflow-hidden rounded"
                >
                  <img
                    src={`https://i.ytimg.com/vi/${loop.video_id}/mqdefault.jpg`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play className="ml-0.5 h-4 w-4 text-white" fill="currentColor" />
                  </span>
                </button>
                <button
                  onClick={() => playSavedLoop(loop)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-xs font-semibold text-stone-900">
                    {loop.title || "Untitled loop"}
                  </p>
                  <p className="text-[11px] tabular-nums text-stone-500">
                    {formatTime(loop.start_seconds)}–{formatTime(loop.end_seconds)}
                    {loop.playback_rate !== 1 && ` · ${loop.playback_rate}×`}
                  </p>
                </button>
                <button
                  onClick={() => deleteLoop(loop.id)}
                  aria-label={`Delete loop ${loop.title}`}
                  className="flex h-7 w-7 flex-none items-center justify-center rounded text-stone-300 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {!user && loops.length > 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-stone-400">
            Sign in to keep these loops on every device.
          </p>
        )}
      </aside>
    </div>
  );
}
