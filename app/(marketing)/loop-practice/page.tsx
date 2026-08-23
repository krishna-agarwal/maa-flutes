import type { Metadata } from "next";
import YouTubeLooper from "@/components/tools/YouTubeLooper";

export const metadata: Metadata = {
  title: "YouTube Loop Practice — Repeat Any Section of a Video",
  description:
    "Free practice looper for musicians. Paste any YouTube link, set a start and end point, slow it down, and repeat that phrase until you have it. Save your loops for tomorrow's riyaaz.",
  alternates: {
    canonical: "/loop-practice",
  },
};

const steps = [
  {
    title: "Paste a link",
    body: "Any YouTube URL works — a lesson, a concert recording, or a film song you're learning by ear.",
  },
  {
    title: "Mark A and B",
    body: "Play up to the phrase you want, hit “Set here” for the start, then again for the end. Nudge either point a second at a time.",
  },
  {
    title: "Slow it down",
    body: "Drop to 0.5× or 0.25× to catch the ornaments, then work the speed back up to full tempo.",
  },
  {
    title: "Save it",
    body: "Name the loop and save it. Sign in and your loops follow you to every device.",
  },
];

export default function LoopPracticePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-4 flex flex-wrap  items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-amber-600">
            Practice tool
          </p>
          <h1 className="text-2xl font-black leading-tight text-stone-900 sm:text-3xl">
            Loop any part of a{" "}
            <span className="text-amber-600">YouTube video</span>
          </h1>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-stone-600">
          Mark a start and end point, slow it down, and let the phrase repeat
          while you play along.
        </p>
      </header>

      <YouTubeLooper />

      <section className="mt-10 border-t border-stone-200 pt-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-stone-500">
          How to use it
        </h2>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-2.5">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  {step.title}
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
