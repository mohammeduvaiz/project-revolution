import React from "react";
import type { Scene } from "../../../shared/lesson-schema";
import { AccentBar } from "../components/AccentBar";
import { BodyText } from "../components/BodyText";
import { DiagramArea } from "../components/DiagramArea";
import { Headline } from "../components/Headline";
import { colors, timing } from "../theme";
import { SceneFrame, type SceneTimingProps } from "./SceneFrame";

type Props = SceneTimingProps & { scene: Extract<Scene, { type: "concept" }> };

export const ConceptScene: React.FC<Props> = ({ scene, ...t }) => (
  <SceneFrame {...t} label={scene.label} caption={scene.caption} centered={!scene.visual}>
    <AccentBar color={colors.teal} delay={timing.staggerFrames} />
    <Headline text={scene.headline} delay={timing.staggerFrames * 2} />
    {scene.body && <BodyText text={scene.body} delay={Math.round(t.audioFrames * 0.3)} />}
    {scene.visual && <DiagramArea visual={scene.visual} narration={scene.narration} audioFrames={t.audioFrames} />}
  </SceneFrame>
);
