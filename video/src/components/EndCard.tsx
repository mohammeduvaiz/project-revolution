import React from "react";
import { AbsoluteFill } from "remotion";
import type { ReelInfo } from "../LessonVideo";
import { colors, fonts, layout, timing, type } from "../theme";
import { AccentBar } from "./AccentBar";
import { Headline } from "./Headline";
import { enterStyle, useEnter } from "./useEnter";

type Props = { reel: ReelInfo };

const MonoLine: React.FC<{ text: string; color: string; delay: number }> = ({ text, color, delay }) => {
  const enter = useEnter(delay);
  return (
    <div style={{ ...enterStyle(enter), fontFamily: fonts.label, fontSize: type.label, letterSpacing: type.labelTracking, textTransform: "uppercase", color }}>
      {text}
    </div>
  );
};

/** Last few seconds of a reel: the next topic in the module, or "module complete". */
export const EndCard: React.FC<Props> = ({ reel }) => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        top: layout.topPadding,
        left: layout.sidePadding,
        right: layout.sidePadding,
        bottom: layout.captionZone,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: layout.gap,
      }}
    >
      {reel.next ? (
        <>
          <MonoLine text={`Next in Module ${reel.moduleNumber}`} color={colors.label} delay={0} />
          <AccentBar delay={timing.staggerFrames} color={colors.teal} />
          <Headline text={reel.next.title} delay={timing.staggerFrames * 2} />
          <MonoLine text={reel.next.id} color={colors.teal} delay={timing.staggerFrames * 3} />
        </>
      ) : (
        <>
          <MonoLine text={`Module ${reel.moduleNumber} complete`} color={colors.label} delay={0} />
          <AccentBar delay={timing.staggerFrames} />
          <Headline text={reel.moduleTheme} delay={timing.staggerFrames * 2} />
          <MonoLine text={reel.subjectName} color={colors.teal} delay={timing.staggerFrames * 3} />
        </>
      )}
    </div>
  </AbsoluteFill>
);
