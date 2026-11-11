# PLAN.md

The production plan for turning the KTU 2024 CSE syllabus into short lesson reels, using the existing lesson-video pipeline. CLAUDE.md says how the code works; PRODUCT.md says why; this file says what to build and in what order.

## Where we start

Already built (prototype):

- Lesson JSON → Sarvam TTS voiceover → Remotion render → MP4
- Scene types: hook, concept, flow, compare, takeaway
- Minimal web app: lesson list + player

Already decided (outside the repo):

- 17 core subjects, S1–S6, KTU 2024 scheme, no labs, no general maths (Discrete Mathematics included as CS core)
- 536 reel topics (405 Major, 131 Minor), one idea per reel
- Every reel has a concrete example
- Electives come later

## The content model

```
Semester → Subject → Module → Topic (= one reel)
```

- **Topic ID** is the key everywhere: `PIC-4-01` = Programming in C, Module 4, topic 1.
- `curriculum/ktu-2024-cse.csv` is the topic list, exported from the tracker Sheet.
- `lessons/<topic-id>.json` is one reel's script, named by lowercase topic ID (`lessons/pic-4-01.json`).
- A topic's curriculum mapping (semester, subject, module) lives in the CSV, not in the lesson, so the same reel can later be mapped to other curricula (e.g. Rajagiri) by adding a column.
- The tracker Sheet stays the place where the team sees status. Claude Code cannot edit it; `npm run status` prints what the repo knows so the Sheet can be updated by hand.

## The pipeline for every reel

| Stage | Who | Output | Gate to next stage |
|---|---|---|---|
| 1. Plan module | Human + Claude | Example chosen for every topic in the module | Examples agreed |
| 2. Draft | Claude (lesson-video skill) | `lessons/<id>.json`, `review.status: "pending"` | Valid against schema |
| 3. Review | Subject expert | `review.status: "approved"` + reviewer name | Technically correct, example fits |
| 4. Voice | Script | WAVs + manifest | Approved only; spot-listen |
| 5. Render | Script | `web/public/videos/<id>.mp4` | Voice exists |
| 6. QA | Human | Watched on a phone at 1.5x | Readable, synced, no errors |
| 7. Publish | Script | Entry in `web/public/lessons.json` | QA passed |

Work happens **one module at a time**, not one reel at a time: topics in a module share terms, a running example and pacing.

## Phases

### Phase 1: Curriculum in the repo (half a day)

1. Export the tracker's Reels tab as CSV (the Sheet's page offers a CSV download) and save it as `curriculum/ktu-2024-cse.csv`.
2. `scripts/import-curriculum.ts`: validate the CSV with zod, write `curriculum/topics.json` (subjects → modules → topics), and fail loudly on duplicate IDs or gaps.
3. Extend `shared/lesson-schema.ts`: `topicId`, `example` (required), `review` block, and the new scene types below.
4. `npm run status [-- --subject PIC]`: for each topic, show drafted / approved / voiced / rendered / published, from files on disk.

Done when: `npm run status` lists all 536 topics as "not drafted".

### Phase 2: Syllabus-ready video template (1–2 days)

New scene types, because programming and theory subjects need more than concept cards:

- `example`: the real-life example, with a short setup line and a payoff line. Every lesson must have one.
- `code`: a code block (C, Python, Java, SQL) that reveals line by line, with one line highlighted per narration sentence. Monospace, syntax-coloured from `theme.ts`, max 12 lines.
- `steps`: a numbered algorithm or procedure (e.g. infix to postfix), revealing one step at a time.
- `table`: a small table (≤ 4 columns, ≤ 5 rows) for truth tables, scheduling examples, comparisons.

Also:

- A subject badge and "S3 · Module 2" label on every reel.
- An end card: "Next: <next topic title>".

Done when: one reel per new scene type renders and reads well on a phone.

### Phase 3: Batch tooling (1 day)

- `npm run draft -- <subject> <module>`: drafts every topic in that module through the lesson-video skill workflow (Claude Code does the writing; the script prepares the list and checks schema).
- `npm run voice -- --module PIC-4`: voices every approved lesson in the module; skips unchanged text.
- `npm run render -- --module PIC-4`: renders every voiced lesson in the module.
- `npm run index`: rebuilds `web/public/lessons.json` with semester, subject and module for every published reel.
- `curriculum/pronunciation/<subject>.json`: terms the voice gets wrong, with the spelling that works. The voice script applies these automatically.

Done when: a whole module goes from drafted to rendered with three commands.

### Phase 4: Pilot with one subject (2 weeks)

- Subject: **Programming in C** (40 reels). It is a common back-paper subject and tests the `code` scene hardest.
- Produce Major topics first (27), then Minor (13).
- Put it in front of 20–30 students before an exam. Track completion, quiz scores and what they ask for.
- Adjust format, length and example style before scaling.

Done when: 40 published reels, pilot feedback written up in `docs/pilot-notes.md`.

### Phase 5: Web app for students (parallel with Phase 4)

- Browse by Semester → Subject → Module → reels, with Major reels marked.
- Vertical player with captions; "next reel" auto-advance within a module.
- Three-question quiz after each reel (questions stored in the lesson JSON).
- Progress per module, kept in localStorage for now.
- Video hosting on a streaming service once there are more than a few dozen reels.

### Phase 6: Scale

Order of production:

1. Subjects with exams coming up soonest (follow the KTU exam calendar).
2. Major topics before Minor topics, across all subjects in that term.
3. Module recaps ("Module 3 in 3 minutes") once a module's reels are done.
4. Worked-problem videos (3–5 min) for 9-mark question types: program tracing, recurrence solving, normalization, scheduling, parsing tables.
5. Electives: list all in `curriculum/electives.csv` (names and slots only); break down only those students actually pick, top two per slot first.

## Quality rules (non-negotiable)

- No lesson is voiced unless `review.status` is `"approved"`. The voice script refuses otherwise.
- Every lesson has an example, and every claim is technically correct.
- Scripts are original. Never copy a textbook's or another creator's wording.
- Malayalam in Malayalam script, English technical terms in English.

## Rough throughput (once Phase 3 is done)

| Team | Reels per week | All 536 core reels |
|---|---|---|
| One person, part time | about 40 | about 3 months |
| One producer + two reviewers | about 100 | about 5–6 weeks |

Review is the bottleneck, so plan reviewer time first.
