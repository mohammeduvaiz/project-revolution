import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseFile } from "music-metadata";
import { sceneAudioFile, type Manifest, type ManifestScene, type Scene } from "../shared/lesson-schema.ts";
import { topicFileId } from "../shared/curriculum-schema.ts";
import { loadLesson } from "./lib/lessons.ts";
import { moduleFlag, moduleTopics } from "./lib/module.ts";
import { audioDir, lessonPath, loadManifest, manifestPath, syncLessonToVideo } from "./lib/paths.ts";
import { applyPronunciation, loadPronunciation } from "./lib/pronunciation.ts";

// Verified against https://docs.sarvam.ai/api-reference-docs/text-to-speech/convert
const SARVAM_URL = "https://api.sarvam.ai/text-to-speech";
const MODEL = "bulbul:v3";
const LANGUAGE = "ml-IN";
const SAMPLE_RATE = 24000;
const MAX_SECONDS = 18;
const MIN_SECONDS = 4;

type SarvamResponse = { request_id: string | null; audios: string[] };

const isSarvamResponse = (value: unknown): value is SarvamResponse =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as { audios?: unknown }).audios) &&
  typeof (value as { audios: unknown[] }).audios[0] === "string";

/** Hash of exactly what is sent, so a narration or pronunciation change re-voices the scene. */
const hashText = (text: string, speaker: string): string =>
  createHash("sha256").update(`${MODEL}|${LANGUAGE}|${speaker}|${SAMPLE_RATE}|${text}`).digest("hex").slice(0, 16);

const synthesize = async (scene: Scene, text: string, apiKey: string, speaker: string): Promise<Buffer> => {
  const res = await fetch(SARVAM_URL, {
    method: "POST",
    headers: { "api-subscription-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      language_code: LANGUAGE,
      model: MODEL,
      speaker,
      speech_sample_rate: SAMPLE_RATE,
      output_audio_codec: "wav",
    }),
  });
  const bodyText = await res.text();
  if (!res.ok) throw new Error(`Sarvam TTS failed for scene "${scene.id}" (HTTP ${res.status}): ${bodyText}`);
  const body: unknown = JSON.parse(bodyText);
  if (!isSarvamResponse(body)) throw new Error(`Unexpected Sarvam response for scene "${scene.id}": ${bodyText.slice(0, 300)}`);
  return Buffer.from(body.audios[0], "base64");
};

type VoiceOptions = { draft: boolean; apiKey: string; speaker: string };
type VoiceResult = { generated: number; cached: number; totalSeconds: number };

/** Voices one lesson. Throws if it isn't approved (unless draft) or a Sarvam call fails. */
const voiceLesson = async (id: string, { draft, apiKey, speaker }: VoiceOptions): Promise<VoiceResult> => {
  const lesson = await loadLesson(id);
  // Quality rule (PLAN.md): only lessons a human reviewer approved get voiced for publishing.
  if (!draft && lesson.review.status !== "approved") {
    throw new Error(
      `Refusing to voice ${lesson.topicId}: review.status is "${lesson.review.status}". ` +
        `A reviewer must set it to "approved" (with their name in review.reviewer) first.\n` +
        `To hear it before review, run: npm run voice -- ${id} --draft  (preview only, never published)`,
    );
  }
  const pronunciation = await loadPronunciation(lesson.topicId.split("-")[0] ?? "");
  await syncLessonToVideo(id);
  const dir = audioDir(id, draft);
  await mkdir(dir, { recursive: true });
  const previous = await loadManifest(id, draft);
  const previousById = new Map(previous?.scenes.map((s) => [s.id, s]) ?? []);

  const mode = draft ? "DRAFT voice (Studio preview only, never published)" : "voice";
  console.log(`${mode} for ${lesson.topicId} "${lesson.title}" · speaker ${speaker} · ${lesson.scenes.length} scenes`);
  const scenes: ManifestScene[] = [];
  let generated = 0;
  for (const [index, scene] of lesson.scenes.entries()) {
    const file = sceneAudioFile(index);
    const filePath = path.join(dir, file);
    const { text, applied } = applyPronunciation(scene.narration, pronunciation);
    const hash = hashText(text, speaker);
    const old = previousById.get(scene.id);
    let status: string;
    if (old && old.hash === hash && old.file === file && existsSync(filePath)) {
      status = "cached";
    } else {
      await writeFile(filePath, await synthesize(scene, text, apiKey, speaker));
      status = "generated";
      generated++;
    }
    const { format } = await parseFile(filePath);
    if (!format.duration) throw new Error(`Could not read duration of ${file} (scene "${scene.id}")`);
    const durationInSeconds = Math.round(format.duration * 1000) / 1000;
    const flag = durationInSeconds > MAX_SECONDS ? "  ⚠ over 18 s" : durationInSeconds < MIN_SECONDS ? "  ⚠ under 4 s" : "";
    const fixes = applied.length ? `  (pronunciation: ${applied.join(", ")})` : "";
    console.log(`  ${scene.id.padEnd(4)} ${scene.type.padEnd(9)} ${durationInSeconds.toFixed(2).padStart(6)} s  ${status}${flag}${fixes}`);
    scenes.push({ id: scene.id, file, durationInSeconds, hash });
  }

  const manifest: Manifest = { lessonId: id, speaker, scenes };
  await writeFile(manifestPath(id, draft), `${JSON.stringify(manifest, null, 2)}\n`);
  const totalSeconds = scenes.reduce((sum, s) => sum + s.durationInSeconds, 0);
  const totalFlag = totalSeconds < 45 || totalSeconds > 75 ? "  ⚠ outside 45–75 s" : "";
  console.log(`  total        ${totalSeconds.toFixed(2).padStart(6)} s${totalFlag}  → ${path.relative(process.cwd(), dir)}/\n`);
  return { generated, cached: scenes.length - generated, totalSeconds };
};

/** npm run voice -- <topic-id> [--draft]   |   npm run voice -- --module PIC-4 [--draft] */
const main = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  const draft = argv.includes("--draft");
  const module = moduleFlag(argv);
  const id = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--module")?.toLowerCase();
  if (!module && !id) {
    console.error("Usage: npm run voice -- <topic-id> [--draft]   or   npm run voice -- --module PIC-4 [--draft]");
    process.exit(1);
  }
  const apiKey = process.env.SARVAM_API_KEY?.trim();
  const speaker = process.env.SARVAM_SPEAKER?.trim().toLowerCase() || "shubh";
  if (!apiKey) throw new Error("SARVAM_API_KEY is missing. Copy .env.example to .env and fill it in.");
  const options = { draft, apiKey, speaker };

  if (!module) {
    await voiceLesson(id ?? "", options);
    return;
  }

  // Module mode: every drafted lesson in syllabus order. Approved only, unless --draft.
  const { topics, theme } = await moduleTopics(module);
  console.log(`Module ${module.subject}-${module.module}: ${theme} · ${draft ? "DRAFT voice" : "approved lessons only"}\n`);
  const rows: string[] = [];
  let failed = 0;
  for (const topic of topics) {
    const lessonId = topicFileId(topic.id);
    if (!existsSync(lessonPath(lessonId))) {
      rows.push(`  ${topic.id.padEnd(10)} skipped   not drafted`);
      continue;
    }
    try {
      const lesson = await loadLesson(lessonId);
      if (!draft && lesson.review.status !== "approved") {
        rows.push(`  ${topic.id.padEnd(10)} skipped   review is "${lesson.review.status}" (use --draft to preview)`);
        continue;
      }
      const r = await voiceLesson(lessonId, options);
      rows.push(`  ${topic.id.padEnd(10)} voiced    ${r.generated} generated, ${r.cached} cached, ${r.totalSeconds.toFixed(1)} s`);
    } catch (err) {
      failed++;
      rows.push(`  ${topic.id.padEnd(10)} FAILED    ${(err instanceof Error ? err.message : String(err)).split("\n")[0]}`);
    }
  }
  console.log(`Summary\n${rows.join("\n")}`);
  if (failed) process.exit(1);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
