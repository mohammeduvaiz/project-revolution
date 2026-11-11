import React from "react";
import type { Scene } from "../../../shared/lesson-schema";
import { DiagramArea } from "../components/DiagramArea";
import { Headline } from "../components/Headline";
import { StepList } from "../components/StepList";
import { diagram, timing } from "../theme";
import { SceneFrame, type SceneTimingProps } from "./SceneFrame";

type Props = SceneTimingProps & { scene: Extract<Scene, { type: "steps" }> };

/** An algorithm or procedure as numbered steps, revealed in order. */
export const StepsScene: React.FC<Props> = ({ scene, ...t }) => (
  <SceneFrame {...t} label={scene.label} caption={scene.caption} centered={!scene.visual}>
    <Headline text={scene.headline} delay={timing.staggerFrames} />
    <StepList items={scene.items} audioFrames={t.audioFrames} />
    {scene.visual && (
      <DiagramArea visual={scene.visual} narration={scene.narration} audioFrames={t.audioFrames} rowHeight={diagram.compactRowHeight} />
    )}
  </SceneFrame>
);
