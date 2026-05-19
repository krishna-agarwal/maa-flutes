"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Play, Pause, Minus, Plus } from "lucide-react";
import {
  ALANKARS,
  THAATS,
  SA_PITCHES,
  type SaLabel,
  type SwaraNote,
  type Thaat,
  noteHz,
  renderSwaraLabel,
  saHzFromLabel,
  semitonesFor,
} from "@/lib/alankars";

const MIN_BPM = 40;
const MAX_BPM = 200;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;

const PARTIALS: ReadonlyArray<readonly [number, number]> = [
  [1, 1.0],
  [2, 0.07],
  [3, 0.02],
];
const ATTACK = 0.05;
const DECAY = 0.04;
const SUSTAIN = 0.85;
const RELEASE = 0.08;
const VIBRATO_HZ = 5.5;
const VIBRATO_CENTS = 9;

function scheduleNote(
  ctx: AudioContext,
  master: AudioNode,
  freq: number,
  startAt: number,
  duration: number,
) {
  const env = ctx.createGain();
  env.connect(master);

  const peak = 0.9;
  const sustainStart = startAt + ATTACK + DECAY;
  const releaseStart = Math.max(sustainStart, startAt + duration - RELEASE);

  env.gain.setValueAtTime(0.0001, startAt);
  env.gain.exponentialRampToValueAtTime(peak, startAt + ATTACK);
  env.gain.exponentialRampToValueAtTime(SUSTAIN, sustainStart);
  env.gain.setValueAtTime(SUSTAIN, releaseStart);
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = VIBRATO_HZ;
  lfo.start(startAt);
  lfo.stop(startAt + duration + 0.03);

  for (const [mult, amp] of PARTIALS) {
    const partialFreq = freq * mult;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = partialFreq;

    const depthHz = partialFreq * (Math.pow(2, VIBRATO_CENTS / 1200) - 1);
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = depthHz;
    lfo.connect(lfoGain).connect(o.frequency);

    const g = ctx.createGain();
    g.gain.value = amp;
    o.connect(g).connect(env);
    o.start(startAt);
    o.stop(startAt + duration + 0.03);
  }
}

interface MiniAlankarPracticeProps {
  selectedScale?: string;
}

export default function MiniAlankarPractice({
  selectedScale,
}: MiniAlankarPracticeProps = {}) {
  const [thaatId, setThaatId] = useState<string>(THAATS[0].id);
  const [alankarId, setAlankarId] = useState<string>(ALANKARS[0].id);
  const [saLabel, setSaLabel] = useState<SaLabel>(
    (selectedScale as SaLabel) || "C"
  );
  const [bpm, setBpm] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);

  const thaat = useMemo<Thaat>(
    () => THAATS.find((t) => t.id === thaatId) ?? THAATS[0],
    [thaatId],
  );
  const alankar = useMemo(
    () => ALANKARS.find((a) => a.id === alankarId) ?? ALANKARS[0],
    [alankarId],
  );

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextNoteTimeRef = useRef(0);
  const noteCounterRef = useRef(0);

  const bpmRef = useRef(bpm);
  const thaatRef = useRef(thaat);
  const patternRef = useRef<SwaraNote[]>(alankar.pattern);
  const saHzRef = useRef(saHzFromLabel(saLabel));

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { thaatRef.current = thaat; }, [thaat]);
  useEffect(() => {
    patternRef.current = alankar.pattern;
    noteCounterRef.current = 0;
    setCurrentNoteIndex(-1);
  }, [alankar]);
  useEffect(() => { saHzRef.current = saHzFromLabel(saLabel); }, [saLabel]);
  useEffect(() => {
    if (selectedScale) setSaLabel(selectedScale as SaLabel);
  }, [selectedScale]);

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const pattern = patternRef.current;
      if (pattern.length === 0) return;
      const i = noteCounterRef.current % pattern.length;
      const note = pattern[i];
      const semitones = semitonesFor(note, thaatRef.current);
      const freq = noteHz(saHzRef.current, semitones);

      const beat = 60 / bpmRef.current;
      const dur = beat * 0.92;
      const startAt = nextNoteTimeRef.current;

      scheduleNote(ctx, master, freq, startAt, dur);

      const delayMs = (startAt - ctx.currentTime) * 1000;
      const indexAtFire = i;
      setTimeout(() => setCurrentNoteIndex(indexAtFire), Math.max(0, delayMs));

      noteCounterRef.current = i + 1;
      nextNoteTimeRef.current = startAt + beat;
    }
  }, []);

  const start = useCallback(() => {
    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = master;
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    noteCounterRef.current = 0;
    schedulerRef.current = setInterval(scheduler, LOOKAHEAD_MS);
    setIsPlaying(true);
  }, [scheduler]);

  const stop = useCallback(() => {
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentNoteIndex(-1);
  }, []);

  useEffect(() => {
    return () => {
      if (schedulerRef.current) clearInterval(schedulerRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const adjustBpm = (delta: number) =>
    setBpm((v) => Math.min(MAX_BPM, Math.max(MIN_BPM, v + delta)));

  const selectClass =
    "bg-stone-900/80 text-white border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400";

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">Alankar Practice</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">
            {isPlaying ? "Playing…" : "Ready"}
          </span>
          <button
            onClick={() => (isPlaying ? stop() : start())}
            aria-label={isPlaying ? "Stop alankar practice" : "Start alankar practice"}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 shrink-0 font-semibold ${
              isPlaying
                ? "bg-white/15 text-white hover:bg-white/25"
                : "bg-white/15 text-white hover:bg-white/25 shadow-sm shadow-white/20"
            }`}
          >
            {isPlaying ? <Pause fill="currentColor" size={16} /> : <Play fill="currentColor" size={16} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-white/40">Thaat</span>
          <select
            value={thaatId}
            onChange={(e) => setThaatId(e.target.value)}
            className={selectClass}
          >
            {THAATS.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-white/40">Sa</span>
          <select
            value={saLabel}
            onChange={(e) => setSaLabel(e.target.value as SaLabel)}
            className={selectClass}
          >
            {SA_PITCHES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-white/40">Alankar</span>
        <select
          value={alankarId}
          onChange={(e) => setAlankarId(e.target.value)}
          className={selectClass}
        >
          {ALANKARS.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </label>

      <div className="bg-black/30 rounded-xl p-2 max-h-24 overflow-y-auto">
        <div className="flex flex-wrap gap-1">
          {alankar.pattern.map((note, i) => {
            const active = isPlaying && currentNoteIndex === i;
            return (
              <span
                key={i}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold tabular-nums transition-colors ${
                  active
                    ? "bg-amber-500/30 text-amber-200 ring-1 ring-amber-400"
                    : "bg-white/5 text-white/70"
                }`}
              >
                {renderSwaraLabel(note, thaat)}
              </span>
            );
          })}
        </div>
      </div>

      {/* BPM display */}
      <div className="text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-black text-white tabular-nums">{bpm}</span>
          <span className="text-xs text-white/40">BPM</span>
        </div>
      </div>

      {/* BPM slider controls */}
      <div className="flex items-center gap-2 -mt-2">
        <button
          onClick={() => adjustBpm(-1)}
          aria-label="Decrease BPM by 1"
          className="w-8 h-8 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white active:scale-95 transition-all flex items-center justify-center shrink-0"
        >
          <Minus size={16} />
        </button>
        <input
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          aria-label="BPM"
          className="flex-1 accent-amber-500 h-1"
          style={{
            WebkitAppearance: 'slider-horizontal',
          }}
        />
        <button
          onClick={() => adjustBpm(1)}
          aria-label="Increase BPM by 1"
          className="w-8 h-8 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white active:scale-95 transition-all flex items-center justify-center shrink-0"
        >
          <Plus size={16} />
        </button>
      </div>

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
