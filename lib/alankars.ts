export type SwaraIdx = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface SwaraNote {
  idx: SwaraIdx;
  octave: -1 | 0 | 1;
}

export interface Thaat {
  id: string;
  name: string;
  offsets: readonly [0, number, number, number, number, number, number];
  labels: readonly [string, string, string, string, string, string, string];
}

export interface Alankar {
  id: string;
  name: string;
  pattern: SwaraNote[];
}

export const SA_PITCHES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

export type SaLabel = (typeof SA_PITCHES)[number];

export const SA_BASE_HZ = 261.6256;

export const THAATS: readonly Thaat[] = [
  { id: "bilawal",  name: "Bilawal",  offsets: [0, 2, 4, 5, 7, 9, 11], labels: ["S", "R", "G", "M",  "P", "D", "N"] },
  { id: "kalyan",   name: "Kalyan",   offsets: [0, 2, 4, 6, 7, 9, 11], labels: ["S", "R", "G", "M'", "P", "D", "N"] },
  { id: "khamaj",   name: "Khamaj",   offsets: [0, 2, 4, 5, 7, 9, 10], labels: ["S", "R", "G", "M",  "P", "D", "n"] },
  { id: "bhairav",  name: "Bhairav",  offsets: [0, 1, 4, 5, 7, 8, 11], labels: ["S", "r", "G", "M",  "P", "d", "N"] },
  { id: "bhairavi", name: "Bhairavi", offsets: [0, 1, 3, 5, 7, 8, 10], labels: ["S", "r", "g", "M",  "P", "d", "n"] },
  { id: "asavari",  name: "Asavari",  offsets: [0, 2, 3, 5, 7, 8, 10], labels: ["S", "R", "g", "M",  "P", "d", "n"] },
  { id: "todi",     name: "Todi",     offsets: [0, 1, 3, 6, 7, 8, 11], labels: ["S", "r", "g", "M'", "P", "d", "N"] },
  { id: "purvi",    name: "Purvi",    offsets: [0, 1, 4, 6, 7, 8, 11], labels: ["S", "r", "G", "M'", "P", "d", "N"] },
  { id: "marwa",    name: "Marwa",    offsets: [0, 1, 4, 6, 7, 9, 11], labels: ["S", "r", "G", "M'", "P", "D", "N"] },
  { id: "kafi",     name: "Kafi",     offsets: [0, 2, 3, 5, 7, 9, 10], labels: ["S", "R", "g", "M",  "P", "D", "n"] },
];

const n = (idx: SwaraIdx, octave: -1 | 0 | 1 = 0): SwaraNote => ({ idx, octave });
const seq = (...notes: SwaraNote[]): SwaraNote[] => notes;

// Combine an ascending phrase with its descent: play up to the peak, then
// the full mirror back down. The peak sounds twice (top of ascent + start of
// descent), while the starting swara stays single so the loop seam stays clean.
const mirror = (asc: SwaraNote[]): SwaraNote[] => [
  ...asc,
  ...[...asc].reverse().slice(0, -1),
];

const lo_P = n(4, -1);
const lo_D = n(5, -1);
const lo_N = n(6, -1);
const S = n(0);
const R = n(1);
const G = n(2);
const M = n(3);
const P = n(4);
const D = n(5);
const N = n(6);
const hi_S = n(0, 1);
const hi_R = n(1, 1);
const hi_G = n(2, 1);

export const ALANKARS: readonly Alankar[] = [
  {
    id: "aroh-avaroh",
    name: "Aroh–Avaroh (ascend + descend)",
    pattern: mirror(seq(S, R, G, M, P, D, N, hi_S)),
  },
  {
    id: "pairs",
    name: "Pairs — SR RG GM … (up & down)",
    pattern: mirror(seq(S, R, R, G, G, M, M, P, P, D, D, N, N, hi_S)),
  },
  {
    id: "triplets",
    name: "Triplets — SRG RGM … (up & down)",
    pattern: mirror(
      seq(
        S, R, G,
        R, G, M,
        G, M, P,
        M, P, D,
        P, D, N,
        D, N, hi_S,
      ),
    ),
  },
  {
    id: "fours",
    name: "Four-note — SRGM RGMP … (up & down)",
    pattern: mirror(
      seq(
        S, R, G, M,
        R, G, M, P,
        G, M, P, D,
        M, P, D, N,
        P, D, N, hi_S,
      ),
    ),
  },
  {
    id: "fives",
    name: "Five-note — SRGMP RGMPD … (up & down)",
    pattern: mirror(
      seq(
        S, R, G, M, P,
        R, G, M, P, D,
        G, M, P, D, N,
        M, P, D, N, hi_S,
      ),
    ),
  },
  {
    id: "sixes",
    name: "Six-note — SRGMPD … (up & down)",
    pattern: mirror(
      seq(
        S, R, G, M, P, D,
        R, G, M, P, D, N,
        G, M, P, D, N, hi_S,
      ),
    ),
  },
  {
    id: "sevens",
    name: "Seven-note — SRGMPDN … (up & down)",
    pattern: mirror(
      seq(
        S, R, G, M, P, D, N,
        R, G, M, P, D, N, hi_S,
      ),
    ),
  },
  {
    id: "palindrome-3",
    name: "Palindrome 3 — SRS RGR …",
    pattern: seq(
      S, R, S,
      R, G, R,
      G, M, G,
      M, P, M,
      P, D, P,
      D, N, D,
      N, hi_S, N,
    ),
  },
  {
    id: "palindrome-5",
    name: "Palindrome 5 — SRGRS RGMGR …",
    pattern: seq(
      S, R, G, R, S,
      R, G, M, G, R,
      G, M, P, M, G,
      M, P, D, P, M,
      P, D, N, D, P,
      D, N, hi_S, N, D,
    ),
  },
  {
    id: "palindrome-7",
    name: "Palindrome 7 — SRGMGRS",
    pattern: seq(
      S, R, G, M, G, R, S,
      R, G, M, P, M, G, R,
      G, M, P, D, P, M, G,
      M, P, D, N, D, P, M,
      P, D, N, hi_S, N, D, P,
    ),
  },
  {
    id: "double-each",
    name: "Doubled swaras — SS RR GG …",
    pattern: seq(
      S, S, R, R, G, G, M, M,
      P, P, D, D, N, N, hi_S, hi_S,
    ),
  },
  {
    id: "skip-thirds",
    name: "Thirds — SG RM GP … (up & down)",
    pattern: mirror(
      seq(
        S, G,
        R, M,
        G, P,
        M, D,
        P, N,
        D, hi_S,
      ),
    ),
  },
  {
    id: "step-up-down",
    name: "Up-down twos — SR SG SM SP …",
    pattern: seq(
      S, R, S, G, S, M, S, P, S, D, S, N, S, hi_S,
    ),
  },
  {
    id: "mandra-stretch",
    name: "Mandra stretch — ·NSRS, ·D·NSRS …",
    pattern: seq(
      lo_N, S, R, S,
      lo_D, lo_N, S, R, S,
      lo_P, lo_D, lo_N, S, R, S,
    ),
  },
  {
    id: "tara-stretch",
    name: "Tara stretch — DNS' R'S'ND …",
    pattern: seq(
      D, N, hi_S, hi_R, hi_S, N, D,
      P, D, N, hi_S, hi_R, hi_S, N, D, P,
    ),
  },
  {
    id: "full-aroh-avaroh-tara",
    name: "Full ascend + tara peak + descend",
    pattern: seq(
      S, R, G, M, P, D, N,
      hi_S, hi_R, hi_G,
      hi_R, hi_S,
      N, D, P, M, G, R, S,
    ),
  },
  {
    id: "wave-2-up",
    name: "Wave — SRSRGRGMG…",
    pattern: seq(
      S, R, S, R, G, R, G, M, G, M, P, M,
      P, D, P, D, N, D, N, hi_S, N, hi_S,
    ),
  },
  {
    id: "zigzag",
    name: "Zigzag — SRG RSR GMP MGM …",
    pattern: seq(
      S, R, G, R, S, R,
      G, M, P, M, G, M,
      P, D, N, D, P, D,
      N, hi_S, hi_R, hi_S, N, hi_S,
    ),
  },
  {
    id: "drop-fourth",
    name: "Drop-fourth — SRGM SGRM …",
    pattern: seq(
      S, R, G, M,
      R, G, M, P,
      G, M, P, D,
      M, P, D, N,
      P, D, N, hi_S,
      D, N, hi_S, hi_R,
    ),
  },
  {
    id: "echo-pairs",
    name: "Echo pairs — SR RS, RG GR, …",
    pattern: seq(
      S, R, R, S,
      R, G, G, R,
      G, M, M, G,
      M, P, P, M,
      P, D, D, P,
      D, N, N, D,
      N, hi_S, hi_S, N,
    ),
  },
  {
    id: "pakad",
    name: "Pakad-style — SRG SRGM … (up & down)",
    pattern: seq(
      // ascending build-up to the peak
      S, R, G,
      S, R, G, M,
      S, R, G, M, P,
      S, R, G, M, P, D,
      S, R, G, M, P, D, N,
      S, R, G, M, P, D, N, hi_S,
      // descending wind-down (peak sounds again to start the descent)
      hi_S, N, D,
      hi_S, N, D, P,
      hi_S, N, D, P, M,
      hi_S, N, D, P, M, G,
      hi_S, N, D, P, M, G, R,
      hi_S, N, D, P, M, G, R, S,
    ),
  },
  {
    id: "alternating",
    name: "Alternating triplets — SRG GRS RGM MGR …",
    pattern: seq(
      S, R, G, G, R, S,
      R, G, M, M, G, R,
      G, M, P, P, M, G,
      M, P, D, D, P, M,
      P, D, N, N, D, P,
      D, N, hi_S, hi_S, N, D,
    ),
  },
];

export function semitonesFor(note: SwaraNote, thaat: Thaat): number {
  return thaat.offsets[note.idx] + 12 * note.octave;
}

export function saSemitoneFromLabel(label: SaLabel): number {
  const i = SA_PITCHES.indexOf(label);
  return i < 0 ? 0 : i;
}

export function noteHz(saHz: number, semitones: number): number {
  return saHz * Math.pow(2, semitones / 12);
}

export function saHzFromLabel(label: SaLabel): number {
  return SA_BASE_HZ * Math.pow(2, saSemitoneFromLabel(label) / 12);
}

export function renderSwaraLabel(note: SwaraNote, thaat: Thaat): string {
  const base = thaat.labels[note.idx];
  if (note.octave === -1) return `·${base}`;
  if (note.octave === 1) return `${base}'`;
  return base;
}
