# Input plan: growing the amount of Swedish per lecture

Lectures 1 and 2 are deliberately small. They hold about 235 and 400 Swedish
words in total (dialogue, textbook pages, examples, listening and reading). That
is right for a complete beginner, but acquisition is driven by large amounts of
understood input, so the amount must grow on purpose as the course grows.

## Targets per lecture

| Stage | Lectures | Swedish words across the lecture | Longest single listening | Easy stories |
|---|---|---:|---:|---:|
| First steps (A0) | 1–4 | 250–600 | 30–60 s | 1 |
| Growing (A0–A1) | 5–12 | 600–1,200 | 1–2 min | 2 |
| Everyday (A1) | 13–24 | 1,200–2,000 | 2–3 min | 2–3 |
| Toward YKI basic (A2) | 25+ | 2,000+ | 3–5 min | 3 |

Count words with the same method each time: all Swedish text a learner meets in
the lecture, including listening and reading texts.

## How the input grows

1. **Easy stories.** Short original stories that reuse the lecture's words with
   the recurring characters, voiced with the native voices. At least 90% of the
   words should already be known, so the story is understood without English.
   This needs a new `extraSteps` kind (for example `stories`), rendered like the
   textbook step.
2. **Recycling.** Each story and listening text reuses about a third of its
   words from earlier lectures, so old words keep being met in new sentences.
3. **Real Finland-Swedish audio.** No Finland-Swedish synthetic voice exists, so
   from the A1 stage each lecture links one short real clip at the right level
   (for example Yle Nyheter på lätt svenska, Svenska Yle's easy-Swedish news;
   Klartext is Sveriges Radio's, from Sweden) with a listen-for-gist
   question.
4. **Daily listening outside lectures.** A short "listen today" list on the home
   screen: the learner's due stories replayed at normal and then natural speed.

## Checks before a lecture is activated

- The word count is inside the stage's range.
- Every story passes the 90%-known check against the words taught so far.
- At least one listening passes at natural speed without slow audio.
