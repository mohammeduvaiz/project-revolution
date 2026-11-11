import React from "react";
import { useCurrentFrame } from "remotion";
import { colors, fonts, layout, steps, timing, type } from "../theme";
import { enterStyle, useEnter } from "./useEnter";

type Props = { items: string[]; audioFrames: number };

const Step: React.FC<{ index: number; text: string; delay: number; isNewest: boolean }> = ({ index, text, delay, isNewest }) => {
  const enter = useEnter(delay);
  const accent = isNewest ? colors.turmeric : colors.teal;
  return (
    <div style={{ ...enterStyle(enter), display: "flex", alignItems: "flex-start", gap: 28 }}>
      <div
        style={{
          width: steps.numberSize,
          height: steps.numberSize,
          flexShrink: 0,
          borderRadius: steps.numberSize / 2,
          border: `${layout.border}px solid ${accent}`,
          backgroundColor: isNewest ? accent : colors.inkRaised,
          color: isNewest ? colors.ink : accent,
          fontFamily: fonts.label,
          fontSize: steps.numberFontSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {index + 1}
      </div>
      <div
        style={{
          fontFamily: fonts.body,
          fontWeight: isNewest ? 700 : 500,
          fontSize: steps.fontSize,
          lineHeight: type.bodyLineHeight,
          color: colors.text,
          paddingTop: (steps.numberSize - steps.fontSize * type.bodyLineHeight) / 2,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Numbered steps that appear one at a time; the newest one is marked in turmeric. */
export const StepList: React.FC<Props> = ({ items, audioFrames }) => {
  const frame = useCurrentFrame();
  const interval = (audioFrames * steps.revealFraction) / Math.max(1, items.length);
  const delays = items.map((_, i) => Math.round(timing.staggerFrames * 2 + i * interval));
  const newest = delays.reduce((last, d, i) => (frame >= d ? i : last), -1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: steps.gap }}>
      {items.map((text, i) => (
        <Step key={i} index={i} text={text} delay={delays[i] ?? 0} isNewest={i === newest} />
      ))}
    </div>
  );
};
