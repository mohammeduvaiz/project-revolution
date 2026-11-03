import React from "react";
import type { Scene } from "../../../shared/lesson-schema";
import { AccentBar } from "../components/AccentBar";
import { DiagramArea } from "../components/DiagramArea";
import { Headline } from "../components/Headline";
import { colors, timing, type } from "../theme";
import { SceneFrame, type SceneTimingProps } from "./SceneFrame";

type Props = SceneTimingProps & { scene: Extract<Scene, { type: "takeaway" }> };

export const TakeawayScene: React.FC<Props> = ({ scene, ...t }) => (
  <SceneFrame {...t} label={scene.label} caption={scene.caption} centered={!scene.visual}>
    <AccentBar delay={timing.staggerFrames} />
    <Headline text={scene.headline} size={scene.visual ? type.headline : type.hero} color={colors.turmeric} delay={timing.staggerFrames * 2} />
    {scene.visual && <DiagramArea visual={scene.visual} narration={scene.narration} audioFrames={t.audioFrames} />}
  </SceneFrame>
);
