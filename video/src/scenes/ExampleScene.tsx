import React from "react";
import type { Scene } from "../../../shared/lesson-schema";
import { DiagramArea } from "../components/DiagramArea";
import { enterStyle, useEnter } from "../components/useEnter";
import { colors, diagram, exampleScene, fonts, timing, type } from "../theme";
import { SceneFrame, type SceneTimingProps } from "./SceneFrame";

type Props = SceneTimingProps & { scene: Extract<Scene, { type: "example" }> };

const Line: React.FC<{ text: string; size: number; color: string; weight: number; delay: number }> = ({ text, size, color, weight, delay }) => {
  const enter = useEnter(delay);
  return (
    <p style={{ ...enterStyle(enter), margin: 0, fontFamily: fonts.body, fontWeight: weight, fontSize: size, lineHeight: type.bodyLineHeight, color }}>
      {text}
    </p>
  );
};

/** The real-life example: setup line, a diagram of it, then the payoff that ties it to the concept. */
export const ExampleScene: React.FC<Props> = ({ scene, ...t }) => (
  <SceneFrame {...t} label={scene.label} caption={scene.caption}>
    <Line text={scene.setup} size={exampleScene.setupSize} color={colors.text} weight={700} delay={timing.staggerFrames} />
    <DiagramArea visual={scene.visual} narration={scene.narration} audioFrames={t.audioFrames} rowHeight={diagram.compactRowHeight} />
    <Line
      text={scene.payoff}
      size={exampleScene.payoffSize}
      color={colors.turmeric}
      weight={800}
      delay={Math.round(t.audioFrames * timing.examplePayoffAt)}
    />
  </SceneFrame>
);
