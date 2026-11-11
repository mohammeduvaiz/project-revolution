---
name: lesson-video
description: Plan, draft, revise, voice and render syllabus lesson reels for this app, one module at a time. Use this whenever the user names a topic ID (PIC-4-01), a subject or module ("do OS module 2", "next module", "draft DSA"), asks for lesson scripts, narration, examples or quizzes, wants voice regenerated or a reel re-rendered, or asks what's left to produce.
---

# Lesson video

Turns syllabus topics into published reels: plan module → draft lessons → human review → voice → render → QA → publish. Read CLAUDE.md (schema, commands, rules) and PLAN.md (pipeline, gates) first.

## Prerequisites

This skill needs PLAN.md Phase 1 (curriculum import, `npm run status`, `curriculum/topics.json`, `topicId` and `review` in the schema) and Phase 2 (the `example`, `code`, `steps` and `table` scene types). Before starting, check they exist. If any are missing, stop, tell the user which phase is unfinished, and offer to build it. Don't draft lessons against a schema that can't validate them.

## Workflow for a module

1. **Locate the module.** Run `npm run status -- --subject <SUBJ>` and read the module's topics from `curriculum/topics.json`. Confirm with the user which module to do; default to the next module with undrafted Major topics.
2. **Plan the examples.** Propose one concrete example per topic in a short table (topic ID, topic, example). Prefer one running example across the module when it fits (e.g. a college canteen for every OS synchronization topic). Wait for the user's OK before drafting.
3. **Draft** every lesson in the module to `lessons/<id>.json` with `review.status: "pending"`. Major topics first. Validate each against the schema.
4. **Hand off for review.** Tell the user which files are ready and what a reviewer should check. Do not voice anything until lessons are marked `"approved"` by a person. Never set `"approved"` yourself.
5. **After approval:** `npm run voice -- --module <SUBJ>-<m>`. Report each scene's duration; flag lessons over 75 s or under 40 s.
6. **Render:** `npm run render -- --module <SUBJ>-<m>`, then ask the user to QA on a phone.
7. **Publish:** `npm run index`. Report what's published and what the user should update in the tracker Sheet.

## Lesson structure

4–7 scenes, 45–75 seconds total:

| Order | Scene | Purpose |
|---|---|---|
| 1 | `hook` | A question or situation that makes the topic matter |
| 2 | `concept` | The idea in plain words, then its name |
| 3 | `example` | The real-life example (required in every lesson) |
| 4 | `flow` / `code` / `steps` / `table` / `compare` | Show how it works |
| last | `takeaway` | One sentence to remember for the exam |

Pick the "show" scene by topic: `code` for programming syntax, `steps` for algorithms and procedures, `table` for truth tables and worked numbers, `flow` for processes, `compare` for "X vs Y" topics.

## Writing narration

- Malayalam in Malayalam script; English technical terms, keywords and acronyms in English. Never romanized Malayalam.
- Kerala classroom register: Malayalam sentences, English nouns. Don't translate established terms (array, pointer, process, thread).
- Short sentences. About 2–2.5 words per second of target length.
- Say what the syllabus means, at the depth KTU exams expect. Don't go beyond the syllabus in a reel.
- Original writing only. Never reuse a textbook's, a notes site's or another creator's wording.
- If unsure a claim is correct, say so to the user instead of guessing.

## Choosing examples

- Concrete and familiar in Kerala: college canteen, KSRTC bus routes, hospital OP queue, ration shop register, exam hall seating, Onam sadya serving order, railway reservation, a WhatsApp group.
- The example must match the concept exactly; a loose analogy that breaks under questioning is worse than none.
- For programming topics, the example can be a tiny program that solves a real task (e.g. calculating a KTU SGPA).

## On-screen text

- `label`: 1–3 words, uppercase mono (e.g. `POINTER`, `KEY IDEA`).
- `headline`: 2–6 words.
- `caption`: one line under 40 characters.
- `code`: ≤ 12 lines, real compilable code, no line over 32 characters.
- `steps`: ≤ 6 items; `table`: ≤ 4 columns, ≤ 5 rows; `compare`: 2–3 parallel points per side.

## Visuals

Animated diagrams stay part of the format: a reel should show, not just state. Use the `visual` field exactly as `shared/lesson-schema.ts` defines it (cue-timed icons and arrows). The schema is the source of truth: keep its format, don't invent a new one. Everything below marked **(enforced)** fails validation, naming the scene id.

**Where visuals go**
- `concept` scenes must have a `visual` **(enforced)**. `example` scenes must too, once Phase 2 adds that type.
- `hook` and `takeaway` scenes may have one. Add it where a picture explains better than text.
- Today `flow` and `compare` scenes don't accept a `visual`. When Phase 2 adds `code`, `steps` and `table`, they may take one where an arrow or highlight makes the logic clearer (e.g. where a pointer points after each line).

**Size**
- At most **5 nodes** and **6 arrows** per visual, so it reads on a phone **(enforced)**.
- Nodes sit on a 3×3 grid: `col` 0–2, `row` 0–2, halves allowed **(enforced)**.

**Nodes**
- Each node has exactly one of `icon` or `text` **(enforced)**.
- `icon` is one of `question`, `answer`, `doc`, `docs`, `search`, `prompt`, `model`, `weights`, `examples`, `pdf`, `chatbot` **(enforced)**.
- `text` is a speech bubble, at most 28 characters; `label` sits under the node, at most 22 characters **(enforced)**.

**Timing**
- Every node has a `cue`: a phrase copied exactly from the scene's narration (case-insensitive), or a number 0–1 as a fraction of the audio. A phrase not found in the narration fails validation **(enforced)**.
- Optional cues: node `highlightCue` (turns turmeric; `weights` reshuffles), node `dimCue` (fades), arrow `cue` (draws in; defaults to when its later node appears) and arrow `flowCue` (a dot travels along it).
- Every arrow's `from` and `to` must be node ids in the same visual **(enforced)**.
- Time each element to the narration word that introduces it, so nothing appears before it's mentioned.

**Content**
- Draw the mechanism, not decoration: for a pointer, a variable box, its address, and an arrow from `p` to it; for a queue, people joining at the back and leaving at the front.
- Reuse the module's running example in its visuals, so a module looks like one story.

## Quiz (from Phase 5)

Three multiple-choice questions per lesson, four options each, testing the reel's one idea. One should test the example, one the definition, one a likely exam-style twist.

## Example lesson (shape reference)

```json
{
  "topicId": "PIC-4-01",
  "title": "What is a pointer?",
  "language": "ml-IN",
  "example": "A house address written on a slip, versus the house itself",
  "review": { "status": "pending" },
  "scenes": [
    { "id": "s1", "type": "hook", "label": "POINTER", "headline": "Address, not value",
      "caption": "int *p;", "narration": "ഒരു variable-ന്റെ value അല്ല, അതിന്റെ address സൂക്ഷിക്കുന്ന variable ആണ് pointer." }
  ]
}
```

## Fixing common problems

- **Term mispronounced:** add it to `curriculum/pronunciation/<subject>.json` with a spelling that works, then re-voice that lesson.
- **Lesson too long:** cut a clause or a scene; never speed up the voice.
- **Code too long for the screen:** shorten the program; never shrink the font below the minimum.
- **Reviewer requested changes:** read `review.notes`, fix only what's asked, set status back to `"pending"`.

## Before voicing, check

- Schema valid, `topicId` exists, `example` filled, at least one `example` scene
- Every `concept` (and, from Phase 2, `example`) scene has a `visual` within 5 nodes and 6 arrows, with cues matching the narration
- `review.status` is `"approved"` (set by a person)
- No romanized Malayalam in narration
- Total estimated length 45–75 s
