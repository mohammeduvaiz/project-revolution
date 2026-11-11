import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SceneHeader } from "../components/SceneHeader";
import { TypewriterCaption } from "../components/TypewriterCaption";
import { layout, timing } from "../theme";

export type SceneTimingProps = {
  index: number;
  audioFrames: number;
  durationInFrames: number;
  /** The last scene skips its own fade-out; the whole video fades out instead. */
  isLast: boolean;
};

type Props = SceneTimingProps & {
  label: string;
  caption: string;
  /** Vertically center the content instead of stacking from the top. */
  centered?: boolean;
  children: React.ReactNode;
};

/** Shared scene chrome: safe area, header, caption and a short fade in/out. */
export const SceneFrame: React.FC<Props> = ({ index, label, caption, audioFrames, durationInFrames, isLast, centered = false, children }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, timing.sceneFadeFrames], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = isLast
    ? 1
    : interpolate(frame, [durationInFrames - timing.sceneFadeFrames, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const fade = Math.min(fadeIn, fadeOut);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <div
        style={{
          position: "absolute",
          top: layout.topPadding,
          left: layout.sidePadding,
          right: layout.sidePadding,
          bottom: layout.captionZone,
          display: "flex",
          flexDirection: "column",
          gap: layout.gap,
        }}
      >
        <SceneHeader index={index} label={label} />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: centered ? "center" : "flex-start",
            gap: layout.gap,
            paddingTop: centered ? 0 : layout.gap,
          }}
        >
          {children}
        </div>
      </div>
      <TypewriterCaption text={caption} audioFrames={audioFrames} />
    </AbsoluteFill>
  );
};
