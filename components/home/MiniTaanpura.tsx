"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

const SCALES = [
  { label: "C", file: "c" },
  { label: "C#", file: "c-sharp" },
  { label: "D", file: "d" },
  { label: "D#", file: "d-sharp" },
  { label: "E", file: "e" },
  { label: "F", file: "f" },
  { label: "F#", file: "f-sharp" },
  { label: "G", file: "g" },
  { label: "G#", file: "g-sharp" },
  { label: "A", file: "a" },
  { label: "A#", file: "a-sharp" },
  { label: "B", file: "b" },
];

const CROSSFADE_S = 0.3;

const VIZ_W = 800;
const VIZ_H = 60;

function sinePath(
  width: number,
  height: number,
  period: number,
  amp: number,
  phase: number,
) {
  const cy = height / 2;
  const steps = 240;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const y = cy + Math.sin((x / period) * Math.PI * 2 + phase) * amp;
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
  }
  return d.trim();
}

const WAVE_BACK = sinePath(VIZ_W, VIZ_H, 200, 14, 0);
const WAVE_MID = sinePath(VIZ_W, VIZ_H, 130, 9, Math.PI / 3);
const WAVE_FRONT = sinePath(VIZ_W, VIZ_H, 90, 5, Math.PI / 1.7);

type Voice = { src: AudioBufferSourceNode; gain: GainNode };

interface MiniTaanpuraProps {
  selectedScale?: string;
}

export default function MiniTaanpura({
  selectedScale,
}: MiniTaanpuraProps = {}) {
  const [scale, setScale] = useState(selectedScale || "C");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const activeRef = useRef<Voice[]>([]);
  const timerRef = useRef<number | null>(null);
  const nextStartRef = useRef(0);

  function ensureContext() {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterGainRef.current = master;
    }
    return ctxRef.current;
  }

  async function loadBuffer(file: string) {
    const cached = bufferCacheRef.current.get(file);
    if (cached) return cached;
    const ctx = ensureContext();
    const res = await fetch(`/audio/taanpura/${file}.mp3`);
    const arr = await res.arrayBuffer();
    const buf = await ctx.decodeAudioData(arr);
    bufferCacheRef.current.set(file, buf);
    return buf;
  }

  function scheduleVoice(buffer: AudioBuffer, startAt: number) {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    src.connect(gain).connect(master);

    const dur = buffer.duration;
    const fade = Math.min(CROSSFADE_S, dur / 3);

    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(1, startAt + fade);
    gain.gain.setValueAtTime(1, startAt + dur - fade);
    gain.gain.linearRampToValueAtTime(0, startAt + dur);

    src.start(startAt);
    src.stop(startAt + dur + 0.05);

    const voice: Voice = { src, gain };
    activeRef.current.push(voice);
    src.onended = () => {
      activeRef.current = activeRef.current.filter((v) => v !== voice);
    };
  }

  function stopAll() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    activeRef.current.forEach(({ src, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        src.stop(now + 0.06);
      } catch {
        // already stopped
      }
    });
    activeRef.current = [];
  }

  async function startPlayback(file: string) {
    const ctx = ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
    const buffer = await loadBuffer(file);

    const fade = Math.min(CROSSFADE_S, buffer.duration / 3);
    const interval = buffer.duration - fade;
    nextStartRef.current = ctx.currentTime + 0.05;

    const tick = () => {
      const c = ctxRef.current;
      if (!c) return;
      while (nextStartRef.current < c.currentTime + 1) {
        scheduleVoice(buffer, nextStartRef.current);
        nextStartRef.current += interval;
      }
      timerRef.current = window.setTimeout(tick, 200);
    };
    tick();
  }

  useEffect(() => {
    if (selectedScale && selectedScale !== scale) {
      setScale(selectedScale);
    }
  }, [selectedScale, scale]);

  useEffect(() => {
    if (isPlaying) {
      const file = SCALES.find((s) => s.label === scale)?.file ?? "c";
      startPlayback(file).catch(() => setIsPlaying(false));
    } else {
      stopAll();
    }
    return () => stopAll();
  }, [isPlaying, scale]);

  useEffect(() => {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(volume, now + 0.05);
  }, [volume]);

  useEffect(() => {
    return () => {
      stopAll();
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  function handleToggle() {
    setIsPlaying((p) => !p);
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
      <style>{`
        @keyframes mtp-flow-back  { to { transform: translateX(-400px); } }
        @keyframes mtp-flow-mid   { to { transform: translateX(-260px); } }
        @keyframes mtp-flow-front { to { transform: translateX(-180px); } }
        @media (prefers-reduced-motion: reduce) {
          .mtp-layer { animation: none !important; }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">Taanpura</h3>
        <button
          onClick={handleToggle}
          aria-label={isPlaying ? "Stop taanpura" : "Start taanpura"}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 shrink-0 font-semibold ${
            isPlaying
              ? "bg-white/15 text-white hover:bg-white/25"
              : "bg-amber-500 text-stone-900 hover:bg-amber-400 shadow-sm shadow-amber-500/20"
          }`}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>

      {/* Wave visualization */}
      <div className="bg-amber-950/50 rounded-xl h-16 overflow-hidden">
        <svg
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          className="w-full h-full"
          style={{
            opacity: isPlaying ? 1 : 0.5,
            transition: "opacity 300ms ease",
          }}
        >
          <defs>
            <filter id="mtp-glow" x="-10%" y="-30%" width="120%" height="160%">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
          </defs>

          <g
            className="mtp-layer"
            style={{
              animation: "mtp-flow-back 18s linear infinite",
              animationPlayState: isPlaying ? "running" : "paused",
              willChange: "transform",
            }}
          >
            <path
              d={WAVE_BACK}
              stroke="rgb(251 191 36)"
              strokeOpacity="0.22"
              strokeWidth="2"
              fill="none"
            />
          </g>

          <g
            className="mtp-layer"
            style={{
              animation: "mtp-flow-mid 7s linear infinite",
              animationPlayState: isPlaying ? "running" : "paused",
              willChange: "transform",
            }}
          >
            <path
              d={WAVE_MID}
              stroke="rgb(251 191 36)"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              fill="none"
            />
          </g>

          <g
            className="mtp-layer"
            style={{
              animation: "mtp-flow-front 4.2s linear infinite",
              animationPlayState: isPlaying ? "running" : "paused",
              willChange: "transform",
            }}
          >
            <path
              d={WAVE_FRONT}
              stroke="rgb(254 215 170)"
              strokeOpacity="0.7"
              strokeWidth="2.5"
              fill="none"
              filter="url(#mtp-glow)"
            />
            <path
              d={WAVE_FRONT}
              stroke="rgb(254 240 138)"
              strokeWidth="1.2"
              fill="none"
            />
          </g>
        </svg>
      </div>

      {/* Scale selector */}
      <div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-xs text-white/40">Scale:</span>
          <span className="text-sm font-bold text-white">{scale}</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {SCALES.map((s) => (
            <button
              key={s.label}
              onClick={() => setScale(s.label)}
              className={`py-1 text-[10px] font-medium rounded transition-all ${
                scale === s.label
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-white/5 text-white/40 hover:bg-white/10"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setVolume((v) => (v > 0 ? 0 : 0.7))}
          aria-label={volume === 0 ? "Unmute taanpura" : "Mute taanpura"}
          className="text-white/60 hover:text-white transition-colors shrink-0"
        >
          {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Taanpura volume"
          className="flex-1 h-1 accent-amber-500 cursor-pointer"
        />
        <span className="text-[10px] text-white/40 w-8 text-right tabular-nums">
          {Math.round(volume * 100)}%
        </span>
      </div>

    </div>
  );
}
