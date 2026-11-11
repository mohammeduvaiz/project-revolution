import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { SUBJECT_CODES, topicFileId, type TopicEntry } from "../shared/curriculum-schema.ts";
import { lessonSchema } from "../shared/lesson-schema.ts";
import type { LessonIndexEntry } from "../shared/lesson-index.ts";
import { loadTopics } from "./lib/curriculum.ts";
import { lessonPath, LESSONS_DIR, loadManifest, PUBLISHED_INDEX, videoPath } from "./lib/paths.ts";

/** Pipeline stages in order (PLAN.md). Each topic reports the furthest stage its files show. */
const STAGES = [
  "not drafted",
  "invalid draft",
  "in review",
  "changes requested",
  "approved",
  "voiced",
  "rendered",
  "published",
] as const;
type Stage = (typeof STAGES)[number];

const parseArgs = (): { subject: string | null } => {
  const args = process.argv.slice(2);
  const i = args.indexOf("--subject");
  if (i === -1) return { subject: null };
  const code = args[i + 1]?.toUpperCase();
  if (!code || !(SUBJECT_CODES as readonly string[]).includes(code)) {
    console.error(`--subject needs one of: ${SUBJECT_CODES.join(", ")}`);
    process.exit(1);
  }
  return { subject: code };
};

const loadPublished = async (): Promise<Set<string>> => {
  if (!existsSync(PUBLISHED_INDEX)) return new Set();
  const entries = JSON.parse(await readFile(PUBLISHED_INDEX, "utf8")) as LessonIndexEntry[];
  return new Set(entries.map((e) => e.slug));
};

const stageOf = async (topic: TopicEntry, published: Set<string>): Promise<Stage> => {
  const id = topicFileId(topic.id);
  if (!existsSync(lessonPath(id))) return "not drafted";
  const parsed = lessonSchema.safeParse(JSON.parse(await readFile(lessonPath(id), "utf8")));
  if (!parsed.success || parsed.data.topicId !== topic.id) return "invalid draft";
  const lesson = parsed.data;
  if (lesson.review.status === "pending") return "in review";
  if (lesson.review.status === "changes") return "changes requested";
  const manifest = await loadManifest(id);
  const voiced = manifest !== null && lesson.scenes.every((s) => manifest.scenes.some((m) => m.id === s.id));
  if (!voiced) return "approved";
  if (!existsSync(videoPath(id))) return "voiced";
  if (!published.has(id)) return "rendered";
  return "published";
};

const truncate = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

const main = async (): Promise<void> => {
  const { subject } = parseArgs();
  const { file, byId } = await loadTopics();
  const published = await loadPublished();

  const topics = [...byId.values()].filter((t) => !subject || t.subject.code === subject);
  const stages = new Map<string, Stage>();
  for (const topic of topics) stages.set(topic.id, await stageOf(topic, published));

  // Per-topic listing, grouped by semester → subject → module.
  for (const semester of file.semesters) {
    for (const subj of semester.subjects) {
      if (subject && subj.code !== subject) continue;
      console.log(`\n${semester.sem} · ${subj.code}  ${subj.name} (${subj.courseCode})`);
      for (const module of subj.modules) {
        console.log(`  Module ${module.number} · ${module.theme}`);
        for (const topic of module.topics) {
          const stage = stages.get(topic.id) ?? "not drafted";
          console.log(`    ${topic.id.padEnd(10)} ${topic.priority.padEnd(5)}  ${stage.padEnd(17)}  ${truncate(topic.title, 64)}`);
        }
      }
    }
  }

  // Lesson files that don't belong to any topic (typos in file names or topicId).
  const lessonFiles = existsSync(LESSONS_DIR) ? (await readdir(LESSONS_DIR)).filter((f) => f.endsWith(".json")) : [];
  const known = new Set([...byId.keys()].map(topicFileId));
  const orphans = lessonFiles.filter((f) => !known.has(path.basename(f, ".json")));

  // Totals.
  const counts = STAGES.map((stage) => [stage, topics.filter((t) => stages.get(t.id) === stage).length] as const).filter(([, n]) => n > 0);
  const major = topics.filter((t) => t.priority === "Major");
  const majorDone = major.filter((t) => stages.get(t.id) === "published").length;
  console.log(`\n${subject ?? "All subjects"}: ${topics.length} topics`);
  for (const [stage, n] of counts) console.log(`  ${stage.padEnd(17)} ${n}`);
  console.log(`  Major published   ${majorDone}/${major.length}`);
  if (orphans.length) {
    console.log(`\n⚠ ${orphans.length} lesson file(s) match no topic in curriculum/topics.json:`);
    for (const f of orphans) console.log(`  lessons/${f}`);
  }
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
