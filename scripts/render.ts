import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { loadLesson, loadManifest, requireSlug, ROOT, syncLessonToVideo, videoPath } from "./lib/paths.ts";

/** npm run render -- <slug> [extra remotion flags, e.g. --frames=0-90] */
const main = async (): Promise<void> => {
  const slug = requireSlug("render");
  const extra = process.argv.slice(3);
  const lesson = await loadLesson(slug);
  await syncLessonToVideo(slug);

  const manifest = await loadManifest(slug);
  if (!manifest) console.warn(`⚠ No voice manifest for "${slug}". Scenes will be silent and ${8}s long. Run: npm run voice -- ${slug}`);
  const missing = lesson.scenes.filter((s) => !manifest?.scenes.some((m) => m.id === s.id)).map((s) => s.id);
  if (manifest && missing.length) console.warn(`⚠ No audio for scenes: ${missing.join(", ")}. Run: npm run voice -- ${slug}`);

  const isPartial = extra.some((a) => a.startsWith("--frames"));
  const out = isPartial ? path.join(ROOT, "out", `${slug}-partial.mp4`) : videoPath(slug);
  await mkdir(path.dirname(out), { recursive: true });

  const args = ["remotion", "render", "src/index.ts", "LessonVideo", out, `--props=${JSON.stringify({ slug })}`, "--codec=h264", ...extra];
  console.log(`Rendering "${lesson.title}" → ${path.relative(ROOT, out)}`);
  const result = spawnSync("npx", args, { cwd: path.join(ROOT, "video"), stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
  if (!existsSync(out)) throw new Error(`Render finished but ${out} is missing`);
  console.log(`\n✓ ${path.relative(ROOT, out)}`);
  if (!isPartial) console.log("Next: npm run index");
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
