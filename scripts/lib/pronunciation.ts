import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pronunciationSchema, type Pronunciation } from "../../shared/curriculum-schema.ts";
import { CURRICULUM_DIR } from "./curriculum.ts";

export const pronunciationPath = (subjectCode: string): string =>
  path.join(CURRICULUM_DIR, "pronunciation", `${subjectCode.toLowerCase()}.json`);

/** The subject's pronunciation file, or an empty list if it doesn't have one yet. */
export const loadPronunciation = async (subjectCode: string): Promise<Pronunciation> => {
  const file = pronunciationPath(subjectCode);
  if (!existsSync(file)) return { replacements: [] };
  const result = pronunciationSchema.safeParse(JSON.parse(await readFile(file, "utf8")));
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.map(String).join(".")}: ${i.message}`);
    throw new Error(`Invalid ${path.relative(process.cwd(), file)}:\n${lines.join("\n")}`);
  }
  return result.data;
};

/**
 * Applies replacements to narration, longest `from` first (so "%d" wins over "%", "&&" over "&").
 * Replacements are padded with spaces and whitespace is collapsed, so "&x" reads "ampersand x".
 * Returns the text to send and which replacements fired.
 */
export const applyPronunciation = (text: string, pronunciation: Pronunciation): { text: string; applied: string[] } => {
  const ordered = [...pronunciation.replacements].sort((a, b) => b.from.length - a.from.length);
  const applied: string[] = [];
  let out = text;
  for (const { from, to } of ordered) {
    if (!out.includes(from)) continue;
    out = out.split(from).join(` ${to} `);
    applied.push(`${from} → ${to}`);
  }
  return { text: applied.length ? out.replace(/[ \t]+/g, " ").replace(/ ([.,?!])/g, "$1").trim() : text, applied };
};
