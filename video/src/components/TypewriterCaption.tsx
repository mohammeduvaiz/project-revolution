import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors, fonts, layout, timing, type } from "../theme";

type Props = { text: string; audioFrames: number };

/** Split by grapheme so Malayalam conjuncts never render half-typed. */
const graphemes = (text: string): string[] => {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(segmenter.segment(text), (s) => s.segment);
};

/** Reveals characters evenly across the first part of the audio, then holds. */
export const TypewriterCaption: React.FC<Props> = ({ text, audioFrames }) => {
  const frame = useCurrentFrame();
  const chars = useMemo(() => graphemes(text), [text]);
  const end = Math.max(1, audioFrames * timing.typewriterFraction);
  const shown = Math.round(interpolate(frame, [0, end], [0, chars.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const typing = shown < chars.length;
  return (
    <div
      style={{
        position: "absolute",
        left: layout.sidePadding,
        right: layout.sidePadding,
        bottom: layout.captionBottom,
        fontFamily: fonts.body,
        fontWeight: 700,
        fontSize: type.caption,
        lineHeight: type.bodyLineHeight,
        color: colors.text,
      }}
    >
      <span>{chars.slice(0, shown).join("")}</span>
      <span style={{ color: colors.turmeric, opacity: typing || Math.floor(frame / 15) % 2 === 0 ? 1 : 0 }}>▍</span>
      {/* Invisible remainder keeps line breaks stable while typing. */}
      <span style={{ visibility: "hidden" }}>{chars.slice(shown).join("")}</span>
    </div>
  );
};
