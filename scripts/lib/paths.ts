import { copyFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseLesson, parseManifest, type Lesson, type Manifest } from "../../shared/lesson-schema.ts";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const LESSONS_DIR = path.join(ROOT, "lessons");
export const VIDEO_PUBLIC = path.join(ROOT, "video", "public");
export const WEB_PUBLIC = path.join(ROOT, "web", "public");

export const lessonPath = (slug: string): string => path.join(LESSONS_DIR, `${slug}.json`);
export const audioDir = (slug: string): string => path.join(VIDEO_PUBLIC, "audio", slug);
export const manifestPath = (slug: string): string => path.join(audioDir(slug), "manifest.json");
export const videoPath = (slug: string): string => path.join(WEB_PUBLIC, "videos", `${slug}.mp4`);

export const requireSlug = (command: string): string => {
  const slug = process.argv[2];
  if (!slug) {
    console.error(`Usage: npm run ${command} -- <slug>`);
    process.exit(1);
  }
  return slug;
};

export const loadLesson = async (slug: string): Promise<Lesson> => {
  const file = lessonPath(slug);
  if (!existsSync(file)) throw new Error(`No lesson found at lessons/${slug}.json`);
  const lesson = parseLesson(JSON.parse(await readFile(file, "utf8")), `lessons/${slug}.json`);
  if (lesson.slug !== slug) throw new Error(`lessons/${slug}.json has slug "${lesson.slug}"; they must match`);
  return lesson;
};

export const loadManifest = async (slug: string): Promise<Manifest | null> => {
  const file = manifestPath(slug);
  if (!existsSync(file)) return null;
  return parseManifest(JSON.parse(await readFile(file, "utf8")), path.relative(ROOT, file));
};

/** Remotion reads lessons via staticFile(), so keep a copy in video/public/lessons/. */
export const syncLessonToVideo = async (slug: string): Promise<void> => {
  const dir = path.join(VIDEO_PUBLIC, "lessons");
  await mkdir(dir, { recursive: true });
  await copyFile(lessonPath(slug), path.join(dir, `${slug}.json`));
};
