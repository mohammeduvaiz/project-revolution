import { SUBJECT_CODES, type TopicEntry } from "../../shared/curriculum-schema.ts";
import { loadTopics } from "./curriculum.ts";

export type ModuleRef = { subject: string; module: number };

/** Accepts "PIC-4", "pic-4", or two args "PIC" "4". */
export const parseModuleRef = (a: string | undefined, b?: string): ModuleRef => {
  const joined = b !== undefined && /^\d+$/.test(b) ? `${a}-${b}` : (a ?? "");
  const match = /^([A-Za-z]+)-(\d+)$/.exec(joined);
  const subject = match?.[1]?.toUpperCase();
  if (!match || !subject || !(SUBJECT_CODES as readonly string[]).includes(subject)) {
    throw new Error(`Expected a module like PIC-4 (subjects: ${SUBJECT_CODES.join(", ")}); got "${[a, b].filter(Boolean).join(" ")}"`);
  }
  return { subject, module: Number(match[2]) };
};

/** The module's topics in syllabus order. Fails if the module doesn't exist. */
export const moduleTopics = async (ref: ModuleRef): Promise<{ topics: TopicEntry[]; theme: string; subjectName: string; sem: string }> => {
  const { byId } = await loadTopics();
  const topics = [...byId.values()].filter((t) => t.subject.code === ref.subject && t.module.number === ref.module);
  const first = topics[0];
  if (!first) throw new Error(`${ref.subject} has no module ${ref.module} in curriculum/topics.json`);
  return { topics, theme: first.module.theme, subjectName: first.subject.name, sem: first.sem };
};

/** Reads `--module X` from argv, or null. */
export const moduleFlag = (argv: string[]): ModuleRef | null => {
  const i = argv.indexOf("--module");
  if (i === -1) return null;
  return parseModuleRef(argv[i + 1]);
};
