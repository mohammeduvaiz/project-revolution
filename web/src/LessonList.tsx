import React from "react";
import type { LessonIndexEntry } from "../../shared/lesson-index";
import { formatDuration, lessonNumber } from "./format";
import { lessonHref } from "./useHashRoute";

type Props = { lessons: LessonIndexEntry[] };

export const LessonList: React.FC<Props> = ({ lessons }) => (
  <main className="page">
    <p className="eyebrow">AI · Malayalam</p>
    <h1>Short AI lessons</h1>
    <p className="lede">One idea per lesson, about a minute each, in everyday Malayalam–English.</p>
    {lessons.length === 0 ? (
      <p className="muted">No lessons published yet.</p>
    ) : (
      <ul className="list">
        {lessons.map((lesson, i) => (
          <li key={lesson.slug}>
            <a className="card" href={lessonHref(lesson.slug)}>
              <span className="card-num">{lessonNumber(i)}</span>
              <span>
                <p className="card-title">{lesson.title}</p>
                <p className="card-desc">{lesson.description}</p>
              </span>
              <span className="card-time">{formatDuration(lesson.durationInSeconds)}</span>
            </a>
          </li>
        ))}
      </ul>
    )}
  </main>
);
