import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseFile } from "music-metadata";
import { topicFileId, type TopicEntry } from "../shared/curriculum-schema.ts";
import type { LessonIndexEntry } from "../shared/lesson-index.ts";
import { loadTopics } from "./lib/curriculum.ts";
import { loadLesson } from "./lib/lessons.ts";
import { lessonPath, loadManifest, PUBLISHED_INDEX, ROOT, videoPath, WEB_PUBLIC } from "./lib/paths.ts";

/** The index entry for a topic's lesson, with its place in the syllabus. */
export const buildEntry = async (topic: TopicEntry, durationInSeconds: number): Promise<LessonIndexEntry> => {
  const slug = topicFileId(topic.id);
  const lesson = await loadLesson(slug);
  return {
    slug,
    topicId: topic.id,
    title: lesson.title,
    description: lesson.example,
    durationInSeconds: Math.round(durationInSeconds),
    videoUrl: `/videos/${slug}.mp4`,
    sem: topic.sem,
    subject: { code: topic.subject.code, name: topic.subject.name },
    module: { number: topic.module.number, theme: topic.module.theme },
    topicNumber: topic.number,
    priority: topic.priority,
  };
};

/** Why a drafted lesson isn't published yet, or null if it can be. */
const notPublishable = async (id: string): Promise<string | null> => {
  const lesson = await loadLesson(id);
  if (lesson.review.status !== "approved") return `review is "${lesson.review.status}"`;
  if (!(await loadManifest(id))) return "no approved voice";
  if (!existsSync(videoPath(id))) return "not rendered";
  return null;
};

/** npm run index [-- --dry-run]: rebuilds web/public/lessons.json from approved, voiced, rendered lessons. */
const main = async (): Promise<void> => {
  const dryRun = process.argv.includes("--dry-run");
  const { byId } = await loadTopics();
  const entries: LessonIndexEntry[] = [];
  const skipped: string[] = [];
  for (const topic of byId.values()) {
    const id = topicFileId(topic.id);
    if (!existsSync(lessonPath(id))) continue;
    const reason = await notPublishable(id);
    if (reason) {
      skipped.push(`  skip  ${topic.id.padEnd(10)} ${reason}`);
      continue;
    }
    const { format } = await parseFile(videoPath(id));
    if (!format.duration) throw new Error(`Could not read duration of web/public/videos/${id}.mp4`);
    entries.push(await buildEntry(topic, format.duration));
    console.log(`  add   ${topic.id.padEnd(10)} ${topic.sem} · ${topic.subject.code} · Module ${topic.module.number}`);
  }
  if (skipped.length) console.log(skipped.join("\n"));
  const json = `${JSON.stringify(entries, null, 2)}\n`;
  if (dryRun) {
    console.log(`\n--dry-run: would write ${entries.length} lesson(s) to ${path.relative(ROOT, PUBLISHED_INDEX)}; nothing written.`);
    return;
  }
  await mkdir(WEB_PUBLIC, { recursive: true });
  await writeFile(PUBLISHED_INDEX, json);
  console.log(`\nWrote ${path.relative(ROOT, PUBLISHED_INDEX)} (${entries.length} lesson${entries.length === 1 ? "" : "s"})`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
