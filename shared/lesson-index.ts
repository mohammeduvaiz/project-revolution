/** One row of web/public/lessons.json, written by scripts/build-index.ts, in syllabus order. */
export type LessonIndexEntry = {
  /** Lesson id used in URLs and file names: lowercase topic ID (pic-4-01). */
  slug: string;
  topicId: string;
  title: string;
  /** The lesson's real-life example, shown under the title. */
  description: string;
  /** Longer text under the player (prototype lessons only). */
  summary?: string;
  durationInSeconds: number;
  videoUrl: string;
  sem: string;
  subject: { code: string; name: string };
  module: { number: number; theme: string };
  /** Position of the topic within its module (1-based). */
  topicNumber: number;
  priority: "Major" | "Minor";
};
