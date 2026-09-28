# Stigen — Swedish from A0 to B1

Stigen is a local-first Swedish learning application for adult learners in Finland. It contains 60 connected episodes across 12 modules, original four-skill YKI-style practice, spaced word review, saved notes, progress evidence, browser speech, recording, and optional AI coaching.

The supplied classroom notes and two books informed the course progression. Their pages and exercises are not republished in the app; learner-facing tasks are newly authored.

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

## Course and exam scope

Stigen keeps listening, speaking, reading, and writing evidence separate. The final workshops and simulations are compressed, original practice—not copies of an official examination and not representations of official timing. Always use the Finnish National Agency for Education links in the Resources view for current registration, test-day, and certification rules.

Internal fields named `fi` are retained for compatibility with the original saved-data schema; in this project those fields contain Swedish.
