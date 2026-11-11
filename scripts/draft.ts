import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { topicFileId } from "../shared/curriculum-schema.ts";
import { parseLesson } from "../shared/lesson-schema.ts";
import { lessonPath } from "./lib/paths.ts";
import { moduleTopics, parseModuleRef } from "./lib/module.ts";

/**
 * npm run draft -- PIC 4   (or PIC-4)
 * Prepares a module for drafting: lists its topics in order, validates every lesson already drafted,
 * and names the topics still to write. Claude Code does the writing (lesson-video skill).
 */
const main = async (): Promise<void> => {
  const ref = parseModuleRef(process.argv[2], process.argv[3]);
  const { topics, theme, subjectName, sem } = await moduleTopics(ref);
  console.log(`${sem} · ${ref.subject} ${subjectName} · Module ${ref.module}: ${theme}\n`);

  const todo: string[] = [];
  let invalid = 0;
  for (const topic of topics) {
    const id = topicFileId(topic.id);
    const head = `  ${topic.id.padEnd(10)} ${topic.priority.padEnd(5)}`;
    if (!existsSync(lessonPath(id))) {
      console.log(`${head}  ·  not drafted        ${topic.title}`);
      todo.push(topic.id);
      continue;
    }
    try {
      const lesson = parseLesson(JSON.parse(await readFile(lessonPath(id), "utf8")), `lessons/${id}.json`);
      if (lesson.topicId !== topic.id) throw new Error(`  - topicId is "${lesson.topicId}" but the file is for ${topic.id}`);
      const review = lesson.review.status === "approved" ? `approved by ${lesson.review.reviewer}` : lesson.review.status;
      console.log(`${head}  ✓  valid, ${review.padEnd(9)}  ${topic.title}`);
    } catch (err) {
      invalid++;
      console.log(`${head}  ✗  invalid            ${topic.title}`);
      const detail = err instanceof Error ? err.message.split("\n").slice(1) : [String(err)];
      for (const line of detail) console.log(`        ${line.trim()}`);
    }
  }

  const major = topics.filter((t) => todo.includes(t.id) && t.priority === "Major").map((t) => t.id);
  console.log(`\n${topics.length} topics: ${topics.length - todo.length} drafted (${invalid} invalid), ${todo.length} to draft.`);
  if (todo.length) {
    console.log(`To draft, Major first: ${[...major, ...todo.filter((t) => !major.includes(t))].join(", ")}`);
    console.log(`Ask Claude Code: "draft ${ref.subject} module ${ref.module}" (lesson-video skill). Then re-run this to validate.`);
  }
  if (invalid) process.exit(1);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
