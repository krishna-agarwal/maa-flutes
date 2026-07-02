import type { Metadata } from "next";
import Link from "next/link";
import { HomeHero } from "@/components/home/HomeHero";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Maa Flutes",
  description:
    "Handcrafted Indian classical flutes, music tools, and courses for every level of player.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://maaflutes.com",
  logo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://maaflutes.com"}/logo.png`,
  sameAs: [],
  offers: {
    "@type": "AggregateOffer",
    itemCondition: "https://schema.org/NewCondition",
    availability: "https://schema.org/InStock",
    priceCurrency: "INR",
  },
};

export const metadata: Metadata = {
  title: "Maa Flutes — Handcrafted Indian Classical Flutes",
  description:
    "Explore our handcrafted bansuri flutes, practice with free music tools, and deepen your journey in Indian classical music.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeHero />

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
