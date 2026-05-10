import type { Metadata } from "next";
import Link from "next/link";
import PracticeStopwatch from "@/components/home/PracticeStopwatch";
import MiniMetronome from "@/components/home/MiniMetronome";
import MiniTaanpura from "@/components/home/MiniTaanpura";
import MiniPitchDetector from "@/components/home/MiniPitchDetector";
import MiniAlankarPractice from "@/components/home/MiniAlankarPractice";

export const metadata: Metadata = {
  title: "Maa Flutes — Handcrafted Indian Classical Flutes",
  description:
    "Explore our handcrafted bansuri flutes, practice with free music tools, and deepen your journey in Indian classical music.",
};

export default function HomePage() {
  return (
    <>
      {/* Hero — Practice Zone */}
      <section className="relative bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-10">
          {/* Header text */}
          <div className="text-center mb-10">
            <p className="text-amber-400 font-medium tracking-wider text-sm uppercase mb-3">
              Your daily riyaaz
            </p>
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Practice makes <span className="text-amber-400">perfect.</span>
            </h1>
          </div>

          {/* Tuner left · Practice center · Tools right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-6xl mx-auto">
            {/* Left — Tuner + Alankar Practice */}
            <div className="flex flex-col gap-4">
              
              <MiniAlankarPractice />
              <MiniMetronome />
            </div>

            {/* Center — Practice card */}
            <div className="flex justify-center">
              <PracticeStopwatch />
            </div>

            {/* Right — Metronome + Taanpura */}
            <div className="flex flex-col gap-4">
              <MiniPitchDetector />
              
              <MiniTaanpura />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              icon: "🪈",
              title: "Handcrafted Flutes",
              desc: "Each bansuri is carefully crafted and tuned by hand. Browse our collection of concert and practice grade flutes.",
              href: "/shop",
              cta: "Shop now",
            },
            {
              icon: "🎓",
              title: "Learn from a Master",
              desc: "Free YouTube lessons and a complete paid course with Amit. Beginner to advanced, taught in Hindi.",
              href: "/courses",
              cta: "Browse courses",
            },
            {
              icon: "📖",
              title: "Articles & Tradition",
              desc: "Articles on ragas, technique, and the history of the bansuri. Written for students and enthusiasts alike.",
              href: "/blog",
              cta: "Read the blog",
            },
          ].map((feature) => (
            <div key={feature.href} className="group">
              <div className="text-5xl mb-5">{feature.icon}</div>
              <h2 className="text-2xl font-bold text-stone-900 mb-3">
                {feature.title}
              </h2>
              <p className="text-stone-600 leading-relaxed mb-5">
                {feature.desc}
              </p>
              <Link
                href={feature.href}
                className="inline-flex items-center gap-1 text-amber-600 font-semibold hover:text-amber-700 transition-colors"
              >
                {feature.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-amber-400 font-medium tracking-wider text-sm uppercase mb-3">
              What our players say
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Loved by musicians across India
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "The tonal quality of my Maa Flutes bansuri is outstanding. It has become my go-to flute for concert performances. The intonation across octaves is remarkably consistent.",
                name: "Raghav Sharma",
                detail: "Bansuri student, Delhi",
              },
              {
                quote:
                  "I ordered a practice-grade E bass and was blown away. The bamboo quality and finish are what you'd expect from flutes costing twice as much. Truly handcrafted with care.",
                name: "Meera Iyer",
                detail: "Carnatic flautist, Chennai",
              },
              {
                quote:
                  "The free practice tools on this site changed my riyaaz routine. Having the taanpura, metronome, and timer in one place — no apps, no ads — is a blessing.",
                name: "Aamir Khan",
                detail: "Music teacher, Pune",
              },
            ].map((t) => (
              <blockquote
                key={t.name}
                className="relative bg-stone-900 rounded-2xl p-8 border border-stone-800"
              >
                {/* Decorative quote mark */}
                <span className="absolute -top-4 left-6 text-amber-500/20 text-7xl font-serif leading-none select-none">
                  &ldquo;
                </span>
                <p className="text-stone-300 leading-relaxed mb-6 relative">
                  {t.quote}
                </p>
                <footer className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-sm">
                    {t.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {t.name}
                    </p>
                    <p className="text-stone-500 text-sm">{t.detail}</p>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
