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
  /** Scene content starts below the progress bar and the subject badge row. */
  topPadding: 232,
  /** Subject badge row, shown on every scene. */
  badgeTop: 136,
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
  /** Extra hold after the last scene's audio so the takeaway can land before the end card. */
  endHoldFrames: 24,
  /** The end card naming the next topic. */
  endCardFrames: 90,
  /** Example scenes reveal their payoff line at this fraction of the audio. */
  examplePayoffAt: 0.6,
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
  /** Shorter rows for scenes with text above and below the diagram (example). */
  compactRowHeight: 300,
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

/** Subject badge and "S2 · Module 4" label at the top of every reel. */
export const badge = {
  height: 52,
  paddingX: 22,
  fontSize: 30,
  radius: 12,
  gap: 20,
} as const;

/** Example scene: the setup line above the diagram, the payoff line below it. */
export const exampleScene = {
  setupSize: 52,
  payoffSize: 56,
} as const;

/** Code scene: block styling, syntax colours and reveal timing. */
export const code = {
  fontSize: 36,
  lineHeight: 1.5,
  paddingX: 36,
  paddingY: 30,
  lineNumberWidth: 56,
  highlightBar: 6,
  /** Lines reveal across this fraction of the audio; highlights use the rest. */
  revealFraction: 0.4,
  /** Non-highlighted lines fade to this once highlighting starts. */
  dimOpacity: 0.45,
  /** Active line tint: turmeric at this alpha. */
  highlightRgb: "245, 184, 46",
  highlightAlpha: 0.14,
  syntax: {
    plain: "#F4EFE6",
    keyword: "#2DD4BF",
    type: "#8EC5FF",
    string: "#F2C879",
    number: "#F59E6B",
    comment: "#8FA3B5",
    preprocessor: "#C9A7F5",
    punctuation: "#B8C4CF",
  },
} as const;

/** Steps scene: a numbered procedure revealed one item at a time. */
export const steps = {
  numberSize: 64,
  numberFontSize: 30,
  fontSize: 46,
  gap: 26,
  /** Items appear one by one across this fraction of the audio (CLAUDE.md: first half). */
  revealFraction: 0.5,
} as const;

/** Table scene: a small table whose rows appear one at a time. */
export const table = {
  fontSize: 44,
  headerFontSize: 28,
  cellPaddingX: 22,
  cellPaddingY: 20,
  newestFill: "rgba(245, 184, 46, 0.10)",
  /** Rows appear one by one across this fraction of the audio (CLAUDE.md: first half). */
  revealFraction: 0.5,
} as const;
