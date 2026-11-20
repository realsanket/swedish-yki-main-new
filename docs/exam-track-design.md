# Exam course track: design (16 November 2026)

**Goal.** The app carries the exam-first course documented in `reports/` (start with `reports/START-HERE.md`): an 84-day pass-first course with a core sheet, short learner pages for Days 1-14, the long curriculum for Days 15-84, Green/Amber/Red marks, an 8-card daily limit, an error list and a pilot log. The existing 52-lecture course stays as it is.

**Decisions.**

1. **A second track beside the lectures, not inside them.** The lecture list is wired to one 52-lecture course (module ranges, `lecture-NN` ids, `lecture_state` without a track column), so the exam track has its own content folder, its own table and its own views. Nothing in lecture code changes except the sidebar and the hash router.
2. **Content is generated once and committed.** `scripts/build-exam-content.py` reads `../reports/*.md` and writes `site/content/exam/*.json`. The app never reads `../reports` at run time (builds rooted at `site/` must not depend on it). `reports/teacher-only/` and `reports/data/` are never read.
3. **Markdown with playable Swedish.** The learner pages and curriculum entries are Markdown with Swedish in *italics*. The app renders italics as tap-to-hear chips (`/api/speech`, Azure sv-SE character voices) and `~~wrong forms~~` as marked-wrong text. This gives audio for all 84 days without hand-structuring each sentence. Days 1-14 additionally have structured steps, cards and phone-call scripts (two speakers via `AudioButton` segments).
4. **Progress is one JSON document** per learner in a new table `exam_state` (created with `CREATE TABLE IF NOT EXISTS`, so the learner's existing `progress.db` is untouched). Actions are small idempotent deltas applied in a transaction (`POST /api/exam`), so two tabs cannot clobber each other; no revision check is needed for one learner.
5. **Own review queue.** Cards use `scheduleReview` from `lib/progress.ts` but their own state (`exam_state.cards`), so the lecture review whitelist is not touched. At most 8 new cards a day is enforced by content (the validator), not by the UI.
6. **Green / Amber / Red.** Logging a day stores the mark, real minutes and optional pilot fields. A day counts as done on green or amber; red means repeat. "Today" is the first unit not done.
7. **Not in the app:** the teacher-only mock reserve, the held-back book task descriptions, any exam date or pair choice (decided at booking time).
8. **Audio caveat.** Voices are synthetic Sweden-Swedish (Azure has no Finland-Swedish voice); the UI says so. Teacher recordings are better for copying; the audio list in `reports/` is the recording brief.

**Views (sidebar group "Exam course").** Exam today, Exam days (all 84 units with marks), Core sheet, Exam cards, Error list, Method and guide (plan, templates, book map, guide, audio list as readable documents). The pilot log is a tab on Exam days. A day opens at `#exam-day/<key>`.

**Checks.** `npm run check` gains `validate-exam-content.py` (84 days present, Days 1-14 at most 8 cards each, steps and dialogues present, no teacher-only text) and `test:exam` (state actions). A browser pass at 1440x900 and 390x844 covers every new view.
