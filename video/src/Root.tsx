import React from "react";
import { Composition, Folder, getStaticFiles } from "remotion";
import { calculateLessonMetadata, LessonVideo, type LessonVideoProps } from "./LessonVideo";
import { video } from "./theme";

const props = (topicId: string, useDraftAudio: boolean): LessonVideoProps => ({
  topicId,
  lesson: null,
  timings: [],
  reel: null,
  useDraftAudio,
  audioSource: "none",
});

/** Lesson files synced into public/lessons/ (by npm run studio / render), as topic IDs. */
const syncedTopicIds = (): string[] =>
  getStaticFiles()
    .map((f) => /^lessons\/([a-z0-9-]+)\.json$/.exec(f.name)?.[1])
    .filter((id): id is string => Boolean(id))
    .map((id) => id.toUpperCase())
    .sort();

const common = {
  component: LessonVideo,
  width: video.width,
  height: video.height,
  fps: video.fps,
  durationInFrames: video.fps * 10,
  calculateMetadata: calculateLessonMetadata,
} as const;

export const RemotionRoot: React.FC = () => (
  <>
    {/* Used by npm run render (publishing). Approved voice only: never plays draft audio. */}
    <Composition id="LessonVideo" {...common} defaultProps={props(syncedTopicIds()[0] ?? "PIC-1-01", false)} />
    {/* One entry per drafted lesson, for checking in Studio. Plays draft voice when it exists. */}
    <Folder name="Lessons">
      {syncedTopicIds().map((topicId) => (
        <Composition key={topicId} id={topicId} {...common} defaultProps={props(topicId, true)} />
      ))}
    </Folder>
  </>
);
