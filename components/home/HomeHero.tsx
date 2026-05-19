"use client";

import { useState, Suspense } from "react";
import PracticeStopwatch from "@/components/home/PracticeStopwatch";
import MiniMetronome from "@/components/home/MiniMetronome";
import MiniTaanpura from "@/components/home/MiniTaanpura";
import MiniPitchDetector from "@/components/home/MiniPitchDetector";
import MiniAlankarPractice from "@/components/home/MiniAlankarPractice";
import { ScaleNudgeCard } from "@/components/home/ScaleNudgeCard";

export function HomeHero() {
  const [selectedScale, setSelectedScale] = useState<string>("C");

  return (
    <section className="relative bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-10">
        {/* Header section with scale selector on left and shop card on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-10">
          {/* Left — Header text + scale selector */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-amber-400 font-medium tracking-wider text-sm uppercase">
                Your daily riyaaz
              </p>
              <select
                value={selectedScale}
                onChange={(e) => setSelectedScale(e.target.value)}
                className="bg-amber-600/20 border border-amber-500/30 text-white text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
              >
                {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
                  (scale) => (
                    <option key={scale} value={scale} className="bg-stone-900">
                      {scale} Scale
                    </option>
                  )
                )}
              </select>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Practice makes <span className="text-amber-400">perfect.</span>
            </h1>
          </div>

          {/* Right — Shop nudge card */}
          <Suspense fallback={<div className="h-24 bg-white/5 rounded animate-pulse" />}>
            <ScaleNudgeCard selectedScale={selectedScale} onScaleChange={setSelectedScale} />
          </Suspense>
        </div>

        {/* Tools section — unchanged 3 column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start  mx-auto">
          {/* Left — Alankar Practice + Metronome */}
          <div className="flex flex-col gap-4 order-2 lg:order-1">
            <MiniPitchDetector />

            <MiniTaanpura selectedScale={selectedScale} />

            {/* Live Classes Contact Card */}
            <a
              href="https://wa.me/912027308131"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all hover:bg-white/10 active:scale-95"
            >
              <div>
                <p className="text-white font-bold text-sm leading-tight">Live Classes</p>
                <p className="text-white/70 text-xs">Contact Us</p>
              </div>
              <img src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5 flex-shrink-0" />
            </a>
          </div>

          {/* Center — Practice card */}
          <div className="flex justify-center order-1 lg:order-2">
            <PracticeStopwatch />
          </div>

          {/* Right — Pitch Detector + Taanpura */}
          <div className="flex flex-col gap-4 order-3">
            
            <MiniMetronome />
            
            <MiniAlankarPractice selectedScale={selectedScale} />
          </div>
        </div>
      </div>
    </section>
  );
}
