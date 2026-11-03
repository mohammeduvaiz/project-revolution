import React from "react";
import type { Scene } from "../../../shared/lesson-schema";
import { CompareScene } from "./CompareScene";
import { ConceptScene } from "./ConceptScene";
import { FlowScene } from "./FlowScene";
import { HookScene } from "./HookScene";
import type { SceneTimingProps } from "./SceneFrame";
import { TakeawayScene } from "./TakeawayScene";

type Props = SceneTimingProps & { scene: Scene };

/** Picks the component for a scene type. Exhaustive: a new type fails to compile here. */
export const SceneView: React.FC<Props> = ({ scene, ...t }) => {
  switch (scene.type) {
    case "hook":
      return <HookScene scene={scene} {...t} />;
    case "concept":
      return <ConceptScene scene={scene} {...t} />;
    case "flow":
      return <FlowScene scene={scene} {...t} />;
    case "compare":
      return <CompareScene scene={scene} {...t} />;
    case "takeaway":
      return <TakeawayScene scene={scene} {...t} />;
    default: {
      const unreachable: never = scene;
      throw new Error(`Unknown scene type: ${JSON.stringify(unreachable)}`);
    }
  }
};
