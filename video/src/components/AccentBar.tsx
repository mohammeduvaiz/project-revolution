import React from "react";
import { colors, layout } from "../theme";
import { useEnter } from "./useEnter";

type Props = { delay?: number; color?: string };

/** Short bar that draws in from the left; marks the start of a new idea. */
export const AccentBar: React.FC<Props> = ({ delay = 0, color = colors.turmeric }) => {
  const enter = useEnter(delay);
  return (
    <div
      style={{
        width: layout.accentBarWidth * enter,
        height: layout.accentBarHeight,
        borderRadius: layout.accentBarHeight,
        backgroundColor: color,
      }}
    />
  );
};
