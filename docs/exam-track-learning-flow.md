# Exam course: the learning flow (implementation spec)

*16 November 2026. For the engineers who build it. It replaces the "document dump" day screen and changes no course content. Source tags: [Plan n] = `reports/YKI-EXAM-FIRST-PLAN.md` section n; [Core n] = `reports/YKI-CORE-SHEET.md`; [Pages] = `reports/YKI-LEARNER-DAYS-1-14.md`; [Curr] = `reports/YKI-EXAM-FIRST-CURRICULUM.md`; [Pilot] = `reports/YKI-PILOT-LOG.md`; [Start] = `reports/START-HERE.md`. "[App's own]" marks a rule added here because the course files are silent.*

**Kept decisions.** The pair and the exam date are chosen only at booking time [Plan 1, 4.7]. No teacher-only mock prompt is ever in the app [Plan 6.2]. The 84 days are a default order of 88 study units, not dates [Plan 1]. This spec writes no new Swedish. Every Swedish string in the app must come from `reports/`, or be a composed line listed for the teacher (6.3), and stays marked **[Unreviewed Swedish: have a teacher check it]**.

---

## 1. The method in one paragraph

The product enforces the course's own rules, each cited where it is used: hear before you say [Core 14 rule 4]; the ladder with growing time pressure [Plan 3.2]; at most 6 new patterns and 8 new cards a day, review stopped at 8 minutes, a 60-minute day [Core 14 rules 1, 3, 6]; done when a changed version works [Core 14 rule 7]; Green, Amber, Red, with counts as targets and never gates [Plan 1]. The app never says "ready to book" [Plan 3.4 rule 8].

**Why this order (general research, cited from memory and not checked for this spec; none is a YKI study).** Recall from a cue beats re-reading (Roediger and Karpicke 2006); spaced review beats massed review (Cepeda et al. 2006); mixing item types helps (Rohrer and Taylor 2007, on mathematics practice); feedback on one's own errors helps accuracy (Lyster and Saito 2010). Shadowing helps listening more surely than speaking.

---

## 2. The learner journey

### 2.1 First visit

`Exam today` shows a welcome once (`state.seenWelcome`): what this is ("One study day is about 60 minutes. The app tells you what to do next."); the six blocks of [Plan 3.1] with minutes; the honest notices (12.3). Then `Check where to start (25 min)` and `Start at Day 1`, with "If you are new to Swedish, start at Day 1. The check sends most beginners there anyway."

### 2.2 Day 0: the staged check [Plan 4.1, Part 1]

Five stages of 5 minutes, each with a stage clock. The Swedish prompts are the plan's own, parsed into `placement.json`.

| Stage | In the app | Mark |
|---|---|---|
| 1 Understand 6 spoken questions | Audio only; one extra hearing per question. The learner picks what the question asks from 4 English options (the other questions' meanings). | Computed. Green: 6 right, no second hearing. Amber: a second hearing, or 1 wrong. Red: 2 or more wrong. |
| 2 Build 4 sentences | Word chips in mixed order, tapped into order; checked against the key. | Computed. Green: 4 right first try. Amber: 1 fixed on a second try. Red: 2 or more not built. |
| 3 Change them | One instruction per sentence ("Make it negative", "Ask the question"). Typed and checked with the typed diff (4.8). [App's own: the plan says "say"; typing gives an objective check.] | Computed. Green: each change works. Amber: they work, with one repeated slip. Red: the negative or the question fails. |
| 4 Speak 30 seconds | Card, up to 1 minute to think, record, transcript. | Self-marked, the plan's three descriptions as buttons. |
| 5 Type a message | Card, three points as tick boxes, text box. | Self-marked. |

**The rule.** The first Red in stages 1-3 ends the check: "Start at Day 1." Stages 4 and 5 then stay optional and only add a home-screen line ("Watch Days 3a and 7" or "Watch Days 3b and 8"). If stages 1-3 are all Green or Amber: "You may be able to start later. The long placement (about 100 minutes) is done on paper with your teacher: Method, section 4.1. Until then, start at Day 1." A link `Start at Day 15 instead` sets `startKey` after a confirm. The long placement is not built.

### 2.3 The daily loop

`Start today` opens the day player (section 3). The order inside every ordinary day is fixed:

**Review (8 min, hard stop) → Hear → Rule check → Imitate → Recall → Swap → Understand → the speaking task (card, attempt, check, redo with a change) → the typed task (points first, write, check, fix) → numbers, or outside listening and reading → Cards → Errors → Log.**

- **Done.** An activity is done by its own rule (section 4). A unit is done when its latest run is logged Green or Amber (rest day and mock: when saved). A Red log ends today, but the unit stays next.
- **A second unit in one day** is possible from `All days`, with "A second day today means more than 6 new patterns. Its cards will wait until tomorrow." (8.4)

### 2.4 Weekly rhythm

The unit order already holds it [Plan 6.1]: six study days, then a light day (7, 21, 35, 49, 70, 77); mocks on 28, 56, 84; rest on 83. Two reminders come from the entries: the Top-3 error drill where an entry prints it, and "Send your teacher pack" where a page or entry says so (Days 6 and 13). That screen lists the two newest typed texts with their cards and points (`exam_work`, 11.4), `Copy`, and "Add your two newest recordings: download them from the task screen."

### 2.5 Missed days and Red days

- **Missed day.** Nothing is lost and no streak is broken. The open run resumes at its first unfinished activity; on a new calendar day a fresh Review step comes first. After 7 or more days away the home card says "Welcome back. Warm up first: your due cards, then re-record one earlier task" (an unlogged practice run) [App's own, from the light-day recipe in Plan 3.1].
- **Red day.** The log is saved, the day's cards still join review, and the home card becomes "Day 4 again, with new details": a new run of the same unit with `variant` raised by one (13.1). The Red stays in history.

### 2.6 Home screen

Top to bottom: (1) one primary card with exactly one button, by priority: run in progress → Red repeat → pinned exit-test redo → next unit → "You have finished every day". (2) Today's steps with minutes. (3) Cards due, open errors, days done, hours logged. (4) The last 14 calendar days as dots with "9 study days in the last 14"; no streak counter. (5) Pilot status on Days 1-7. (6) The notices, one line with `Why?` after the first week.

---

## 3. The day player

### 3.1 Shell

The player replaces `ExamDay.tsx`. A lesson has **steps** (the printed steps or minute blocks, 5 to 9 a day), each with 1 to 6 **activities**.

```
1440 x 900
+-----------------------------------------------------------------------------------+
| < All days   DAY 4 . Book an appointment      23 of 60 min  [Pause]  [Full entry] |
| [1 Review ok][2 New lines ok][3 Call ====  ][4 Text][5 Numbers][6 Cards][7 Log]   |
+--------------------------------------------------+--------------------------------+
| STEP 3 OF 7 . SPEAKING . 15 MIN (6 used)         | Today's lines   (tap to hear)  |
| Call the health centre                           | Rule of the day                |
| o o (o) o   The call, first take                 | Watch for (wrong form, struck) |
|   [ activity body, max width 720 ]               | Notice: computer voices        |
+--------------------------------------------------+--------------------------------+
| [Back]              [Skip this step]                     [Next: listen back  >]   |
+-----------------------------------------------------------------------------------+

390 x 844
+--------------------------------------+
| <  Day 4        23/60 min   [...]    |
| Step 3 of 7  [== == =- -- -- -- --]  |
| SPEAKING . 15 MIN (6 used)           |
| Call the health centre               |
| o o (o) o  The call, first take      |
|  [ activity body, full width ]       |
| [Lines]                 [Next  >]    |   sticky bar; Back and Skip sit in [...]
+--------------------------------------+
```

- **Stepper.** Segment widths follow the minutes; each has an icon and a text state ("done", "now", "skipped", "to do"). A done segment reopens read-only; a later one asks "Jump ahead? Skipped steps show in the log."
- **Time.** The day clock counts active time (it pauses when the tab is hidden, after 3 idle minutes, and on `Pause`). Over budget: "2 min over. Finish this take and move on." Nothing is blocked.
- **Side panel** (a bottom sheet on a phone). Today's lines as tap-to-hear chips; a line appears only after its Hear activity.
- **Full entry.** A drawer with the curriculum entry and the models. Opening the models before the first attempt of a counted task sets `modelFirst` (section 5).
- **Skip.** Always allowed and recorded.
- **Session length.** At the start of a run: `60` (default), `90`, `30`. 90 shows `only90` activities and the 90-minute budgets of [Plan 3.1]. 30 keeps the same lesson over two sittings; the second starts with a 5-minute review [App's own reading of the 30-minute scaling].

### 3.2 Time budgets (so the app does not inflate the day)

The curriculum estimates "about 30 s to hear a new line and say it three times; 30 s per ladder rung" [Curr, note above Day 15]. Hear, Imitate and Recall together must fit that scale. The generator estimates every step as the sum below plus 10 seconds per activity:

| Activity | Seconds per item |
|---|---|
| Hear | 20 a line |
| Imitate | 15 a line |
| Recall | 20 a line |
| Swap | 20 an item |
| Choose | 8 an item; rule check 20 |
| Dictation | 20 an item |

*Worked example, Day 4 step 2 ("Listen and repeat. Ladder", 10 minutes = 600 s):* Hear 6 lines (4 patterns, 2 known) 120; rule check 20; Imitate 4 lines 60; Recall 4 lines 80; Swap 6 items (4 ladder rungs, 2 swaps) 120; Understand and Words 4 items 32; six activities 60. Total 492 s, about 8 minutes.

- **Evidence calls never block.** The next item opens at once; a transcript or score fills in when it arrives.
- **Build check.** For Days 1-14 a step whose estimate exceeds its printed minutes fails the build unless trimmed, in this order: swaps down to 2, then 1, a pattern; Swap on 2 patterns; Imitate on patterns only. Hear and Recall are never trimmed.
- **Attribution.** Each run stores seconds per step; the pilot view lists them beside the budgets (10.3), so an overrun can be traced to the course load or to the app.

### 3.3 Contract for activity components

```ts
export type ActivityProps<A extends ExamActivity = ExamActivity> = {
  unit: ExamUnit; lesson: ExamLesson; activity: A; run: ExamRun;
  variant: number;                 // 0 = first time; 1+ = repeat with new details
  factor: 0 | 1 | 1.5 | 2;         // timer factor from activity.pressure (0 = no timer)
  record: (result: ExamResult, done: boolean) => Promise<string>;   // "" or an error message
  services: { speech: SpeechApi; recorder: RecorderApi; evidence: EvidenceQueue;
              canSpeak: boolean; canTranscribe: boolean; canScore: boolean };
};
```

An activity never draws its own Next button (it calls `record` with `done: true` and the shell enables Next), and must work with all three `can*` flags false.

---

## 4. Activity types

Evidence goes into `run.evidence[activity.id]` as `first` (never overwritten) and `last`. Long texts go to `exam_work`. **One recording makes at most one evidence call: Imitate uses `/api/pronunciation`; everything else uses `/api/transcribe`.** Both share one limiter of 12 calls a minute (`allowAiRequest`, `lib/ai.ts`), so all calls pass through the client `EvidenceQueue` (11.5).

| Type | What the learner does | Evidence | Uses |
|---|---|---|---|
| `review` | Due cards, 8-minute stop (section 8) | per card | `CardReviewer` (new) |
| `read` | Reads a short note or an unstructured block | done | `MarkdownView` |
| `hear` | Hears each new line; text appears after the first play | plays, slow used | `/api/speech` |
| `choose` | Picks a meaning or the right form | first-try right per item | `/api/speech` |
| `imitate` | Hears, records, compares | pronunciation score (display only) | `/api/pronunciation`, `toWav16k` |
| `recall` | Sees English, says the Swedish, uncovers | verdict, self-rating, `modelFirst` | `/api/transcribe` |
| `swap` | Says the line with a new detail or one ladder change | verdict per item | `/api/transcribe` |
| `respond` | A spoken task from a card, or unknown questions | understood, points, seconds, excerpt | `/api/transcribe`, optional `/api/exam/points` |
| `dialogue` | A phone call, turn by turn | turns answered, replays, points | `/api/speech`, `/api/transcribe` |
| `type` | Types lines from English, or a message from a card | diff classes, points, words, minutes | pure diff |
| `dictation` | Hears numbers, times, dates, prices; types digits | got / of, kinds missed | `/api/speech` |
| `outside` | A timed routine on real material or a book task | self-entered scores | none |
| `drill` | The Top-3 error drill | text saved | `exam_work` |
| `cards`, `errors`, `log` | Sections 8.4, 9, 5 | state actions | state |
| `timer` | Mock shell: timers and a results table, no prompts | signals | state |

**4.1 Hear.** One row per line. Before the first play: `Play`, the English, "Swedish appears after you listen." After it: the Swedish (bold = the part you change), word notes, `Play again`, `Slow`, "Heard 1 of 3" [Pages, top]. Complete when every line has played once; three is a target. No timer. Elin speaks the learner's lines, Henrik the "Voice" lines.

**4.2 Choose.**
- *Listen mode* (the "Understand" questions): audio once, no text, 4 English options taken from other items of the same activity, then the same unit. One replay, recorded.
- *Read mode* (task words, which the exam shows in writing): the word as text and audio, 4 options.
- *Rule check*: from the Rule line's right and wrong pair, "Which is right?" with both as plain options. The wrong form is never played.
- Feedback: "Yes." or "Not this time. It means: …"; a missed item returns once.

**4.3 Imitate.** Per line: the model plays, recording follows (10 seconds at most), then `Model` and `You` sit side by side. With scoring, words are labelled "good", "close" or "work on it", plus "Scored against Sweden-Swedish. A correct Finland-Swedish sound can lose points. This never changes your mark." Two retries at most. No microphone: "Say it aloud after the model" and `Done`.

**4.4 Recall (cover and say).** English cue only, with a gentle timer (twice the target; target = words x 0.75 s, at least 4 s). `Record`, say it, `Stop`. Then the transcript ("We heard: …"), the Swedish, `Play`, and `Got it` / `Slowly` / `Missed`. `lib/exam-match.ts` preselects one:

| Verdict | Rule (after lower-casing, removing punctuation, turning digits into words) | Preselect |
|---|---|---|
| `match` | at least 85% of the expected words found in order | Got it |
| `close` | 60-85% | Slowly |
| `different` | under 60% | Missed, missing words underlined |
| `empty`, `none` | nothing heard, or no transcription | nothing |

Under the transcript: "If the machine misheard you, choose for yourself." The learner's choice wins; changing `different` to `Got it` stores `override: true`. `Show answer` before recording sets `modelFirst` and counts as Missed. A missed line returns once.

**4.5 Swap (rungs 2-5).** Two or three patterns a day [Plan 3.1 block 2], three swaps each [Core 14]. An item shows the base line in English and one instruction: "Say it with: *Helsingfors* (Helsinki)", "Put *i dag* first", "Now for *hon* (she)", "Make the question". Expected sentences come from content (6.3), never from a rule at run time; the check is Recall's, with a moderate timer. Patterns whose first swap was right feed the pilot's "changed independently".

**4.6 Respond (the speaking task).** One screen per stage:

1. **Card.** The card in Swedish with `Hear it` and `Show English`. Days 1-14 ask "What does the card want?" (3 options from the overlay). Days 15-84 ask `Yes` / `Partly` / `No` after the English. Stores `understood`.
2. **Prepare.** The card's preparation time, if any. Paper notes are allowed.
3. **Speak.** Countdown of target x factor; recording stops 5 seconds after it; overrun is shown as a target ("12 s over").
4. **Check.** The transcript, the learner's audio, and the required points as tick boxes. With the AI check on (11.3) each point shows "AI thinks: found / not found"; the learner's ticks decide. A `critical` point shows "Without this the message cannot be used."
5. **Model.** Behind `Show the model` (truly hidden, not a blur) until the check is saved.
6. **Redo with a change.** The next variant's details, moderate timer, same points. Two redos at most [Plan 3.4 rule 3]: "Move on: more redos only memorise this answer."

*Question mode* (Day 1 step 3, Day 2 step 5): the voice asks, audio only; where the key has a model answer the Recall verdict is used. Recordings stay in memory with `Download`.

**4.7 Dialogue.** Respond with stage 3 as a call:
- The voice line plays once. Gentle mode allows one `Hear it again` per turn, recorded; exam mode has none, because the real voice cannot repeat [Plan 1].
- Recording starts after the line with a turn countdown (40 s gentle, 30 s moderate, 20 s exam, or the entry's numbers). `Done` ends a turn early.
- A silent turn is kept as "no answer" and the call goes on, with the day's tip ("Give the next point from your card. Do not say *Okej* by reflex.") [Curr, note above Day 15].
- No network call happens during the call. Afterwards turns are transcribed through the queue; the check shows each turn's voice line, transcript, clip and `Show model`.
- The title is `task.title` ("The health-centre call"), never the raw heading.

**4.8 Type.**
- *Lines mode* (Day 1 step 5, the Day 12 drill, the Day 14 sentence test): English cue, one input with `å ä ö` buttons, `spellCheck={false}`, `lang="sv"`. `lib/exam-diff.ts` classifies:

| Class | Rule | Shown | Counts as |
|---|---|---|---|
| exact | equal after normalising case, spaces, final punctuation | "Right." | right |
| spelling slip | each differing word within edit distance 1 (up to 5 letters) or 2 (longer), or differing only in a/å/ä or o/ö | "Right. Spelling slip: *tyvär* → *tyvärr*. Slips never lower your mark." | right |
| word order | same words, another order | "The words are right, the order is not." plus the day's rule | real error |
| missing, extra, wrong word | anything else | the model with the differing words underlined and labelled | real error |

  A real error offers `Add to my error list`. One retry; the first try is stored.
- *Message mode* (the typed task). Screen 1: the card, then its points to tick [Plan 3.1 block 4]. Screen 2: a text box, a word count, a clock against time x factor. Screen 3: the fixed-order check of [Plan 3.4 rule 6] as five questions beside the text (points, verb second, *inte*, verb forms, *en/ett*). The app adds objective findings only: opening and closing found or not, and **watch hits** (a wrong form listed for today, underlined with "The page says: …"). Screen 4: the model, and "Rewrite one or two sentences".

**4.9 Dictation.** Items come from the back-of-file keys, and for Day 14 and repeats from `lib/exam-numbers.ts` (6.4). Audio once, one replay, a numeric input. Accepted: spaces ignored in phone numbers; `.` or `:` in times; `,` or `.` in prices. Results are grouped by kind with the Swedish words playable. A missed item is offered as today's "number you find hardest" card.

**4.10 Outside material.** For the easy-news and notice routines [Plan 7.3, 7.4], notice hunts and Book practice. The routine appears as timed sub-steps in the plan's wording, with fields for facts, numbers and two self-entered scores, under "The app cannot check this. Write the true number." A book task shows only its page code, our description, a timer and the generic points of its kind. Links live in `content/exam/links.json`, checked by hand.

---

## 5. Evidence and the suggested mark

The Log step suggests a mark from the Red and Amber definitions of [Plan 1], and nothing else (`lib/exam-mark.ts`, pure):

```
counted = activities with counts: true (the speaking task, the typed task, each exit test)
RED   if any counted task has: understood = "no" (or a failed card check)
                             | no answer on the first attempt (empty recording or text)
                             | modelFirst = true
                             | a critical point unticked after the first attempt
      or the learner ticks one of the day's own "Red here" lines
AMBER else if any counted task has: a required point unticked on the first attempt
                             | the redo with a change not done, or done with a point missing
                             | "I got there, but slowly" ticked
                             | an error added today whose type is recurring (section 9)
      or a counted task was skipped ("Not finished: Amber at best. You can also stop and finish tomorrow.")
GREEN otherwise
```

Never used: pronunciation scores, transcript percentages, spelling slips, word counts, seconds, error counts. They appear under "Targets (not gates)".

**Log step.** (1) "What the evidence says", one line per counted task ("Call: 5 of 5 points on the first take; redo done."). (2) Three mark buttons with the day's own sentences, rendered through the Markdown inline renderer so wrong forms show struck, not as raw `~~`. One is labelled "Suggested from your evidence"; all stay selectable. (3) "Actual minutes", prefilled from the clock. (4) The pilot row on Days 1-7 (10.3). (5) Note. (6) `Save the day`.

Stored: `gar`, `suggested`, `reasons[]`, `minutes`, `clockMinutes`. The progress view later says "On 3 days you marked higher than the evidence suggested. Your teacher's rating is the tiebreak." [Plan 1]

**After saving.** Green or Amber: "Saved. Day 5 is next. Today's cards come back tomorrow." Red: "Saved. Tomorrow you do this day again with new details. That is the plan working, not a failure."

---

## 6. Content for Days 1-14

### 6.1 Sources and the overlay

`scripts/build-exam-content.py` writes one `ExamLesson` per unit to `content/exam/lessons.json`. For Days 1-14 it reads the learner page, the back of the file, and `YKI-AUDIO-LIST-DAYS-1-14.md` (which labels each line as pattern, word, swap, question, numbers, rule example or task card). What cannot be parsed sits in a committed overlay, `content/exam/authoring/days-1-14.json`:

| Overlay field | Why |
|---|---|
| `steps[stepId].activities` | Overrides the default expansion below. |
| `swaps[lineId]`, `ladder[stepId]` | Each swap item and ladder rung as `{ instructionEn, sv }` (6.3). |
| `points[taskId]` | Required points in English, split from the Green sentence; `critical` where the page names a Red ("nobody could write your number down"). |
| `cardCheck[taskId]`, `variants[taskId]` | Three English options for "what does the card want?"; detail sets for runs 2 and 3 (13.1). |

| Printed step | Activities |
|---|---|
| "Review", "Due cards" | `review` |
| "Listen and repeat" | `hear` → rule `choose` → `imitate` → `recall` → `swap` → listen `choose` (the Understand questions) → read `choose` (Words) |
| "Answer the … questions", "A helper asks" | `respond`, question mode |
| A card in italics with "Record" or "Run it" | `respond` |
| "Call …", "… calls you" (Voice lines at the back) | `dialogue` |
| "Type", "Text", "Write to" | `type` message; `type` lines for "type the five sentences" and the Day 12 drill |
| "Write the N numbers / dates / prices / times your helper says" | `dictation` |
| "On a notice, find …", "One short clip" | `outside` |
| "Cards" / "Error list" | `cards` then `errors` / `errors` |
| (every unit) | `log` |

Day 14's five tests are counted activities E1-E5: read `choose` over the 41 words; `dictation` of 20 generated items; `type` lines from the sentence-engine test [Plan 4.2]; two `respond` tasks.

### 6.2 Cards for Days 1-14

The generator must parse the page's **Cards (N)** line (today Day 4 yields 4 cards where the page lists 8). Items are split on `;`:

| Text | Card |
|---|---|
| `1-5 = patterns 1-5` | one `say` card per pattern |
| `5 = patterns 5 and 6` | one `say` card with two items |
| `5 = *Swedish line*` | a `say` card for that known line |
| `6-8 = listening cards: *a* · *b* · *c*` | one `listen` card each |
| `7 = listening card: the two Understand questions` | one `listen` card with two items |
| `8 = word card: *välj, be om*` | one `word` card, one item per word |
| `7 = *halv fem* = 4:30` | one `number` card |
| "the number you find hardest", "your own birthday", "the price you found hardest" | a `pick` slot: the Cards step asks the learner to choose from the day's set or type it |

The validator fails if the parsed count differs from N.

### 6.3 Swaps and composed lines

There is no automatic swap. "Swap:" notes on the pages are mixed: single words, whole sentences (Day 3b: *I morgon har jag inte tid.*) and prose (Day 2: "any number from 1 to 12"). So the overlay lists every swap and ladder item as a finished sentence: `swaps[lineId] = [{ instructionEn, sv }]`. A sentence is either copied from the page or its key, or **composed**: a printed pattern with one printed swap word put in the place of one word or phrase. The build checks that every word of a composed sentence occurs in that page's pattern or swap words, and writes all composed sentences to `content/exam/authoring/composed-lines.md`, one per line with its source, for the teacher to check. Person changes and questions are used only where the page or key prints the result ("Step 2 key: *Nu bor hon i Vanda.*"). Every other Swedish string in `lessons.json` must be found in `reports/` after removing emphasis marks.

### 6.4 Number generator (`lib/exam-numbers.ts`)

Day 14 needs "20 new items" and repeats need new numbers. A pure generator builds items only from sets the pages teach: 0-100; clock times with *halv*, *kvart över*, *kvart i* and full hours; dates with the Day 8 ordinals (1st-12th, 21st, 31st) and months; prices as "X euro och Y cent"; phone numbers digit by digit; the Day 13 year patterns. It returns `{ say, key, kind }`, and is tested against every printed key. Its output is **[Unreviewed Swedish: have a teacher check it]**.

---

## 7. Days 15-84: deriving the flow from the long entries

These days have no learner page, so the generator derives the same lesson shape from each curriculum entry. A prototype parser run on the current `curriculum.json` (73 units: Days 15-84 with 31b, 34a/b, 38a/b) gave the numbers below. The validator prints this table on every build.

| What | Found in | Note |
|---|---|---|
| "Done when" | 73 of 73 | |
| Minute blocks (`- 8-18 …` bullets, or the plan 5.1 table) | 72 of 73 | Day 83 (rest) has one line |
| Blocks classified by the table in 7.2, as written | 395 of 433 (91%) | the other 38 are on 23 days: 21, 27, 29, 41, 48, 54, 55, 58, 62, 63, 67, 68, 70, 71, 72, 74, 75, 76, 78, 80, 81, 82, 84 |
| "Speaking output" | 63 | 44 print a Swedish card; 19 a numbered voice list; 20 are reaction rounds |
| "Writing output" | 66 | 45 print a Swedish card |
| A points list | 54 | "Required points (6): …" or "Points (7): …" |
| Swedish lines with an English gloss in "What we learn today" | 42 | |
| A declared number of new patterns | 30 | 22 with patterns, 8 with none; Days 43-53 say "Cards today" instead |
| Pattern list extracted with the declared count (7.3) | 25 of 30 | exceptions: Days 22, 30, 31, 32, 44 |
| Pattern frames resolved to a full line with English | 77 of 81 | the other 4 need an overlay gloss |
| Wrong → right pairs in "Typical errors" | 60 | |

### 7.1 Sectioning and named exceptions

Split an entry on bold lead-ins at the start of a line (*What we learn today, Why it matters, How we learn it, Speaking output, Writing output, Done when, Typical errors to watch, Book practice, Library, Model, Set, Listening and reading, On a 90-minute day also, Phase-exit rule*); a `####` heading starts a sub-block. Exceptions are code paths listed in `scripts/exam_build/exceptions.json`:

- **Pointer days 15, 29, 43, 57, 71, 84** use the plan's 5.1 text: minutes from the `| 0-8 | … |` table, the call from "The call, with a model answer for each turn", points from the numbered lists, errors from the "Common errors" table.
- **Block days 22, 24, 31.** The `#### … extra 15-minute block` replaces the speaking block on a 60-minute day; the day's own speaking prompt becomes `only90` [Curr, Day 22, "60-minute rule"].
- **Mock days and exit tests:** section 13.

### 7.2 From minute blocks to steps

Each minute line becomes a step with `minutes = end - start`. The first matching rule wins:

| # | Test on the block text | Step and activities |
|---|---|---|
| 1 | starts with Review, Due cards, All overdue | `review` (the printed "cards from Days …" list is ignored; the queue decides) |
| 2 | contains "error drill" | `drill` |
| 3 | starts with Set up, Break | `read` with a timer |
| 4 | starts with Error log, Log, Count, Fill in, Score, Rate each, Mark, "Listen to each" | `cards` (if the day has candidates), `errors`, `log` |
| 5 | contains easy-news, notice routine, clip, notices, "Listening and reading", "Timed set" | `outside` |
| 6 | starts with Speaking, Task 1-3 or 6-8, S1-S6, "Set A/B/C"; or contains "recorded", "rounds", "aloud" | the tasks of "Speaking output" (7.4) |
| 7 | starts with Writing, Task 4-5 or 9-10, W1-W3; or contains "message", "letter", "formal", "texts" | the tasks of "Writing output" (7.4) |
| 8 | starts with New, Topic words, No timer, Learn, Numbers; or contains "hear", "ladder" | the New step (7.3) |
| 9 | none | `read` holding the block text |

Rule 9 is a declared fallback: each use must be listed in `exceptions.json` as `{ unit, block, reason }`, or the build fails. Ten units have two rule-4 blocks (41, 42, 61, 64, 65, 66, 71, 75, 78, 79): only the last gets `cards`, `errors` and `log`; the earlier one is a `read` step with a timer. A day with no rule-4 block gets a Log step appended.

### 7.3 The New step

Within "What we learn today" and "What we learn in this block":

1. **Lines.** Every italic span followed by an English gloss in brackets is a line: `*Ja, den finns kvar.* (Yes, it's still available.)`. `[brackets]` inside the Swedish are slots.
2. **The pattern list.** After a lead-in "New patterns (N…):" the patterns are the run of italic spans joined by ` / ` (a gloss or a short note may sit before a slash). The run ends at the first span not followed by a slash. On the current files this gives exactly N for 25 of the 30 units that declare a count.
3. **Frames to lines.** A pattern in the list is often a short frame (`*… var här [i tisdags], men det hjälpte inte.*`). It resolves to the first line whose Swedish contains the frame's fixed words in order; that line gives the audio text and the English. Tested: 77 of 81.
4. **Other classes.** Lines after "Known", "Questions you already have" → `known`; after "Library", "recognise only", "reference", "no card" → `library`; a topic-word list → `word`. A line with no lead-in before it is `library` (heard on tap, never drilled or carded).
5. **Overlay for the rest.** `content/exam/authoring/days-15-84.json` gives `patterns: [{ sv, en }]` (strings copied from the entry) for the exception days 22, 30, 31, 32 and 44, for unresolved frames, and for Days 43-53, where the "Cards today" sentence names the patterns in prose.
6. **Build checks.** Extracted patterns must equal the declared count or come from the overlay; more than 6 fails (load rule 1); a day with a declared count above 0 and no patterns fails.

Activities: `hear` (patterns, then known lines) → rule `choose` (only if today's grammar point prints a wrong and right pair) → `imitate` → `recall` → `swap`.

- **Ladders.** A chain after "Ladder" (`*A* → *B* → *C*`) becomes swap items: the learner sees the gloss, or "Next rung" with the previous sentence, and says the next one. Arrows in a ladder join correct sentences.
- **Wrong forms.** In "Typical errors to watch" and "Common errors" the left side of `→` is wrong, although it is written in plain italics. It is emitted only as `watch.wrong`: never a line, card, chip or audio. The generator decides by section, never by markup.
- **Stays as reading.** "Why it matters" (collapsed), grammar prose with no wrong and right pair, timing advice, library lines (tap to hear, no drill), rule-9 blocks.

### 7.4 Tasks

- **Card.** The first italic span after "Card:" or at the start of the section is `cardSv`; the bracket after it `cardEn`.
- **Voice lines.** After "The other voice:", "The voice:" or "Voice:", numbered italic spans (`1. *…*` or `1 *…*`) are the turns → `dialogue`. A card with no voice list → `respond`.
- **Rounds.** Lettered or numbered cards with "20 s" preparation → one `respond` with `rounds[]`; listen back to the two weakest only [Plan 3.4 rule 2].
- **Timing.** "6 turns, 20 seconds each", "20 s prep + 25 s", "15 minutes" set the targets. First take gentle, redo moderate; tests and mocks exam [Curr, note above Day 15].
- **Points.** `Required points (N): a; b; c` or `Points (N): …`, split on `;`, or a numbered list. The count must equal N.
- **Models.** A line starting "Model" is the `model`.
- **Appendix references** ("appendix A7") resolve to the plan's appendix card, parsed into `prompts.json` (seen practice).
- **Several tasks.** Where an entry names a core task and optional ones (Days 58-61, 68, 69, 74, 76, 80), only the core one has `counts: true`.
- A speaking or writing step with no card and no reference becomes a task with the block text as instruction and a self-check; it must be in `exceptions.json`.

### 7.5 Cards

Candidates, in order: `pattern` lines, then words named as card words ("Card words, only 3: …"); never library or recognise-only lines. The cap is the smallest of 8, the entry's own number ("6 cards for the new patterns") and the candidate count. Ids (`d{unit}-p{n}`, `d{unit}-w{n}`) must be stable: the validator fails on a changed id whose text is unchanged. The 8-a-day limit lives in state (8.4), because error cards share it.

A derived day shows "Guided from the full entry" in its header. Section 16 asks whether Days 15-28 should also get short hand-written pages.

---

## 8. Cards and review

### 8.1 Schedule

The course's schedule, not the lecture scheduler: a card made on day N returns on N+1, N+3, N+7, N+14 and N+30, and a miss restarts it [Plan 3.3]. `lib/exam-schedule.ts`:

```ts
export const EXAM_GAPS = [1, 2, 4, 7, 16] as const;   // days between reviews: +1, +3, +7, +14, +30
// rung 0..5; dueDay is a Helsinki date string "YYYY-MM-DD"; a new card: rung 0, dueDay = addedDay + 1
got    -> dueDay = today + (EXAM_GAPS[rung + 1] ?? 30); rung = min(rung + 1, 5)   // after +30: every 30 days [App's own]
slowly -> dueDay = today + (EXAM_GAPS[rung] ?? 30); rung unchanged                // the same gap again [App's own]
missed -> dueDay = today + 1; rung = 0; lapses += 1
```

Gaps count **Helsinki calendar days**, not study days, because memory fades with real time. All date maths uses day strings, so clock changes and month ends cannot shift a due date. `scheduleReview` in `lib/progress.ts` is no longer used by this track.

### 8.2 Queue order

1. **Yesterday's new cards**, shuffled by a seed of the date. Their first-pass result is the pilot's "recalled next day" for the unit that made them, at no extra time. On pilot days (units 1-7) a short listen pass follows this group: each of yesterday's patterns is played once in a new order and the learner picks its meaning (about 8 seconds a line). That is "understood when spoken", measured per line, in the same sitting as recall and after it.
2. Cards missed at their last review.
3. Other due cards by `dueDay`, oldest first, shuffled inside a day so units and kinds mix.

### 8.3 A review card

| Kind | Front | Answer | Rating |
|---|---|---|---|
| `say`, `number`, `error`, `own` | English cue (error card: the wrong sentence, labelled "wrong", never spoken) | say it, then `Show` | `Got it` / `Slowly` / `Missed` (keys 3, 2, 1) |
| `listen` | audio only | choose the meaning from 4; a question card then shows a model answer to say | automatic |
| `word` | the Swedish word, text and audio | choose the meaning from 4 | automatic |

Recall's microphone check runs for group 1, and for all `say` cards if the learner turns on "Check my voice" (default off, to keep about 12 seconds a card [Plan 3.3]). Any miss in a multi-item card makes it missed. A missed card returns once in the session without changing its schedule.

### 8.4 Limits

- **8 minutes** of active time per learning day (`state.reviewSec[day]`). At 8:00 the current card is finished: "Review stops at 8 minutes. 6 cards wait for tomorrow." The day player has no way past it; the `Exam cards` view offers `5 more minutes` once, "outside your 60 minutes" [App's own].
- **8 new cards a learning day, error cards included; at most 3 error cards** [Plan 3.3]. `confirmCards` counts cards whose `addedDay` is today. The Cards step lists today's content cards in page order; error cards and missed-number cards take the place of the last ones [Pages, counting rule]; displaced cards go to `state.waiting` and head tomorrow's list.
- **Pile-up.** If more than 20 due cards remain after the stop on 3 days running, the Cards step says "Reviews are piling up. Make fewer new cards today." and preselects only pattern cards [Plan 3.3].
- Cards are added at the Cards step whatever the day's mark (v1 added none on a Red day).

`Exam cards` has three tabs: **Review**, **All cards** (by unit; "returns in 4 days"; add an own card), **Waiting**.

---

## 9. The error list

**Entry** [Plan 3.6]: wrong text, right text, type (`G1` to `G7`, `word`, `missing-point`, `over-time`), unit, task, days seen.

**Sources.** (1) Found by the app and offered in the Errors step with `Add` / `Not an error`: real errors from typed diffs; watch hits in texts and transcripts; unticked required points; turns or texts over the exam-like limit. (2) Added by hand. A text that matches an open entry raises its `seen` count.

**Cards.** At most 3 a day. Candidates are ordered: missing critical points, recurring types, the rest; the learner ticks up to three. Front: the wrong sentence; back: the right form and the rule [Plan 3.3, card type 4].

**Recurring.** A type seen 3 or more times in the last 7 days [Plan 3.6]: labelled `Recurring`, with the daily 10-sentence drill suggested and "days without it" counted (target 2, not a gate). It makes a task Amber, never Red.

**Resolving.** The learner ticks `Resolved`; the app proposes it once the entry's card has passed +7 and the entry has not been seen for 14 days [App's own]. A resolved entry seen again reopens.

**View.** Tabs **Open**, **Patterns** (counts per type for 7 and 28 days, with "This week's top 3", the input of the weekly drill), **Resolved**.

---

## 10. Progress the learner sees

`Exam days` gets four tabs; the sidebar does not change.

**10.1 Map.** Four phase bands of unit tiles (number, mark icon with its name, a mark if repeated), each with "Phase 1: 9 of 15 done. Exit test: Day 14." Later phases read "after the Day 14 test" [Plan 4].

**10.2 Timeline.** One row per logged run, newest first: date, unit, run, mark, minutes (a bar with a tick at 60), the suggested mark if different, the note. Above: minutes per day for 28 days and weekly totals.

**10.3 Pilot (Days 1-7).** One row per unit 1, 2, 3a, 3b, 4, 5, 6, 7, plus spare rows for repeats, with the columns of [Pilot]:

| Column | Filled by |
|---|---|
| Actual minutes | the Log step |
| New patterns | content |
| Recalled next day | the first pass of that unit's pattern cards in the next review (8.2); right = `match`, or `Got it` / `Slowly` by the learner; overrides shown as "(1 by your own call)" |
| Understood when spoken | the listen pass after group 1 of the next review (8.2), per line |
| Changed independently | Swap (4.5) |
| Typed independently | Type in lines mode; on message days the learner's own count |
| G/A/R | the log |
| What was too much | one line of text, plus a tick box "This whole day was too much" |

Computed cells can be edited and then show "edited". Each row also opens to the seconds used per step against the budget (3.2).

**"How to read the result"**, computed after the Day 6 log (`lib/exam-pilot.ts`). One card per rule of [Pilot], printing the numbers it used:

| Rule | Test | Message |
|---|---|---|
| 2 | at least 4 of the 7 study days at 65 minutes or less [App's reading of "most"], and rule 3 does not fire | "60 minutes is realistic. Keep the plan." |
| 3 | 2 or more days over 70 minutes | "60 minutes is not realistic at this load: plan 75-90-minute days, or cut to 4 new patterns a day." |
| 4 | recalled below two thirds on 2 or more days | "The load is too high: fewer new patterns, not more review." |
| 5 | on any day, 2 or more lines were missed in recall but understood when spoken [App's reading; the log gives no number] | "You understand these lines but cannot recall them: more hearing before saying, not more cards." (lists the lines) |
| 6 | changed below two thirds on 2 or more days [App's own number; the log gives none] | "Give the swap drill more minutes before any new pattern." |
| 7 | typed below two thirds while recalled and changed are not | "The keyboard or spelling is the problem: add 5 typing minutes." |
| 8 | Day 3b: any run Red, or over 70 minutes, or the "too much" box ticked | "Split Day 3b into 3b and 3c." with `Do Day 3b again as 3c (new details)` |
| 9 | Day 4: the same test | "Split Day 4 into 4a and 4b." with the same button |

The split is the repeat run with new details (13.1), which is what load rule 9 asks. If neither rule 2 nor rule 3 fires (several days at 66-70 minutes, or one day over 70): "The log gives no rule for this result. Look at each day and ask your teacher." No threshold is invented. `Copy the log as a table` serves the teacher pack [Pilot rule 10].

**10.4 Mocks.** The early skill signal table of [Plan 6.3]: four subtests by Mock 1, 2, 3, each Green, Amber, Red or empty, plus "top 1-2 mistakes". Fixed caption: "This shows which skills are getting stronger. It decides nothing. The pair and the date are chosen only when you book."

---

## 11. Schemas, state, APIs, migration

### 11.1 Content types (`site/lib/exam-types.ts`, additions; the component contract is in 3.3)

```ts
export type ExamPressure = "none" | "gentle" | "moderate" | "exam";
export type ExamBlock = "review" | "new" | "speaking" | "writing" | "input" | "log";
export type ExamSlot = { target: string; options: { sv: string; en?: string }[] };
export type ExamLine = { id: string; sv: string; en: string; notes?: string; slots?: ExamSlot[];
                         cls: "pattern" | "known" | "question" | "word" | "number" | "library" };
export type ExamWatch = { wrong: string; right: string; rule?: string; type?: ExamErrorType };
export type ExamPoint = { id: string; en: string; critical?: boolean };
export type ExamTurn = { who: "voice" | "you"; sv: string };
export type ExamVariant = { id: string; label: string; source: "page" | "overlay" | "book" | "ninety" | "appendix" | "self";
  cardSv?: string; cardEn?: string; details?: { label: string; sv?: string; en: string }[];
  turns?: ExamTurn[]; model?: string; bookRef?: string };
export type ExamTask = { id: string; title: string; skill: "speaking" | "writing";
  cardSv?: string; cardEn?: string; cardCheck?: { options: string[]; answer: number };
  prepSec?: number; speakSec?: number; turnSec?: number; writeMin?: number; wordRange?: [number, number];
  situation?: "phone" | "voicemail" | "friend" | "formal" | "opinion" | "story" | "face" | "react";
  points: ExamPoint[]; turns?: ExamTurn[]; rounds?: { cardSv: string; cardEn?: string }[];
  questions?: { sv: string; en: string; modelSv?: string }[];
  model?: string; variants: ExamVariant[]; testId?: string; seen: true };
export type ExamChoiceItem = { id: string; mode: "listen" | "read"; sv?: string; prompt?: string; options: string[]; answer: number };
export type ExamSwapItem = { id: string; lineId: string; instruction: string; sv: string };
export type ExamDictationItem = { say: string; key: string; kind: "number" | "time" | "date" | "price" | "phone" | "year" };

type Base = { id: string; step: string; block: ExamBlock; title: string; minutes?: number; pressure: ExamPressure;
              counts?: boolean; optional?: boolean; only90?: boolean; note?: string; derived?: boolean };
export type ExamActivity = Base & (
  | { type: "review" | "cards" | "errors" | "log" | "drill" }
  | { type: "read"; markdown: string }
  | { type: "hear" | "imitate" | "recall"; lineIds: string[] }
  | { type: "choose"; items: ExamChoiceItem[] }
  | { type: "swap"; items: ExamSwapItem[] }
  | { type: "respond" | "dialogue"; task: ExamTask }
  | { type: "type"; mode: "lines"; items: { id: string; en: string; sv: string }[] }
  | { type: "type"; mode: "message"; task: ExamTask }
  | { type: "dictation"; items: ExamDictationItem[]; generate?: { kinds: ExamDictationItem["kind"][]; count: number } }
  | { type: "outside"; routine: "listening" | "reading" | "notice-hunt" | "book"; markdown: string; bookRef?: string }
  | { type: "timer"; parts: { id: string; title: string; minutes: number; skill: ExamSkill }[] });

export type ExamStepDef = { id: string; title: string; block: ExamBlock; minutes: number; minutes90?: number };
export type ExamCard = { id: string; unitKey: string; kind: "say" | "listen" | "word" | "number" | "pick";
                         items: { front: string; back: string; lineId?: string }[]; pool?: string[] };
export type ExamLesson = { key: string; source: "page" | "entry";
  steps: ExamStepDef[]; activities: ExamActivity[]; lines: ExamLine[]; cards: ExamCard[]; cardCap: number;
  rule?: { text: string; pairs: { right: string; wrong: string }[] }; watch: ExamWatch[];
  doneWhen: { green: string; amber: string; red: string; redHere?: string[] };
  tests?: { id: string; title: string; behind: string[] }[];
  fallbacks: number };
```

New files: `lessons.json` (key → `ExamLesson`), `placement.json`, `prompts.json`, `links.json`. `learner.json` and `curriculum.json` stay and feed the `Full entry` drawer. A v1 `ExamCard` (`front`, `back`) reads as `kind: "say"` with one item.

### 11.2 State v2 (`exam-types.ts`, `exam-state.ts`)

```ts
export type ExamErrorType = "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7" | "word" | "missing-point" | "over-time";
export type ExamResult = { ok?: number; of?: number; verdict?: "match" | "close" | "different" | "empty" | "none";
  self?: "got" | "slow" | "missed"; override?: boolean; understood?: "yes" | "partly" | "no";
  english?: boolean; modelFirst?: boolean; points?: string[]; pointsOf?: number; seconds?: number; limit?: number;
  replays?: number; words?: number; pron?: number; kinds?: string[]; watch?: string[]; excerpt?: string };  // excerpt: 160 chars
export type ExamEvidence = { first: ExamResult; last?: ExamResult; tries: number; at: number };
export type ExamRun = { n: number; variant: number; plan: 30 | 60 | 90; startedDay: string; startedAt: number;
  activeSec: number; stepSec: Record<string, number>; done: string[]; skipped: string[]; evidence: Record<string, ExamEvidence>;
  events: string[]; cardsConfirmed?: boolean; noAudio?: boolean; log?: ExamDayLog };
export type ExamDayLog = /* the v1 fields, plus */ { run: number; suggested?: ExamGar; reasons?: string[];
  clockMinutes?: number; tests?: Record<string, { gar: ExamGar; misread?: boolean }>;
  tooMuchDay?: boolean; edited?: string[]; editedAt?: number };
export type ExamCardState = { kind: "say" | "listen" | "word" | "number" | "error" | "own";
  custom?: { front: string; back: string; unitKey?: string; errorId?: string };
  addedDay: string; rung: number; dueDay: string; lapses: number; reviews: number; lastDay?: string; lastEventId?: string };
export type ExamError = { id: string; text: string; right?: string; type?: ExamErrorType; unitKey?: string;
  activityId?: string; createdAt: number; seen: number; seenDays: string[]; cardId?: string; resolvedAt?: number };
export type ExamState = { version: 2; rev: number; seenWelcome?: boolean; startKey: "1" | "15";
  settings: { plan: 30 | 60 | 90; voiceCheck: boolean; aiPoints: boolean };
  placement?: { stages: Partial<Record<"1" | "2" | "3" | "4" | "5", ExamGar>>; day: string };
  runs: Record<string, ExamRun[]>;
  days: Record<string, ExamDayLog>;        // the log of the latest logged run (v1 readers keep working)
  steps: Record<string, string[]>;         // v1 only; read during migration
  cards: Record<string, ExamCardState>; waiting: string[];
  reviewSec: Record<string, number>;       // per learning day; the last 14 days are kept
  errors: ExamError[];
  signals: Record<string, Partial<Record<ExamSkill, ExamGar>> & { mistakes?: string }>;
  usedPrompts: string[]; updatedAt: number };
```

**Actions.** All are idempotent; those marked * carry an `eventId` (kept in `run.events`, last 200, or on the card) and are ignored when repeated.

| Action | Validation and limits |
|---|---|
| `setSettings`, `seeWelcome`, `savePlacement`, `setStart` | enumerated values only |
| `startRun { unitKey, n, variant, plan }` | `n` = runs + 1, or an existing `n` (no-op); 9 runs a unit at most; refused while the last run has no log |
| `recordEvidence* { unitKey, n, activityId, result, done, activeSec }` | the activity must exist in the lesson; `first` is written once; 80 entries a run; `activeSec` at most 900 per event, added to the run and to `stepSec` |
| `skipActivity* { unitKey, n, activityId }` | |
| `confirmCards* { unitKey, n, cardIds, picks, errorIds }` | at most 8 with `addedDay` = today, at most 3 error cards; extra content cards go to `waiting`; unknown ids are rejected |
| `reviewCard* { cardId, rating, verdict?, sec }` | `got` / `slow` / `missed` (v1 `good`, `easy` → `got`; `hard` → `slow`; `again` → `missed`); `sec` at most 120, added to `reviewSec[today]`; a card not yet due is refused unless `practice: true`, which changes nothing |
| `logDay { unitKey, n?, log }` | as v1, plus `tests`, `suggested`, `reasons`; with no `n` (a v1 client) it targets the latest run and creates run 1 if there is none; writes the run's log and `days[unit]`; clears `run.events`; if cards were not confirmed, content cards are confirmed automatically within the limits |
| `editLog { unitKey, n, patch }` | may change `gar`, `minutes`, `note`, pilot fields; sets `editedAt`; never removes cards |
| `addError`, `seeError*`, `setErrorType`, `resolveError`, `deleteError`, `errorToCard` | 500 errors; texts 300 characters; `errorToCard` obeys the card limits |
| `addCard`, `deleteCard`, `usePrompt`, `setSignal` (with `mistakes`, 300 characters) | as v1 |
| `tickStep`, `resetDay` (v1) | still accepted: `tickStep` marks that legacy step's activities done in the latest run; `resetDay` clears the latest run's log |

Every action raises `rev`. New selectors: `nextThing`, `currentRun`, `dueCards(state, today)`, `newCardsToday`, `suggestMark`, `phaseExit`, `recurringTypes`, `pilotRows`, `pilotAdvice`.

**Migration (`normalizeExamState`).** Stored data of any age returns a complete v2 state and never throws. From v1: each `days[unit]` becomes run 1 with that log; `steps[unit]` becomes its `done` list (legacy step ids expand to activity ids); each card gets `kind: "say"` (`"own"` if it has `custom`), `rung = min(repetitions, 5)`, `dueDay = learningDay(due)`, `addedDay` = the unit's log date; each error gets `seen: 1`; the rest is defaulted. The row is rewritten only by the next action. Nothing in `site/data/progress.db*` is deleted or recreated.

### 11.3 APIs

| Route | Change |
|---|---|
| `POST /api/exam` | the new action names; body limit 24,000 characters; the context gains activity ids per unit and all card ids |
| `GET /api/exam/content` | adds `kind=lesson&key=`, `kind=placement`, `kind=prompt&id=`; `kind=cards` returns v2 cards |
| `POST` and `GET /api/exam/work` (new) | saves and lists typed texts and transcripts (6,000 characters each); same-origin check |
| `POST /api/exam/points` (new, last package) | body `{ unitKey, activityId, variant, text }`; the server takes the points from content, asks the feedback model for strict JSON `{ points: [{ id, found, quote }] }`, treats the learner's text as data, uses `allowAiRequest`, returns 503 with no model |
| `POST /api/speech` | check the limiter after the cache lookup and raise the cache from 32 to 200 clips, so a replay does not count against 40 a minute |
| `/api/transcribe`, `/api/pronunciation` | unchanged |

### 11.4 Database

One new table, created with `CREATE TABLE IF NOT EXISTS` in `lib/db.ts`: `exam_work (user_id TEXT, id TEXT, unit_key TEXT, run INTEGER, activity_id TEXT, kind TEXT, body TEXT, created_at INTEGER, PRIMARY KEY (user_id, id))`. `exam_state` is unchanged.

### 11.5 Client services

- `speech.ts`: an in-memory store of the last 80 clips, and a `slow` variant.
- `useRecorder.ts` (new): `MediaRecorder` with `audio/webm`, falling back to `audio/mp4`; a maximum length; returns blob, seconds, object URL; frees the microphone on stop and unmount.
- `evidenceQueue.ts` (new): serial; at most 10 calls in any 60 seconds; on 429 waits 20 seconds and retries once; then resolves `verdict: "none"`.
- `useRun.ts` (new): holds the run, sends evidence, keeps unsent actions in `sessionStorage` and retries them, refetches when the tab becomes visible.

---

## 12. Copy, accessibility, failures

### 12.1 Buttons and empty states

| Place | Copy |
|---|---|
| Primary buttons | `Start today` · `Continue Day 4` · `Day 4 again, with new details` · `Next` · `Record` · `Stop` · `Check` · `Show the model` · `Redo with a change` · `Save the day` |
| Review, nothing due | "No cards are due. New cards come back tomorrow." |
| Review, no cards yet | "You have no cards yet. Finish Day 1 and its 8 cards arrive tomorrow." |
| Errors, empty | "No mistakes on your list. After a task, add the one or two that kept coming back." |
| Pilot, before Day 6 | "The reading of the result appears after Day 6." |
| A day ahead of your place | "This day is ahead of you (you are on Day 4). You can do it, but its new cards will wait." |
| Mock day | "Mock days need prompts you have not seen. Ask your teacher or a helper. The app gives you the timers and the results table." |

### 12.2 Screens other than the player

| Screen | 1440 x 900 | 390 x 844 |
|---|---|---|
| Home | Primary card across the top; "today's steps" beside the four numbers; 14-day dots; notices | One column: primary card, numbers as a 2 x 2 grid, steps as a list, dots, notices |
| Review card | A 640-wide card: counter "7 of 23", clock "5:12 of 8:00", cue, `Show`, three rating buttons in a row | Full width; rating buttons in the sticky bottom bar |
| Cards step | Two columns: "Today's cards (6 of 8)" with tick boxes, and "Waiting" | One list; "Waiting" under a disclosure |
| Errors | A table: wrong, right, type, seen, actions | One stacked card per error |
| Log step | Evidence on the left, three mark buttons on the right, fields below | Evidence, marks stacked, fields |
| Map | Four bands, tiles 14 a row | Tiles 7 a row; a tile opens a sheet with title and marks |
| Timeline, Pilot, Mocks | Tables; advice cards in two columns | One card per row with labelled values |

### 12.3 Honest notices

- **Swedish:** "The Swedish in this course was written by an AI and has not been checked by a teacher. If your teacher corrects a line, the teacher is right."
- **Voices:** "The voices are computer voices from Sweden. Finland-Swedish sounds a little different. Your teacher's recordings are better to copy."
- **Listening to you:** "The app's listening is trained on Sweden-Swedish and makes mistakes, more so with an accent. It gives hints. You decide."
- **Marks:** "Green, Amber and Red are your own honest marks. They are not an exam result."
- **AI points (if on):** "An AI looked for each point. It can be wrong in both directions."

Shown in full in the welcome, as one line on the first Hear, Recall and Log steps of each week, and always under `Why?`.

### 12.4 Failures

| Situation | Behaviour and copy |
|---|---|
| Microphone refused, or no `MediaRecorder` | Recording activities become say-and-self-check. "The microphone is blocked. Say it aloud and mark yourself. To record, allow the microphone in your browser's site settings." `Try the microphone again` stays. |
| Speech 503 or 502 | Text shows at once. "The Swedish voice is not available now. Read the line aloud; hear it later from your teacher." `noAudio` is stored in the run. |
| Speech 429 | One retry after 5 seconds; then "Too many audio requests. Wait a moment." |
| Transcription or scoring not configured | `canTranscribe` / `canScore` are false from the start (`/api/ai-status`); no dead buttons. |
| Transcribe 429 | "Checking your recording … (waiting in line)". After the retry: "We could not check this one. Listen to yourself and mark it." |
| 422, no speech | "We heard nothing. Check the microphone, then try once more." A second empty take is "no answer". |
| Offline or a failed save | A badge "Not saved yet (2)"; work continues; retried every 10 seconds and on focus. |
| Content fails to load | "This day could not be loaded." with `Try again` and `Open the full entry`. |

### 12.5 Accessibility

- **Keyboard.** `Enter` primary action; `Space` play or stop; `R` record or stop; `S` slow; `1` `2` `3` Missed, Slowly, Got it (Red, Amber, Green in the Log step); `Esc` stop audio or close a drawer. Shortcuts are off inside text fields and listed under `?`.
- **Focus and names.** A new activity moves focus to its heading; drawers trap and return focus. Every icon button has a text name ("Play: Jag bor i Esbo"). Swedish carries `lang="sv"`. Hidden models are out of the accessibility tree until shown.
- **Live region.** One polite region announces recording start and stop, results and saves; timers only "10 seconds left" and "Time".
- **No colour-only meaning.** Marks are a circle with "Green", a triangle with "Amber", a square with "Red". Word bands, diffs and wrong forms carry text labels.
- **Motion and layout.** With `prefers-reduced-motion`, countdown bars become numbers. Targets are at least 44 px. At 390 px tables become stacked lists and nothing scrolls sideways. Light theme only; contrast at least 4.5:1.

---

## 13. Edge cases and rules

### 13.1 Repeating a day with new details

A repeat is a run with `variant` n. Tasks use `task.variants[n - 1]`; Hear, Imitate and Recall collapse into one Recall of the day's lines; Cards offers no new content cards; Dictation uses the generator.

- **Days 1-14.** Variant 1 is the printed redo (the dentist call, "as Sara", the umbrella). Variants 2 and 3 are overlay detail sets of taught words only (names, the four towns, weekdays, clock times). Variant voice lines are composed from the printed lines (day and hour changed only) and listed in `composed-lines.md`. The base model is shown with "The model uses the old details."
- **Days 15-84.** Sources in order, from the hand-written map `scripts/exam_build/redo-sources.json` (unit → appendix function): the day's Book practice task of the same kind; the "On a 90-minute day, also" prompt; an unused appendix prompt of that function (`usedPrompts`); last, `self`: "Change the details yourself: a new name, day, time and price."

### 13.2 Other rules

| Case | Rule |
|---|---|
| Light days | Due cards, one earlier task re-recorded with a changed detail, one input item [Plan 3.1]. Marked like any day (the Day 7 page has its own Green, Amber, Red). |
| Rest day (83) | One `read` step and `Mark done`; no mark. |
| Mock days 28, 56 | The entry's printed tasks run as seen practice at exam pressure. A switch `My teacher gives the prompts` turns every task into a bare timer and points count. No day mark: the learner fills the signal table (10.4). Mocks never block. |
| Mock 84 and later | `timer` activities only (the tasks and times of [Plan 6.2]), the results table, and the booking-gate checks as a list to fill in with the teacher. No prompts. "This mock counts only with prompts you have never seen and a teacher's rating." |
| Exit tests (14, 41-42, 62-63) | Each test is marked on its own; each Red asks "Was the card or a task word misunderstood?". `phaseExit` passes with at most 1 Red that is not such a misreading; 41 with 42, and 62 with 63, count together. Passed with one Red: its redo is pinned to the home screen for three study days and does not block. Not passed: the days behind each Red (`tests[].behind`, from [Plan 4.2] and the entry) come next, then only the Red tests rerun. With no teacher the result is "provisional" [Plan 3.5]. |
| Changing a log | `editLog` at any time. To Red: the repeat becomes next, later days stay done. From Red: the repeat goes. The timeline shows "edited". |
| Two tabs | Actions are deltas in one transaction; event ids make repeats harmless; `first` evidence is written once; a tab refetches on focus, or when a response's `rev` is more than one ahead of its own. |
| Day boundary | The learning day is the Helsinki calendar day (`learningDay`), wherever the laptop is. A run across midnight continues; cards made after midnight count for the new day. `nextLearningDayStart` (fixed +02:00) is removed. |
| First day of a month, clock changes | The course files define no monthly behaviour, so the app has none. Tests cover 31 January to 1 February, 28 February to 1 March, and the clock changes of 28 March and 31 October 2027. |

---

## 14. Build plan

### 14.1 Work packages

P0 first. Then A, B, C and D in parallel. E to H start when D has committed the shell, `ActivityProps`, and the activity registry `components/exam/activities/index.ts`: a map from every activity type to a fixed lazy import path, with a stub file per type that renders the `read` fallback. E to H replace their own stubs and never edit the registry. No two packages own the same file.

| Pkg | Scope | Files owned | Acceptance |
|---|---|---|---|
| P0 Contracts | Types of 3.3 and 11; all new npm scripts (`test:exam` runs every `scripts/exam-*.test.ts`; `audit:exam`) | `lib/exam-types.ts`, `package.json` | typecheck; then frozen |
| A Generator, Days 1-14 | Pages, keys, audio list, overlay, Cards parser, composed lines, placement | `scripts/build-exam-content.py` (entry only), `scripts/exam_build/learner.py`, `placement.py`, `checks_learner.py`, `content/exam/authoring/days-1-14.json`, `composed-lines.md` | 15 lessons; card counts equal "Cards (N)"; Day 4 has 8 cards, a 4-turn call and the dentist variant; every step estimate fits its printed minutes |
| B Generator, Days 15-84, validator | Sections 7, 13.1; appendix prompts; build report | `scripts/exam_build/curriculum.py`, `prompts.py`, `checks_curriculum.py`, `exceptions.json`, `redo-sources.json`, `content/exam/authoring/days-15-84.json`, `scripts/validate-exam-content.py` (runs both check modules), `scripts/exam_build_test.py` | 73 lessons; coverage table printed; build fails on an unlisted fallback, a pattern count that differs from the declared one, over 6 patterns, over 8 cards, a wrong form used as a line, a changed card id, or teacher-only text |
| C Logic and storage | State v2, schedule, mark, pilot, match, diff, numbers, work table, routes | `lib/exam-state.ts`, `exam-schedule.ts`, `exam-mark.ts`, `exam-pilot.ts`, `exam-match.ts`, `exam-diff.ts`, `exam-numbers.ts`, `exam-db.ts`, `exam-content.ts`, `lib/db.ts` (one table), `app/api/exam/route.ts`, `app/api/exam/content/route.ts`, `app/api/exam/work/route.ts`, `app/api/speech/route.ts` (limiter order), `scripts/exam-{state,schedule,mark,pilot,match,diff,numbers}.test.ts` | the tests of 14.2 pass; a v1 row loads and saves as v2 |
| D Shell and services | Stepper, clock, drawers, registry and stubs, content and run hooks, recorder, queue, speech store, Markdown fixes | `components/exam/ExamDay.tsx`, `player/*`, `activities/index.ts`, `useExam.ts`, `useRun.ts`, `useRecorder.ts`, `evidenceQueue.ts`, `speech.ts`, `MarkdownView.tsx`, `lib/exam-markdown.ts`, `scripts/exam-markdown.test.ts` | a lesson of stub activities can be stepped, skipped, resumed and logged at both widths; lists keep their numbers; `~~` never shows raw |
| E Line activities | Hear, Choose, Imitate, Recall, Swap, Dictation, Read | `components/exam/activities/{Hear,Choose,Imitate,Recall,Swap,Dictation,Read}.tsx` | each works with microphone, speech and transcription on and off; the next item never waits for a network call |
| F Task activities | Respond, Dialogue, Type, Outside, Drill, Timer | `components/exam/activities/{Respond,Dialogue,Type,Outside,Drill,Timer}.tsx` | the Day 4 call makes no network call during the call; the model cannot be seen early without `modelFirst` |
| G Cards and errors | Reviewer, Review, Cards and Errors activities, both views | `ExamCards.tsx`, `ExamErrors.tsx`, `cards/*`, `activities/{Review,Cards,Errors}.tsx` | the 8-minute stop; the 8 and 3 limits shown and enforced; the waiting list; the pilot listen pass |
| H Home, placement, progress, log | Home, welcome, Day 0, map, timeline, pilot, mocks, Log activity | `ExamHome.tsx`, `ExamDays.tsx`, `ExamPilot.tsx`, `Placement.tsx`, `progress/*`, `activities/Log.tsx` | pilot advice equals the expected output for 6 fixtures; one primary action on the home screen in every state |
| I Integration | Browser audit, handbook, then the optional AI points check | `scripts/audit-exam.mjs`, `AGENTS.md`, `docs/exam-track-design.md`, `app/api/exam/points/route.ts` | 14.3 passes at both widths; `npm run check` and `npm run build` pass |

Each package adds its own CSS module. `exam.module.css`, `ExamViews.tsx` and `app/learning-app.tsx` are not changed. Components import `toWav16k` from `components/learning/wav.ts` and do not modify `SoundCheck` or `LiveVoice`.

**Known defects to close (A or D):** numbered lists lose their numbers; the dialogue title reads "4: the health-centre call"; the Amber text shows raw `~~`; steps and cards appear twice; Day 4 has 4 cards, not 8.

### 14.2 Unit-test targets

- **`exam-state`**: v1 to v2 migration (own cards stay `own`); a v1 `logDay` with no run; each action's validation; repeated event ids; `first` evidence written once; the ninth new card and the fourth error card; a Red `logDay` keeps cards; `editLog` Green to Red; `startRun` while a run is open; v1 `tickStep`; review time stops at 480 seconds.
- **`exam-schedule`**: +1, +3, +7, +14, +30; a miss returns to +1; `slowly` repeats the gap; a late review keeps the gap; the dates of 13.2.
- **`exam-mark`**: every Red and Amber trigger; spelling, seconds and pronunciation never change the result.
- **`exam-pilot`**: a fixture per rule 2-9 and a "no rule fires" fixture.
- **`exam-match`, `exam-diff`**: each verdict and class; digits against words; every pair in the Day 12 typing key is exact.
- **`exam-numbers`**: every printed key in the back of the file is reproduced from its digits.
- **Generator**: card counts for Days 1-14; step estimates within the printed minutes; the Day 4 call and variant; every composed line made only of that page's words; pattern counts equal the declared counts for Days 16-39; pointer days read plan 5.1; Day 22 swaps its speaking block; wrong forms appear only in `watch`; library lines give no cards; no teacher-only text; stable ids.

### 14.3 Browser test script (1440x900 and 390x844; empty learner; speech and transcription mocked on, then off)

1. **First visit.** Welcome; `Start at Day 1`; one primary button on the home screen.
2. **Day 1.** Review says "no cards yet". Hear hides text until play. Recall with a `match` and a `different` verdict (override). Swap; question round; the redo "as Sara". Type lines with a spelling slip (right) and a word-order error (offered to the error list). Cards shows 8. Log suggests Green.
3. **Next day (clock +1).** Review starts with Day 1's pattern cards, then the listen pass; Day 1's pilot row fills "recalled" and "understood".
4. **Day 4.** Card check; a first take with no request during the call; a silent turn shown as "no answer"; no model before the check; the dentist redo; "vill att boka" flagged in the message; dictation of 8 tens; 8 cards; mark Red. Home shows "Day 4 again, with new details"; the repeat has no Hear step and no new content cards.
5. **Day 16.** Six seller lines in Hear; a ladder in Swap; a 6-turn call and an ad with 6 points each; a notice routine; 6 cards; the wrong forms of "Typical errors" appear only struck and labelled, with no play button.
6. **Cards.** A fourth error card is refused with the limit message; the 8-minute stop (clock mocked) ends with a count of waiting cards.
7. **Errors.** Add by hand, see again (count 2), resolve, reopen.
8. **Pilot.** A fixture with two days over 70 minutes and Day 3b Red shows the rule 3 and rule 8 cards; the copy button works.
9. **Failures.** Microphone refused; speech 503; transcribe 429; the unsaved badge offline.
10. **Layout.** No sideways scroll anywhere; every step reachable by keyboard alone.

---

## 15. What we deliberately do not build, and the risks

**Not built.** The long placement, the booking gate, or any "ready to book" signal [Plan 4.1, 4.7]. Any counted mock prompt, the teacher-only reserve, or text from the practice book. Stored audio (recordings stay in the tab and can be downloaded; typed texts are stored). An AI rating of Swedish quality or a predicted YKI level. The live voice coach inside this course. Automatic personalising of model answers (the bold parts stay the learner's job). Dark theme, notifications, streak rewards, a dated calendar, any choice of pair or date.

| Risk | What we do | What remains |
|---|---|---|
| Self-rating is too generous | Objective evidence where possible (choices, typed diffs, dictation, `modelFirst`, no answer); a suggested mark; an override count | Understanding and "slowly" are self-reported; only a teacher's weekly rating corrects this |
| Transcription mishears accented or Finland-Swedish speech | Verdicts only preselect; the learner overrides | False "different" results; if they pass about one in four, turn the voice check off by default |
| Computer voices from Sweden; unreviewed Swedish | Notices; the audio list for teacher recordings; the validator blocks invented strings; composed lines are listed for the teacher | The exam's accent is unknown [Plan 1]; a wrong model line is drilled until the source is corrected |
| Derived Days 15-84 are thinner, and depend on the entries' wording | Build report, declared fallbacks, pattern-count checks, a visible header | 38 blocks and 5 pattern lists need hand rules today; any edit to `reports/` can break a parse |
| The app itself may push a day past 60 minutes | Step estimates checked at build; seconds per step in the pilot view | Nobody has timed a learner yet [Start 8]; the estimates in 3.2 are guesses until the pilot |

---

## 16. Five decisions for the owner

1. **Review schedule.** Use the course's ladder (+1, +3, +7, +14, +30 calendar days; a miss restarts) in place of the lecture scheduler? **Recommended: yes.** The plan and every printed review list assume it.
2. **Days 15-84.** Ship the derived flow now, and also write short learner pages for Days 15-28 before you reach Day 15? **Recommended: yes to both.** The derived flow needs hand rules on 23 days, and the pilot may change the load first.
3. **AI points check.** Let the app's text model suggest which required points it found in a transcript or text, labelled as a suggestion? **Recommended: yes, built last, on by default; your ticks decide.**
4. **Day 0.** Offer the 25-minute staged check in the app and leave the 100-minute long placement to paper and your teacher? **Recommended: yes**, with `Start at Day 1` as the equal first choice.
5. **Recordings.** Keep recordings in the browser tab with a download link, and store only typed texts and transcripts? **Recommended: yes for now.** Saving audio on the laptop for the teacher pack is a good second step.
