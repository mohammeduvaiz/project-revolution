import React from "react";
import { AbsoluteFill, Audio, Series, staticFile, type CalculateMetadataFunction } from "remotion";
import { parseLesson, parseManifest, type Lesson, type Manifest } from "../../shared/lesson-schema";
import { Background } from "./components/Background";
import { ProgressBar } from "./components/ProgressBar";
import { SceneView } from "./scenes/SceneView";
import { timing, video } from "./theme";

export type SceneTiming = {
  id: string;
  audioFile: string | null;
  audioFrames: number;
  durationInFrames: number;
};

export type LessonVideoProps = {
  slug: string;
  lesson: Lesson | null;
  timings: SceneTiming[];
};

const fetchJson = async (path: string): Promise<unknown | null> => {
  const res = await fetch(staticFile(path));
  if (!res.ok) return null;
  return res.json();
};

const buildTimings = (lesson: Lesson, manifest: Manifest | null): SceneTiming[] => {
  if (!manifest) console.warn(`[LessonVideo] No manifest for "${lesson.slug}". Using ${timing.fallbackSceneSeconds}s scenes. Run: npm run voice -- ${lesson.slug}`);
  const byId = new Map(manifest?.scenes.map((s) => [s.id, s]) ?? []);
  return lesson.scenes.map((scene, i) => {
    const audio = byId.get(scene.id);
    if (manifest && !audio) console.warn(`[LessonVideo] Scene "${scene.id}" has no audio. Using ${timing.fallbackSceneSeconds}s.`);
    const seconds = audio?.durationInSeconds ?? timing.fallbackSceneSeconds;
    const audioFrames = Math.ceil(seconds * video.fps);
    const isLast = i === lesson.scenes.length - 1;
    return {
      id: scene.id,
      audioFile: audio ? `audio/${lesson.slug}/${audio.file}` : null,
      audioFrames,
      durationInFrames: audioFrames + timing.tailFrames + (isLast ? timing.endHoldFrames : 0),
    };
  });
};

export const calculateLessonMetadata: CalculateMetadataFunction<LessonVideoProps> = async ({ props }) => {
  const rawLesson = await fetchJson(`lessons/${props.slug}.json`);
  if (rawLesson === null) {
    throw new Error(`Lesson "${props.slug}" not found in video/public/lessons/. Run: npm run voice -- ${props.slug}`);
  }
  const lesson = parseLesson(rawLesson, `lessons/${props.slug}.json`);
  const rawManifest = await fetchJson(`audio/${props.slug}/manifest.json`);
  const manifest = rawManifest === null ? null : parseManifest(rawManifest, `audio/${props.slug}/manifest.json`);
  const timings = buildTimings(lesson, manifest);
  const durationInFrames = timings.reduce((sum, t) => sum + t.durationInFrames, 0);
  return { durationInFrames, props: { ...props, lesson, timings } };
};

export const LessonVideo: React.FC<LessonVideoProps> = ({ lesson, timings }) => {
  if (!lesson) return <Background />;
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
      </Series>
      <ProgressBar />
    </AbsoluteFill>
  );
};
