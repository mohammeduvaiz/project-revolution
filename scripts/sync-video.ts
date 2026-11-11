import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { TOPICS_JSON } from "./lib/curriculum.ts";
import { LESSONS_DIR, VIDEO_PUBLIC } from "./lib/paths.ts";

/**
 * Remotion only sees files in video/public/. Copies every lesson and topics.json there,
 * removing copies of lessons that no longer exist. Run before Studio and renders.
 */
export const syncVideoInputs = async (): Promise<number> => {
  if (!existsSync(TOPICS_JSON)) throw new Error("curriculum/topics.json not found. Run: npm run import");
  const curriculumOut = path.join(VIDEO_PUBLIC, "curriculum");
  await mkdir(curriculumOut, { recursive: true });
  await copyFile(TOPICS_JSON, path.join(curriculumOut, path.basename(TOPICS_JSON)));

  const lessonsOut = path.join(VIDEO_PUBLIC, "lessons");
  await rm(lessonsOut, { recursive: true, force: true });
  await mkdir(lessonsOut, { recursive: true });
  const files = existsSync(LESSONS_DIR) ? (await readdir(LESSONS_DIR)).filter((f) => f.endsWith(".json")) : [];
  for (const f of files) await copyFile(path.join(LESSONS_DIR, f), path.join(lessonsOut, f));
  return files.length;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  syncVideoInputs()
    .then((n) => console.log(`Synced ${n} lesson${n === 1 ? "" : "s"} and topics.json into video/public/`))
    .catch((err: unknown) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
