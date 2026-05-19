import type { Metadata } from "next";
import Link from "next/link";
import { getAllCourses, type CourseMeta } from "@/lib/courses";
import { getPlaylistVideos } from "@/lib/youtube";
import YouTubePlaylistPlayer from "@/components/courses/YouTubePlaylistPlayer";

export const metadata: Metadata = {
  title: "Courses — Learn the bansuri at your pace",
  description:
    "Free YouTube lessons and in-depth paid courses on the Indian bamboo flute, taught by Amit in Hindi for students at every level.",
};

function PaidCourseCard({ course }: { course: CourseMeta }) {
  return (
    <article className="rounded-3xl overflow-hidden bg-gradient-to-br from-stone-950 via-stone-900 to-stone-900 text-white shadow-xl border border-stone-800">
      {course.coverImage ? (
        <img
          src={course.coverImage}
          alt={course.title}
          className="w-full aspect-[5/3] object-cover border-b border-stone-800"
        />
      ) : (
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-700/10 flex items-center justify-center py-10 border-b border-stone-800">
          <span className="text-7xl">{course.coverEmoji}</span>
        </div>
      )}
      <div className="p-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-400/30">
            Flagship Course
          </span>
        </div>
        <h3 className="text-xl lg:text-2xl font-bold leading-tight mb-3">
          {course.title}
        </h3>
        <p className="text-stone-400 text-sm leading-relaxed mb-5">
          {course.description}
        </p>

        <ul className="space-y-2.5 mb-6 text-sm text-stone-300">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">✓</span>
            <span>Structured curriculum, beginner to advanced</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">✓</span>
            <span>Lifetime access · self-paced</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">✓</span>
            <span>Downloadable practice material</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">✓</span>
            <span>Taught by {course.instructor} in {course.language}</span>
          </li>
        </ul>

        {course.price && (
          <div className="mb-5 pb-5 border-b border-stone-800">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">
              Lifetime access
            </p>
            <p className="text-3xl font-black text-amber-400">{course.price}</p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {course.externalUrl && (
            <a
              href={course.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-3 bg-amber-500 text-stone-950 font-bold rounded-xl hover:bg-amber-400 transition-colors"
            >
              Enroll on courses.store →
            </a>
          )}
          <Link
            href={`/courses/${course.slug}`}
            className="inline-flex items-center justify-center px-5 py-3 border border-stone-700 text-stone-200 font-semibold rounded-xl hover:bg-stone-800 transition-colors"
          >
            View full curriculum
          </Link>
        </div>
      </div>
    </article>
  );
}

function MembersCourseCard({ course }: { course: CourseMeta }) {
  const youtubeUrl = course.playlistId
    ? `https://www.youtube.com/playlist?list=${course.playlistId}`
    : "#";
  return (
    <article className="rounded-2xl overflow-hidden border border-stone-200 bg-white hover:border-amber-300 hover:shadow-md transition-all">
      <div className="grid sm:grid-cols-[140px_1fr]">
        <div className="bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center py-8 sm:py-0">
          <span className="text-5xl">{course.coverEmoji}</span>
        </div>
        <div className="p-5 lg:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-900 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              Members Only
            </span>
            <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">
              {course.level}
            </span>
          </div>
          <h3 className="text-lg font-bold text-stone-900 leading-tight mb-2">
            {course.title}
          </h3>
          <p className="text-stone-600 text-sm leading-relaxed mb-3 line-clamp-2">
            {course.description}
          </p>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link
              href={`/courses/${course.slug}`}
              className="text-xs font-semibold text-stone-600 hover:text-amber-700"
            >
              Course details →
            </Link>
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              Watch on YouTube →
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

async function FreeCourseBlock({ course }: { course: CourseMeta }) {
  const videos = course.playlistId ? await getPlaylistVideos(course.playlistId) : [];

  return (
    <article>
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider border border-emerald-200">
          Free
        </span>
        <span className="text-xs text-amber-700 font-semibold uppercase tracking-wider">
          {course.tag}
        </span>
        <span className="w-1 h-1 rounded-full bg-stone-300" />
        <span className="text-xs text-stone-500 font-medium">
          {course.level}
        </span>
      </div>
      <h3 className="text-2xl lg:text-3xl font-bold text-stone-900 leading-tight mb-2">
        {course.title}
      </h3>
      <p className="text-stone-600 leading-relaxed mb-5">
        {course.description}
      </p>

      {videos.length > 0 ? (
        <YouTubePlaylistPlayer
          videos={videos}
          defaultVideoId={course.firstVideoId}
          title={course.title}
        />
      ) : course.playlistId ? (
        <div className="aspect-video rounded-2xl overflow-hidden border border-stone-200 bg-stone-950 shadow-sm">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(course.playlistId)}`}
            title={course.title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-3 text-xs text-stone-500">
        <span>Taught by {course.instructor}</span>
        <span className="w-1 h-1 rounded-full bg-stone-300" />
        <span>{course.language}</span>
        <span className="w-1 h-1 rounded-full bg-stone-300" />
        <span>{course.duration}</span>
      </div>
    </article>
  );
}

export default async function CoursesIndexPage() {
  const courses = await getAllCourses();
  const freeCourses = courses.filter((c) => c.type === "free-youtube");
  const membersCourses = courses.filter((c) => c.type === "members-youtube");
  const paidCourses = courses.filter((c) => c.type === "paid-external");

  return (
    <>
      <section className="relative bg-stone-950 text-white overflow-hidden">


        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center py-8 sm:py-10 lg:py-12">
            {/* Text */}
            <div>
              {/* <p className="text-amber-400 font-medium text-xs tracking-widest uppercase mb-2">
                Handcrafted in India
              </p> */}
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Learn the bansuri,{" "}
              <span className="text-amber-400">at your pace.</span>
              </h1>
              <p className="mt-3 text-stone-300 max-w-lg text-sm leading-relaxed">
              Free YouTube lessons and an in-depth paid course with Amit, taught
              in Hindi for students at every level.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-10 lg:gap-12">
          {/* Free playlists — main column */}
          <div className="lg:col-span-2 min-w-0">
            {/* <div className="mb-10">
              <p className="text-emerald-700 font-semibold tracking-wider text-xs uppercase mb-2">
                Watch free now
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-3">
                Free lessons on YouTube
              </h2>
              <p className="text-stone-600 text-lg max-w-xl">
                Watch every lesson directly on this page — no signup, no fees,
                no ads in your way.
              </p>
            </div> */}

            <div className="space-y-16">
              {freeCourses.map((course) => (
                <FreeCourseBlock key={course.slug} course={course} />
              ))}
              {freeCourses.length === 0 && (
                <p className="text-stone-500 italic">
                  Free courses coming soon.
                </p>
              )}
            </div>

            {membersCourses.length > 0 && (
              <div className="mt-20 pt-12 border-t border-stone-200">
                <div className="mb-8">
                  <p className="text-stone-700 font-semibold tracking-wider text-xs uppercase mb-2">
                    For YouTube channel members
                  </p>
                  <h2 className="text-2xl lg:text-3xl font-bold text-stone-900 mb-3">
                    Deeper series, members-only
                  </h2>
                  <p className="text-stone-600 max-w-xl">
                    Extended playlists available to YouTube channel members.
                    Membership supports the channel and unlocks longer-form
                    teaching.
                  </p>
                </div>
                <div className="space-y-4">
                  {membersCourses.map((course) => (
                    <MembersCourseCard key={course.slug} course={course} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Paid course — sticky sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="hidden lg:block">
                <p className="text-amber-700 font-semibold tracking-wider text-xs uppercase mb-2">
                  Go deeper
                </p>
                <h2 className="text-2xl font-bold text-stone-900 mb-2">
                  Paid course
                </h2>
                <p className="text-stone-600 text-sm">
                  When you're ready for a structured, step-by-step path.
                </p>
              </div>

              {paidCourses.map((course) => (
                <PaidCourseCard key={course.slug} course={course} />
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
