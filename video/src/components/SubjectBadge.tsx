import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { ReelInfo } from "../LessonVideo";
import { badge, colors, fonts, layout, timing, type } from "../theme";

type Props = { reel: ReelInfo; draftVoice: boolean };

/** "PIC  S2 · MODULE 4" at the top of every scene, so a student knows where the reel fits. */
export const SubjectBadge: React.FC<Props> = ({ reel, draftVoice }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, timing.sceneFadeFrames * 2], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: layout.badgeTop,
        left: layout.sidePadding,
        right: layout.sidePadding,
        height: badge.height,
        display: "flex",
        alignItems: "center",
        gap: badge.gap,
        opacity,
      }}
    >
      <div
        style={{
          height: badge.height,
          padding: `0 ${badge.paddingX}px`,
          borderRadius: badge.radius,
          backgroundColor: colors.turmeric,
          color: colors.ink,
          fontFamily: fonts.label,
          fontWeight: 500,
          fontSize: badge.fontSize,
          letterSpacing: "0.08em",
          display: "flex",
          alignItems: "center",
        }}
      >
        {reel.subjectCode}
      </div>
      <div style={{ fontFamily: fonts.label, fontSize: type.label, letterSpacing: type.labelTracking, textTransform: "uppercase", color: colors.label }}>
        {reel.sem} · Module {reel.moduleNumber}
      </div>
      {draftVoice && (
        <div
          style={{
            marginLeft: "auto",
            padding: `0 ${badge.paddingX / 2}px`,
            height: badge.height,
            borderRadius: badge.radius,
            border: `${layout.border}px dashed ${colors.label}`,
            fontFamily: fonts.label,
            fontSize: type.label * 0.8,
            letterSpacing: type.labelTracking,
            color: colors.label,
            display: "flex",
            alignItems: "center",
          }}
        >
          DRAFT VOICE
        </div>
      )}
    </div>
  );
};
