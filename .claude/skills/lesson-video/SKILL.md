---
name: lesson-video
description: Create, revise, voice and render an animated AI lesson video for this app, from topic to MP4 in the web app. Use this whenever the user wants a new lesson, a lesson script, lesson JSON, narration or captions in Malayalam–English, voiceover regeneration, scene timing fixes, or a render, even if they only name a topic ("make one on embeddings") or say "next lesson".
---

# Lesson video

Turns a topic into a published lesson: original script → `lessons/<slug>.json` → voice → preview → render → web app. Read CLAUDE.md for repo conventions and PRODUCT.md for content principles before starting.

## Workflow

1. **Agree the idea.** Confirm the topic, the one idea the lesson teaches, and the example to use. If the topic holds two ideas, propose splitting it.
2. **Draft the script** as scenes (rules below). Show the narration to the user before writing JSON; the script is the part they care most about.
3. **Write the JSON** to `lessons/<slug>.json`. Slug is kebab-case English (`rag-vs-finetuning`). Validate against `shared/lesson-schema.ts`.
4. **Generate voice:** `npm run voice -- <slug>`. Report each scene's duration. Flag any scene over 18 seconds or under 4 seconds for the user to rework.
5. **Preview:** tell the user to open `npm run studio` and check the lesson. Fix wording, pronunciation or timing they report, re-running voice only for changed scenes.
6. **Render and publish:** `npm run render -- <slug>`, then `npm run index`. Confirm the MP4 exists and the lesson appears in `web/public/lessons.json`.

## Lesson structure

5–7 scenes, 45–90 seconds total, in this order:

| Scene | Type | Purpose | Target length |
|---|---|---|---|
| 1 | `hook` | A question the viewer has wondered about | 5–8 s |
| 2–3 | `concept` | Explain each idea in plain words, then name it | 8–14 s each |
| 4 | `flow` or `compare` | Show how it works or how two things differ | 10–16 s |
| 5 | `concept` (optional) | A concrete local example | 8–12 s |
| last | `takeaway` | One sentence the viewer should remember | 5–8 s |

## Writing narration

- Malayalam in Malayalam script; English tech terms, product names and acronyms in English. Never romanized Malayalam: the voice mispronounces it.
- Write the way people in Kerala actually talk about tech: Malayalam sentence structure, English nouns. Don't translate established terms ("model", "training", "documents").
- Short sentences, one clause each where possible. Commas and full stops are the only pause control (no SSML).
- Spell out acronyms the first time in the caption, not the narration, unless the expansion helps understanding.
- About 2–2.5 words per second of target length. Check against the table above.
- Original writing only. Never reuse or closely paraphrase another creator's script, captions or on-screen text.
- Accuracy check: every claim must be technically correct. If unsure, say so to the user rather than guessing.

## Writing on-screen text

- `label`: 1–3 words, shown uppercase mono with the scene number (e.g. `RAG`, `KEY DIFFERENCE`).
- `headline`: 2–6 words, a punchy summary. English is fine; it's display text.
- `caption`: the single line typed out at the bottom. A short example or key phrase, under 40 characters.
- `steps` in a flow: 2–4 boxes, `title` 1–2 words, `sub` one lowercase word describing the action.
- `compare` points: 2–3 per side, under 30 characters each, parallel wording on both sides.

## Writing visuals (animated diagrams)

Every explaining scene (`concept`, and usually `hook` and `takeaway`) should have a `visual` that shows what the narration says, building up as it's said. Text alone doesn't teach.

- Grid: `col` 0–2, `row` 0–2 (halves allowed). Prefer horizontal and diagonal arrows; keep vertical arrows to rows that are adjacent.
- Nodes: `icon` (`question`, `answer`, `doc`, `docs`, `search`, `prompt`, `model`, `weights`, `examples`, `pdf`, `chatbot`) or `text` (a chat bubble, max 28 chars). `label` max 22 chars, shown under icons.
- Timing: `cue` is a phrase copied exactly from the narration; the element appears when the voice reaches it. Use English terms in the narration as cues where possible (`"documents"`, `"weights"`).
- Emphasis: `highlightCue` turns a node turmeric (the `weights` icon reshuffles, which shows training). `dimCue` fades an outdated node. Edge `flowCue` sends a dot along the arrow to show data moving.
- Show the mechanism, not decoration: the order nodes appear in should retell the narration on its own.
- When a scene has a `visual`, leave out `body`.

## Example scene (format reference)

```json
{
  "id": "s1",
  "type": "hook",
  "label": "QUESTION",
  "headline": "Two ways to teach AI",
  "caption": "RAG or Fine-Tuning?",
  "narration": "ഒരു AI model-ന് പുതിയ കാര്യങ്ങൾ അറിയാൻ രണ്ട് വഴികളുണ്ട്. ഏതാണ് നിങ്ങൾക്ക് വേണ്ടത്?"
}
```

## Fixing common problems

- **Term mispronounced:** try a different spelling in English (`Fine Tuning` vs `Fine-Tuning`), add a comma before it, or move it to the start of a sentence. Re-run voice for that scene only.
- **Scene too long:** cut a clause rather than speeding up the voice.
- **Captions finish too early or late:** adjust the typewriter fraction in `theme.ts`, not per scene.
- **Text overflows the safe area:** shorten the text first; only reduce font size as a last resort and never below the minimums in CLAUDE.md.

## Checklist before rendering

- JSON validates and every scene has narration and caption
- Total duration is 45–90 seconds
- User has listened to the voice and approved it
- No romanized Malayalam anywhere in narration
- Headlines and captions fit the safe area in Studio
