import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cueFraction, type Cue, type Visual, type VisualEdge, type VisualNode } from "../../../shared/lesson-schema";
import { colors, diagram, fonts, layout, timing } from "../theme";
import { Icon } from "./Icon";

type Props = { visual: Visual; narration: string; audioFrames: number; rowHeight?: number };

const WIDTH = 1080 - layout.sidePadding * 2;

type Point = { x: number; y: number };

const centerOf = (node: VisualNode, rowHeight: number): Point => ({
  x: ((node.col + 0.5) * WIDTH) / diagram.columns,
  y: (node.row + 0.5) * rowHeight,
});

/** Converts a cue to a frame inside the scene. */
const useCueFrame = (narration: string, audioFrames: number) => (value: Cue): number =>
  Math.max(timing.staggerFrames, Math.round(cueFraction(narration, value) * audioFrames) - diagram.cueLeadFrames);

const Node: React.FC<{ node: VisualNode; rowHeight: number; appearAt: number; highlightAt: number | null; dimAt: number | null }> = ({ node, rowHeight, appearAt, highlightAt, dimAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - appearAt, fps, config: timing.popSpring });
  const highlighted = highlightAt !== null && frame >= highlightAt;
  const bump = highlightAt === null ? 0 : spring({ frame: frame - highlightAt, fps, config: timing.popSpring, durationInFrames: 20 });
  const pulse = highlighted ? 1 + 0.08 * Math.sin(Math.min(1, bump) * Math.PI) : 1;
  const dim = dimAt === null ? 1 : interpolate(frame, [dimAt, dimAt + 12], [1, diagram.dimOpacity], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const accent = highlighted ? colors.turmeric : colors.label;
  const c = centerOf(node, rowHeight);
  const scale = (0.6 + 0.4 * enter) * pulse;

  const label = node.label && (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginTop: 14,
        fontFamily: fonts.body,
        fontWeight: 700,
        fontSize: diagram.labelSize,
        color: highlighted ? colors.turmeric : colors.text,
        whiteSpace: "nowrap",
      }}
    >
      {node.label}
    </div>
  );

  return (
    <div
      style={{
        position: "absolute",
        left: c.x,
        top: c.y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: Math.min(1, enter) * dim,
      }}
    >
      {node.icon ? (
        <div
          style={{
            width: diagram.iconBox,
            height: diagram.iconBox,
            borderRadius: layout.radius,
            border: `${layout.border}px solid ${accent}`,
            backgroundColor: colors.inkRaised,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: highlighted ? `0 0 48px rgba(245, 184, 46, 0.25)` : "none",
          }}
        >
          <Icon name={node.icon} color={highlighted ? colors.turmeric : colors.text} activeFrames={highlightAt === null || !highlighted ? null : frame - highlightAt} frame={frame} />
        </div>
      ) : (
        <div
          style={{
            maxWidth: diagram.bubbleMaxWidth,
            padding: "22px 32px",
            borderRadius: 32,
            border: `${layout.border}px solid ${accent}`,
            backgroundColor: highlighted ? "rgba(245, 184, 46, 0.12)" : colors.inkRaised,
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: diagram.bubbleSize,
            color: colors.text,
            whiteSpace: "pre",
          }}
        >
          {node.text}
        </div>
      )}
      {label}
    </div>
  );
};

/** Half-size of what a node draws around its centre, with the label below counted when the arrow heads down. */
const halfSize = (node: VisualNode, goingDown: boolean): { w: number; h: number } => {
  const withLabel = Boolean(node.label) && goingDown;
  const labelHalfWidth = withLabel ? ((node.label?.length ?? 0) * diagram.labelSize * diagram.bubbleCharWidth) / 2 : 0;
  const labelHeight = withLabel ? diagram.labelBlock : 0;
  const shapeHalfWidth = node.icon
    ? diagram.iconBox / 2
    : Math.min(diagram.bubbleMaxWidth, (node.text?.length ?? 0) * diagram.bubbleSize * diagram.bubbleCharWidth + diagram.bubblePaddingX * 2) / 2;
  const shapeHalfHeight = node.icon ? diagram.iconBox / 2 : diagram.bubbleHeight / 2;
  return { w: Math.max(shapeHalfWidth, labelHalfWidth), h: shapeHalfHeight + labelHeight };
};

/** Distance from a node's centre to its outline along a direction, plus a small gap. */
const insetAlong = (node: VisualNode, ux: number, uy: number): number => {
  const { w, h } = halfSize(node, uy > 0.3);
  const tx = Math.abs(ux) < 1e-6 ? Infinity : w / Math.abs(ux);
  const ty = Math.abs(uy) < 1e-6 ? Infinity : h / Math.abs(uy);
  return Math.min(tx, ty) + diagram.edgeGap;
};

const Edge: React.FC<{ edge: VisualEdge; from: VisualNode; to: VisualNode; rowHeight: number; drawAt: number; flowAt: number | null }> = ({ from, to, rowHeight, drawAt, flowAt }) => {
  const frame = useCurrentFrame();
  const a = centerOf(from, rowHeight);
  const b = centerOf(to, rowHeight);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const ux = dx / dist;
  const uy = dy / dist;
  const startInset = insetAlong(from, ux, uy);
  const endInset = insetAlong(to, -ux, -uy);
  const p1 = { x: a.x + ux * startInset, y: a.y + uy * startInset };
  const p2 = { x: b.x - ux * endInset, y: b.y - uy * endInset };
  const length = Math.max(0, dist - startInset - endInset);
  const progress = interpolate(frame, [drawAt, drawAt + timing.arrowDrawFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (progress <= 0 || length <= 0) return null;

  const head = diagram.arrowHead;
  const angle = (Math.atan2(uy, ux) * 180) / Math.PI;

  let dot: Point | null = null;
  if (flowAt !== null) {
    const elapsed = frame - flowAt;
    const total = diagram.flowTravelFrames * diagram.flowRepeats;
    if (elapsed >= 0 && elapsed < total) {
      const t = (elapsed % diagram.flowTravelFrames) / diagram.flowTravelFrames;
      dot = { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
    }
  }

  return (
    <g>
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={colors.label}
        strokeWidth={diagram.strokeWidth}
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - progress)}
      />
      {progress >= 1 && (
        <path
          d={`M ${-head} ${-head * 0.7} L 0 0 L ${-head} ${head * 0.7}`}
          transform={`translate(${p2.x} ${p2.y}) rotate(${angle})`}
          fill="none"
          stroke={colors.label}
          strokeWidth={diagram.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {dot && <circle cx={dot.x} cy={dot.y} r={diagram.flowDotRadius} fill={colors.turmeric} />}
    </g>
  );
};

/** Nodes and arrows that build up as the narration mentions them. */
export const Diagram: React.FC<Props> = ({ visual, narration, audioFrames, rowHeight = diagram.rowHeight }) => {
  const toFrame = useCueFrame(narration, audioFrames);
  const appear = new Map(visual.nodes.map((n) => [n.id, toFrame(n.cue)]));
  const byId = new Map(visual.nodes.map((n) => [n.id, n]));
  const rows = Math.max(...visual.nodes.map((n) => n.row)) + 1;
  const height = rows * rowHeight;
  return (
    <div style={{ position: "relative", width: WIDTH, height, flexShrink: 0 }}>
      <svg width={WIDTH} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {visual.edges.map((edge, i) => {
          const from = byId.get(edge.from);
          const to = byId.get(edge.to);
          if (!from || !to) return null;
          const drawAt = edge.cue === undefined ? Math.max(appear.get(edge.from) ?? 0, appear.get(edge.to) ?? 0) : toFrame(edge.cue);
          return <Edge key={i} edge={edge} from={from} to={to} rowHeight={rowHeight} drawAt={drawAt} flowAt={edge.flowCue === undefined ? null : toFrame(edge.flowCue)} />;
        })}
      </svg>
      {visual.nodes.map((node) => (
        <Node
          key={node.id}
          node={node}
          rowHeight={rowHeight}
          appearAt={appear.get(node.id) ?? 0}
          highlightAt={node.highlightCue === undefined ? null : toFrame(node.highlightCue)}
          dimAt={node.dimCue === undefined ? null : toFrame(node.dimCue)}
        />
      ))}
    </div>
  );
};
