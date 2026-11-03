import React from "react";
import { interpolate } from "remotion";
import type { IconName } from "../../../shared/lesson-schema";
import { colors, diagram } from "../theme";

type Props = {
  name: IconName;
  color: string;
  /** Frames since the icon became active (highlighted), or null. Drives icon-specific motion. */
  activeFrames: number | null;
  frame: number;
};

const sw = diagram.strokeWidth;
const common = { fill: "none", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** 3×3 weights. Cells settle into a new pattern after the icon becomes active (training). */
const Weights: React.FC<{ color: string; activeFrames: number | null; frame: number }> = ({ color, activeFrames, frame }) => {
  const before = [0.9, 0.3, 0.6, 0.4, 1, 0.3, 0.7, 0.4, 0.8];
  const after = [0.3, 1, 0.4, 0.9, 0.5, 1, 0.3, 0.8, 0.4];
  const t = activeFrames === null ? 0 : interpolate(activeFrames, [0, diagram.weightsShuffleFrames], [0, 1], { extrapolateRight: "clamp" });
  const shuffling = t > 0 && t < 1;
  return (
    <g>
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => {
          const i = r * 3 + c;
          const flicker = shuffling ? (Math.sin(frame * 0.9 + i * 2.3) + 1) / 2 : 0;
          const base = (before[i] ?? 0.5) * (1 - t) + (after[i] ?? 0.5) * t;
          const opacity = shuffling ? 0.25 + 0.75 * flicker : base;
          return <circle key={i} cx={24 + c * 24} cy={24 + r * 24} r={8} fill={activeFrames === null ? colors.teal : color} opacity={opacity} />;
        }),
      )}
      {[0, 1, 2].map((r) => (
        <line key={`h${r}`} x1={24} y1={24 + r * 24} x2={72} y2={24 + r * 24} stroke={colors.label} strokeWidth={2} opacity={0.35} />
      ))}
      {[0, 1, 2].map((c) => (
        <line key={`v${c}`} x1={24 + c * 24} y1={24} x2={24 + c * 24} y2={72} stroke={colors.label} strokeWidth={2} opacity={0.35} />
      ))}
    </g>
  );
};

const Page: React.FC<{ x: number; y: number; color: string; lines?: number }> = ({ x, y, color, lines = 3 }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 0 H30 L44 14 V60 H0 Z" stroke={color} {...common} />
    <path d="M30 0 V14 H44" stroke={color} {...common} />
    {Array.from({ length: lines }, (_, i) => (
      <line key={i} x1={9} y1={26 + i * 10} x2={35} y2={26 + i * 10} stroke={color} {...common} strokeWidth={3} />
    ))}
  </g>
);

export const Icon: React.FC<Props> = ({ name, color, activeFrames, frame }) => {
  const size = diagram.iconSize;
  const body = ((): React.ReactNode => {
    switch (name) {
      case "question":
        return (
          <g>
            <path d="M14 20 H82 V62 H40 L24 76 V62 H14 Z" stroke={color} {...common} />
            <text x={48} y={54} textAnchor="middle" fontSize={34} fontWeight={800} fill={color} fontFamily="sans-serif">?</text>
          </g>
        );
      case "answer":
        return (
          <g>
            <path d="M14 20 H82 V62 H72 V76 L56 62 H14 Z" stroke={color} {...common} />
            <line x1={26} y1={34} x2={70} y2={34} stroke={color} {...common} />
            <line x1={26} y1={48} x2={56} y2={48} stroke={color} {...common} />
          </g>
        );
      case "doc":
        return <Page x={26} y={18} color={color} />;
      case "docs":
        return (
          <g>
            <Page x={16} y={12} color={colors.label} lines={0} />
            <Page x={34} y={24} color={color} />
          </g>
        );
      case "search":
        return (
          <g>
            <circle cx={42} cy={42} r={20} stroke={color} {...common} />
            <line x1={57} y1={57} x2={76} y2={76} stroke={color} {...common} strokeWidth={sw + 2} />
          </g>
        );
      case "prompt":
        return (
          <g>
            <rect x={12} y={20} width={72} height={56} rx={8} stroke={color} {...common} />
            <path d="M24 38 L34 46 L24 54" stroke={color} {...common} />
            <line x1={40} y1={56} x2={60} y2={56} stroke={color} {...common} />
            <circle cx={70} cy={20} r={10} fill={colors.turmeric} />
            <line x1={70} y1={15} x2={70} y2={25} stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
            <line x1={65} y1={20} x2={75} y2={20} stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
          </g>
        );
      case "model":
        return (
          <g>
            <rect x={22} y={22} width={52} height={52} rx={10} stroke={color} {...common} />
            {[34, 48, 62].map((p) => (
              <g key={p}>
                <line x1={p} y1={10} x2={p} y2={22} stroke={color} {...common} />
                <line x1={p} y1={74} x2={p} y2={86} stroke={color} {...common} />
                <line x1={10} y1={p} x2={22} y2={p} stroke={color} {...common} />
                <line x1={74} y1={p} x2={86} y2={p} stroke={color} {...common} />
              </g>
            ))}
            <text x={48} y={56} textAnchor="middle" fontSize={20} fontWeight={800} fill={color} fontFamily="sans-serif">AI</text>
          </g>
        );
      case "weights":
        return <Weights color={color} activeFrames={activeFrames} frame={frame} />;
      case "examples":
        return (
          <g>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={18 + i * 6} y={18 + i * 12} width={56} height={34} rx={6} stroke={i === 2 ? color : colors.label} {...common} fill={colors.inkRaised} />
            ))}
            <path d="M40 64 L48 72 L64 54" stroke={colors.teal} {...common} />
          </g>
        );
      case "pdf":
        return (
          <g>
            <Page x={26} y={14} color={color} lines={0} />
            <rect x={20} y={46} width={44} height={20} rx={4} fill={colors.turmeric} />
            <text x={42} y={61} textAnchor="middle" fontSize={15} fontWeight={800} fill={colors.ink} fontFamily="sans-serif">PDF</text>
          </g>
        );
      case "chatbot":
        return (
          <g>
            <rect x={26} y={8} width={44} height={80} rx={10} stroke={color} {...common} />
            <rect x={32} y={22} width={24} height={12} rx={6} fill={colors.label} opacity={0.6} />
            <rect x={40} y={40} width={24} height={12} rx={6} fill={colors.teal} />
            <rect x={32} y={58} width={20} height={12} rx={6} fill={colors.label} opacity={0.6} />
          </g>
        );
      default: {
        const unreachable: never = name;
        throw new Error(`Unknown icon ${String(unreachable)}`);
      }
    }
  })();
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      {body}
    </svg>
  );
};
