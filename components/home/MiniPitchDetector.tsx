"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const NOTE_NAMES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

const REF_A = 440;
const MIN_FREQ = 60;
const MAX_FREQ = 2000;
const RMS_THRESHOLD = 0.005;
const BUFFER_SIZE = 2048;

interface Pitch {
  freq: number;
  note: string;
  octave: number;
  cents: number;
  noteIndex?: number;
}

// Autocorrelation-based pitch detection. Returns frequency in Hz, or -1.
function detectPitch(buf: Float32Array, sampleRate: number): number {
  const size = buf.length;

  // Reject signals below threshold (silence / breath only).
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / size);
  if (rms < RMS_THRESHOLD) return -1;

  // Trim leading/trailing samples below 20% of RMS to focus on the steady tone.
  const cutoff = rms * 0.2;
  let start = 0;
  let end = size - 1;
  while (start < size && Math.abs(buf[start]) < cutoff) start++;
  while (end > 0 && Math.abs(buf[end]) < cutoff) end--;
  const trimmed = buf.subarray(start, end + 1);
  const n = trimmed.length;
  if (n < 64) return -1;

  // Difference function (similar to YIN step 1).
  const minLag = Math.floor(sampleRate / MAX_FREQ);
  const maxLag = Math.min(Math.floor(sampleRate / MIN_FREQ), Math.floor(n / 2));
  if (maxLag <= minLag) return -1;

  const diffs = new Float32Array(maxLag);
  for (let lag = minLag; lag < maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      const d = trimmed[i] - trimmed[i + lag];
      sum += d * d;
    }
    diffs[lag] = sum;
  }

  // Cumulative mean normalized difference (YIN step 3).
  const cmnd = new Float32Array(maxLag);
  cmnd[minLag] = 1;
  let runningSum = 0;
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    runningSum += diffs[lag];
    cmnd[lag] = (diffs[lag] * (lag - minLag)) / runningSum;
  }

  // Absolute threshold: pick the first lag below 0.2.
  const threshold = 0.2;
  let chosenLag = -1;
  for (let lag = minLag + 1; lag < maxLag - 1; lag++) {
    if (cmnd[lag] < threshold) {
      while (lag + 1 < maxLag && cmnd[lag + 1] < cmnd[lag]) lag++;
      chosenLag = lag;
      break;
    }
  }
  if (chosenLag < 0) return -1;

  // Parabolic interpolation around the chosen lag for sub-sample accuracy.
  const x0 = chosenLag - 1;
  const x2 = chosenLag + 1;
  let betterLag = chosenLag;
  if (x0 >= minLag && x2 < maxLag) {
    const s0 = cmnd[x0];
    const s1 = cmnd[chosenLag];
    const s2 = cmnd[x2];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) betterLag = chosenLag + (s2 - s0) / denom;
  }

  return sampleRate / betterLag;
}

function freqToPitch(freq: number, refA: number): Pitch {
  // Semitones above A4 (= refA, scaled).
  const semitonesFromA4 = 12 * Math.log2(freq / refA);
  const midiOffset = Math.round(semitonesFromA4);
  const cents = Math.round((semitonesFromA4 - midiOffset) * 100);
  // A4 is MIDI 69. Map to note name + octave.
  const midi = 69 + midiOffset;
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return { freq, note: NOTE_NAMES[noteIndex], octave, cents, noteIndex };
}

export default function MiniPitchDetector() {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const failCountRef = useRef(0);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    bufferRef.current = null;
    setIsListening(false);
    setPitch(null);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });
      streamRef.current = stream;

      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = BUFFER_SIZE;
      source.connect(analyser);

      sourceRef.current = source;
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);

      const tick = () => {
        const a = analyserRef.current;
        const buf = bufferRef.current;
        const c = audioCtxRef.current;
        if (!a || !buf || !c) return;
        a.getFloatTimeDomainData(buf);
        const f = detectPitch(buf, c.sampleRate);
        if (f > 0) {
          setPitch(freqToPitch(f, REF_A));
          failCountRef.current = 0;
        } else {
          failCountRef.current++;
          if (failCountRef.current > 10) {
            setPitch(null);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      setIsListening(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone access denied";
      setError(msg);
      stop();
    }
  }, [stop]);

  useEffect(() => {
    return () => {
      stop();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [stop]);

  const cents = pitch?.cents ?? 0;
  const inTune = pitch !== null && Math.abs(cents) <= 5;
  const slightlyOff = pitch !== null && Math.abs(cents) > 5 && Math.abs(cents) <= 15;
  const noteColor = inTune
    ? "text-green-400"
    : slightlyOff
    ? "text-amber-400"
    : pitch
    ? "text-red-400"
    : "text-white/30";

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">Tuner</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">
            {isListening ? "Listening…" : "Mic off"}
          </span>
          <button
            onClick={() => (isListening ? stop() : start())}
            aria-label={isListening ? "Stop" : "Start tuning"}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 shrink-0 ${
              isListening
                ? "bg-white/10 text-white hover:bg-white/15"
                : "bg-amber-500 text-stone-900 hover:bg-amber-400"
            }`}
          >
            {isListening ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {error && (
        <p className="text-[10px] text-red-400/80 text-center -mt-2">{error}</p>
      )}

      {/* Note display */}
      <div className="bg-black/40 rounded-xl py-3 flex items-center justify-center min-h-[64px]">
        {(() => {
          const displayPitch = pitch || {
            freq: 261.63,
            note: "C",
            octave: 4,
            cents: 0,
            noteIndex: 0
          };
          const noteIdx = displayPitch.noteIndex ?? 0;
          const flatNote = NOTE_NAMES[(noteIdx - 1 + 12) % 12];
          const sharpNote = NOTE_NAMES[(noteIdx + 1) % 12];
          const isActive = pitch !== null;

          return (
            <div className="flex items-baseline justify-between w-full px-4">
              <span className={`text-2xl font-bold ${isActive ? "text-white/40" : "text-white/15"}`}>
                {flatNote}
              </span>
              <div className="flex items-baseline">
                <span className={`text-4xl font-black tabular-nums ${isActive ? noteColor : "text-white/30"}`}>
                  {displayPitch.note}
                </span>
                <span className={`text-lg font-bold ml-0.5 ${isActive ? noteColor : "text-white/30"} opacity-70`}>
                  {displayPitch.octave}
                </span>
              </div>
              <span className={`text-2xl font-bold ${isActive ? "text-white/40" : "text-white/15"}`}>
                {sharpNote}
              </span>
            </div>
          );
        })()}
      </div>

      {/* Cents meter */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[9px] text-white/50 tabular-nums px-0.5">
          {[-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map((v) => (
            <span
              key={v}
              className={
                v === 0
                  ? inTune
                    ? "text-green-400 font-bold"
                    : "text-white/80 font-bold"
                  : ""
              }
            >
              {v > 0 ? `+${v}` : v}
            </span>
          ))}
        </div>
        <div className="relative h-10 bg-black/30 rounded-md overflow-hidden">
          <div className="absolute inset-0 flex items-baseline px-0.5">
            {Array.from({ length: 81 }).map((_, i) => {
              const barCents = -50 + (i * 100) / 80;
              const isCenter = i === 40;
              const isMajor = i % 8 === 0 && !isCenter;
              const absBarCents = Math.abs(barCents);

              // "Trail" — bars between 0 and current cents are lit.
              let inTrail = false;
              if (pitch) {
                inTrail =
                  cents >= 0
                    ? barCents >= 0 && barCents <= cents + 0.5
                    : barCents <= 0 && barCents >= cents - 0.5;
              }

              let barClass: string;
              if (inTrail) {
                if (absBarCents <= 5) {
                  barClass = "bg-green-400";
                } else if (absBarCents <= 15) {
                  barClass = "bg-amber-400";
                } else {
                  barClass = "bg-red-400";
                }
              } else if (isCenter) {
                barClass = "bg-green-400/40";
              } else if (isMajor) {
                barClass = "bg-white/25";
              } else {
                barClass = "bg-white/20";
              }

              const heightClass = isCenter
                ? "h-full"
                : isMajor
                ? "h-[78%]"
                : "h-[68%]";

              return (
                <div
                  key={i}
                  className={`flex-1 mx-[0.5px] rounded-t-sm ${heightClass} ${barClass}`}
                />
              );
            })}
          </div>
        </div>
        <div className="text-[10px] text-white/40 tabular-nums text-center">
          {pitch ? (
            <>
              {pitch.freq.toFixed(1)} Hz
              {" · "}
              <span
                className={
                  inTune
                    ? "text-green-400"
                    : slightlyOff
                    ? "text-amber-400"
                    : "text-red-400"
                }
              >
                {cents > 0 ? "+" : ""}
                {cents} cents
              </span>
            </>
          ) : (
            <span className="opacity-0">·</span>
          )}
        </div>
      </div>

    </div>
  );
}
