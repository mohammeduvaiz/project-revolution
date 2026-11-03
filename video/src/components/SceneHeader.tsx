import React from "react";
import { colors, fonts, type } from "../theme";
import { enterStyle, useEnter } from "./useEnter";

type Props = { index: number; label: string };

/** "02 — RAG" in uppercase mono. */
export const SceneHeader: React.FC<Props> = ({ index, label }) => {
  const enter = useEnter(0);
  return (
    <div
      style={{
        ...enterStyle(enter),
        fontFamily: fonts.label,
        fontSize: type.label,
        letterSpacing: type.labelTracking,
        textTransform: "uppercase",
        color: colors.label,
        display: "flex",
        gap: 24,
      }}
    >
      <span style={{ color: colors.teal }}>{String(index + 1).padStart(2, "0")}</span>
      <span>{label}</span>
    </div>
  );
};
