import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Bansuri articles, technique & tradition",
  description:
    "Articles on the Indian bamboo flute — choosing your first bansuri, care and seasoning, ragas, breath technique, and the living tradition of Hindustani music.",
  alternates: {
    canonical: "/blog",
  },
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();
  const [featured, ...rest] = posts;

  return (
    <>
      <section className="bg-gradient-to-b from-stone-950 via-stone-900 to-stone-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <p className="text-amber-400 font-medium tracking-wider text-sm uppercase mb-3">
            The Maa Flutes Journal
          </p>
          <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-4">
            On bansuri, <span className="text-amber-400">tradition</span>, and
            the art of listening.
          </h1>
          <p className="text-stone-300 text-lg max-w-2xl">
            Articles for students and enthusiasts of the Indian bamboo flute —
            written with care, free to read.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group block mb-16 rounded-3xl overflow-hidden bg-amber-50 border border-amber-100 hover:border-amber-300 transition-colors"
          >
            <div className="grid md:grid-cols-5">
              <div className="md:col-span-2 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center py-14 md:py-0">
                <span className="text-8xl">{featured.coverEmoji}</span>
              </div>
              <div className="md:col-span-3 p-8 lg:p-10">
                <div className="flex items-center gap-3 text-xs text-amber-700 font-semibold uppercase tracking-wider mb-3">
                  <span>Featured</span>
                  <span className="w-1 h-1 rounded-full bg-amber-500" />
                  <span>{featured.tag}</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-stone-900 group-hover:text-amber-700 transition-colors leading-tight mb-3">
                  {featured.title}
                </h2>
                <p className="text-stone-600 leading-relaxed mb-5">
                  {featured.description}
                </p>
                <div className="flex items-center gap-3 text-sm text-stone-500">
                  <span>{formatDate(featured.date)}</span>
                  <span className="w-1 h-1 rounded-full bg-stone-400" />
                  <span>{featured.readingTime}</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl overflow-hidden border border-stone-200 hover:border-amber-300 hover:shadow-lg transition-all"
            >
              <div className="bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center py-12">
                <span className="text-6xl">{post.coverEmoji}</span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-amber-700 font-semibold uppercase tracking-wider mb-3">
                  <span>{post.tag}</span>
                </div>
                <h3 className="text-xl font-bold text-stone-900 group-hover:text-amber-700 transition-colors leading-tight mb-2">
                  {post.title}
                </h3>
                <p className="text-stone-600 text-sm leading-relaxed mb-4 line-clamp-3">
                  {post.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span>{formatDate(post.date)}</span>
                  <span className="w-1 h-1 rounded-full bg-stone-400" />
                  <span>{post.readingTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
