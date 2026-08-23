// Minimal typings + a singleton loader for the YouTube IFrame Player API.
// We type only the slice of the API the looper uses instead of pulling in
// @types/youtube.

export const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getPlaybackRate(): number;
  setPlaybackRate(rate: number): void;
  loadVideoById(opts: { videoId: string; startSeconds?: number }): void;
  cueVideoById(opts: { videoId: string; startSeconds?: number }): void;
  getVideoData(): { video_id: string; title: string; author: string };
  destroy(): void;
};

type PlayerEvent = { target: YTPlayer; data: number };

export type YTPlayerOptions = {
  host?: string;
  videoId?: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (e: PlayerEvent) => void;
    onStateChange?: (e: PlayerEvent) => void;
    onError?: (e: PlayerEvent) => void;
  };
};

type YTNamespace = {
  Player: new (el: HTMLElement | string, opts: YTPlayerOptions) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const SCRIPT_ID = "youtube-iframe-api";
let apiPromise: Promise<YTNamespace> | null = null;

/**
 * Injects https://www.youtube.com/iframe_api once and resolves when the global
 * `YT` namespace is ready. Safe to call from several components — they all
 * share the same promise.
 */
export function loadYouTubeIframeApi(): Promise<YTNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube player is browser-only"));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    // The API calls this global exactly once when it finishes booting.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube player failed to initialise"));
    };

    if (document.getElementById(SCRIPT_ID)) return; // already in flight

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      script.remove();
      reject(new Error("Could not load the YouTube player"));
    };
    document.head.appendChild(script);
  });

  return apiPromise;
}
