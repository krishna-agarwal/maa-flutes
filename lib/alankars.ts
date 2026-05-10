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
    id: "aroh",
    name: "Aroh (ascend)",
    pattern: seq(S, R, G, M, P, D, N, hi_S),
  },
  {
    id: "avaroh",
    name: "Avaroh (descend)",
    pattern: seq(hi_S, N, D, P, M, G, R, S),
  },
  {
    id: "aroh-avaroh",
    name: "Aroh + Avaroh",
    pattern: seq(S, R, G, M, P, D, N, hi_S, N, D, P, M, G, R, S),
  },
  {
    id: "pairs-up",
    name: "Pairs ascending — SR RG GM …",
    pattern: seq(S, R, R, G, G, M, M, P, P, D, D, N, N, hi_S),
  },
  {
    id: "pairs-down",
    name: "Pairs descending — S'N ND DP …",
    pattern: seq(hi_S, N, N, D, D, P, P, M, M, G, G, R, R, S),
  },
  {
    id: "triplets-up",
    name: "Triplets ascending — SRG RGM …",
    pattern: seq(
      S, R, G,
      R, G, M,
      G, M, P,
      M, P, D,
      P, D, N,
      D, N, hi_S,
    ),
  },
  {
    id: "triplets-down",
    name: "Triplets descending — S'ND NDP …",
    pattern: seq(
      hi_S, N, D,
      N, D, P,
      D, P, M,
      P, M, G,
      M, G, R,
      G, R, S,
    ),
  },
  {
    id: "fours-up",
    name: "Four-note ascending — SRGM RGMP …",
    pattern: seq(
      S, R, G, M,
      R, G, M, P,
      G, M, P, D,
      M, P, D, N,
      P, D, N, hi_S,
    ),
  },
  {
    id: "fours-down",
    name: "Four-note descending — S'NDP NDPM …",
    pattern: seq(
      hi_S, N, D, P,
      N, D, P, M,
      D, P, M, G,
      P, M, G, R,
      M, G, R, S,
    ),
  },
  {
    id: "fives-up",
    name: "Five-note ascending — SRGMP RGMPD …",
    pattern: seq(
      S, R, G, M, P,
      R, G, M, P, D,
      G, M, P, D, N,
      M, P, D, N, hi_S,
    ),
  },
  {
    id: "fives-down",
    name: "Five-note descending",
    pattern: seq(
      hi_S, N, D, P, M,
      N, D, P, M, G,
      D, P, M, G, R,
      P, M, G, R, S,
    ),
  },
  {
    id: "sixes-up",
    name: "Six-note ascending",
    pattern: seq(
      S, R, G, M, P, D,
      R, G, M, P, D, N,
      G, M, P, D, N, hi_S,
    ),
  },
  {
    id: "sevens-up",
    name: "Seven-note ascending",
    pattern: seq(
      S, R, G, M, P, D, N,
      R, G, M, P, D, N, hi_S,
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
    id: "skip-thirds-up",
    name: "Thirds ascending — SG RM GP …",
    pattern: seq(
      S, G,
      R, M,
      G, P,
      M, D,
      P, N,
      D, hi_S,
    ),
  },
  {
    id: "skip-thirds-down",
    name: "Thirds descending — S'D NP DM …",
    pattern: seq(
      hi_S, D,
      N, P,
      D, M,
      P, G,
      M, R,
      G, S,
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
    id: "pakad-asc",
    name: "Pakad-style asc — SRG SRGM SRGMP",
    pattern: seq(
      S, R, G,
      S, R, G, M,
      S, R, G, M, P,
      S, R, G, M, P, D,
      S, R, G, M, P, D, N,
      S, R, G, M, P, D, N, hi_S,
    ),
  },
  {
    id: "pakad-desc",
    name: "Pakad-style desc — S'ND, S'NDP, …",
    pattern: seq(
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
