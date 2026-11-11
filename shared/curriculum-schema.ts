import { z } from "zod";

export const SUBJECT_CODES = [
  "ATP", "FOC", "PIC", "DM", "TOC", "DSA", "OOP", "DBMS", "OS",
  "COA", "CN", "DAA", "ML", "MC", "CD", "ACS", "CS",
] as const;

export type SubjectCode = (typeof SUBJECT_CODES)[number];

/** `<SUBJ>-<module>-<nn>`, e.g. PIC-4-01. */
export const TOPIC_ID_PATTERN = /^([A-Z]+)-(\d+)-(\d{2})$/;

export const CSV_COLUMNS = ["ID", "Sem", "Subject", "Module", "Reel topic", "Priority", "Status", "Module theme", "Course code"] as const;

/** One row of curriculum/ktu-2024-cse.csv, after trimming. */
export const csvRowSchema = z
  .object({
    ID: z.string().regex(TOPIC_ID_PATTERN, "ID must look like PIC-4-01"),
    Sem: z.string().regex(/^S[1-8]$/, "Sem must be S1–S8"),
    Subject: z.string().min(1),
    Module: z.coerce.number().int().min(1),
    "Reel topic": z.string().min(1),
    Priority: z.enum(["Major", "Minor"]),
    Status: z.string(),
    "Module theme": z.string().min(1),
    "Course code": z.string().min(1),
  })
  .superRefine((row, ctx) => {
    const match = TOPIC_ID_PATTERN.exec(row.ID);
    if (!match) return;
    const [, code, module] = match;
    if (!(SUBJECT_CODES as readonly string[]).includes(code ?? "")) {
      ctx.addIssue({ code: "custom", path: ["ID"], message: `unknown subject code "${code}" (expected one of ${SUBJECT_CODES.join(", ")})` });
    }
    if (Number(module) !== row.Module) {
      ctx.addIssue({ code: "custom", path: ["Module"], message: `ID says module ${module} but Module column is ${row.Module}` });
    }
  });

export type CsvRow = z.infer<typeof csvRowSchema>;

const topicSchema = z.object({
  id: z.string().regex(TOPIC_ID_PATTERN),
  number: z.number().int().min(1),
  title: z.string().min(1),
  priority: z.enum(["Major", "Minor"]),
  /** The tracker Sheet's status at export time. The repo's own view comes from `npm run status`. */
  sheetStatus: z.string(),
});

const moduleSchema = z.object({
  number: z.number().int().min(1),
  theme: z.string().min(1),
  topics: z.array(topicSchema).min(1),
});

const subjectSchema = z.object({
  code: z.enum(SUBJECT_CODES),
  name: z.string().min(1),
  courseCode: z.string().min(1),
  modules: z.array(moduleSchema).min(1),
});

const semesterSchema = z.object({
  sem: z.string().regex(/^S[1-8]$/),
  subjects: z.array(subjectSchema).min(1),
});

export const topicsFileSchema = z.object({
  scheme: z.string(),
  source: z.string(),
  topicCount: z.number().int(),
  semesters: z.array(semesterSchema),
});

export type Topic = z.infer<typeof topicSchema>;
export type CurriculumModule = z.infer<typeof moduleSchema>;
export type Subject = z.infer<typeof subjectSchema>;
export type Semester = z.infer<typeof semesterSchema>;
export type TopicsFile = z.infer<typeof topicsFileSchema>;

/** A topic with its place in the curriculum, for lookups by ID. */
export type TopicEntry = Topic & { sem: string; subject: Pick<Subject, "code" | "name" | "courseCode">; module: Pick<CurriculumModule, "number" | "theme"> };

/** Flattens topics.json into a map keyed by topic ID, in curriculum order. */
export const indexTopics = (file: TopicsFile): Map<string, TopicEntry> => {
  const map = new Map<string, TopicEntry>();
  for (const semester of file.semesters) {
    for (const subject of semester.subjects) {
      for (const module of subject.modules) {
        for (const topic of module.topics) {
          map.set(topic.id, {
            ...topic,
            sem: semester.sem,
            subject: { code: subject.code, name: subject.name, courseCode: subject.courseCode },
            module: { number: module.number, theme: module.theme },
          });
        }
      }
    }
  }
  return map;
};

/** Lesson files are named by lowercase topic ID: PIC-4-01 → pic-4-01. */
export const topicFileId = (topicId: string): string => topicId.toLowerCase();

/** curriculum/pronunciation/<subject>.json: narration fixes applied before text goes to the voice. */
export const pronunciationSchema = z.object({
  replacements: z.array(
    z.object({
      /** Exact text to find in narration (case-sensitive). */
      from: z.string().min(1),
      /** What the voice should read instead. */
      to: z.string().min(1),
      /** Why it's here, and whether it was confirmed by listening. */
      note: z.string().optional(),
    }),
  ),
});

export type Pronunciation = z.infer<typeof pronunciationSchema>;
