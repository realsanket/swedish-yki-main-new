# Stigen — Lesson 1 workshop

Stigen is a local-first Swedish learning application for adult learners in Finland. The live curriculum is deliberately limited to **Chapter 1, Lecture 1** while its teaching flow and interface are improved step by step. Saved notes, progress evidence, browser speech, recording, and optional AI coaching remain available around that lesson.

The supplied classroom notes and two books informed the course progression. Their pages and exercises are not republished in the app; learner-facing tasks are newly authored.

Source-to-lecture decisions are tracked in [`../mapping.md`](../mapping.md). Follow that file before revising curriculum content.

## Active chapter files

- `content/modules.json` — the single live chapter definition.
- `content/lectures/lecture-01.json` — the editable Lesson 1 content.
- `content/lectures/index.json` — the generated runtime index; currently contains only Lecture 1.
- `lib/story-world.ts` — the Chapter 1 story, cast, and artwork lookup.
- `components/learning/LecturePlayer.tsx` — the teaching flow.
- `app/course.css` — the visual system, including the dedicated Lesson 1 workspace.
- `docs/lecture-template.md` — the contract for extending lectures without copying Lesson 1.

Lectures 2–60, the former 12-chapter plan, later story mappings, and later artwork are preserved outside the runtime tree in [`../backup/future-course-2026-09-29`](../backup/future-course-2026-09-29). Do not restore them until the user explicitly expands the course scope.

Lecture presentation is optional metadata. Lecture 1 opts into `conversation-first`; a future lecture defaults to a neutral renderer and must earn any custom layout from its own verified teaching material. Shared components must not branch on lecture numbers.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Progress is stored in a local SQLite database under `data/`.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Optional AI features

Copy `.env.example` to `.env` and add only the server-side credentials you use. Without AI configuration, all lessons, quizzes, model answers, browser text-to-speech, local recording, and self-review remain available.

- Text feedback and the inline lesson coach use an OpenAI-compatible Responses endpoint.
- Fast Swedish transcription can use Azure Speech, with Swedish locales configured server-side.
- Live voice uses a server-created Azure GPT-Live WebRTC session. Long-lived API credentials are never sent to the browser.

The AI coach is practice support, not an official YKI examiner. It does not assign official grades or guarantee a test result.

## Learning and exam scope

Stigen keeps listening, speaking, reading, and writing evidence separate. Lecture 1 completion records practice; it does not certify a CEFR level or predict a YKI result. Always use the Finnish National Agency for Education links in the Resources view for current registration, test-day, and certification rules.

Internal fields named `fi` are retained for compatibility with the original saved-data schema; in this project those fields contain Swedish.
