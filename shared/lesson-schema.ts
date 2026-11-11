import { z } from "zod";
import { TOPIC_ID_PATTERN } from "./curriculum-schema.ts";

export const NARRATION_MAX_CHARS = 2500;

const base = {
  id: z.string().min(1),
  label: z.string().min(1),
  narration: z
    .string()
    .min(1)
    .max(NARRATION_MAX_CHARS, `narration must be under ${NARRATION_MAX_CHARS} characters (Sarvam limit)`),
  caption: z.string().min(1),
};

/**
 * A cue says when something appears: a word or phrase from the scene's narration
 * (appears roughly when the voice says it), or a number 0–1 (fraction of the audio).
 */
const cue = z.union([z.string().min(1), z.number().min(0).max(1)]);

export const ICONS = [
  "question",
  "answer",
  "doc",
  "docs",
  "search",
  "prompt",
  "model",
  "weights",
  "examples",
  "pdf",
  "chatbot",
] as const;

const visualNode = z
  .object({
    id: z.string().min(1),
    /** Grid position: col 0–2 and row 0–2 (halves allowed). */
    col: z.number().min(0).max(2),
    row: z.number().min(0).max(2),
    icon: z.enum(ICONS).optional(),
    /** Speech-bubble text instead of an icon (e.g. a chat message). */
    text: z.string().min(1).max(28).optional(),
    label: z.string().min(1).max(22).optional(),
    cue,
    /** From this cue the node is highlighted in turmeric (and an icon like weights animates). */
    highlightCue: cue.optional(),
    /** From this cue the node fades back (e.g. an outdated answer). */
    dimCue: cue.optional(),
  })
  .refine((n) => Boolean(n.icon) !== Boolean(n.text), { message: "a visual node needs exactly one of icon or text" });

const visualEdge = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  /** When the arrow draws in. Defaults to when its later node appears. */
  cue: cue.optional(),
  /** When a dot travels along the arrow, showing something moving. */
  flowCue: cue.optional(),
});

/** Limits that keep a diagram readable on a phone. */
export const VISUAL_MAX_NODES = 5;
export const VISUAL_MAX_EDGES = 6;

const visualShape = {
  nodes: z
    .array(visualNode)
    .min(1, "a visual needs at least 1 node")
    .max(VISUAL_MAX_NODES, `a visual allows at most ${VISUAL_MAX_NODES} nodes`),
  edges: z.array(visualEdge).max(VISUAL_MAX_EDGES, `a visual allows at most ${VISUAL_MAX_EDGES} arrows`).default([]),
};

const visualSchema = z.object(visualShape);

/**
 * A visual that must be present: concept and example scenes.
 * Checked per scene (not in the lesson-level refine) so it's reported alongside every other problem.
 */
const requiredVisual = (sceneType: string) =>
  z.object(visualShape, {
    error: (issue) => (issue.input === undefined ? `${sceneType} scenes must have a visual` : undefined),
  });

const hookScene = z.object({ ...base, type: z.literal("hook"), headline: z.string().min(1), visual: visualSchema.optional() });

const conceptScene = z.object({
  ...base,
  type: z.literal("concept"),
  headline: z.string().min(1),
  body: z.string().optional(),
  visual: requiredVisual("concept"),
});

const flowStep = z.object({ title: z.string().min(1), sub: z.string().min(1) });

const flowScene = z.object({
  ...base,
  type: z.literal("flow"),
  headline: z.string().min(1),
  steps: z.array(flowStep).min(2).max(4),
});

const compareSide = z.object({ title: z.string().min(1), points: z.array(z.string().min(1)).min(1).max(3) });

const compareScene = z.object({ ...base, type: z.literal("compare"), left: compareSide, right: compareSide });

const takeawayScene = z.object({
  ...base,
  type: z.literal("takeaway"),
  headline: z.string().min(1),
  visual: visualSchema.optional(),
});

/** The real-life example. Every lesson needs at least one. */
const exampleScene = z.object({
  ...base,
  type: z.literal("example"),
  setup: z.string().min(1),
  payoff: z.string().min(1),
  visual: requiredVisual("example"),
});

export const CODE_LANGUAGES = ["c", "python", "java", "sql", "text"] as const;
export const CODE_MAX_LINES = 12;
export const CODE_MAX_LINE_CHARS = 32;

const codeScene = z.object({
  ...base,
  type: z.literal("code"),
  language: z.enum(CODE_LANGUAGES),
  lines: z
    .array(z.string().max(CODE_MAX_LINE_CHARS, `a code line is at most ${CODE_MAX_LINE_CHARS} characters`))
    .min(1)
    .max(CODE_MAX_LINES, `code is at most ${CODE_MAX_LINES} lines`),
  /** 1-based line numbers, highlighted in this order as the narration goes. */
  highlight: z.array(z.number().int().min(1)).default([]),
  visual: visualSchema.optional(),
});

const stepsScene = z.object({
  ...base,
  type: z.literal("steps"),
  headline: z.string().min(1),
  items: z.array(z.string().min(1)).min(2).max(6, "steps allows at most 6 items"),
  visual: visualSchema.optional(),
});

const tableScene = z.object({
  ...base,
  type: z.literal("table"),
  columns: z.array(z.string().min(1)).min(1).max(4, "a table allows at most 4 columns"),
  rows: z.array(z.array(z.string())).min(1).max(5, "a table allows at most 5 rows"),
  visual: visualSchema.optional(),
});

export const sceneSchema = z.discriminatedUnion("type", [
  hookScene,
  conceptScene,
  exampleScene,
  flowScene,
  compareScene,
  codeScene,
  stepsScene,
  tableScene,
  takeawayScene,
]);

const reviewSchema = z.object({
  status: z.enum(["pending", "approved", "changes"]),
  reviewer: z.string().min(1).optional(),
  notes: z.string().optional(),
});

const quizItem = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4, "a quiz question has exactly 4 options"),
  answer: z.number().int().min(0).max(3, "answer is the index (0–3) of the right option"),
});

export const lessonSchema = z
  .object({
    topicId: z.string().regex(TOPIC_ID_PATTERN, "topicId must look like PIC-4-01"),
    title: z.string().min(1),
    language: z.literal("ml-IN"),
    /** One sentence: the real-life example this reel uses. */
    example: z.string().min(1),
    review: reviewSchema,
    quiz: z.array(quizItem).length(3, "a quiz has exactly 3 questions").optional(),
    scenes: z.array(sceneSchema).min(4, "a lesson has 4–7 scenes").max(7, "a lesson has 4–7 scenes"),
  })
  .superRefine((lesson, ctx) => {
    if (lesson.review.status === "approved" && !lesson.review.reviewer) {
      ctx.addIssue({ code: "custom", path: ["review", "reviewer"], message: "an approved lesson must name its reviewer" });
    }
    if (!lesson.scenes.some((s) => s.type === "example")) {
      ctx.addIssue({ code: "custom", path: ["scenes"], message: "every lesson needs at least one example scene" });
    }
    const seen = new Set<string>();
    lesson.scenes.forEach((scene, i) => {
      if (seen.has(scene.id)) {
        ctx.addIssue({ code: "custom", path: ["scenes", i, "id"], message: `duplicate scene id "${scene.id}"` });
      }
      seen.add(scene.id);
      if (scene.type === "code") {
        scene.highlight.forEach((line, hi) => {
          if (line > scene.lines.length) {
            ctx.addIssue({ code: "custom", path: ["scenes", i, "highlight", hi], message: `line ${line} doesn't exist (code has ${scene.lines.length} lines)` });
          }
        });
      }
      if (scene.type === "table") {
        scene.rows.forEach((row, ri) => {
          if (row.length !== scene.columns.length) {
            ctx.addIssue({ code: "custom", path: ["scenes", i, "rows", ri], message: `row has ${row.length} cells but the table has ${scene.columns.length} columns` });
          }
        });
      }
      if (!("visual" in scene) || !scene.visual) return;
      const visual = scene.visual;
      const ids = new Set(visual.nodes.map((n) => n.id));
      const checkCue = (value: Cue | undefined, where: (string | number)[]): void => {
        if (typeof value === "string" && findCue(scene.narration, value) < 0) {
          ctx.addIssue({ code: "custom", path: ["scenes", i, "visual", ...where], message: `cue "${value}" is not in the narration` });
        }
      };
      visual.nodes.forEach((n, ni) => {
        checkCue(n.cue, ["nodes", ni, "cue"]);
        checkCue(n.highlightCue, ["nodes", ni, "highlightCue"]);
        checkCue(n.dimCue, ["nodes", ni, "dimCue"]);
      });
      visual.edges.forEach((e, ei) => {
        for (const end of ["from", "to"] as const) {
          if (!ids.has(e[end])) ctx.addIssue({ code: "custom", path: ["scenes", i, "visual", "edges", ei, end], message: `unknown node "${e[end]}"` });
        }
        checkCue(e.cue, ["edges", ei, "cue"]);
        checkCue(e.flowCue, ["edges", ei, "flowCue"]);
      });
    });
  });

export type Cue = z.infer<typeof cue>;
export type IconName = (typeof ICONS)[number];
export type Visual = z.infer<typeof visualSchema>;
export type VisualNode = z.infer<typeof visualNode>;
export type VisualEdge = z.infer<typeof visualEdge>;

/** Character index of a cue phrase in the narration (case-insensitive), or -1. */
export const findCue = (narration: string, phrase: string): number => narration.toLowerCase().indexOf(phrase.toLowerCase());

/** Fraction (0–1) of the narration at which a cue happens. Estimated by character position. */
export const cueFraction = (narration: string, value: Cue): number => {
  if (typeof value === "number") return value;
  const index = findCue(narration, value);
  return index < 0 ? 0 : index / Math.max(1, narration.length);
};

export type Lesson = z.infer<typeof lessonSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type SceneType = Scene["type"];
export type FlowStep = z.infer<typeof flowStep>;
export type CompareSide = z.infer<typeof compareSide>;
export type Review = z.infer<typeof reviewSchema>;
export type QuizItem = z.infer<typeof quizItem>;

export const manifestSchema = z.object({
  /** Lesson id: lowercase topic ID (pic-4-01). */
  lessonId: z.string(),
  speaker: z.string(),
  scenes: z.array(
    z.object({
      id: z.string(),
      file: z.string(),
      durationInSeconds: z.number().positive(),
      hash: z.string(),
    }),
  ),
});

export type Manifest = z.infer<typeof manifestSchema>;
export type ManifestScene = Manifest["scenes"][number];

/** Turns a zod path like ["scenes", 2, "steps", 0] into a readable location, naming the scene id. */
const describePath = (raw: unknown, path: ReadonlyArray<PropertyKey>): string => {
  if (path[0] === "scenes" && typeof path[1] === "number") {
    const scenes = (raw as { scenes?: Array<{ id?: unknown }> } | null)?.scenes;
    const id = scenes?.[path[1]]?.id;
    const sceneName = typeof id === "string" ? `scene "${id}"` : `scene #${path[1] + 1}`;
    const rest = path.slice(2).map(String).join(".");
    return rest ? `${sceneName} → ${rest}` : sceneName;
  }
  return path.map(String).join(".") || "(root)";
};

/** Validates lesson JSON. Throws one error listing every problem with the scene id it belongs to. */
export const parseLesson = (raw: unknown, source: string): Lesson => {
  const result = lessonSchema.safeParse(raw);
  if (result.success) return result.data;
  const lines = result.error.issues.map((issue) => `  - ${describePath(raw, issue.path)}: ${issue.message}`);
  throw new Error(`Invalid lesson in ${source}:\n${lines.join("\n")}`);
};

export const parseManifest = (raw: unknown, source: string): Manifest => {
  const result = manifestSchema.safeParse(raw);
  if (result.success) return result.data;
  const lines = result.error.issues.map((issue) => `  - ${issue.path.map(String).join(".")}: ${issue.message}`);
  throw new Error(`Invalid manifest in ${source}:\n${lines.join("\n")}`);
};

/** Folders under video/public/. Draft audio is for Studio previews only and is never used by a publishing render. */
export const AUDIO_DIR = "audio";
export const DRAFT_AUDIO_DIR = "audio-draft";

/** Audio file name for a scene, by 1-based position. */
export const sceneAudioFile = (index: number): string => `scene-${index + 1}.wav`;
