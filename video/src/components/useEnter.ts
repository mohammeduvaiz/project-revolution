import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { timing } from "../theme";

/** 0→1 spring that starts at `delay` frames into the current sequence. */
export const useEnter = (delay = 0, config: typeof timing.spring | typeof timing.popSpring = timing.spring): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

/** Style for an element sliding up and fading in with an enter value. */
export const enterStyle = (progress: number): React.CSSProperties => ({
  opacity: progress,
  transform: `translateY(${(1 - progress) * timing.enterOffset}px)`,
});
