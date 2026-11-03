import React from "react";
import { colors, fonts, type } from "../theme";
import { enterStyle, useEnter } from "./useEnter";

/** Keeps hyphenated words ("Fine-Tuning") on one line and honours explicit "\n" breaks. */
const renderText = (text: string): React.ReactNode =>
  text.split("\n").map((line, li) => (
    <React.Fragment key={li}>
      {li > 0 && <br />}
      {line.split(" ").map((word, wi) => (
        <React.Fragment key={wi}>
          {wi > 0 && " "}
          {word.includes("-") ? <span style={{ whiteSpace: "nowrap" }}>{word}</span> : word}
        </React.Fragment>
      ))}
    </React.Fragment>
  ));

type Props = {
  text: string;
  size?: number;
  color?: string;
  delay?: number;
  align?: "left" | "center";
};

export const Headline: React.FC<Props> = ({ text, size = type.headline, color = colors.text, delay = 0, align = "left" }) => {
  const enter = useEnter(delay);
  return (
    <h1
      style={{
        ...enterStyle(enter),
        margin: 0,
        fontFamily: fonts.headline,
        fontWeight: 800,
        fontSize: size,
        lineHeight: type.lineHeight,
        letterSpacing: "-0.02em",
        color,
        textAlign: align,
      }}
    >
      {renderText(text)}
    </h1>
  );
};
