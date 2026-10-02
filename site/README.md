# Stigen — Lesson 1 workshop

Stigen is a local-first Swedish learning application for adult learners in Finland. The live curriculum is deliberately limited to **Chapter 1, Lectures 1 and 2** while their teaching flow and interface are improved step by step. Saved notes, progress evidence, browser speech, recording, and optional AI coaching remain available around that lesson.

The supplied classroom notes and two books informed the course progression. Their pages and exercises are not republished in the app; learner-facing tasks are newly authored.

Source-to-lecture decisions are tracked in [`../docs/mapping.md`](../docs/mapping.md). Follow that file before revising curriculum content.

## Active chapter files

- `content/modules.json` — the single live chapter definition.
- `content/lectures/lecture-01.json` — the editable Lesson 1 content.
- `content/lectures/lecture-02.json` — the editable Lesson 2 content.
- `content/lectures/index.json` — the generated runtime index; currently contains Lectures 1 and 2.
- `content/modules.json` and each lecture’s `story` — chapter stories and scene metadata; `lib/story-world.ts` supplies neutral lookups and the character registry.
- `lib/character-voices.ts` — the bilingual Azure voice casting for Alex, Elin, Henrik, and Maja.
- `lib/azure-capabilities.ts` — the shared public capability map used by Settings and future learning surfaces.
- `lib/voice-live-context.mjs` — the server-only resolver that turns safe episode or module IDs into bounded Voice Live teaching context.
- `components/learning/CourseOrientation.tsx` — the focused three-step entry into Lesson 1.
- `components/learning/LecturePlayer.tsx` — the teaching flow.
- `components/learning/AzureVoiceTools.tsx` — the reusable conversation and pronunciation tools for episodes and modules.
- `app/course.css` — the visual system, including the dedicated Lesson 1 workspace.
- `docs/lecture-template.md` — the contract for extending lectures without copying Lesson 1.
- `docs/character-mapping.md` — the four stable viewpoints, minimal-cast rule, and introduction gate for any fifth character.
- `docs/textbook-page-map.md` — the complete physical-page 4-55 reading record and four-character coverage evidence; it does not activate later lessons.

The former 60-lecture plan was removed from the repository on September 30, 2026 (it remains in git history). New lectures are built one at a time from the teacher's lessons; see the checklist in [`../AGENTS.md`](../AGENTS.md).

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
npm run content:index   # regenerate content/lectures/index.json after editing a lecture
npm run check           # content validator, typecheck, lint, progress-rule tests
npm run build
```

The full project handbook, including features, Azure lessons learned and the
backlog, is [`../AGENTS.md`](../AGENTS.md).

## Optional AI features

Copy `.env.example` to `.env` and add only the server-side credentials you use. Without AI configuration, lessons, quizzes, model answers, local recording, and self-review remain available; generated speech and live voice require Azure.

- Text feedback and the inline lesson coach use an OpenAI-compatible Responses endpoint.
- Fast Swedish transcription can use Azure Speech, with Swedish locales configured server-side.
- All character, dialogue, vocabulary, and pronunciation playback uses server-side Azure Speech synthesis. There is no browser or static-audio fallback.
- Live voice uses Azure Speech Voice Live with `gpt-realtime-2.1-mini` and the multilingual HD voice `en-US-Andrew:DragonHDLatestNeural` (Swedish and English in one reply). A same-origin server WebSocket proxy keeps the long-lived Azure key and trusted lesson instructions out of the browser.
- Pronunciation scoring uses Azure Speech pronunciation assessment for `sv-SE` (`/api/pronunciation`).

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
