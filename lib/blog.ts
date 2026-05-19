export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  readingTime: string;
  tag: string;
  coverEmoji: string;
};

// Static list — add a slug here whenever a new content/blog/*.mdx file is created.
// fs.readdir is not available in the Cloudflare Workers edge runtime.
const POST_SLUGS = [
  "understanding-ragas-on-the-bansuri",
  "choosing-your-first-bansuri",
  "breath-control-and-tone-production",
  "care-and-seasoning-of-bamboo-flutes",
] as const;

export async function getAllPostSlugs(): Promise<string[]> {
  return [...POST_SLUGS];
}

export async function getPostMeta(slug: string): Promise<BlogPostMeta> {
  const mod = await import(`@/content/blog/${slug}.mdx`);
  return { slug, ...(mod.metadata as Omit<BlogPostMeta, "slug">) };
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const slugs = await getAllPostSlugs();
  const posts = await Promise.all(slugs.map(getPostMeta));
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
