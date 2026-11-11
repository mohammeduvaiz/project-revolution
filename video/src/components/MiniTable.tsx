import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, layout, table, timing, type } from "../theme";

type Props = { columns: string[]; rows: string[][]; audioFrames: number };

/** Cells without letters (operators, numbers, 0/1 truth values) read better in monospace. */
const isSymbolic = (value: string): boolean => value.trim() !== "" && !/\p{L}/u.test(value);

/** Header first, then each row slides in; the newest row is tinted turmeric. */
export const MiniTable: React.FC<Props> = ({ columns, rows, audioFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const interval = (audioFrames * table.revealFraction) / Math.max(1, rows.length);
  const delays = rows.map((_, i) => Math.round(timing.staggerFrames * 2 + i * interval));
  const newest = delays.reduce((last, d, i) => (frame >= d ? i : last), -1);
  const header = spring({ frame: frame - timing.staggerFrames, fps, config: timing.spring });
  const cell: React.CSSProperties = { padding: `${table.cellPaddingY}px ${table.cellPaddingX}px`, textAlign: "left", verticalAlign: "top" };

  return (
    <div style={{ borderRadius: layout.radius, border: `${layout.border}px solid ${colors.label}`, backgroundColor: colors.inkRaised, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ opacity: header, borderBottom: `${layout.border}px solid ${colors.label}` }}>
            {columns.map((c) => (
              <th
                key={c}
                style={{
                  ...cell,
                  fontFamily: fonts.label,
                  fontWeight: 500,
                  fontSize: table.headerFontSize,
                  letterSpacing: type.labelTracking,
                  textTransform: "uppercase",
                  color: colors.label,
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const appear = spring({ frame: frame - (delays[ri] ?? 0), fps, config: timing.spring });
            const isNewest = ri === newest;
            return (
              <tr
                key={ri}
                style={{
                  opacity: appear,
                  transform: `translateY(${(1 - appear) * 20}px)`,
                  backgroundColor: isNewest ? table.newestFill : "transparent",
                  borderTop: ri > 0 ? `1px solid ${colors.track}` : "none",
                }}
              >
                {row.map((value, ci) => (
                  <td
                    key={ci}
                    style={{
                      ...cell,
                      fontFamily: isSymbolic(value) ? fonts.label : fonts.body,
                      fontWeight: isNewest ? 700 : 500,
                      fontSize: table.fontSize,
                      lineHeight: type.lineHeight,
                      color: ci === 0 ? colors.teal : isNewest ? colors.turmeric : colors.text,
                      whiteSpace: isSymbolic(value) ? "pre" : "normal",
                    }}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
