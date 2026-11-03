import React from "react";
import type { Scene } from "../../../shared/lesson-schema";
import { CompareCard } from "../components/CompareCard";
import { colors, fonts, timing, type } from "../theme";
import { enterStyle, useEnter } from "../components/useEnter";
import { SceneFrame, type SceneTimingProps } from "./SceneFrame";

type Props = SceneTimingProps & { scene: Extract<Scene, { type: "compare" }> };

/** Fraction of the audio after which the right-hand side appears (narration covers left first). */
const RIGHT_SIDE_AT = 0.45;

const Versus: React.FC<{ delay: number }> = ({ delay }) => {
  const enter = useEnter(delay);
  return (
    <div style={{ ...enterStyle(enter), fontFamily: fonts.label, fontSize: type.label, letterSpacing: type.labelTracking, color: colors.label, textAlign: "center" }}>
      VS
    </div>
  );
};

export const CompareScene: React.FC<Props> = ({ scene, ...t }) => {
  const rightDelay = Math.round(t.audioFrames * RIGHT_SIDE_AT);
  return (
    <SceneFrame {...t} label={scene.label} caption={scene.caption} centered>
      <CompareCard side={scene.left} accent={colors.teal} delay={timing.staggerFrames} />
      <Versus delay={rightDelay - timing.staggerFrames} />
      <CompareCard side={scene.right} accent={colors.turmeric} delay={rightDelay} />
    </SceneFrame>
  );
};
