import React from "react";
import type { Scene } from "../../../shared/lesson-schema";
import { CodeBlock } from "../components/CodeBlock";
import { DiagramArea } from "../components/DiagramArea";
import { enterStyle, useEnter } from "../components/useEnter";
import { diagram, timing } from "../theme";
import { SceneFrame, type SceneTimingProps } from "./SceneFrame";

type Props = SceneTimingProps & { scene: Extract<Scene, { type: "code" }> };

/** A short program revealed line by line, then walked through with a moving highlight. */
export const CodeScene: React.FC<Props> = ({ scene, ...t }) => {
  const enter = useEnter(timing.staggerFrames);
  return (
    <SceneFrame {...t} label={scene.label} caption={scene.caption} centered={!scene.visual}>
      <div style={enterStyle(enter)}>
        <CodeBlock lines={scene.lines} language={scene.language} highlight={scene.highlight} audioFrames={t.audioFrames} />
      </div>
      {scene.visual && (
        <DiagramArea visual={scene.visual} narration={scene.narration} audioFrames={t.audioFrames} rowHeight={diagram.compactRowHeight} />
      )}
    </SceneFrame>
  );
};
