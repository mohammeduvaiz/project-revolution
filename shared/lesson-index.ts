/** One row of web/public/lessons.json, written by scripts/build-index.ts. */
export type LessonIndexEntry = {
  slug: string;
  title: string;
  description: string;
  summary: string;
  durationInSeconds: number;
  videoUrl: string;
};
