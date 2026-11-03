import React from "react";
import type { CompareSide } from "../../../shared/lesson-schema";
import { colors, fonts, layout, timing, type } from "../theme";
import { enterStyle, useEnter } from "./useEnter";

type Props = { side: CompareSide; accent: string; delay: number };

const Point: React.FC<{ text: string; accent: string; delay: number }> = ({ text, accent, delay }) => {
  const enter = useEnter(delay);
  return (
    <div style={{ ...enterStyle(enter), display: "flex", alignItems: "center", gap: 24 }}>
      <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: accent, flexShrink: 0 }} />
      <span style={{ fontFamily: fonts.body, fontWeight: 500, fontSize: type.point, color: colors.text }}>{text}</span>
    </div>
  );
};

export const CompareCard: React.FC<Props> = ({ side, accent, delay }) => {
  const enter = useEnter(delay);
  return (
    <div
      style={{
        ...enterStyle(enter),
        border: `${layout.border}px solid ${colors.label}`,
        borderRadius: layout.radius,
        backgroundColor: colors.inkRaised,
        padding: "40px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <div style={{ fontFamily: fonts.headline, fontWeight: 800, fontSize: type.cardTitle, color: accent }}>{side.title}</div>
      {side.points.map((point, i) => (
        <Point key={point} text={point} accent={accent} delay={delay + (i + 1) * timing.staggerFrames * 2} />
      ))}
    </div>
  );
};
