import fs from "node:fs/promises";
import path from "node:path";

export type CourseType =
  | "free-youtube"
  | "members-youtube"
  | "paid-external";

export type CourseMeta = {
  slug: string;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  language: string;
  instructor: string;
  duration: string;
  date: string;
  tag: string;
  coverEmoji: string;
  coverImage?: string;
  type: CourseType;
  playlistId?: string;
  firstVideoId?: string;
  externalUrl?: string;
  price?: string;
};

const COURSES_DIR = path.join(process.cwd(), "content", "courses");

export async function getAllCourseSlugs(): Promise<string[]> {
  const files = await fs.readdir(COURSES_DIR);
  return files
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export async function getCourseMeta(slug: string): Promise<CourseMeta> {
  const mod = await import(`@/content/courses/${slug}.mdx`);
  return { slug, ...(mod.metadata as Omit<CourseMeta, "slug">) };
}

export async function getAllCourses(): Promise<CourseMeta[]> {
  const slugs = await getAllCourseSlugs();
  const courses = await Promise.all(slugs.map(getCourseMeta));
  return courses.sort((a, b) => (a.date < b.date ? 1 : -1));
}
