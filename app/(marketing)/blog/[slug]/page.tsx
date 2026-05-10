import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPostSlugs, getAllPosts, formatDate } from "@/lib/blog";

type Params = { slug: string };

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
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
    const mod = await import(`@/content/blog/${slug}.mdx`);
    return {
      title: mod.metadata.title,
      description: mod.metadata.description,
    };
  } catch {
    return { title: "Post not found" };
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  let Post: React.ComponentType;
  let meta: Awaited<ReturnType<typeof import("@/lib/blog").getPostMeta>>;
  try {
    const mod = await import(`@/content/blog/${slug}.mdx`);
    Post = mod.default;
    meta = { slug, ...mod.metadata };
  } catch {
    notFound();
  }

  const all = await getAllPosts();
  const related = all.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <article>
      <header className="bg-gradient-to-b from-stone-950 via-stone-900 to-stone-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <Link
            href="/blog"
            className="inline-flex items-center text-amber-400 text-sm font-medium hover:text-amber-300 mb-6"
          >
            ← All articles
          </Link>
          <div className="flex items-center gap-3 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-4">
            <span>{meta.tag}</span>
            <span className="w-1 h-1 rounded-full bg-amber-500" />
            <span>{meta.readingTime}</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-black leading-tight mb-5">
            {meta.title}
          </h1>
          <p className="text-stone-300 text-lg leading-relaxed mb-6">
            {meta.description}
          </p>
          <div className="flex items-center gap-3 text-sm text-stone-400">
            <span>{meta.author}</span>
            <span className="w-1 h-1 rounded-full bg-stone-500" />
            <span>{formatDate(meta.date)}</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <Post />
      </div>

      {related.length > 0 && (
        <section className="bg-stone-50 border-t border-stone-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-bold text-stone-900 mb-8">
              Keep reading
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {related.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block rounded-2xl overflow-hidden bg-white border border-stone-200 hover:border-amber-300 hover:shadow-lg transition-all"
                >
                  <div className="bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center py-10">
                    <span className="text-5xl">{post.coverEmoji}</span>
                  </div>
                  <div className="p-6">
                    <div className="text-xs text-amber-700 font-semibold uppercase tracking-wider mb-2">
                      {post.tag}
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-700 transition-colors leading-tight mb-2">
                      {post.title}
                    </h3>
                    <p className="text-stone-600 text-sm leading-relaxed line-clamp-2">
                      {post.description}
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
