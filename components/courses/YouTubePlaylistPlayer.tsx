"use client";

import { useState, useRef } from "react";
import type { YouTubeVideo } from "@/lib/youtube";

type Props = {
  videos: YouTubeVideo[];
  defaultVideoId?: string;
  title: string;
};

export default function YouTubePlaylistPlayer({ videos, defaultVideoId, title }: Props) {
  const firstId = defaultVideoId ?? videos[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(firstId);
  const [autoplay, setAutoplay] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const selectedVideo = videos.find((v) => v.id === selectedId);
  const iframeSrc = `https://www.youtube-nocookie.com/embed/${selectedId}${autoplay ? "?autoplay=1" : ""}`;

  function selectVideo(id: string) {
    setSelectedId(id);
    setAutoplay(true);
  }

  function scroll(dir: "left" | "right") {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -el.clientWidth * 0.65 : el.clientWidth * 0.65, behavior: "smooth" });
  }

  return (
    <div className="w-full min-w-0">
      {/* Main player */}
      <div className="aspect-video w-full rounded-2xl overflow-hidden border border-stone-200 bg-stone-950 shadow-sm">
        {selectedId && (
          <iframe
            key={selectedId}
            src={iframeSrc}
            title={selectedVideo?.title ?? title}
            aria-label={selectedVideo?.title ?? title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        )}
      </div>

      {/* Carousel */}
      {videos.length > 1 && (
        <div className="mt-4 min-w-0">
          {/* Header: count + nav buttons */}
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="text-xs text-stone-500 font-medium truncate">
              {videos.length} videos in playlist
            </p>
            <div className="flex gap-1 flex-none">
              <button
                onClick={() => scroll("left")}
                aria-label="Scroll left"
                className="w-7 h-7 rounded-full border border-stone-200 bg-white shadow-sm flex items-center justify-center hover:bg-stone-50 hover:border-stone-300 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 text-stone-600">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => scroll("right")}
                aria-label="Scroll right"
                className="w-7 h-7 rounded-full border border-stone-200 bg-white shadow-sm flex items-center justify-center hover:bg-stone-50 hover:border-stone-300 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 text-stone-600">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable strip */}
          <div
            ref={carouselRef}
            className="flex gap-2.5 overflow-x-auto scroll-smooth"
            style={{ scrollbarWidth: "none" }}
          >
            {videos.map((video, index) => {
              const isSelected = video.id === selectedId;
              return (
                <button
                  key={video.id}
                  onClick={() => selectVideo(video.id)}
                  className={`group flex-none w-[136px] rounded-xl overflow-hidden border-2 transition-all text-left ${
                    isSelected
                      ? "border-amber-400 ring-2 ring-amber-200 shadow-md"
                      : "border-stone-200 hover:border-amber-300 hover:shadow-sm"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full aspect-video object-cover block"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isSelected ? (
                        <span className="bg-amber-400 rounded-full w-7 h-7 flex items-center justify-center shadow">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-stone-900 ml-0.5">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="bg-black/50 rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white ml-0.5">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      {index + 1}
                    </span>
                  </div>
                  <div className="px-2.5 py-2 bg-white">
                    <p className="text-[11px] font-medium text-stone-700 line-clamp-2 leading-snug">
                      {video.title}
                    </p>
                  </div>
                </button>
              );
            })}
            {/* trailing spacer so last item isn't flush */}
            <div className="flex-none w-1" aria-hidden />
          </div>
        </div>
      )}
    </div>
  );
}
