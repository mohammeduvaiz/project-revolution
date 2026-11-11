import React from "react";
import type { Scene } from "../../../shared/lesson-schema";
import { DiagramArea } from "../components/DiagramArea";
import { MiniTable } from "../components/MiniTable";
import { diagram } from "../theme";
import { SceneFrame, type SceneTimingProps } from "./SceneFrame";

type Props = SceneTimingProps & { scene: Extract<Scene, { type: "table" }> };

/** Truth tables, worked numbers, short comparisons: rows revealed in order. */
export const TableScene: React.FC<Props> = ({ scene, ...t }) => (
  <SceneFrame {...t} label={scene.label} caption={scene.caption} centered={!scene.visual}>
    <MiniTable columns={scene.columns} rows={scene.rows} audioFrames={t.audioFrames} />
    {scene.visual && (
      <DiagramArea visual={scene.visual} narration={scene.narration} audioFrames={t.audioFrames} rowHeight={diagram.compactRowHeight} />
    )}
  </SceneFrame>
);
