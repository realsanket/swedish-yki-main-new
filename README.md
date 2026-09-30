# Stigen: Swedish for YKI, one lesson at a time

Stigen is a personal Swedish learning app. It follows a real evening class
(the teacher's notes in `docs/Group 3.md`, the class textbook and the YKI
preparation book) and turns each class lesson into an app lecture, aimed at the
Swedish YKI exam in Finland.

**Live scope:** Chapter 1 with Lecture 1 (introduce yourself, Swedish sounds)
and Lecture 2 (how are you, people in your life, question words).

**Start here:** [`AGENTS.md`](AGENTS.md) is the full handbook: who it is for,
working rules, architecture, the lecture content model, features, learning
decisions, status and backlog.

## Run it

```bash
cd site
npm install
cp .env.example .env    # add the Azure key for voices, live coach and scoring
npm run dev             # http://localhost:3000
```

Checks before pushing:

```bash
npm run content:index   # after editing a lecture JSON
npm run check           # content validator, typecheck, lint, progress tests
npm run build
```

Local runs have every feature. The Vercel preview
(<https://swedish-main.vercel.app>) shows changes visually, without voice
features and with temporary progress; see [`site/DEPLOY.md`](site/DEPLOY.md).

## What a lecture contains

1. **Hear the conversation:** recall from earlier lectures, the Elin and Alex
   story, meaning checks.
2. **Textbook page(s):** the real page in five stages (gist, meaning, hunt,
   vanishing text, role-play).
3. **Build it step by step:** one idea per card, with activities and
   plain-English grammar notes.
4. **Try the phrases.** *Part 1 ends here: a good place to stop for the day.*
5. **Do the task:** recall, then plan your lines, say them, check them (with a
   Swedish pronunciation score), answer unexpected questions, say it again.
6. **Check yourself.**
7. **Take it forward.**

Between lectures, the **Word bank** page runs spaced review: see the English,
say the Swedish, check and rate, with a "What I still remember" chart.

## Where things live

| Purpose | Location |
|---|---|
| Project handbook | [`AGENTS.md`](AGENTS.md) |
| Source-to-lecture decisions | [`docs/mapping.md`](docs/mapping.md) |
| Lecture content (edit these) | [`site/content/lectures/`](site/content/lectures) |
| Chapter and titles | [`site/content/modules.json`](site/content/modules.json) |
| Grammar glossary | [`site/content/grammar-terms.json`](site/content/grammar-terms.json) |
| How to write or extend a lecture | [`site/docs/lecture-template.md`](site/docs/lecture-template.md) |
| Plan for growing Swedish input | [`site/docs/input-plan.md`](site/docs/input-plan.md) |
| Character voices | [`site/docs/voice-casting.md`](site/docs/voice-casting.md) |
| Azure services | [`site/docs/azure-services.md`](site/docs/azure-services.md) |
| App code | [`site/`](site) (see [`site/README.md`](site/README.md)) |

Reference PDFs, textbook images and Classroom exports under `docs/` are
evidence for building lessons, not app content. Learner-facing dialogues and
exercises are original.
