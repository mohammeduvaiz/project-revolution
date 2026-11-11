import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { topicFileId } from "../../shared/curriculum-schema.ts";
import { parseLesson, type Lesson } from "../../shared/lesson-schema.ts";
import { loadTopics } from "./curriculum.ts";
import { lessonPath } from "./paths.ts";

/**
 * Loads lessons/<id>.json, validates it, and checks it belongs to a real topic:
 * its topicId must exist in topics.json and match the file name.
 */
export const loadLesson = async (id: string): Promise<Lesson> => {
  const file = lessonPath(id);
  if (!existsSync(file)) throw new Error(`No lesson found at lessons/${id}.json`);
  const lesson = parseLesson(JSON.parse(await readFile(file, "utf8")), `lessons/${id}.json`);
  if (topicFileId(lesson.topicId) !== id) {
    throw new Error(`lessons/${id}.json has topicId "${lesson.topicId}"; the file must be named ${topicFileId(lesson.topicId)}.json`);
  }
  const { byId } = await loadTopics();
  if (!byId.has(lesson.topicId)) {
    throw new Error(`lessons/${id}.json: topicId "${lesson.topicId}" is not in curriculum/topics.json`);
  }
  return lesson;
};
