import React from "react";
import { AbsoluteFill, Audio, interpolate, Series, staticFile, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction } from "remotion";
import { indexTopics, topicFileId, topicsFileSchema, type TopicsFile } from "../../shared/curriculum-schema";
import { AUDIO_DIR, DRAFT_AUDIO_DIR, parseLesson, parseManifest, type Lesson, type Manifest } from "../../shared/lesson-schema";
import { Background } from "./components/Background";
import { EndCard } from "./components/EndCard";
import { ProgressBar } from "./components/ProgressBar";
import { SubjectBadge } from "./components/SubjectBadge";
import { SceneView } from "./scenes/SceneView";
import { colors, timing, video } from "./theme";

export type SceneTiming = {
  id: string;
  audioFile: string | null;
  audioFrames: number;
  durationInFrames: number;
};

/** Where the reel sits in the syllabus, from curriculum/topics.json. */
export type ReelInfo = {
  sem: string;
  subjectCode: string;
  subjectName: string;
  moduleNumber: number;
  moduleTheme: string;
  /** The following topic in the same module, or null if this is the module's last reel. */
  next: { id: string; title: string } | null;
};

export type LessonVideoProps = {
  /** Topic ID, e.g. "PIC-4-01". Files are looked up by its lowercase form. */
  topicId: string;
  lesson: Lesson | null;
  timings: SceneTiming[];
  reel: ReelInfo | null;
  /**
   * Studio previews set this: play draft voice (audio-draft/, unapproved lessons) when it exists.
   * Publishing renders leave it false, so draft voice can never reach a published video.
   */
  useDraftAudio: boolean;
  /** Filled in by calculateMetadata: which voice the timings came from. */
  audioSource: "approved" | "draft" | "none";
};

const fetchJson = async (path: string): Promise<unknown | null> => {
  const res = await fetch(staticFile(path));
  if (!res.ok) return null;
  return res.json();
};

const buildTimings = (lesson: Lesson, manifest: Manifest | null, id: string, audioFolder: string): SceneTiming[] => {
  if (!manifest) console.warn(`[LessonVideo] No manifest for "${id}". Using ${timing.fallbackSceneSeconds}s scenes. Run: npm run voice -- ${id}`);
  const byId = new Map(manifest?.scenes.map((s) => [s.id, s]) ?? []);
  return lesson.scenes.map((scene, i) => {
    const audio = byId.get(scene.id);
    if (manifest && !audio) console.warn(`[LessonVideo] Scene "${scene.id}" has no audio. Using ${timing.fallbackSceneSeconds}s.`);
    const seconds = audio?.durationInSeconds ?? timing.fallbackSceneSeconds;
    const audioFrames = Math.ceil(seconds * video.fps);
    const isLast = i === lesson.scenes.length - 1;
    return {
      id: scene.id,
      audioFile: audio ? `${audioFolder}/${id}/${audio.file}` : null,
      audioFrames,
      durationInFrames: audioFrames + timing.tailFrames + (isLast ? timing.endHoldFrames : 0),
    };
  });
};

const buildReelInfo = (file: TopicsFile, topicId: string): ReelInfo => {
  const entry = indexTopics(file).get(topicId);
  if (!entry) throw new Error(`Topic "${topicId}" is not in curriculum/topics.json. Run: npm run import`);
  const module = file.semesters
    .flatMap((s) => s.subjects)
    .find((s) => s.code === entry.subject.code)
    ?.modules.find((m) => m.number === entry.module.number);
  const position = module?.topics.findIndex((t) => t.id === topicId) ?? -1;
  const next = module?.topics[position + 1];
  return {
    sem: entry.sem,
    subjectCode: entry.subject.code,
    subjectName: entry.subject.name,
    moduleNumber: entry.module.number,
    moduleTheme: entry.module.theme,
    next: next ? { id: next.id, title: next.title } : null,
  };
};

export const calculateLessonMetadata: CalculateMetadataFunction<LessonVideoProps> = async ({ props }) => {
  const id = topicFileId(props.topicId);
  const rawLesson = await fetchJson(`lessons/${id}.json`);
  if (rawLesson === null) {
    throw new Error(`Lesson "${id}" not found in video/public/lessons/. Draft lessons/${id}.json, then run: npm run studio (or render)`);
  }
  const lesson = parseLesson(rawLesson, `lessons/${id}.json`);
  const rawTopics = await fetchJson("curriculum/topics.json");
  if (rawTopics === null) throw new Error("curriculum/topics.json not found in video/public/. Run: npm run import, then npm run studio (or render)");
  const reel = buildReelInfo(topicsFileSchema.parse(rawTopics), lesson.topicId);
  const loadVoice = async (folder: string): Promise<Manifest | null> => {
    const raw = await fetchJson(`${folder}/${id}/manifest.json`);
    return raw === null ? null : parseManifest(raw, `${folder}/${id}/manifest.json`);
  };
  const draftManifest = props.useDraftAudio ? await loadVoice(DRAFT_AUDIO_DIR) : null;
  const manifest = draftManifest ?? (await loadVoice(AUDIO_DIR));
  const audioSource = draftManifest ? "draft" : manifest ? "approved" : "none";
  const timings = buildTimings(lesson, manifest, id, draftManifest ? DRAFT_AUDIO_DIR : AUDIO_DIR);
  const durationInFrames = timings.reduce((sum, t) => sum + t.durationInFrames, 0) + timing.endCardFrames;
  return { durationInFrames, props: { ...props, lesson, timings, reel, audioSource } };
};

/** Fades everything, background included, to ink at the very end so the video closes calmly. */
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(frame, [durationInFrames - timing.outroFadeFrames, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ backgroundColor: colors.ink, opacity }} />;
};

export const LessonVideo: React.FC<LessonVideoProps> = ({ lesson, timings, reel, audioSource }) => {
  if (!lesson || !reel) return <Background />;
  return (
    <AbsoluteFill>
      <Background />
      <Series>
        {lesson.scenes.map((scene, i) => {
          const t = timings[i];
          if (!t) throw new Error(`Missing timing for scene "${scene.id}"`);
          return (
            <Series.Sequence key={scene.id} durationInFrames={t.durationInFrames} name={`${scene.id} · ${scene.type}`}>
              {t.audioFile && <Audio src={staticFile(t.audioFile)} />}
              <SceneView scene={scene} index={i} audioFrames={t.audioFrames} durationInFrames={t.durationInFrames} />
            </Series.Sequence>
          );
        })}
        <Series.Sequence durationInFrames={timing.endCardFrames} name="end card">
          <EndCard reel={reel} />
        </Series.Sequence>
      </Series>
      <SubjectBadge reel={reel} draftVoice={audioSource === "draft"} />
      <ProgressBar />
      <Outro />
    </AbsoluteFill>
  );
};
