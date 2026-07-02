import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllCourseSlugs,
  getAllCourses,
  type CourseMeta,
} from "@/lib/courses";
import YouTubePlaylistEmbed from "@/components/courses/YouTubePlaylistEmbed";

type Params = { slug: string };

export async function generateStaticParams() {
  const slugs = await getAllCourseSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const mod = await import(`@/content/courses/${slug}.mdx`);
    const { title, description } = mod.metadata;
    return {
      title,
      description,
      alternates: {
        canonical: `/courses/${slug}`,
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: `/courses/${slug}`,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return { title: "Course not found" };
  }
}

function FreeBadge() {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-400/30">
      Free
    </span>
  );
}

function PaidBadge({ price }: { price?: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-semibold uppercase tracking-wider border border-amber-400/30">
      {price ? `Paid · ${price}` : "Paid"}
    </span>
  );
}

function MembersBadge() {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold uppercase tracking-wider border border-amber-400/30">
      Members Only
    </span>
  );
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  let Course: React.ComponentType;
  let meta: CourseMeta;
  try {
    const mod = await import(`@/content/courses/${slug}.mdx`);
    Course = mod.default;
    meta = { slug, ...mod.metadata };
  } catch {
    notFound();
  }

  const all = await getAllCourses();
  const related = all.filter((c) => c.slug !== slug).slice(0, 2);

  return (
    <article>
      <header className="bg-gradient-to-b from-stone-950 via-stone-900 to-stone-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <Link
            href="/courses"
            className="inline-flex items-center text-amber-400 text-sm font-medium hover:text-amber-300 mb-6"
          >
            ← All courses
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {meta.type === "free-youtube" && <FreeBadge />}
            {meta.type === "members-youtube" && <MembersBadge />}
            {meta.type === "paid-external" && (
              <PaidBadge price={meta.price} />
            )}
            <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              {meta.tag}
            </span>
            <span className="w-1 h-1 rounded-full bg-amber-500" />
            <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              {meta.level}
            </span>
            <span className="w-1 h-1 rounded-full bg-amber-500" />
            <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              {meta.duration}
            </span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-black leading-tight mb-5">
            {meta.title}
          </h1>
          <p className="text-stone-300 text-lg leading-relaxed mb-6">
            {meta.description}
          </p>
          <div className="flex items-center gap-3 text-sm text-stone-400">
            <span>Taught by {meta.instructor}</span>
            <span className="w-1 h-1 rounded-full bg-stone-500" />
            <span>{meta.language}</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {meta.type === "free-youtube" && meta.playlistId && (
          <div className="mb-12">
            <YouTubePlaylistEmbed
              playlistId={meta.playlistId}
              title={meta.title}
            />
            <p className="text-xs text-stone-500 mt-3 text-center">
              Lessons stream from YouTube. No account required.
            </p>
          </div>
        )}

        <Course />

        {meta.type === "members-youtube" && meta.playlistId && (
          <aside className="mt-12 rounded-3xl border border-stone-200 bg-stone-50 p-8 lg:p-10">
            <p className="text-xs text-stone-600 font-semibold uppercase tracking-wider mb-2">
              Watch on YouTube
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-stone-900 mb-3">
              Members-only playlist
            </h2>
            <p className="text-stone-700 leading-relaxed mb-6">
              This playlist is available to YouTube channel members. Become a
              member of {meta.instructor}'s channel to unlock all videos in
              this series.
            </p>
            <a
              href={`https://www.youtube.com/playlist?list=${meta.playlistId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-stone-900 text-white font-semibold rounded-xl hover:bg-stone-800 transition-colors"
            >
              Watch on YouTube →
            </a>
            <p className="text-xs text-stone-500 mt-4">
              You'll be redirected to YouTube. Channel membership is managed
              there.
            </p>
          </aside>
        )}

        {meta.type === "paid-external" && meta.externalUrl && (
          <aside className="mt-12 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-8 lg:p-10">
            <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider mb-2">
              Enroll
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-stone-900 mb-3">
              Ready to begin?
            </h2>
            <p className="text-stone-700 leading-relaxed mb-6">
              {meta.price ? (
                <>
                  Full course access for{" "}
                  <span className="font-bold">{meta.price}</span> — lifetime,
                  taught by {meta.instructor}.
                </>
              ) : (
                <>
                  Full course access — lifetime, taught by {meta.instructor}.
                </>
              )}
            </p>
            <a
              href={meta.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors"
            >
              Enroll on courses.store →
            </a>
            <p className="text-xs text-stone-500 mt-4">
              You'll be redirected to our partner platform to complete
              enrollment.
            </p>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section className="bg-stone-50 border-t border-stone-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-bold text-stone-900 mb-8">
              More courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {related.map((course) => (
                <Link
                  key={course.slug}
                  href={`/courses/${course.slug}`}
                  className="group block rounded-2xl overflow-hidden bg-white border border-stone-200 hover:border-amber-300 hover:shadow-lg transition-all"
                >
                  <div className="bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center py-10">
                    <span className="text-5xl">{course.coverEmoji}</span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                          course.type === "free-youtube"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : course.type === "members-youtube"
                              ? "bg-stone-900 text-amber-300 border-stone-900"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {course.type === "free-youtube"
                          ? "Free"
                          : course.type === "members-youtube"
                            ? "Members"
                            : "Paid"}
                      </span>
                      <span className="text-xs text-amber-700 font-semibold uppercase tracking-wider">
                        {course.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-700 transition-colors leading-tight mb-2">
                      {course.title}
                    </h3>
                    <p className="text-stone-600 text-sm leading-relaxed line-clamp-2">
                      {course.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
