import fs from "node:fs/promises";
import path from "node:path";

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

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export async function getAllPostSlugs(): Promise<string[]> {
  const files = await fs.readdir(BLOG_DIR);
  return files
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
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
