import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseFile } from "music-metadata";
import { sceneAudioFile, type Manifest, type ManifestScene, type Scene } from "../shared/lesson-schema.ts";
import { audioDir, loadLesson, loadManifest, manifestPath, requireSlug, syncLessonToVideo } from "./lib/paths.ts";

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

const hashScene = (scene: Scene, speaker: string): string =>
  createHash("sha256").update(`${MODEL}|${LANGUAGE}|${speaker}|${SAMPLE_RATE}|${scene.narration}`).digest("hex").slice(0, 16);

const synthesize = async (scene: Scene, apiKey: string, speaker: string): Promise<Buffer> => {
  const res = await fetch(SARVAM_URL, {
    method: "POST",
    headers: { "api-subscription-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: scene.narration,
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

const main = async (): Promise<void> => {
  const slug = requireSlug("voice");
  const apiKey = process.env.SARVAM_API_KEY?.trim();
  const speaker = process.env.SARVAM_SPEAKER?.trim().toLowerCase() || "shubh";
  if (!apiKey) throw new Error("SARVAM_API_KEY is missing. Copy .env.example to .env and fill it in.");

  const lesson = await loadLesson(slug);
  await syncLessonToVideo(slug);
  const dir = audioDir(slug);
  await mkdir(dir, { recursive: true });

  const previous = await loadManifest(slug);
  const previousById = new Map(previous?.scenes.map((s) => [s.id, s]) ?? []);

  console.log(`Voice for "${lesson.title}" · speaker ${speaker} · ${lesson.scenes.length} scenes\n`);
  const scenes: ManifestScene[] = [];
  for (const [index, scene] of lesson.scenes.entries()) {
    const file = sceneAudioFile(index);
    const filePath = path.join(dir, file);
    const hash = hashScene(scene, speaker);
    const old = previousById.get(scene.id);
    let status: string;
    if (old && old.hash === hash && old.file === file && existsSync(filePath)) {
      status = "cached";
    } else {
      await writeFile(filePath, await synthesize(scene, apiKey, speaker));
      status = "generated";
    }
    const { format } = await parseFile(filePath);
    if (!format.duration) throw new Error(`Could not read duration of ${file} (scene "${scene.id}")`);
    const durationInSeconds = Math.round(format.duration * 1000) / 1000;
    const flag = durationInSeconds > MAX_SECONDS ? "  ⚠ over 18 s" : durationInSeconds < MIN_SECONDS ? "  ⚠ under 4 s" : "";
    console.log(`  ${scene.id.padEnd(4)} ${scene.type.padEnd(9)} ${durationInSeconds.toFixed(2).padStart(6)} s  ${status}${flag}`);
    scenes.push({ id: scene.id, file, durationInSeconds, hash });
  }

  const manifest: Manifest = { slug, speaker, scenes };
  await writeFile(manifestPath(slug), `${JSON.stringify(manifest, null, 2)}\n`);
  const total = scenes.reduce((sum, s) => sum + s.durationInSeconds, 0);
  const totalFlag = total < 45 || total > 90 ? "  ⚠ outside 45–90 s" : "";
  console.log(`\n  total        ${total.toFixed(2).padStart(6)} s${totalFlag}`);
  console.log(`\nWrote ${path.relative(process.cwd(), dir)}/`);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
