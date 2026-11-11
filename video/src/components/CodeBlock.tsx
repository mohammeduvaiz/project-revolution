import React, { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { code, colors, fonts, layout, timing } from "../theme";
import { tokenizeLine, type CodeLanguage } from "./syntax";

type Props = {
  lines: string[];
  language: CodeLanguage;
  /** 1-based line numbers, highlighted in this order. */
  highlight: number[];
  audioFrames: number;
};

/**
 * Lines reveal top to bottom across the first part of the audio, then the highlight
 * steps through `highlight` evenly across the rest, dimming the other lines.
 */
export const CodeBlock: React.FC<Props> = ({ lines, language, highlight, audioFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tokens = useMemo(() => lines.map((l) => tokenizeLine(l, language)), [lines, language]);

  const revealEnd = audioFrames * code.revealFraction;
  const revealStep = revealEnd / Math.max(1, lines.length);
  const slot = (audioFrames - revealEnd) / Math.max(1, highlight.length);
  const highlighting = highlight.length > 0 && frame >= revealEnd;
  const step = highlighting ? Math.min(highlight.length - 1, Math.floor((frame - revealEnd) / slot)) : -1;
  const activeLine = step >= 0 ? highlight[step] : undefined;
  const stepStart = revealEnd + Math.max(0, step) * slot;
  const tint = highlighting ? spring({ frame: frame - stepStart, fps, config: timing.spring, durationInFrames: 12 }) : 0;
  const dim = highlight.length
    ? interpolate(frame, [revealEnd, revealEnd + timing.sceneFadeFrames], [1, code.dimOpacity], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const rowHeight = code.fontSize * code.lineHeight;

  return (
    <div
      style={{
        borderRadius: layout.radius,
        border: `${layout.border}px solid ${colors.label}`,
        backgroundColor: colors.inkRaised,
        padding: `${code.paddingY}px 0`,
        fontFamily: fonts.label,
        fontSize: code.fontSize,
        lineHeight: `${rowHeight}px`,
      }}
    >
      {tokens.map((lineTokens, i) => {
        const lineNumber = i + 1;
        const appear = spring({ frame: frame - Math.round(i * revealStep), fps, config: timing.spring });
        const isActive = lineNumber === activeLine;
        return (
          <div
            key={i}
            style={{
              position: "relative",
              display: "flex",
              padding: `0 ${code.paddingX}px 0 0`,
              opacity: appear * (isActive ? 1 : dim),
              transform: `translateX(${(1 - appear) * 24}px)`,
              backgroundColor: isActive ? `rgba(${code.highlightRgb}, ${code.highlightAlpha * tint})` : "transparent",
              whiteSpace: "pre",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: code.highlightBar,
                backgroundColor: colors.turmeric,
                opacity: isActive ? tint : 0,
              }}
            />
            <span style={{ width: code.lineNumberWidth + code.paddingX, textAlign: "right", paddingRight: 24, color: colors.label, flexShrink: 0 }}>
              {lineNumber}
            </span>
            <span>
              {lineTokens.map((t, ti) => (
                <span key={ti} style={{ color: code.syntax[t.kind], fontStyle: t.kind === "comment" ? "italic" : "normal" }}>
                  {t.text}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
};
