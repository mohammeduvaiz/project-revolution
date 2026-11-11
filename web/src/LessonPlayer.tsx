import React from "react";
import type { LessonIndexEntry } from "../../shared/lesson-index";
import { formatDuration, lessonNumber } from "./format";
import { lessonHref } from "./useHashRoute";

type Props = { lessons: LessonIndexEntry[]; slug: string };

export const LessonPlayer: React.FC<Props> = ({ lessons, slug }) => {
  const index = lessons.findIndex((l) => l.slug === slug);
  const lesson = lessons[index];
  if (!lesson) {
    return (
      <main className="page">
        <a className="back" href="#/">← ALL LESSONS</a>
        <h1>Lesson not found</h1>
        <p className="lede">There is no published lesson called “{slug}”.</p>
      </main>
    );
  }
  const next = lessons[index + 1];
  return (
    <main className="page">
      <a className="back" href="#/">← ALL LESSONS</a>
      <p className="eyebrow">
        <b>{lessonNumber(index)}</b> · {formatDuration(lesson.durationInSeconds)}
      </p>
      <h1>{lesson.title}</h1>
      <video key={lesson.slug} className="player" src={lesson.videoUrl} controls playsInline preload="metadata" />
      <p className="summary">{lesson.summary ?? lesson.description}</p>
      {next ? (
        <a className="next" href={lessonHref(next.slug)}>
          <span className="eyebrow">Next lesson →</span>
          <span className="card-title">{next.title}</span>
        </a>
      ) : (
        <p className="muted">That’s the latest lesson. More coming soon.</p>
      )}
    </main>
  );
};
