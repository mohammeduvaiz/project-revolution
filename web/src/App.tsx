import React from "react";
import { LessonList } from "./LessonList";
import { LessonPlayer } from "./LessonPlayer";
import { useHashRoute } from "./useHashRoute";
import { useLessons } from "./useLessons";

export const App: React.FC = () => {
  const route = useHashRoute();
  const state = useLessons();
  if (state.status === "loading") return <main className="page"><p className="muted">Loading…</p></main>;
  if (state.status === "error") return <main className="page"><p className="muted">{state.message}</p></main>;
  return route.page === "lesson" ? <LessonPlayer lessons={state.lessons} slug={route.slug} /> : <LessonList lessons={state.lessons} />;
};
