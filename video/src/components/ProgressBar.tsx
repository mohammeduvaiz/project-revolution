import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { colors, layout } from "../theme";

/** Position across the whole video. Must be rendered outside the scene Series. */
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = Math.min(1, frame / Math.max(1, durationInFrames - 1));
  const trackStyle: React.CSSProperties = {
    position: "absolute",
    top: layout.progressTop,
    left: layout.sidePadding,
    right: layout.sidePadding,
    height: layout.progressHeight,
    borderRadius: layout.progressHeight,
    backgroundColor: colors.track,
    overflow: "hidden",
  };
  return (
    <div style={trackStyle}>
      <div style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: colors.teal, borderRadius: layout.progressHeight }} />
    </div>
  );
};
