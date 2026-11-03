import React from "react";
import type { Scene } from "../../../shared/lesson-schema";
import { AccentBar } from "../components/AccentBar";
import { DiagramArea } from "../components/DiagramArea";
import { Headline } from "../components/Headline";
import { timing, type } from "../theme";
import { SceneFrame, type SceneTimingProps } from "./SceneFrame";

type Props = SceneTimingProps & { scene: Extract<Scene, { type: "hook" }> };

export const HookScene: React.FC<Props> = ({ scene, ...t }) =>
  scene.visual ? (
    <SceneFrame {...t} label={scene.label} caption={scene.caption}>
      <Headline text={scene.headline} delay={timing.staggerFrames} />
      <DiagramArea visual={scene.visual} narration={scene.narration} audioFrames={t.audioFrames} />
    </SceneFrame>
  ) : (
    <SceneFrame {...t} label={scene.label} caption={scene.caption} centered>
      <Headline text={scene.headline} size={type.hero} delay={timing.staggerFrames} />
      <AccentBar delay={timing.staggerFrames * 3} />
    </SceneFrame>
  );
