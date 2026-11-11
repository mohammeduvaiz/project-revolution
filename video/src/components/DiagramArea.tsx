import React from "react";
import type { Visual } from "../../../shared/lesson-schema";
import { Diagram } from "./Diagram";

type Props = { visual: Visual; narration: string; audioFrames: number; rowHeight?: number };

/** Fills the space left under the headline and centres the diagram in it. */
export const DiagramArea: React.FC<Props> = (props) => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Diagram {...props} />
  </div>
);
