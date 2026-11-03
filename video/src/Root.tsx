import React from "react";
import { Composition } from "remotion";
import { calculateLessonMetadata, LessonVideo, type LessonVideoProps } from "./LessonVideo";
import { video } from "./theme";

const defaultProps: LessonVideoProps = { slug: "rag-vs-finetuning", lesson: null, timings: [] };

export const RemotionRoot: React.FC = () => (
  <Composition
    id="LessonVideo"
    component={LessonVideo}
    width={video.width}
    height={video.height}
    fps={video.fps}
    durationInFrames={video.fps * 10}
    defaultProps={defaultProps}
    calculateMetadata={calculateLessonMetadata}
  />
);
