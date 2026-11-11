import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CSV_COLUMNS,
  csvRowSchema,
  topicsFileSchema,
  type CsvRow,
  type Semester,
  type SubjectCode,
  type TopicsFile,
} from "../shared/curriculum-schema.ts";
import { parseCsv } from "./lib/csv.ts";
import { CURRICULUM_CSV, TOPICS_JSON } from "./lib/curriculum.ts";
import { ROOT } from "./lib/paths.ts";

/** Collects every problem first, so one run shows them all. */
const problems: string[] = [];
const fail = (message: string): void => {
  problems.push(message);
};

/** Numbers must run 1, 2, 3… up to the highest one. Reports which are missing. */
const checkSequence = (numbers: number[], what: string, pad = false): void => {
  const present = new Set(numbers);
  const highest = Math.max(0, ...numbers);
  const missing = Array.from({ length: highest }, (_, i) => i + 1).filter((n) => !present.has(n));
  if (missing.length) {
    const list = missing.map((n) => (pad ? String(n).padStart(2, "0") : String(n))).join(", ");
    fail(`${what}: gap, missing ${list} (numbers must run 1, 2, 3… with none skipped)`);
  }
};

const main = async (): Promise<void> => {
  // Optional argument: validate another CSV (e.g. a fresh export) instead of the default.
  const input = process.argv[2] ? path.resolve(process.argv[2]) : CURRICULUM_CSV;
  const csvPath = path.relative(ROOT, input);
  const [header, ...body] = parseCsv(await readFile(input, "utf8"));
  if (!header) throw new Error(`${csvPath} is empty`);
  const columns = header.map((h) => h.trim());
  const missing = CSV_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length) throw new Error(`${csvPath} is missing columns: ${missing.join(", ")}\nFound: ${columns.join(", ")}`);

  // 1. Validate each row. Line numbers count the header as line 1.
  const rows: CsvRow[] = [];
  body.forEach((cells, i) => {
    const line = i + 2;
    const raw = Object.fromEntries(columns.map((c, ci) => [c, (cells[ci] ?? "").trim()]));
    const result = csvRowSchema.safeParse(raw);
    if (result.success) {
      rows.push(result.data);
    } else {
      for (const issue of result.error.issues) {
        fail(`line ${line} (${raw.ID || "no ID"}) → ${issue.path.map(String).join(".")}: ${issue.message}`);
      }
    }
  });

  // 2. Duplicate IDs.
  const seen = new Map<string, number>();
  rows.forEach((row, i) => {
    const first = seen.get(row.ID);
    if (first !== undefined) fail(`duplicate ID ${row.ID} (lines ${first} and ${i + 2})`);
    else seen.set(row.ID, i + 2);
  });

  // 3. Group: subject → module → topics, checking that shared fields agree.
  type SubjectAcc = { code: SubjectCode; sem: string; name: string; courseCode: string; modules: Map<number, { theme: string; rows: CsvRow[] }> };
  const subjects = new Map<string, SubjectAcc>();
  for (const row of rows) {
    const code = row.ID.split("-")[0] as SubjectCode;
    let subject = subjects.get(code);
    if (!subject) {
      subject = { code, sem: row.Sem, name: row.Subject, courseCode: row["Course code"], modules: new Map() };
      subjects.set(code, subject);
    }
    if (row.Sem !== subject.sem) fail(`${row.ID}: Sem ${row.Sem} differs from ${subject.sem} used by other ${code} topics`);
    if (row.Subject !== subject.name) fail(`${row.ID}: Subject "${row.Subject}" differs from "${subject.name}"`);
    if (row["Course code"] !== subject.courseCode) fail(`${row.ID}: Course code ${row["Course code"]} differs from ${subject.courseCode}`);
    let module = subject.modules.get(row.Module);
    if (!module) {
      module = { theme: row["Module theme"], rows: [] };
      subject.modules.set(row.Module, module);
    }
    if (row["Module theme"] !== module.theme) fail(`${row.ID}: Module theme "${row["Module theme"]}" differs from "${module.theme}"`);
    module.rows.push(row);
  }

  // 4. Gaps: modules 1..n per subject, topics 01..n per module.
  for (const subject of subjects.values()) {
    checkSequence([...subject.modules.keys()], `${subject.code} modules`);
    for (const [number, module] of subject.modules) {
      checkSequence(module.rows.map((r) => Number(r.ID.split("-")[2])), `${subject.code} module ${number} topics`, true);
    }
  }

  if (input !== CURRICULUM_CSV && !problems.length) {
    console.log(`✓ ${csvPath} is valid (${rows.length} topics). Not written: only curriculum/ktu-2024-cse.csv feeds topics.json.`);
    return;
  }
  if (problems.length) {
    console.error(`✗ ${csvPath} has ${problems.length} problem${problems.length === 1 ? "" : "s"}; topics.json not written:\n`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  // 5. Build topics.json: semesters in order, subjects in CSV order, modules and topics by number.
  const semesters = new Map<string, Semester>();
  for (const subject of subjects.values()) {
    let semester = semesters.get(subject.sem);
    if (!semester) {
      semester = { sem: subject.sem, subjects: [] };
      semesters.set(subject.sem, semester);
    }
    semester.subjects.push({
      code: subject.code,
      name: subject.name,
      courseCode: subject.courseCode,
      modules: [...subject.modules.entries()]
        .sort(([a], [b]) => a - b)
        .map(([number, module]) => ({
          number,
          theme: module.theme,
          topics: module.rows
            .map((r) => ({ id: r.ID, number: Number(r.ID.split("-")[2]), title: r["Reel topic"], priority: r.Priority, sheetStatus: r.Status }))
            .sort((a, b) => a.number - b.number),
        })),
    });
  }
  const file: TopicsFile = topicsFileSchema.parse({
    scheme: "KTU 2024 B.Tech CSE",
    source: csvPath,
    topicCount: rows.length,
    semesters: [...semesters.values()].sort((a, b) => a.sem.localeCompare(b.sem)),
  });
  await writeFile(TOPICS_JSON, `${JSON.stringify(file, null, 2)}\n`);

  const major = rows.filter((r) => r.Priority === "Major").length;
  console.log(`✓ ${rows.length} topics (${major} Major, ${rows.length - major} Minor) → ${path.relative(ROOT, TOPICS_JSON)}\n`);
  for (const semester of file.semesters) {
    const summary = semester.subjects.map((s) => `${s.code} ${s.modules.reduce((n, m) => n + m.topics.length, 0)}`).join(" · ");
    console.log(`  ${semester.sem}  ${summary}`);
  }
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
