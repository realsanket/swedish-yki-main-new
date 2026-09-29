# Stigen — Lesson 1 workshop

Stigen is a local-first Swedish learning application for adult learners in Finland. The live curriculum is deliberately limited to **Chapter 1, Lecture 1** while its teaching flow and interface are improved step by step. Saved notes, progress evidence, browser speech, recording, and optional AI coaching remain available around that lesson.

The supplied classroom notes and two books informed the course progression. Their pages and exercises are not republished in the app; learner-facing tasks are newly authored.

Source-to-lecture decisions are tracked in [`../mapping.md`](../mapping.md). Follow that file before revising curriculum content.

## Active chapter files

- `content/modules.json` — the single live chapter definition.
- `content/lectures/lecture-01.json` — the editable Lesson 1 content.
- `content/lectures/index.json` — the generated runtime index; currently contains only Lecture 1.
- `lib/story-world.ts` — the Chapter 1 story, cast, and artwork lookup.
- `lib/character-voices.ts` — the bilingual Azure voice casting for Alex, Elin, and Henrik.
- `lib/azure-capabilities.ts` — the shared public capability map used by Settings and future learning surfaces.
- `lib/voice-live-context.mjs` — the server-only resolver that turns safe episode or module IDs into bounded Voice Live teaching context.
- `components/learning/CourseOrientation.tsx` — the focused three-step entry into Lesson 1.
- `components/learning/LecturePlayer.tsx` — the teaching flow.
- `components/learning/AzureVoiceTools.tsx` — the reusable conversation and pronunciation tools for episodes and modules.
- `app/course.css` — the visual system, including the dedicated Lesson 1 workspace.
- `docs/lecture-template.md` — the contract for extending lectures without copying Lesson 1.
- `docs/character-mapping.md` — the minimal-cast rule and source-role mapping for deciding when a future character is actually needed.
- `docs/textbook-page-map.md` — the complete physical-page 4-55 reading record and future cast evidence; it does not activate later lessons.

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

Copy `.env.example` to `.env` and add only the server-side credentials you use. Without AI configuration, lessons, quizzes, model answers, local recording, and self-review remain available; generated speech and live voice require Azure.

- Text feedback and the inline lesson coach use an OpenAI-compatible Responses endpoint.
- Fast Swedish transcription can use Azure Speech, with Swedish locales configured server-side.
- All character, dialogue, vocabulary, and pronunciation playback uses server-side Azure Speech synthesis. There is no browser or static-audio fallback.
- Live voice uses Azure Speech Voice Live with `gpt-realtime-2.1-mini` and native `sv-SE-MattiasNeural`. A same-origin server WebSocket proxy keeps the long-lived Azure key and trusted lesson instructions out of the browser.

The AI coach is practice support, not an official YKI examiner. It does not assign official grades or guarantee a test result.

### Reuse Azure voice in an episode or module

Use the shared component instead of rebuilding capability checks, microphone UI,
or provider calls in each lesson:

```tsx
import AzureVoiceTools from "@/components/learning/AzureVoiceTools";

// Both conversation and pronunciation for one episode.
<AzureVoiceTools contextId="lecture-01" />

// Conversation only, using all currently available material in a module.
<AzureVoiceTools contextId="module-01" tools={["conversation"]} />
```

`episode-01` is also accepted as an alias for `lecture-01`. The component sends
only this stable ID and the selected mode. The server resolves objectives,
phrases, dialogue, speaking help, and pronunciation notes from the canonical
JSON files. Never send a prompt, filesystem path, Azure endpoint, or key from a
lesson component.

To add a future episode, add its canonical `content/lectures/lecture-XX.json`
file and include its number in a range in `content/modules.json`. Any module
range automatically aggregates the lecture files that currently exist inside
that range. Shared Azure labels, required variable names, and test labels belong
in `lib/azure-capabilities.ts`, not in individual screens.

## Learning and exam scope

Stigen keeps listening, speaking, reading, and writing evidence separate. Lecture 1 completion records practice; it does not certify a CEFR level or predict a YKI result. Always use the Finnish National Agency for Education links in the Resources view for current registration, test-day, and certification rules.

Internal fields named `fi` are retained for compatibility with the original saved-data schema; in this project those fields contain Swedish.
