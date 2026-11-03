# CLAUDE.md

Instructions for Claude Code working in this repo. Read PRODUCT.md for the why; this file is the how.

## What we're building

A pipeline that turns a lesson JSON file into a short animated explainer video (Malayalam–English mix, AI voiceover), plus a minimal web app that plays the lessons. Today's goal is a working prototype: one lesson, end to end.

Pipeline: `lessons/<slug>.json` → `scripts/generate-voice.ts` (Sarvam TTS, one WAV per scene + manifest) → Remotion composition (scene timing from audio) → `web/public/videos/<slug>.mp4` → lesson page in `web/`.

## Stack

- Node 18+, TypeScript everywhere, npm
- Video: Remotion (React), in `video/`
- Voice: Sarvam AI text-to-speech, model `bulbul:v3`, language `ml-IN`
- Schema validation: zod (shared by the voice script and the Remotion composition)
- Web app: Vite + React, in `web/`
- Fonts via `@remotion/google-fonts`: Manrope (headlines), Noto Sans Malayalam (any Malayalam text), IBM Plex Mono (labels)

## Repo layout

```
lessons/                 lesson JSON files (source of truth for content)
scripts/
  generate-voice.ts      calls Sarvam, writes WAVs + manifest.json
  build-index.ts         writes web/public/lessons.json from lessons/
shared/
  lesson-schema.ts       zod schema + TS types for lessons
video/                   Remotion project
  src/Root.tsx           registers the LessonVideo composition
  src/LessonVideo.tsx    sequences scenes, attaches audio, uses calculateMetadata
  src/components/        Background, ProgressBar, SceneHeader, Headline,
                         FlowDiagram, CompareCard, TypewriterCaption
  src/scenes/            one component per scene type
  src/theme.ts           colors, fonts, spacing, timing constants
  public/audio/<slug>/   scene-<n>.wav + manifest.json (generated, gitignored)
web/                     Vite app: lesson list + player
```

## Commands

```
npm run voice -- <slug>      generate audio for lessons/<slug>.json
npm run studio               open Remotion Studio (in video/)
npm run render -- <slug>     render to web/public/videos/<slug>.mp4
npm run index                rebuild web/public/lessons.json
npm run web                  start the web app
```

Set these up in the root package.json as the first task if they don't exist.

## Environment

`.env` at the root (never commit it):

```
SARVAM_API_KEY=
SARVAM_SPEAKER=          # pick a voice from Sarvam's docs that sounds good in Malayalam
```

## Lesson schema (summary)

Defined in `shared/lesson-schema.ts`. Every lesson has `slug`, `title`, `language` ("ml-IN"), and `scenes`. Every scene has `id`, `type`, `label`, `narration`, `caption`, plus type-specific fields:

- `hook`: `headline`
- `concept`: `headline`, optional `body`
- `flow`: `headline`, `steps` (2–4 items of `{ title, sub }`)
- `compare`: `left` and `right`, each `{ title, points: string[] }`
- `takeaway`: `headline`
- `hook`, `concept`, `takeaway` may add `visual`: an animated diagram of icon/bubble `nodes` on a 3×3 grid and `edges` (arrows). Each element has a `cue` (a phrase from the narration, or a 0–1 fraction) that sets when it appears; `highlightCue`, `dimCue` and edge `flowCue` add emphasis and a moving dot. Cue phrases must exist in the narration (validated). Rendered by `video/src/components/Diagram.tsx`; icons in `Icon.tsx`.

Validate with zod at the start of both the voice script and the composition. Fail loudly with the scene id when something is wrong.

## Voice generation rules

- POST `https://api.sarvam.ai/text-to-speech` with header `api-subscription-key`. Body includes `text`, `language_code: "ml-IN"` (verified against docs.sarvam.ai; not `target_language_code`), `model: "bulbul:v3"`, `speaker`. The response has base64 audio in `audios[0]`; decode and write it as WAV.
- Verify the exact request and response fields against docs.sarvam.ai before writing the client. Don't guess.
- One request per scene. Keep each narration under 2,500 characters (the API limit); error clearly if over.
- bulbul:v3 has no SSML. Control pauses by punctuation and by splitting text.
- Narration must have Malayalam words in Malayalam script and English tech terms in English. Never romanized Malayalam ("cheyyunnu"); the voice reads it badly.
- After writing WAVs, read each duration (use the `music-metadata` package) and write `manifest.json`: `{ slug, scenes: [{ id, file, durationInSeconds }] }`.
- Skip scenes whose narration hasn't changed since the last run (hash the text into the manifest) so re-runs are cheap.

## Video rules

- Composition: 1080×1920, 30 fps. Id `LessonVideo`, takes `slug` as input prop.
- Use `calculateMetadata` to load the lesson JSON and manifest, then set total duration = sum of scene durations + padding. Each scene's length = its audio duration + 12 frames of tail.
- Sequence scenes with `Series`. Each scene plays its own audio.
- All animation is driven by `useCurrentFrame()`, `spring()` and `interpolate()`. No CSS transitions or animations, no `setTimeout`, no randomness without a seed (they break rendering).
- Typewriter caption: reveal characters evenly across the first 80% of the scene's audio, then hold.
- Flow diagram: boxes appear one by one with a spring, arrows draw in between, spaced evenly across the first half of the scene.
- Progress bar shows position across the whole video, not per scene.
- Keep everything inside a safe area: 80px side padding, nothing in the bottom 280px except the caption.
- Text must be readable on a phone: headline ≥ 88px, body ≥ 44px, caption ≥ 40px.

## Visual style (original, don't copy other creators)

Our look is "backwater dusk": deep ink background `#0B1622` with slow-drifting blurred shapes in teal `#2DD4BF` and turmeric `#F5B82E`, off-white text `#F4EFE6`, muted labels `#8FA3B5`. Labels are uppercase IBM Plex Mono with letter spacing. Diagram boxes are rounded (20px), 2px borders in label color, highlighted box in turmeric. Keep all values in `video/src/theme.ts`; components never hardcode colors or sizes.

## Code conventions

- Small, single-purpose components with typed props. No default exports except where Remotion requires them.
- No `any`. Types come from the zod schema (`z.infer`).
- Put timing constants (frames per box, tail frames, spring config) in `theme.ts`.
- Generated files (`video/public/audio/`, `web/public/videos/`) are gitignored.

## Build order for today

1. Root scripts, `.env.example`, zod schema, one sample lesson in `lessons/`.
2. Voice script, then listen to the output before moving on.
3. Theme + Background + ProgressBar, check in Studio.
4. SceneHeader, Headline, TypewriterCaption → `hook` and `concept` scenes.
5. FlowDiagram → `flow` scene. CompareCard → `compare` scene. `takeaway` scene.
6. `LessonVideo` with `calculateMetadata` and audio. Render one MP4.
7. `build-index.ts` and the Vite app: list page + player page.

If short on time: use fixed 8-second scenes when no manifest exists (log a warning), and skip the web app. Protect steps 3–6.

## Definition of done (prototype)

`npm run voice -- rag-vs-finetuning && npm run render -- rag-vs-finetuning` produces a playable MP4 with audio-synced scenes, and the web app plays it.

## When working

- Check each component visually in Remotion Studio before building the next.
- After changing timing logic, render a short frame range (`--frames`) to confirm it matches Studio.
- Ask before adding new dependencies beyond those listed here.
