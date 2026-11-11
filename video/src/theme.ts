import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadMalayalam } from "@remotion/google-fonts/NotoSansMalayalam";
import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";

const manrope = loadManrope("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });
const malayalam = loadMalayalam("normal", { weights: ["500", "700"], subsets: ["malayalam", "latin"] });
const plexMono = loadPlexMono("normal", { weights: ["500"], subsets: ["latin"] });

/** "Backwater dusk" palette. Components read colors only from here. */
export const colors = {
  ink: "#0B1622",
  inkRaised: "#122233",
  teal: "#2DD4BF",
  turmeric: "#F5B82E",
  text: "#F4EFE6",
  label: "#8FA3B5",
  track: "rgba(143, 163, 181, 0.18)",
} as const;

/** Malayalam is listed second in every stack so mixed text falls back per glyph. */
export const fonts = {
  headline: `${manrope.fontFamily}, ${malayalam.fontFamily}, sans-serif`,
  body: `${manrope.fontFamily}, ${malayalam.fontFamily}, sans-serif`,
  label: `${plexMono.fontFamily}, ${malayalam.fontFamily}, monospace`,
} as const;

export const video = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/** Sizes in px. Minimums from CLAUDE.md: headline ≥ 88, body ≥ 44, caption ≥ 40. */
export const type = {
  hero: 120,
  headline: 96,
  cardTitle: 64,
  body: 48,
  point: 46,
  caption: 44,
  label: 32,
  stepTitle: 56,
  stepSub: 40,
  labelTracking: "0.18em",
  lineHeight: 1.15,
  bodyLineHeight: 1.35,
} as const;

export const layout = {
  sidePadding: 80,
  topPadding: 200,
  progressTop: 96,
  progressHeight: 8,
  /** Reserved for the caption only. */
  captionZone: 280,
  captionBottom: 110,
  radius: 20,
  border: 2,
  gap: 40,
  accentBarWidth: 120,
  accentBarHeight: 10,
} as const;

export const timing = {
  /** Frames of silence after each scene's audio. */
  tailFrames: 12,
  /** Extra hold at the very end of the video so the takeaway can land. */
  endHoldFrames: 66,
  /** The whole frame (background included) fades to ink over the last frames of the video. */
  outroFadeFrames: 24,
  /** Used when no manifest / audio exists for a scene. */
  fallbackSceneSeconds: 8,
  /** Caption types out across this fraction of the audio, then holds. */
  typewriterFraction: 0.8,
  /** Flow boxes are spread across this fraction of the scene. */
  flowSpreadFraction: 0.5,
  /** Frames for an arrow to draw between flow boxes. */
  arrowDrawFrames: 10,
  /** Delay between staggered items (points, header, headline). */
  staggerFrames: 6,
  sceneFadeFrames: 8,
  spring: { damping: 200, stiffness: 120, mass: 0.8 },
  popSpring: { damping: 14, stiffness: 140, mass: 0.7 },
  enterOffset: 48,
} as const;

export const background = {
  blur: 140,
  blobs: [
    { color: colors.teal, size: 760, x: 0.15, y: 0.18, driftX: 90, driftY: 70, period: 420, opacity: 0.22 },
    { color: colors.turmeric, size: 620, x: 0.85, y: 0.55, driftX: 70, driftY: 110, period: 520, opacity: 0.14 },
    { color: colors.teal, size: 540, x: 0.35, y: 0.88, driftX: 110, driftY: 60, period: 610, opacity: 0.12 },
  ],
} as const;

/** Animated diagrams (scene.visual). Grid is 3 columns across the safe area. */
export const diagram = {
  columns: 3,
  rowHeight: 340,
  iconBox: 168,
  iconSize: 92,
  /** Height of the label block under an icon box; arrows leaving downward clear it. */
  labelBlock: 62,
  /** Gap between an arrow's end and the node it touches. */
  edgeGap: 18,
  bubbleHeight: 96,
  /** Rough text width per character, used to keep arrows off bubbles. */
  bubbleCharWidth: 0.56,
  bubblePaddingX: 32,
  bubbleMaxWidth: 420,
  labelSize: 36,
  bubbleSize: 40,
  strokeWidth: 4,
  arrowHead: 16,
  /** Elements appear this many frames before their cue word, to feel in sync. */
  cueLeadFrames: 4,
  flowDotRadius: 12,
  flowTravelFrames: 24,
  flowRepeats: 2,
  weightsShuffleFrames: 36,
  dimOpacity: 0.3,
} as const;
