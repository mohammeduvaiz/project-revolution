import { copyFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AUDIO_DIR, DRAFT_AUDIO_DIR, parseManifest, type Manifest } from "../../shared/lesson-schema.ts";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const LESSONS_DIR = path.join(ROOT, "lessons");
export const VIDEO_PUBLIC = path.join(ROOT, "video", "public");
export const WEB_PUBLIC = path.join(ROOT, "web", "public");
export const PUBLISHED_INDEX = path.join(WEB_PUBLIC, "lessons.json");

/** Every per-lesson path uses the lesson id: the lowercase topic ID (pic-4-01). */
export const lessonPath = (id: string): string => path.join(LESSONS_DIR, `${id}.json`);
/** Approved voice in audio/<id>/; `draft` voice (unapproved lessons, Studio preview only) in audio-draft/<id>/. */
export const audioDir = (id: string, draft = false): string => path.join(VIDEO_PUBLIC, draft ? DRAFT_AUDIO_DIR : AUDIO_DIR, id);
export const manifestPath = (id: string, draft = false): string => path.join(audioDir(id, draft), "manifest.json");
export const videoPath = (id: string): string => path.join(WEB_PUBLIC, "videos", `${id}.mp4`);

/** Reads the lesson id from argv. Accepts PIC-4-01 or pic-4-01. */
export const requireLessonId = (command: string): string => {
  const arg = process.argv[2];
  if (!arg || arg.startsWith("--")) {
    console.error(`Usage: npm run ${command} -- <topic-id>   (e.g. pic-4-01)`);
    process.exit(1);
  }
  return arg.toLowerCase();
};

export const loadManifest = async (id: string, draft = false): Promise<Manifest | null> => {
  const file = manifestPath(id, draft);
  if (!existsSync(file)) return null;
  return parseManifest(JSON.parse(await readFile(file, "utf8")), path.relative(ROOT, file));
};

/** Remotion reads lessons via staticFile(), so keep a copy in video/public/lessons/. */
export const syncLessonToVideo = async (id: string): Promise<void> => {
  const dir = path.join(VIDEO_PUBLIC, "lessons");
  await mkdir(dir, { recursive: true });
  await copyFile(lessonPath(id), path.join(dir, `${id}.json`));
};
