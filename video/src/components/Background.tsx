import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { background, colors, video } from "../theme";

/** Slow, deterministic drift of blurred shapes behind everything. */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink, overflow: "hidden" }}>
      {background.blobs.map((blob, i) => {
        const phase = (frame / blob.period) * Math.PI * 2;
        const x = blob.x * video.width + Math.sin(phase + i) * blob.driftX - blob.size / 2;
        const y = blob.y * video.height + Math.cos(phase * 0.8 + i * 2) * blob.driftY - blob.size / 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: blob.size,
              height: blob.size,
              borderRadius: "50%",
              backgroundColor: blob.color,
              opacity: blob.opacity,
              filter: `blur(${background.blur}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
