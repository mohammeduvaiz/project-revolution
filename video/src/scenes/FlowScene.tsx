import React from "react";
import type { Scene } from "../../../shared/lesson-schema";
import { FlowDiagram } from "../components/FlowDiagram";
import { Headline } from "../components/Headline";
import { timing } from "../theme";
import { SceneFrame, type SceneTimingProps } from "./SceneFrame";

type Props = SceneTimingProps & { scene: Extract<Scene, { type: "flow" }> };

export const FlowScene: React.FC<Props> = ({ scene, ...t }) => (
  <SceneFrame {...t} label={scene.label} caption={scene.caption} centered>
    <Headline text={scene.headline} delay={timing.staggerFrames} />
    <FlowDiagram steps={scene.steps} spreadFrames={t.durationInFrames * timing.flowSpreadFraction} />
  </SceneFrame>
);
