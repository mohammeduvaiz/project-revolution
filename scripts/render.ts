import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { topicFileId } from "../shared/curriculum-schema.ts";
import { loadLesson } from "./lib/lessons.ts";
import { moduleFlag, moduleTopics } from "./lib/module.ts";
import { lessonPath, loadManifest, ROOT, videoPath } from "./lib/paths.ts";
import { syncVideoInputs } from "./sync-video.ts";

/**
 * A lesson is renderable for publishing when it's approved and its approved voice covers every scene
 * (PLAN.md gate: "voice exists"). Returns the reason it isn't, or null.
 */
const notRenderable = async (id: string): Promise<string | null> => {
  const lesson = await loadLesson(id);
  if (lesson.review.status !== "approved") return `review is "${lesson.review.status}"`;
  const manifest = await loadManifest(id);
  if (!manifest) return `no approved voice (run: npm run voice -- ${id})`;
  const missing = lesson.scenes.filter((s) => !manifest.scenes.some((m) => m.id === s.id)).map((s) => s.id);
  if (missing.length) return `voice missing for ${missing.join(", ")} (run: npm run voice -- ${id})`;
  return null;
};

/** Renders one lesson. Full renders go to web/public/videos/; --frames test renders go to out/. */
const renderLesson = async (id: string, extra: string[]): Promise<string> => {
  const lesson = await loadLesson(id);
  const isPartial = extra.some((a) => a.startsWith("--frames"));
  const out = isPartial ? path.join(ROOT, "out", `${id}-partial.mp4`) : videoPath(id);
  await mkdir(path.dirname(out), { recursive: true });
  const props = JSON.stringify({ topicId: lesson.topicId, useDraftAudio: false });
  const args = ["remotion", "render", "src/index.ts", "LessonVideo", out, `--props=${props}`, "--codec=h264", ...extra];
  console.log(`Rendering ${lesson.topicId} "${lesson.title}" → ${path.relative(ROOT, out)}`);
  const result = spawnSync("npx", args, { cwd: path.join(ROOT, "video"), stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Remotion render failed for ${lesson.topicId} (exit ${result.status})`);
  if (!existsSync(out)) throw new Error(`Render finished but ${out} is missing`);
  return out;
};

/** npm run render -- <topic-id> [--frames=0-90]   |   npm run render -- --module PIC-4 */
const main = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  const module = moduleFlag(argv);
  const extra = argv.filter((a, i) => a.startsWith("--") && a !== "--module" && argv[i - 1] !== "--module");
  const id = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--module")?.toLowerCase();
  if (!module && !id) {
    console.error("Usage: npm run render -- <topic-id> [--frames=0-90]   or   npm run render -- --module PIC-4");
    process.exit(1);
  }
  await syncVideoInputs();

  if (!module) {
    const lessonId = id ?? "";
    const isPartial = extra.some((a) => a.startsWith("--frames"));
    const reason = isPartial ? null : await notRenderable(lessonId);
    if (reason) throw new Error(`Not rendering ${lessonId}: ${reason}. (A --frames test render to out/ works without voice.)`);
    const out = await renderLesson(lessonId, extra);
    console.log(`\n✓ ${path.relative(ROOT, out)}${isPartial ? "" : "\nNext: watch it on a phone (QA), then npm run index"}`);
    return;
  }

  const { topics, theme } = await moduleTopics(module);
  console.log(`Module ${module.subject}-${module.module}: ${theme} · approved and voiced lessons only\n`);
  const rows: string[] = [];
  let failed = 0;
  for (const topic of topics) {
    const lessonId = topicFileId(topic.id);
    if (!existsSync(lessonPath(lessonId))) {
      rows.push(`  ${topic.id.padEnd(10)} skipped   not drafted`);
      continue;
    }
    try {
      const reason = await notRenderable(lessonId);
      if (reason) {
        rows.push(`  ${topic.id.padEnd(10)} skipped   ${reason}`);
        continue;
      }
      const out = await renderLesson(lessonId, extra);
      rows.push(`  ${topic.id.padEnd(10)} rendered  ${path.relative(ROOT, out)}`);
    } catch (err) {
      failed++;
      rows.push(`  ${topic.id.padEnd(10)} FAILED    ${(err instanceof Error ? err.message : String(err)).split("\n")[0]}`);
    }
  }
  console.log(`\nSummary\n${rows.join("\n")}`);
  if (failed) process.exit(1);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
