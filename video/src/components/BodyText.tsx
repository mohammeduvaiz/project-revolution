import React from "react";
import { colors, fonts, type } from "../theme";
import { enterStyle, useEnter } from "./useEnter";

type Props = { text: string; delay?: number };

export const BodyText: React.FC<Props> = ({ text, delay = 0 }) => {
  const enter = useEnter(delay);
  return (
    <p
      style={{
        ...enterStyle(enter),
        margin: 0,
        fontFamily: fonts.body,
        fontWeight: 500,
        fontSize: type.body,
        lineHeight: type.bodyLineHeight,
        color: colors.label,
      }}
    >
      {text}
    </p>
  );
};
