import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { FlowStep } from "../../../shared/lesson-schema";
import { colors, fonts, layout, timing, type } from "../theme";
import { useEnter } from "./useEnter";

type Props = { steps: FlowStep[]; spreadFrames: number };

const ARROW_HEIGHT = 72;

const Arrow: React.FC<{ progress: number }> = ({ progress }) => (
  <div style={{ height: ARROW_HEIGHT, display: "flex", justifyContent: "center" }}>
    <svg width={40} height={ARROW_HEIGHT} viewBox={`0 0 40 ${ARROW_HEIGHT}`}>
      <line x1={20} y1={4} x2={20} y2={4 + (ARROW_HEIGHT - 24) * progress} stroke={colors.label} strokeWidth={4} strokeLinecap="round" opacity={progress > 0 ? 1 : 0} />
      <path
        d={`M8 ${ARROW_HEIGHT - 22} L20 ${ARROW_HEIGHT - 8} L32 ${ARROW_HEIGHT - 22}`}
        fill="none"
        stroke={colors.label}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={progress >= 1 ? 1 : 0}
      />
    </svg>
  </div>
);

const Box: React.FC<{ step: FlowStep; delay: number; highlight: boolean }> = ({ step, delay, highlight }) => {
  const enter = useEnter(delay, timing.popSpring);
  const accent = highlight ? colors.turmeric : colors.label;
  return (
    <div
      style={{
        opacity: Math.min(1, enter),
        transform: `scale(${0.85 + 0.15 * enter})`,
        border: `${layout.border}px solid ${accent}`,
        borderRadius: layout.radius,
        backgroundColor: colors.inkRaised,
        padding: "32px 40px",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 24,
      }}
    >
      <span style={{ fontFamily: fonts.headline, fontWeight: 700, fontSize: type.stepTitle, color: highlight ? colors.turmeric : colors.text }}>
        {step.title}
      </span>
      <span style={{ fontFamily: fonts.label, fontSize: type.stepSub, color: colors.label }}>{step.sub}</span>
    </div>
  );
};

/** Vertical flow: boxes pop in one by one, arrows draw between them. */
export const FlowDiagram: React.FC<Props> = ({ steps, spreadFrames }) => {
  const frame = useCurrentFrame();
  const interval = spreadFrames / steps.length;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {steps.map((step, i) => {
        const delay = Math.round(i * interval);
        const arrowStart = delay - timing.arrowDrawFrames;
        const arrowProgress = interpolate(frame, [arrowStart, delay], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <React.Fragment key={`${step.title}-${i}`}>
            {i > 0 && <Arrow progress={arrowProgress} />}
            <Box step={step} delay={delay} highlight={i === steps.length - 1} />
          </React.Fragment>
        );
      })}
    </div>
  );
};
