"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Minus, Plus } from "lucide-react";

const MIN_BPM = 20;
const MAX_BPM = 900;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;
const BEATS_PER_BAR = 4;

export default function MiniMetronome() {
  const [bpm, setBpm] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatCounterRef = useRef(0);
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bpmRef = useRef(bpm);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  function scheduleClick(time: number, beatIndex: number) {
    const ctx = audioCtxRef.current!;
    const isDownbeat = beatIndex === 0;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = isDownbeat ? 1320 : 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(isDownbeat ? 0.9 : 0.7, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    osc.start(time);
    osc.stop(time + 0.06);

    const delay = (time - ctx.currentTime) * 1000;
    setTimeout(() => setCurrentBeat(beatIndex), Math.max(0, delay));
  }

  function scheduler() {
    const ctx = audioCtxRef.current!;
    const interval = 60 / bpmRef.current;
    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_S) {
      scheduleClick(nextNoteTimeRef.current, beatCounterRef.current);
      beatCounterRef.current = (beatCounterRef.current + 1) % BEATS_PER_BAR;
      nextNoteTimeRef.current += interval;
    }
  }

  const start = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    beatCounterRef.current = 0;
    schedulerRef.current = setInterval(scheduler, LOOKAHEAD_MS);
    setIsPlaying(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback(() => {
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(-1);
  }, []);

  useEffect(() => {
    return () => {
      if (schedulerRef.current) clearInterval(schedulerRef.current);
    };
  }, []);

  const adjustBpm = (delta: number) =>
    setBpm((v) => Math.min(MAX_BPM, Math.max(MIN_BPM, v + delta)));

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">Metronome</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40">
            4 / 4
          </span>
          <button
            onClick={() => (isPlaying ? stop() : start())}
            aria-label={isPlaying ? "Stop metronome" : "Start metronome"}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 shrink-0 font-semibold ${
              isPlaying
                ? "bg-white/15 text-white hover:bg-white/25"
                : "bg-amber-500 text-stone-900 hover:bg-amber-400 shadow-sm shadow-amber-500/20"
            }`}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      </div>

      {/* BPM display + fine controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => adjustBpm(-1)}
          aria-label="Decrease BPM by 1"
          className="w-8 h-8 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white active:scale-95 transition-all flex items-center justify-center"
        >
          <Minus size={16} />
        </button>
        <div className="flex-1 text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-black text-white tabular-nums">
              {bpm}
            </span>
            <span className="text-xs text-white/40">BPM</span>
          </div>
        </div>
        <button
          onClick={() => adjustBpm(1)}
          aria-label="Increase BPM by 1"
          className="w-8 h-8 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus size={16} />
        </button>
      </div>

      <input
        type="range"
        min={MIN_BPM}
        max={MAX_BPM}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        aria-label="BPM"
        className="w-full accent-amber-500"
      />

      {/* 4-beat indicator */}
      <div className="flex justify-center items-center gap-6 h-6">
        {Array.from({ length: BEATS_PER_BAR }).map((_, i) => {
          const active = isPlaying && currentBeat === i;
          const isDownbeat = i === 0;
          return (
            <span
              key={i}
              className={`rounded-full transition-all duration-100 ${
                active
                  ? isDownbeat
                    ? "w-5 h-5 bg-amber-300 shadow-[0_0_18px_#fcd34d]"
                    : "w-4 h-4 bg-amber-400 shadow-[0_0_14px_#fbbf24]"
                  : isDownbeat
                  ? "w-4 h-4 bg-white/20"
                  : "w-3 h-3 bg-white/15"
              }`}
            />
          );
        })}
      </div>

      {/* Quick BPM presets */}
      <div className="flex gap-1.5">
        {[60, 80, 100, 120].map((b) => (
          <button
            key={b}
            onClick={() => setBpm(b)}
            className={`flex-1 py-1 text-xs font-medium rounded-lg transition-all ${
              bpm === b
                ? "bg-amber-500/20 text-amber-300"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}
