import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseFile } from "music-metadata";
import type { LessonIndexEntry } from "../shared/lesson-index.ts";
import { loadLesson, LESSONS_DIR, videoPath, WEB_PUBLIC } from "./lib/paths.ts";

const main = async (): Promise<void> => {
  const files = (await readdir(LESSONS_DIR)).filter((f) => f.endsWith(".json")).sort();
  const entries: LessonIndexEntry[] = [];
  for (const file of files) {
    const slug = path.basename(file, ".json");
    const lesson = await loadLesson(slug);
    if (!existsSync(videoPath(slug))) {
      console.log(`  skip  ${slug} (no video yet: npm run render -- ${slug})`);
      continue;
    }
    const { format } = await parseFile(videoPath(slug));
    if (!format.duration) throw new Error(`Could not read duration of web/public/videos/${slug}.mp4`);
    entries.push({
      slug,
      title: lesson.title,
      description: lesson.description,
      summary: lesson.summary,
      durationInSeconds: Math.round(format.duration),
      videoUrl: `/videos/${slug}.mp4`,
    });
    console.log(`  add   ${slug}`);
  }
  await mkdir(WEB_PUBLIC, { recursive: true });
  await writeFile(path.join(WEB_PUBLIC, "lessons.json"), `${JSON.stringify(entries, null, 2)}\n`);
  console.log(`\nWrote web/public/lessons.json (${entries.length} lesson${entries.length === 1 ? "" : "s"})`);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
