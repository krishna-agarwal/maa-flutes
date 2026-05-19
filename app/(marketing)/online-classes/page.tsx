import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Online Flute Classes — Learn Bansuri Step by Step",
  description:
    "Join our structured online flute courses. Daily riyaz, certificate programs, and step-by-step learning from beginner to advanced level.",
};

export default function OnlineClassesPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-stone-950 via-stone-900 to-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-emerald-400 font-medium tracking-wider text-sm uppercase mb-3">
              🔴 Online Live Classes
            </p>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
              Learn Bansuri <span className="text-emerald-400">Live with Amit</span>
            </h1>
            <p className="text-stone-300 text-lg mb-3">
              Interactive live classes with personalized guidance from Amit Bahukhandi. Structured curriculum with daily live practice sessions included.
            </p>
            <p className="text-stone-400 text-sm mb-8">
              <strong>Note:</strong> This is our live class program - separate from recorded courses. Get direct mentorship and real-time feedback.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/919027308131"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
              >
                <img src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5" />
                Contact Us on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: "📅",
              title: "Live Classes",
              subtitle: "Interactive",
              desc: "Live sessions with Amit + 1 daily practice",
            },
            {
              icon: "🎓",
              title: "Certificate Program",
              subtitle: "For Each Level",
              desc: "Recognized certification upon completion",
            },
            {
              icon: "👨‍🏫",
              title: "Step by Step",
              subtitle: "Learning",
              desc: "From beginner to advanced level",
            },
            {
              icon: "🌍",
              title: "100% Online",
              subtitle: "Classes",
              desc: "Learn from anywhere in the world",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-stone-200 hover:border-amber-300 hover:shadow-lg transition-all"
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-1">
                {feature.subtitle}
              </h3>
              <h4 className="text-xl font-bold text-stone-900 mb-2">
                {feature.title}
              </h4>
              <p className="text-stone-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Level Structured Course */}
      <section className="bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-4">
              3 Level Structured Course
            </h2>
            <p className="text-stone-600 text-lg max-w-2xl mx-auto">
              A comprehensive curriculum designed to take you from complete beginner to performing artist
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                level: "LEVEL 1",
                title: "Foundation Batch",
                duration: "Duration: 4 Months",
                fees: "Fees: ₹5500/- (One Time Payment)",
                highlights: [
                  "Basic Aakar with Sud",
                  "Alankaar (Sa-Re-Ga-Ma)",
                  "Teevra Raag with Pitch Correction",
                  "Taan Basics",
                  "Introduction to Raag Yaman, Bhairav",
                  "Bandish Basics",
                ],
                outcomes: [
                  "Complete Foundation Batch",
                  "Get Certification",
                  "Play Basic Raags",
                  "Write Notation",
                ],
              },
              {
                level: "LEVEL 2",
                title: "Development Batch",
                duration: "Duration: 6 Months",
                fees: "Fees: ₹4000/- + ₹4000/- (Two Time Payment)",
                highlights: [
                  "Advanced Aakar",
                  "Rag Progression Techniques",
                  "Introduction to Thaad, Markhana",
                  "Raag Techniques Deep Dive",
                  "Bandish Progression",
                  "Bandish Baans",
                ],
                outcomes: [
                  "Smooth Rag Progression",
                  "Raag Technique Clarity",
                  "Confidence in Raag",
                  "Performance Readiness",
                ],
              },
              {
                level: "LEVEL 3",
                title: "Performance & Artist Training",
                duration: "Duration: Unlimited",
                fees: "Fees: ₹1500 / Per Month",
                highlights: [
                  "Stage Performance Techniques",
                  "Raag Performance Styles",
                  "Advanced Bandish Development",
                  "Advanced Raadhain",
                  "Riyaz Coaching",
                  "Performance Confidence Building",
                ],
                outcomes: [
                  "Confident Performance",
                  "Raag Mastery",
                  "Raag Interpretation Skills",
                  "Artist Development",
                ],
              },
            ].map((course, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 border border-stone-200 hover:border-amber-300 hover:shadow-lg transition-all"
              >
                <p className="text-amber-700 font-semibold text-xs uppercase tracking-wider mb-2">
                  {course.level}
                </p>
                <h3 className="text-2xl font-bold text-stone-900 mb-2">
                  {course.title}
                </h3>
                <p className="text-stone-600 text-sm mb-1">{course.duration}</p>
                <p className="text-amber-600 font-semibold mb-5">{course.fees}</p>

                <div className="mb-6">
                  <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-3">
                    Course Highlights
                  </p>
                  <ul className="space-y-2">
                    {course.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                        <span className="text-amber-500 mt-1">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-3">
                    Outcomes
                  </p>
                  <ul className="space-y-2">
                    {course.outcomes.map((outcome, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                        <span className="text-emerald-500 mt-1">✓</span>
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Details */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          {[
            {
              icon: "❓",
              title: "Why Night Riyaz",
              points: [
                "Consistency brings perfection",
                "Night time is best for raag study",
                "Guru's guidance builds confidence",
                "Buyer with Guru's guidance grows",
              ],
            },
            {
              icon: "👥",
              title: "Who Can Join",
              points: [
                "Beginners (age 12+)",
                "No prior experience needed",
                "Learn at your own pace",
                "Flexible schedule options",
              ],
            },
            {
              icon: "🎯",
              title: "Course Features",
              points: [
                "Live Classes + 1 Daily Practice Session",
                "Personal Guidance from Amit",
                "Certificate upon completion",
                "Lifetime access to materials",
              ],
            },
            {
              icon: "🏆",
              title: "Certificate",
              points: [
                "Recognized certification",
                "After completion of each level",
                "Showcase your achievement",
                "Career advancement opportunity",
              ],
            },
          ].map((section, idx) => (
            <div key={idx} className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-2xl p-6 border border-stone-200">
              <div className="text-3xl mb-3">{section.icon}</div>
              <h3 className="text-lg font-bold text-stone-900 mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.points.map((point, i) => (
                  <li key={i} className="text-sm text-stone-600 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>


    </>
  );
}
