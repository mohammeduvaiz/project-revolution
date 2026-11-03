import { useEffect, useState } from "react";
import type { LessonIndexEntry } from "../../shared/lesson-index";

export type LessonsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; lessons: LessonIndexEntry[] };

export const useLessons = (): LessonsState => {
  const [state, setState] = useState<LessonsState>({ status: "loading" });
  useEffect(() => {
    fetch("/lessons.json")
      .then((res) => {
        if (!res.ok) throw new Error("No lessons.json yet. Run: npm run index");
        return res.json() as Promise<LessonIndexEntry[]>;
      })
      .then((lessons) => setState({ status: "ready", lessons }))
      .catch((err: unknown) => setState({ status: "error", message: err instanceof Error ? err.message : String(err) }));
  }, []);
  return state;
};
