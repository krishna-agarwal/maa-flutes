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

// Static list — add a slug here whenever a new content/courses/*.mdx file is created.
// fs.readdir is not available in the Cloudflare Workers edge runtime.
const COURSE_SLUGS = [
  "bansuri-foundations-hindi",
  "zero-to-pro-bansuri-course",
  "beginner-level-flute-course-members",
  "advanced-swar-shifting-members",
  "ornamentation-course-members",
] as const;

export async function getAllCourseSlugs(): Promise<string[]> {
  return [...COURSE_SLUGS];
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
