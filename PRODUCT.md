# PRODUCT.md

## One line

Short, animated AI lessons in everyday Malayalam–English, made by a pipeline so new lessons are cheap to produce.

## Problem

Most good AI explainers are in English and assume background knowledge. Malayalam speakers who think in a natural Malayalam–English mix (the way people actually talk about tech in Kerala) have few short, clear, visual lessons. Making each video by hand in an editor is slow, so creators can't keep up a steady flow of content.

## Who it's for

- Students and early-career developers in Kerala curious about AI
- Working professionals who want to understand AI terms they hear at work
- Anyone who prefers a 60-second visual explanation to a long article

## What a lesson is

- 45–90 seconds, one idea per lesson
- Vertical video (1080×1920), watchable on a phone with sound or muted (captions always on)
- Narration in Malayalam with English tech terms kept in English
- Animated text, labeled diagrams and comparisons, with no stock footage or AI avatars
- A consistent structure: hook question → explain → show (diagram or comparison) → takeaway

## Prototype scope (today)

In:
- Lesson JSON format and validation
- AI voiceover per scene via Sarvam TTS
- Remotion template with five scene types: hook, concept, flow, compare, takeaway
- Scene timing driven by voiceover length
- One rendered lesson: "RAG vs Fine-Tuning," written originally for this app
- A web page listing lessons and a player page

Out (for now):
- User accounts, progress tracking, quizzes
- Admin UI for writing lessons (lessons are JSON files edited in the repo)
- Cloud rendering, CDN hosting, analytics
- Multiple visual themes or voices
- Auto-generated scripts from a topic

## User flow (prototype)

1. Open the site and see a list of lessons (title, duration, short description).
2. Tap a lesson and the video plays with captions.
3. Below the video: a one-paragraph text summary and a link to the next lesson.

## Creator flow (prototype)

1. Write `lessons/<slug>.json` (or ask Claude to draft it using the lesson-video skill).
2. Run `npm run voice -- <slug>` and listen to each scene.
3. Preview in Remotion Studio, adjust wording or timing.
4. Run `npm run render -- <slug>` and `npm run index`.
5. The lesson appears in the web app.

Target: a new lesson from idea to published in under 30 minutes, most of it spent on the script.

## Content principles

- Every script is written originally for this app. Learn from other creators, never copy their scripts, captions, layouts or branding.
- One idea per lesson. If a script needs "also," split it.
- Every concept gets a concrete example a Kerala viewer would recognize (a college office chatbot, a hospital records system, a KSRTC route app).
- Accuracy over hype. No claims that AI "thinks" or "knows." Say what it does.
- Plain words first, then the term: explain the idea, then name it.

## Design principles

- Readable on a small phone screen at arm's length
- Motion explains, never decorates: things move when they enter or when they relate
- Calm pacing; nothing appears faster than the narration mentions it
- Our own look ("backwater dusk": ink, teal, turmeric) used consistently so lessons feel like one series

## Success criteria for the prototype

- The pipeline renders a full lesson from JSON with one command after voice generation
- Voiceover pronounces the English terms correctly and sounds natural in Malayalam
- Five people who watch it can explain the difference between RAG and fine-tuning afterwards
- Making a second lesson takes under an hour

## Roadmap after the prototype

1. Five more lessons (tokens, embeddings, context window, prompting, agents) to test the template
2. Word-level caption sync using timestamps from speech recognition on the generated audio
3. LLM-assisted drafting: topic in, lesson JSON out for human review
4. Hosting on a video streaming service, deployed web app
5. Lesson series, progress tracking, and a short quiz after each lesson
6. Optional English-only and pure-Malayalam versions of each lesson
