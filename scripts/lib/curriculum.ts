import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { indexTopics, topicsFileSchema, type TopicEntry, type TopicsFile } from "../../shared/curriculum-schema.ts";
import { ROOT } from "./paths.ts";

export const CURRICULUM_DIR = path.join(ROOT, "curriculum");
export const CURRICULUM_CSV = path.join(CURRICULUM_DIR, "ktu-2024-cse.csv");
export const TOPICS_JSON = path.join(CURRICULUM_DIR, "topics.json");

/** Reads and validates curriculum/topics.json. Tells the user to run the import if it's missing. */
export const loadTopics = async (): Promise<{ file: TopicsFile; byId: Map<string, TopicEntry> }> => {
  if (!existsSync(TOPICS_JSON)) throw new Error("curriculum/topics.json not found. Run: npm run import");
  const result = topicsFileSchema.safeParse(JSON.parse(await readFile(TOPICS_JSON, "utf8")));
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.map(String).join(".")}: ${i.message}`);
    throw new Error(`curriculum/topics.json is invalid (re-run npm run import):\n${lines.join("\n")}`);
  }
  return { file: result.data, byId: indexTopics(result.data) };
};
