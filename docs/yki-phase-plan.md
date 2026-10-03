# Plan: the YKI-book phase (Lectures 23-52)

This is the source map and build plan for the second phase of Stigen. It does
for teacher Lessons 23-51 what `docs/lecture-build-plan.md` did for Lessons
3-22. Read `AGENTS.md` first. The rules in sections 2, 4 and 5 of
`docs/lecture-build-plan.md` still apply, except where this file says
otherwise.

Every line range and page number below was checked on October 3, 2026 against
`docs/Group 3.md`, the book PDF, and the Classroom files.

---

## 1. Purpose and status

- **Plan only.** No lecture JSON, chapter, glossary entry or code exists for
  this phase. Lecture 23 and later stay inactive.
- **Approved for building (October 3, 2026).** The owner asked for every
  lecture in this plan to be built without waiting for batch reviews, and for
  the open questions to be decided. The decisions are recorded in section 8.
- **Main decisions in this plan:**
  1. One lecture per teacher lesson: Lesson 23 → Lecture 23, …, Lesson 51 →
     Lecture 51. No merges.
  2. One extra lecture, **Lecture 52**, a mock exam day built from Classroom
     items 37-39 (posted after the last lesson).
  3. Eight new chapters, **7-14**, following the book's themes.
  4. One new extra-step kind, **`yki-speaking`**, replaces the textbook-page
     step. It holds original YKI dialogues and timed prompt sets.
  5. **No book page images in the app by default.** The step points to the
     book page; all learner-facing tasks are original (section 2.5).

---

## 2. Sources and how they relate

### 2.1 The book

*Förbered dig för allmän språkexamen*, Gimara Oy, 2022, with repairs in 2025
(book p4). File: `docs/e-kirja-Forbered-dig-for-allman-sprakexamen-QR-16.02.2025-yyyiif (1).pdf`,
126 pages. Its own aim: speaking and writing practice "inför språkprovet på
mellannivå" (book p6). It has no listening or reading material.

- **Page numbers.** The printed page number equals the PDF page number (checked
  on pages 8, 12, 41, 54, 64, 125; theme dividers carry no number).
- **Table of contents error.** The contents page (p5) lists theme 5 as
  *Fritid och hobbyer* (p76) and theme 6 as *Arbete och utbildning* (p91). The
  pages say the opposite: p76 is the *Arbete och utbildning* divider and pages
  77-90 carry that header; p91 is the *Fritid och hobbyer* divider. The page
  numbers in the contents are right; the two names are swapped. This plan uses
  the page headers. The teacher does too (work in Lessons 38-40, free time in
  41-44).
- **Theme 4 name.** Pages say *Hälsa och välmående*; the contents and dialogue
  titles say *Hälsa och välbefinnande*.
- **Edition differences.** The teacher seems to use an earlier printing. Page
  numbers match, but some wording differs: Lesson 28 item 3 "Gå in" (PDF "Gå
  emellan"); Lesson 35 fishing website "fisketillstand.net" (PDF
  "eraluvat.fi"); Lesson 40 Din åsikt B "Det är alltid värt att studera" (PDF
  "Det lönar sig alltid att studera"); Lesson 43 item 14 "Be om en hiss" (PDF
  "Be om skjuts"); Lesson 44 Din åsikt B "De nordiska länderna" (PDF
  "Finland"). Use the PDF for page references. The wording does not matter,
  because learner content is original.
- **How a section works.**
  - *Uppvärmning*: word maps and discussion questions.
  - *Dialog N* (task page): the situation in Swedish, the partner's turns
    shown as `***`, and the learner's cues in brackets, for example "(Svara
    nekande och förklara varför.)". The *MODELL* page that follows prints only
    the partner's lines. The learner's lines are never printed. The
    *Vardagsliv* dialogues also print the seconds allowed per turn. Dialogue
    pages carry a QR code to a Gimara SoundCloud playlist (seen on p41; theme
    1's link is in `Group 3.md` line 2680).
  - *Reagera*: a numbered list of situations.
  - *Berätta*: lettered topics with guiding questions.
  - *Din åsikt*: lettered statements with guiding questions.
  - *Skriva*: three writing tasks per theme. They mirror the YKI writing test
    (a message, a formal text, an opinion text).

| # | Theme (page header) | Pages | Uppvärmning | Dialoger (task + model pages) | Reagera | Berätta | Din åsikt | Skriva |
|---:|---|---|---|---|---|---|---|---|
| 1 | Människan och omgivningen | 7-38 | 8-11 | D1 12-13 · D2 14-15 · D3 16-17 · D4 18-19 · D5 20-21 · D6 22-23 · D7 24-25 · D8 26-27 · D9 28-29 · D10 30-31 · D11 32-33 | 34-35 (items 1-18) | 35 (A-D) | 36-37 (A, B, D-L; there is no C) | 38 |
| 2 | Vardagsliv | 39-54 | 40-41 | D1 41-42 · D2 43-44 · D3 45-46 · D4 47-48 · D5 49-50 (turn times printed) | 51-52 (1-16) | 52-53 (5 topics, no letters) | 53 (4 topics, no letters) | 54 |
| 3 | Natur och miljö | 55-64 | 56-58 | D1 58-59 · D2 60-61 | 62 (1-8) | 62-63 (A-C) | 63 (A-C) | 64 |
| 4 | Hälsa och välmående | 65-75 | 66-68 | D1 68-69 · D2 70-71 | 72 (1-13) | 73 (A-F) | 74 (A-D) | 75 |
| 5 | Arbete och utbildning (contents page wrongly says Fritid) | 76-90 | 77-78 | D1 79-80 · D2 81-82 · D3 83-84 · D4 85-86 | 87-88 (1-18) | 88 (A-D) | 89 (A-G) | 90 |
| 6 | Fritid och hobbyer (contents page wrongly says Arbete) | 91-116 | 92-95 | D1 96-97 · D2 98-99 · D3 100-101 · D4 102-103 · D5 104-105 · D6 106-107 · D7 108-109 · D8 110-111 | 112-113 (1-18) | 113-114 (A-I) | 115 (A-E) | 116 |
| 7 | Samhälle | 117-125 | 118 | D1 119-120 · D2 121-122 | 123 (1-8) | 123 (A-B) | 124 (A-D) | 125 |

Skriva tasks, by page (types only; the app writes its own situations):

| Page | Task types |
|---|---|
| 38 | Message congratulating a friend · email to a property agent about the home you want · complaint to the housing company's board |
| 54 | Reply to a sales ad · message asking a half-acquaintance to stop sending flowers · opinion text (choose A or B) |
| 64 | Invitation to a clean-up day (talko) · message describing your area to a friend who may move there · opinion text (A or B) |
| 75 | Forum post about a health problem · message to a colleague on long sick leave · complaint to the patient ombudsman |
| 90 | Note to a colleague to swap shifts · thank-you letter to a teacher · opinion text (A or B) |
| 116 | Opinion in a parents' chat (art or sport club) · invitation to a film, play, concert or exhibition · message to a course teacher (you cannot come the first time) |
| 125 | Message to a friend who wants to move to your country · complaint to an official (refused a Swedish course) · opinion text (A or B) |

### 2.2 The teacher's lessons 23-51

`docs/Group 3.md` lines 2540-5466. Lesson boundaries are the `# Lektion N`
headings. The pattern:

- **Lesson 23**: the exam's structure, dialogue instructions, informal and
  formal writing. No book page.
- **Lessons 24-45**: the book in order, theme by theme (dialogues, then
  Reagera, Berätta, Din åsikt), with the teacher's own phrase banks and writing
  models. The teacher never uses a *Skriva* page; writing comes through
  Classroom items.
- **Lessons 46-51**: "Gamla YKI uppgifter" (old exam-style tasks that are not
  in the book), plus reviews of book dialogues (Lessons 48-50).
- **Watch out:** in the dialogue sections the top-level lines are usually the
  book's *MODELL* lines, quoted (for example line 2719 is book p13's first
  line). The indented lines are the class's own answers, and they contain
  errors. Never copy the top-level lines into the app; use the class answers
  only as ideas, after correction.

### 2.3 Classroom items 18-39

Mapped to the lesson whose date the posting follows, as in phase 1. One item
(27) is mapped by topic to the lesson that taught it.

| Item | Type | Posted | Due | Lecture | Notes |
|---:|---|---|---|---:|---|
| 18 Informal email | Writing (3 topic options) + `18_1` structure PDF + 10-point rubric | Jun 10 | Jun 18 | 23 | Rubric: structure 4, formal vs informal 3 ("ensure level 3 (B1): background + subjunctions"), grammar 3 |
| 19 Formal email | Writing + `19_2` structure PDF + 10-point rubric | Jun 10 | Jun 18 | 23 (taught) · 24 (written) | Posted with Lesson 23; written in Lecture 24 so each lecture has one writing task |
| 20 Nyheter 1 | Listening (Yle Arenan podcast) | Jun 12 | Jun 20 | 24 | |
| 21 Festivalen Bravo | Reading (event information text) | Jun 16 | Jun 24 | 25 | |
| 22 Nyheter 2 | Listening | Jun 22 | Jun 30 | 28 | |
| 23 Köttfri dag | Reading (opinion text, "För det första …") | Jun 24 | Jul 2 | 29 | |
| 24 Opinion piece | Writing (7 topics) + `24_3` structure PDF | Jun 26 | Jul 11 | 30 | Phase 1 used it only as structure for Lecture 22 |
| 25 Nyheter 3 | Listening | Jun 29 | Jul 7 | 31 | |
| 26 Ulf Unge | Reading (opinion column) | Jul 3 | Jul 11 | 33 | |
| 27 Formal writing: ad | Writing + `27_5` structure PDF + 7-criteria rubric | Jul 8 | Jul 16 | 34 | Posted with Lesson 35, but the ad is taught in Lesson 34 |
| 28 Nyheter 4 | Listening | Jul 8 | Jul 16 | 35 | |
| 29 Nyheter 5 | Listening | Jul 8 | Jul 23 | 35 | |
| 30 Barn och mat | Reading (long article) | Jul 14 | Jul 22 | 36 | |
| 31 Nyheter 6 | Listening | Jul 16 | Jul 24 | 37 | |
| 32 Fusket | Reading (article, rätt/fel) | Jul 22 | Jul 30 | 40 | Topic fits work and studies |
| 33 Nyheter 7 | Listening | Jul 25 | Aug 2 | 41 | |
| 34 Nyheter 8 | Listening | Jul 25 | Aug 2 | 41 | |
| 35 Formal email: application | Writing + `35_6` structure PDF + 7-criteria rubric | Jul 27 | Aug 4 | 42 | Same day as the lesson that teaches it |
| 36 Nyheter 9 | Listening | Jul 29 | Aug 6 | 43 | |
| 37 Talförståelse | Listening mock, done in class (MC, rätt/fel, open) | Aug 24 | none | 52 | After the last noted lesson |
| 38 Writing mock test 2 | 3 texts in 55 min (trip blog, complaint, opinion A/B) | Aug 26 | none | 52 | |
| 39 60min Läsförståelse | Reading mock, 6 tasks | Aug 26 | none | 52 | |

The nine *Nyheter* forms link real Finland-Swedish audio on Yle Arenan (for
example item 20: `https://arenan.yle.fi/poddar/1-73102281`; the others are in
each `_Google_Form_data.json`). They partly meet backlog item 2 (real
Finland-Swedish audio). Links can expire; check each one when its lecture is
built.

### 2.4 The YKI exam: official facts and how the book maps to them

Official sources (read October 3, 2026):

- OPH, YKI main page: all YKI tests have four subtests, each rated separately.
  <https://www.oph.fi/sv/allmanna-sprakexamina-yki>
- OPH, *Grunderna för allmänna språkexamina* (2011, Swedish): six-step scale;
  the intermediate test (mellannivå) rates levels 3-4; nine topic areas; task
  descriptions; level descriptions.
  <https://www.oph.fi/sites/default/files/documents/ykiperusteetruo2011.pdf>
- OPH, before the test day: studio speaking; answer types multiple choice,
  rätt/fel and open questions.
  <https://www.oph.fi/sv/utbildning-och-examina/fore-yki-testdagen>
- JYU practice tasks, Swedish intermediate speaking and writing:
  <https://ykitesti.solki.jyu.fi/tutustu-testiin/svenska/mellanniva-talproduktion/>,
  <https://ykitesti.solki.jyu.fi/tutustu-testiin/svenska/mellanniva-skriftlig-framstallning/>
- JYU practice tasks, Finnish intermediate speaking (shows the current
  five-part layout with five situations and an opinion task):
  <https://ykitesti.solki.jyu.fi/en/tutustu-testiin/testifin/keskitaso-puhuminen/>
- Migri, language requirement for citizenship: level 3 in speaking + writing,
  listening + writing, or reading + speaking.
  <https://migri.fi/sv/allman-sprakexamen>
- OPH news: the autumn 2026 single-subtest days are for Finnish only; Swedish is
  unchanged. <https://www.oph.fi/sv/nyheter/2026/forsok-med-delprovsdagar-yki-testerna-hosten-2026>

| Subtest | Teacher (Lesson 23, lines 2553-2568) | Official | Book | How Stigen trains it |
|---|---|---|---|---|
| Listening | 40 min, heard twice; MC, true/false, open | Conversations, interviews, phone messages, announcements, news, ads; heard 1-2 times (OPH 2011, 6.1) | None | Classroom *Nyheter* audio (links) with original questions; `practice.listening`; mock in Lecture 52 |
| Reading | 60 min, 6 texts; MC, true/false, open | Letters, messages, notices, ads, news items, stories; several texts (OPH 2011, 6.3) | None | Original texts in `practice.reading` / `reading_passage` on the Classroom text types; mock |
| Speaking | 25 min: 1 Berätta (1 min prep + 1 min), 2 dialogues (15 s to read, 10-25 s per turn), 5 Reagera (20 s prep + 25 s), 1 Din åsikt (1 min prep + 1 min 30 s) | Studio: simulated conversations, reacting in situations, giving opinions or telling about a topic (OPH 2011, 6.2). Swedish practice page: Berätta 1 min + 1½ min; two *Samtal* with turns of 10-25 s; situations 20 s. Finnish practice page: five situations of 20-30 s; opinion 2 min | Dialoger · Reagera · Berätta · Din åsikt | `yki-speaking` step (section 5) and the mission |
| Writing | 55 min: informal 50-80 words, formal 50-80, opinion 100-150 (ideally 120), choose A or B | Three guided texts of different kinds: messages, letters, opinion texts, complaints, applications (OPH 2011, 6.4). Swedish practice page: *meddelande*, *insändare* (choose one of two themes, three reasons), *reklamation* | Skriva (3 per theme) | `practice.writing` with `situation`, `points`, `wordRange` |

- **What I could not confirm.** The official pages read here do not state
  minutes per subtest. The teacher's numbers fit OPH's total test day (about 5
  hours with breaks). The Swedish practice page shows an older, four-part
  speaking layout without an opinion task; the teacher's layout matches the
  Finnish five-part page. Stigen trains the teacher's layout.
- **Rating.** Each subtest gets its own level: below 3, 3 or 4. Speaking and
  writing are rated against level descriptions by trained raters, not by
  points. Level 4 speaking: can tell formal from informal speech at least
  partly, and can give and justify an opinion understandably (OPH 2011,
  annex 1). Level 3 is the citizenship level.
- **Topic areas** (OPH 2011, annex 2) and the book themes: A Jag och min
  bakgrund → theme 1; B Hem och boende → themes 1 and 3; C Handel och service →
  theme 2; D Kultur and E Resor → theme 6; F Hälsa och välbefinnande → theme 4;
  G Arbete → theme 5; H Miljö → theme 3; I Samhälle → theme 7. (The document's
  short list prints "Hälsa och välbefinnande" twice; its annex names H
  "Miljö".)
- **The teacher's rubrics** turn these levels into checks: the 10-point
  rubrics for items 18-19, and the 7-criteria rubric
  (`14_27_35_Writing_Rubric_7_criteria.md`) for items 27 and 35.

### 2.5 Copyright and privacy rule

- The book is © Gimara Oy. Its p4 forbids copying text or pictures without
  permission, including scanning.
- **Allowed:** naming the book, section and page as a pointer ("Förbered dig,
  Dialog 1, s. 12-13"); practising the same task types with original
  situations, partner lines, cues, prompts, guiding questions and model
  answers; common debate topics in our own words.
- **Not allowed:** transcribing the book's model lines, situation lists, word
  maps or guiding questions; copying Classroom form questions or texts;
  publishing page images unless the owner decides so (open question 1).
- **The watermark.** Every PDF page carries the owner's name and email. Never
  reproduce it anywhere: not in the repo, the app, screenshots, docs or chat.
  Redact it before any render that leaves a scratch folder (section 7.4).
- The PDF is committed in `docs/`, but `docs/` is not part of the Vercel build
  (root `site/`). Anything in `site/public/` is public on the preview.

---

## 3. Lesson-by-lesson source map

"Book" lists only what the teacher uses, checked against the PDF. Item numbers
and letters are the book's. "Lines" are `docs/Group 3.md`.

| Lesson · date | Lines | Book (verified) | Teacher adds | Classroom after it | Notes |
|---|---|---|---|---|---|
| 23 · Jun 10 | 2540-2673 | None | Exam structure and timings; dialogue instruction words (presentera dig, svara jakande/nekande + förklara + föreslå, avsluta artigt); ending phrases; informal text checklist with a weak and a good example; informal vs formal table; two formal email models (Migri, late parcel); "formal style loves numbers and facts" | 18, 19 | Not a book lesson |
| 24 · Jun 12 | 2674-2774 | Uppvärmning word list p8 (not named; the list matches p8); Dialog 1 p12-13; Dialog 2 p14-15 | Relationship words; class answers; describing a flat (kvadratmeter, rooms); för … sedan; tyvärr + reason; skjuts/skjutsa; SoundCloud link (2680) | 20 | |
| 25 · Jun 15 | 2775-2938 | Dialog 3 p16-17; Dialog 7 p24-25; Dialog 4 p18-19 (this order) | YKI rules (2777); reacting to good and bad news; Förlåt/Ursäkta vs Jag är ledsen att höra det; describing an object with 2 of size, colour, brand, material; dress code | 21 | Heavy: 3 dialogues + 2 topics |
| 26 · Jun 17 | 2939-3031 | Dialog 5 p20-21; Dialog 8 p26-27 | Advice frames; typical problems and solutions; offering help; jo; innan/före; party types; tacka ja/nej; bekräfta senast | none | The p68 advice list is similar but not used |
| 27 · Jun 19 | 3032-3151 | Dialog 9 p28-29; Dialog 10 p30-31; Dialog 11 p32-33 | House problems list (overlaps the p11 word map, not named); arranging a time; address and phone number | none | Dialog 11 starts with the learner answering the phone (book's OBS) |
| 28 · Jun 22 | 3152-3229 | Reagera p34 items 1, 2, 3, 6, 7, 12, 11 (page not named; numbers and wording match p34) | Reagera: 20 s + 25 s; be more specific than the prompt; do not repeat its words (3154-3157); describing people; apology + reason + suggestion; compliment + question + compliment | 22 | Teacher homework: video *Vår lägenhet i Zadar* (3 words per room) |
| 29 · Jun 24 | 3230-3331 | Reagera p34-35 items 4, 5, 8, 10, 13, 14, 15; Berätta p35 A, D | Condolences; polite refusal recipe (3252-3256); diets and allergies; Berätta rules: 1 min + 1 min, 40-60 words, narrative in the past, then vs now (3311-3318) | 23 | |
| 30 · Jun 26 | 3332-3385 | None named. The model text uses the topic of Din åsikt G p36 | Opinion lengths: writing 100-150, speaking 60-90 words in 1 min 30 s (3336-3337); three-part structure and phrase bank; two models | 24 | Not a book lesson |
| 31 · Jun 29 | 3386-3483 | Din åsikt p36 A, B; Vardagsliv divider p39; Dialog 5 p49-50; Dialog 3 p45-46 (this order) | Three positions: positive, negative, mix (3396-3410); varken/både/antingen; common complaint topics (3426-3434); returning a product; a café complaint | 25 | Theme 2 starts |
| 32 · Jul 1 | 3484-3577 | Dialog 4 p47-48 | Summarising directions (3492-3498); complaint guideline (3513-3523); three model complaints; complaint phrases (3561-3576) | none | Skriva p38 has a complaint task, not named |
| 33 · Jul 3 | 3578-3666 | Reagera p51-52 items 16, 10, 14, 15, 9, 1, 8, 3, 2, 5, 4 | be vs fråga; bargaining; cutlery; furniture words | 26 | |
| 34 · Jul 6 | 3667-3732 | Berätta p52 (time management; my everyday life; restaurants); Din åsikt p53 (a child under school age and a phone; everyday life in Finland is simple) | The ad text type with three models; units tum, kvm, mil, hekto (3712-3731) | 27 (mapped by topic) | Skriva p54 task 1 (reply to an ad) is the same type |
| 35 · Jul 8 | 3733-3854 | Dialog 2 p60-61; Berätta p62 A, B | Environment vocabulary quiz and gap text (own; overlaps the p56-58 word maps); trees and flowers; "fem minuters promenad" | 28, 29 | Dialog 1 p58-59 is never used |
| 36 · Jul 13 | 3855-3991 | Reagera p62 items 5, 2, 4, 1, 3, 7, 6; Din åsikt p63 B, C; Reagera p72 items 10, 11, 4 | Health vocabulary (own; overlaps p66); ont i + definite form; advice; homework videos (Amira: förkylningen, SFI health, Dr Samuel) | 30 | Spans themes 3 and 4 |
| 37 · Jul 15 | 3992-4093 | Reagera p72 items 1, 5, 7, 9; Dialog 1 p68-69; Dialog 2 p70-71; questions p67 ("Frågor"); Berätta p73 D, E | väcka/vakna; injuries; Krya på dig; humor/humör | 31 | |
| 38 · Jul 17 | 4094-4235 | Din åsikt p74 A, B, C; Arbete och utbildning word list (matches p77-78); Dialog 1 p79-80; Dialog 2 p81-82; Dialog 3 p83-84 | Work and study vocabulary; komma ihåg/minnas; dates | none | Spans themes 4 and 5 |
| 39 · Jul 20 | 4236-4360 | Dialog 4 p85-86; Reagera p87-88 items 15, 9, 4, 8, 17, 1, 3, 14, 18, 2, 10 | Opinion phrase bank: opinion, agreeing, facts, arguments, conclusion (4256-4285) | none | |
| 40 · Jul 22 | 4361-4435 | Berätta p88 A-D; Din åsikt p89 A, B, C, D, F | School and work words; automation | 32 | |
| 41 · Jul 24 | 4436-4572 | Fritid och hobbyer word list (drawn from p92-95); Dialog 1 p96-97; Dialog 2 p98-99; Dialog 3 p100-101; Dialog 4 p102-103 | Free-time vocabulary | 33, 34 | Theme 6 starts |
| 42 · Jul 27 | 4573-4706 | Dialog 5 p104-105; Dialog 6 p106-107; Dialog 7 p108-109; Reagera p112-113 items 1, 3, 5, 6, 7, 8, 9, 16 | Application/registration structure and two models (4629-4642) | 35 | Dialog 8 p110-111 (course enrolment) is never used |
| 43 · Jul 29 | 4707-4805 | Reagera p112 items 2, 4, 10, 11, 14; Berätta p113-114 A, B, D, F, G, H, I | Pointing things out politely | 36 | |
| 44 · Jul 31 | 4806-4903 | Din åsikt p115 A-E | "Gamla YKI uppgifter": 3 opinion topics with a model text (4865-4902), not in the book | none | Mixed lesson |
| 45 · Aug 7 | 4904-5040 | Samhälle word list (matches p118); Dialog 2 p121-122; Reagera p123 items 1, 2, 3, 5; Berätta p123 A, B; Din åsikt p124 B, D | en lag / ett lag; för säkerhets skull; volunteering; fees | none | Last book lesson. Dialog 1 p119-120 never used |
| 46 · Aug 10 | 5041-5114 | **None** | Old YKI tasks: 2 opinion topics, 9 Reagera situations, 2 Berätta topics | none | Not a book lesson |
| 47 · Aug 12 | 5115-5197 | **None** | Old YKI tasks: 4 opinion topics, 6 Reagera situations | none | Not a book lesson; "technology in the classroom" repeats Lesson 44 |
| 48 · Aug 14 | 5198-5293 | Dialog 3 p16-17 (second time); Dialog 6 p22-23 (first time) | Old YKI tasks: 5 opinion topics, 1 Berätta topic | none | Mostly not book |
| 49 · Aug 17 | 5294-5394 | Dialog 7 p24-25 (second time); Dialog 1 p41-42; Dialog 2 p43-44; Berätta p52-53 (debater; restaurants, second time; me in traffic) | Old YKI tasks: Berätta (my schooling), Din åsikt (stress) | none | Review lesson |
| 50 · Aug 19 | 5395-5428 | **None named.** "Listening to the dialogues" (most likely the book's audio) | Old YKI tasks: 4 opinion topics | none | Thin lesson (34 lines) |
| 51 · Aug 21 | 5429-5466 | **None** | Old YKI tasks: 6 opinion topics | 37, 38, 39 (posted Aug 24-26) | Thin lesson (38 lines). The notes end here |

### 3.1 Lessons that do not follow the book

- **No book at all:** 23 (exam overview and writing), 30 (opinion writing),
  46, 47, 51 (old YKI tasks), 50 (dialogue listening, old YKI opinions).
- **Partly:** 44 (book opinions, then old YKI tasks), 48 and 49 (old YKI
  tasks plus book dialogue reviews).
- The old YKI tasks have no source file. Use their topics; write all wording
  fresh.

### 3.2 Book material the teacher never uses (reserve)

Keep it as optional extra practice or for transfer prompts. Do not add it to a
lecture's source pointers, because the lecture follows the lesson.

- Theme 1: p9-11 word maps (p11 overlaps Lesson 27); Reagera 9, 16, 17, 18;
  Berätta B, C; Din åsikt D, E, F, H-L (G only as Lesson 30's model topic).
- Theme 2: "Jag som konsument" p41; Reagera 6, 7, 11, 12, 13; Din åsikt on
  chain stores and bargaining.
- Theme 3: Dialog 1 p58-59 (lost in the forest); Reagera 8; Berätta C; Din
  åsikt A.
- Theme 4: the p68 advice list; Reagera 2, 3, 6, 8, 12, 13; Berätta A, B, C,
  F; Din åsikt D.
- Theme 5: the p77 discussion questions and phrases; Reagera 5, 6, 7, 11, 12,
  13, 16; Din åsikt E, G.
- Theme 6: the p92-94 discussion questions; Dialog 8 p110-111; Reagera 12, 13,
  15, 17, 18; Berätta C, E.
- Theme 7: Dialog 1 p119-120; Reagera 4, 6, 7, 8; Din åsikt A, C.
- Every Skriva page (38, 54, 64, 75, 90, 116, 125). Lectures borrow their task
  types, not their wording.

### 3.3 Teacher-note lines to fix before use

Already flagged in the notes: line 2634 "Ord och datum" (Ort och datum), 2635
"Tjäna!" (Tjena!), 2636 "viktigt" (viktig). Each lecture in section 4 lists
its own fixes under "Fix".

---

## 4. Proposed lectures

### 4.1 Decision: one lecture per lesson, plus a mock

- **Lessons 23-51 become Lectures 23-51**, same numbers, same dates on the
  hero. This keeps the phase-1 rule and the link between the app and the class.
- **No merges.** Lessons 50 and 51 are thin, opinion-only review days, but each
  becomes a short review lecture with a different job (50: dialogue review and
  spoken opinion; 51: the last opinion round and a formal text). Merging would
  break the number alignment for little gain.
- **Heavy lessons** (25, 27, 36, 39, 42, 45) stay one lecture with two sittings.
  The `yki-speaking` step runs one exam-sized round; the other items stay
  optional.
- **Lecture 52, "Provdag"**, is added after Lesson 51. It is built from
  Classroom items 37-39 (posted Aug 24-26, after the last notes) with the
  existing `yki-mock` route. It is the only lecture not tied to a teacher
  lesson.

### 4.2 Chapters

Levels: Chapters 7-9 are **A2** (bridging); Chapters 10-14 are **B1** (the
target: YKI level 3). The book part is where the chapter's book work comes from.

| Ch | Title (for `modules.json`) | Lectures | Level | Book part | Story title | Story summary |
|---:|---|---|---|---|---|---|
| 7 | Getting ready: visits and calls | 23-27 | A2 | Exam overview; theme 1 dialogues (p8-33) | The YKI course begins | Alex joins Henrik's summer YKI course and learns how the test works. He visits Elin and Mikko, hears good and bad news, helps Elin before her company party, accepts a midsommar invitation, and makes the calls a leaking tap needs. |
| 8 | React, tell, give your view | 28-30 | A2 | Theme 1 Reagera, Berätta, Din åsikt (p34-37) | Quick answers | After midsommar Henrik trains fast reactions. Alex gets ready for his cousin's visit, tells about his grandmother in Pune, and argues with Elin about social media. |
| 9 | Everyday errands | 31-34 | A2 | Theme 2 Vardagsliv (p39-54) | Buying for the new flat | Alex shops for his new flat. He returns a broken coffee machine, gets lost in Vasa, complains about a sofa without screws, bargains for a desk and sells his old sofa bed with an ad. |
| 10 | Nature, environment and health | 35-37 | B1 | Themes 3-4 (p55-75) | Summer outdoors | Alex needs a fishing permit, gives away furniture before the move, catches a summer cold, and calls Maja after her bike accident. |
| 11 | Work and studies | 38-40 | B1 | Theme 5 Arbete och utbildning (p76-90) | At work | Alex calls in sick and books a meeting. Elin returns from a business trip and plans to ask for a raise. Maja and Alex compare school in Pune and Helsinki. |
| 12 | Free time | 41-44 | B1 | Theme 6 Fritid och hobbyer (p91-116) | Library, trains and hobbies | A library mix-up, a lost coat ticket, a cancelled train and a course application. Alex talks about books, films and hobbies, and moves into his tvåa at the end of July. |
| 13 | Society and old exam tasks | 45-48 | B1 | Theme 7 Samhälle (p117-125); old YKI tasks | The new home | In his new flat Alex deals with a leak, his insurance and Migri. Henrik's old exam tasks cover gap years, grades, equality and remote work. Alex invites everyone to his housewarming. |
| 14 | Final rehearsal | 49-52 | B1 | Dialogue reviews; old YKI tasks; Classroom mocks | Exam ready | Dialogue reviews, the last opinion rounds and a mock exam day. Afterwards Alex signs up for the test. |

Chapter casts follow the validator rule: only recurring characters who speak in
that chapter's story dialogues.

### 4.3 Story facts for this phase

- **Carried from phase 1:** Alex is from Pune, a programmer who works from
  home and lives alone; he has lived in Finland for two years (Lecture 17);
  his lease ends in August and he wants a tvåa with desk space and bike storage
  (Lectures 21-22); his siblings Priya and Rohan live in India (Lecture 2).
  Elin grew up in Vasa, is sambo with Mikko, has no car, and has a heavy
  workload because a colleague is on sick leave (Lectures 16, 20, 22). Maja is
  17, at gymnasiet, likes chemistry, lives with her mum (a sjukskötare) and her
  sister, and cycles (Lectures 5, 15, 20, 21). Henrik is the language coach.
- **New in this plan:** Henrik runs a summer YKI course (Lecture 23). Alex
  signs a lease for a tvåa in Vallgård from 1 August (Lecture 24) and moves at
  the end of July. Mikko gets a new job (Lecture 25) and stays off-screen. Elin
  has a company summer party (25) and a business trip to Stockholm (39). Maja
  has a summer job at a café (34) and a small bike accident (37). Alex's
  housewarming is on Saturday 15 August (invited in 47). After the mock,
  Alex registers for the next Swedish YKI test; do not invent a date.
- **Sensitive book situations** (divorce, a death, serious illness, a drunk
  driver) stay as anonymous situations in the practice step. Never attach them
  to the recurring cast.
- Service roles (Tjänsteman, Försäljare, Disponent, Chef …) are one-scene
  roles with a role label and one of the four native voices.

### 4.4 Overview

| Lecture | Lesson · date | Working title (Swedish · English) | Book pointers | Writing |
|---:|---|---|---|---|
| 23 | 23 · Jun 10 | Så går YKI-provet till · How the YKI test works | none | Informal (item 18) |
| 24 | 24 · Jun 12 | Välkommen på besök · A visit and a goodbye | p8, D1 p12-13, D2 p14-15 | Formal (item 19) |
| 25 | 25 · Jun 15 | Goda och dåliga nyheter · Good news and bad news | D3 p16-17, D7 p24-25, D4 p18-19 | Informal |
| 26 | 26 · Jun 17 | Du ser trött ut · Advice and a party invitation | D5 p20-21, D8 p26-27 | Informal |
| 27 | 27 · Jun 19 | Problem hemma · Calls about the home | D9 p28-29, D10 p30-31, D11 p32-33 | Formal |
| 28 | 28 · Jun 22 | Reagera snabbt · React in 25 seconds | Reagera p34 | Informal |
| 29 | 29 · Jun 24 | Nej tack, och en berättelse · A polite no, and telling a story | Reagera p34-35, Berätta p35 | Informal (narrative) |
| 30 | 30 · Jun 26 | Min åsikt i 120 ord · The opinion text | (Din åsikt G p36 as topic) | Opinion (item 24) |
| 31 | 31 · Jun 29 | Fester, kvitton och kaffe · Opinions, returns and the café | Din åsikt p36, D5 p49-50, D3 p45-46 | Opinion |
| 32 | 32 · Jul 1 | Vilse i stan och ett klagomål · Lost in town, and a complaint | D4 p47-48 | Formal (complaint) |
| 33 | 33 · Jul 3 | Reagera i affären · React in shops and on the street | Reagera p51-52 | Semi-formal (reply to an ad) |
| 34 | 34 · Jul 6 | Min vardag och en annons · My everyday life and an ad | Berätta p52, Din åsikt p53 | Ad (item 27) |
| 35 | 35 · Jul 8 | Naturen nära · Nature and a permit call | D2 p60-61, Berätta p62 | Semi-formal (invitation) |
| 36 | 36 · Jul 13 | Miljö och förkylning · Green choices and a summer cold | Reagera p62, Din åsikt p63, Reagera p72 | Opinion |
| 37 | 37 · Jul 15 | Ring 112 · Emergencies and accidents | Reagera p72, D1 p68-69, D2 p70-71, p67, Berätta p73 | Informal |
| 38 | 38 · Jul 17 | Vården och jobbet · Healthcare views and calls at work | Din åsikt p74, p77-78, D1 p79-80, D2 p81-82, D3 p83-84 | Formal |
| 39 | 39 · Jul 20 | Affärsresa och lönesamtal · A business trip and a pay talk | D4 p85-86, Reagera p87-88 | Formal |
| 40 | 40 · Jul 22 | Skolan och arbetslivet · School, first jobs and the future of work | Berätta p88, Din åsikt p89 | Opinion |
| 41 | 41 · Jul 24 | Biblioteket och baren · Library, bar and hotel | p92-95, D1-D4 p96-103 | Formal |
| 42 | 42 · Jul 27 | Inställt tåg och en ansökan · A cancelled train and an application | D5-D7 p104-109, Reagera p112-113 | Application (item 35) |
| 43 | 43 · Jul 29 | Fritid som betyder något · Point it out politely, and free time | Reagera p112, Berätta p113-114 | Informal (invitation) |
| 44 | 44 · Jul 31 | Motion – ett måste? · Opinions on free time, and old exam tasks | Din åsikt p115 | Opinion |
| 45 | 45 · Aug 7 | Samhället och försäkringen · Society, authorities and insurance | p118, D2 p121-122, Reagera p123, Berätta p123, Din åsikt p124 | Formal |
| 46 | 46 · Aug 10 | Gamla YKI-uppgifter 1 · Gap year, grades and quick reactions | none | Opinion |
| 47 | 47 · Aug 12 | Gamla YKI-uppgifter 2 · Equality, siblings and a housewarming | none | Informal (invitation) |
| 48 | 48 · Aug 14 | Gamla YKI-uppgifter 3 · Remote work, news and a dialogue review | D3 p16-17, D6 p22-23 | Opinion |
| 49 | 49 · Aug 17 | Dialoger igen · Dialogue review: gym and hairdresser | D7 p24-25, D1 p41-42, D2 p43-44, Berätta p52-53 | Informal (trip blog) |
| 50 | 50 · Aug 19 | Lyssna och tyck till · Listen to the dialogues, then argue | none (book audio) | Opinion |
| 51 | 51 · Aug 21 | Sista åsiktsrundan · The last opinion round | none | Formal (complaint) |
| 52 | Classroom 37-39 · Aug 24-26 | Provdag · Mock exam day | none | Mock (3 texts) |

Writing balance: 9 informal, 12 formal or semi-formal, 8 opinion texts, plus
the mock. Ranges: informal and formal **50-80 words** (the exam's range;
complaints, ads and applications may go to 90-110 because they need facts);
opinion **100-150 words**.

### 4.5 Lecture by lecture

Each lecture has the usual route: Hear the conversation (recall) → **YKI
tasks** (`yki-speaking` extra step, after recall) → teach → guided (end of
Part 1) → Do the task (speaking mission, then the written message) → Check
yourself → Take it forward. Timings in the step follow section 6.3. "Book" is a
pointer only; every part is original.

#### Chapter 7: Getting ready: visits and calls

**Lecture 23 · Så går YKI-provet till · How the YKI test works** (Lesson 23, Jun 10, lines 2540-2673)
- **Book:** none. **YKI step:** one original practice dialogue using the
  teacher's instruction words (presentera dig, svara jakande/nekande +
  förklara + föreslå, avsluta artigt).
- **Teach:** the four subtests, timings and Migri's level-3 pairs; dialogue
  instructions and ending phrases (2570-2593); the six parts of an informal
  text with the weak and good examples (2595-2628); informal vs formal style
  and the formal email (2630-2671).
- **Mission:** a phone call: introduce yourself, give facts (name, address,
  phone number, when you are free), end politely.
- **Writing:** informal message, item 18 topic 3 (a friend lost a job: react,
  offer help, suggest meeting). Points = the teacher's six informal parts.
- **Focus:** du vs ni; Hej/Kram vs Vänliga hälsningar; angående, för att, på
  grund av; Skulle ni kunna …?; Tack på förhand; Vad sägs om …?
- **Prepares for:** items 18 (written here) and 19 (read and practised here,
  written in Lecture 24).
- **Story:** Henrik opens his summer YKI course; Alex and Elin practise a phone
  call; Alex writes to a friend from his old job who has lost it.
- **Fix:** 2657 "telfonnummer".

**Lecture 24 · Välkommen på besök · A visit and a goodbye** (Lesson 24, Jun 12, lines 2674-2774)
- **Book:** word list p8; Dialog 1 p12-13 (a friend visits); Dialog 2 p14-15
  (the friend leaves). **YKI step:** two original dialogues of these types
  (welcome, offer a drink, describe your home, good and could-be-better; ask
  about plans, say no with a reason, offer a ride, insist).
- **Mission:** describe your home to a visiting friend: size, rooms, one good
  thing, one thing that could be better.
- **Writing:** formal email, item 19 topic 1: ask a shop about a product
  (availability, price, back in stock). Points = the item 19 rubric (greeting,
  presentation, questions, facts and numbers).
- **Focus:** p8 relationship words (sambo, förlova sig, skilja sig,
  ensamstående förälder, kärnfamilj); particle verbs (komma ihåg, flytta ihop,
  ta hand om); för … sedan; skulle kunna vara; tyvärr + reason; skjutsa; Oroa
  dig inte · Det var så lite.
- **Prepares for:** item 19; item 20 *Nyheter 1* (link the episode; original
  questions).
- **Story:** Elin and Mikko invite Alex for dinner. He arrives late in the
  rain, praises the flat and asks how big it is. He has signed for a tvåa in
  Vallgård from 1 August. He liked their coffee machine, so he writes to a shop.
- **Fix:** 2730 "Vi träffade inte varandra på 2 månader" → "Vi har inte
  träffats på två månader"; 2732 "din kaffe" → "ditt kaffe"; 2744 "Jag, den
  är fin" → "Ja, den är fin"; 2768 "stån" → "stan".

**Lecture 25 · Goda och dåliga nyheter · Good news and bad news** (Lesson 25, Jun 15, lines 2775-2938)
- **Book:** Dialog 3 p16-17 (congratulate a friend on a new job); Dialog 7
  p24-25 (a friend has divorced); Dialog 4 p18-19 (what to wear to a big
  party). **YKI step:** three original dialogues, in the teacher's order. The
  divorce situation stays anonymous.
- **Teach:** the YKI rules (2777); good and bad news with follow-up questions
  and an offer; Förlåt/Ursäkta vs Jag är ledsen att höra det (2804);
  describing an object with two of size, colour, brand, material (2879-2891);
  dress code.
- **Mission:** call a friend with good news: congratulate, ask two questions,
  suggest a celebration.
- **Writing:** informal message congratulating a friend (Skriva p38 task 1
  type, own situation).
- **Focus:** Vilka fantastiska nyheter! · stolt över · Vad synd/jobbigt! ·
  Stackars dig · Jag beklagar sorgen · Jag finns här för dig; Vi hörs (s-verb);
  upptagen/ledig; ha … på sig, det står, det stämmer, inte ens, sådan/sådant/
  sådana; det vore = det skulle vara.
- **Prepares for:** item 21 *Festivalen Bravo* (an original event text with
  MC and open questions).
- **Story:** Alex calls Elin: Mikko got his dream job. Elin panics because her
  company's summer party says "mörk kostym".
- **Fix:** 2851 gloss "for the sake of kind" → "for the children's sake". Book
  p19's "provsmakare" is odd; do not use it.

**Lecture 26 · Du ser trött ut · Advice and a party invitation** (Lesson 26, Jun 17, lines 2939-3031)
- **Book:** Dialog 5 p20-21 (your friend looks tired); Dialog 8 p26-27 (invite
  a friend to your party). **YKI step:** two original dialogues.
- **Teach:** advice frames (Du borde · Du kan prova att · Det hjälper mig att ·
  En sak som kan vara bra är); problems and solutions; offering help; party
  types, tacka ja/nej, bekräfta senast, önskemål.
- **Mission:** say how a tired friend looks, give two pieces of advice, offer
  help.
- **Writing:** informal reply to an invitation: accept, ask what to bring,
  offer help.
- **Focus:** ser + adjective + ut; på sistone; förmodligen; jo after a negative
  question; innan vs före; följa med; Det behövs inte · Jag klarar det.
- **Story:** Elin looks tired at the class break; Alex and Maja give advice;
  Elin invites them to midsommar at Mikko's family's stuga on Friday (19 June).
- **Fix:** 2952 "lyssnar på musik" in an imperative list → "lyssna på musik".

**Lecture 27 · Problem hemma · Calls about the home** (Lesson 27, Jun 19, lines 3032-3151)
- **Book:** Dialog 9 p28-29 (ask for a renovation quote); Dialog 10 p30-31 (a
  parcel that did not fit the mailbox); Dialog 11 p32-33 (the property manager
  calls about noise; you answer). **YKI step:** three original dialogues.
- **Teach:** home problems (läcker, gick sönder, fungerar inte, täppt, kan inte
  stängas, knarrar, mögel, fukt; rörmokare, elektriker, låssmed); arranging a
  time (Går det bra? · Det passar mig inte); address and phone number;
  answering the phone formally.
- **Mission:** call property maintenance: what is wrong and since when, a time
  that suits you, address and number, a polite end.
- **Writing:** formal fault report: the problem, since when, what should be
  done and by when, contact details (Skriva p38 task 3 type).
- **Focus:** s-verbs as passive (kan inte stängas, kunde inte levereras, nås,
  bevaras); får inte plats; klaga på; häromdagen; hyra/äga.
- **Story:** in Alex's old flat the kitchen tap leaks, and a parcel with his
  new desk chair could not be delivered. Elin helps him plan both calls.
- **Fix:** 3076 "renovera disken (the sink)" → "diskhon"; 3138 "Vi alla jobbar
  på morgone" → "Vi jobbar alla på morgonen"; 3146 "Den är vår egen lägenhet"
  → "Det är vår egen lägenhet".

#### Chapter 8: React, tell, give your view

**Lecture 28 · Reagera snabbt · React in 25 seconds** (Lesson 28, Jun 22, lines 3152-3229)
- **Book:** Reagera p34 items 1, 2, 3, 6, 7, 12, 11. **YKI step:** react set
  of 7 original situations of these types (show a visitor your town; describe
  a visitor to a neighbour; stop teasing; a very expensive gift; a voicemail to
  make up; a compliment; a lost child). Round of 5.
- **Teach:** Reagera rules (3154-3157 and 2777); describing people (lång,
  mörkt hår, hade … på sig, liknade); apology recipe (3186-3198); compliment
  recipe (3203-3215).
- **Mission:** tell a neighbour what you will show a relative in your town.
- **Writing:** informal apology after a small quarrel: reason and a suggestion
  to meet.
- **Prepares for:** item 22 *Nyheter 2*. Teacher's homework video *Vår
  lägenhet i Zadar* in resources.
- **Story:** after midsommar Alex tells Henrik his cousin from Pune is coming;
  Henrik turns Alex's week into quick reactions.

**Lecture 29 · Nej tack, och en berättelse · A polite no, and telling a story** (Lesson 29, Jun 24, lines 3230-3331)
- **Book:** Reagera p34-35 items 4, 5, 8, 10, 13, 14, 15; Berätta p35 A (a
  person I will never forget), D (a friend's or relative's life). **YKI step:**
  react set of 7 originals (condolences; refusing food; asking for a lift;
  refusing a colleague's invitation; why someone matters to you; gossip
  behind your back; a friend is expecting a baby) + tell set of 2.
- **Teach:** bad-news reactions (3237-3248); polite refusal (3252-3270) with
  diets and allergies; the Berätta method (3311-3318).
- **Mission:** Berätta: a person I will never forget (1 minute, 40-60 words).
- **Writing:** a short blog post about that person, 60-100 words (narrative,
  like mock 38 task 1).
- **Focus:** dö – dog – har dött; allergisk mot; mätt, mår illa, bantar,
  fastar; betyda, stötta, uppskatta, gemensamma minnen; besviken på.
- **Prepares for:** item 23 *Köttfri dag* (an original opinion text with
  questions).
- **Story:** Maja tells about her grandfather; Alex tells about his grandmother
  in Pune; Alex politely says no to an after-work invitation because of class.
- **Fix:** 3190 "Jag var fel att fråga" → "Det var fel av mig att fråga";
  "vår argument/bråk" → "vårt bråk"; 3292 "En skratt" → "ett skratt".

**Lecture 30 · Min åsikt i 120 ord · The opinion text** (Lesson 30, Jun 26, lines 3332-3385)
- **Book:** none named (the model text takes Din åsikt G p36 as its topic).
  **YKI step:** opinion set of 3 originals from the item 24 topic list.
- **Teach:** lengths and timing (3336-3337); the three parts and phrase bank
  (3341-3362); two arguments on one side vs one on each side.
- **Mission:** Din åsikt: do social media destroy relationships? (1 min 30 s)
- **Writing:** opinion text, item 24 (one topic), 100-150 words, aim for 120;
  structure from `24_3`.
- **Focus:** Trots att många …, tycker jag att … (the verb comes right after
  the fronted clause); för det första/andra; dessutom; däremot; jämfört med;
  sammanfattningsvis; slippa; påverka … på ett positivt sätt; vilket;
  förstå/förstöra; stad – städer, land – länder.
- **Story:** Alex video-calls his sister Priya; afterwards Elin and Alex
  disagree about social media, and Henrik turns their argument into 120 words.
- **Note:** Lecture 22 built an 80-120-word insändare; this lecture moves to
  exam length.

#### Chapter 9: Everyday errands

**Lecture 31 · Fester, kvitton och kaffe · Opinions, returns and the café** (Lesson 31, Jun 29, lines 3386-3483)
- **Book:** Din åsikt p36 A, B; divider p39; Dialog 5 p49-50 (return a faulty
  appliance); Dialog 3 p45-46 (something is wrong with your coffee).
  **YKI step:** opinion set of 2 + two original dialogues timed like the
  Vardagsliv pages (10-25 s per turn).
- **Teach:** three positions (3396-3410); varken … eller, både … och,
  antingen … eller; complaint topics (3426-3434); returns (kvitto, garantin
  gäller, ersätta, utbyte).
- **Mission:** Din åsikt: are Finnish parties boring? Choose a position and
  give two reasons.
- **Writing:** opinion text, "Finländska fester är tråkiga".
- **Prepares for:** item 25 *Nyheter 3*.
- **Story:** Alex's new coffee machine for the flat will not start, so he
  returns it; at a café Elin's coffee is cold; they disagree about parties.
- **Fix:** 3417 "Heldag" → "helgdag"; 3481 "Jag känner mig bra att vara här"
  → "Jag trivs här".

**Lecture 32 · Vilse i stan och ett klagomål · Lost in town, and a complaint** (Lesson 32, Jul 1, lines 3484-3577)
- **Book:** Dialog 4 p47-48 (lost in a strange town; repeat the
  instructions). **YKI step:** one original dialogue with the page's turn
  pattern (10/10/15/10/10 s).
- **Teach:** directions and saying them back (3492-3510); the complaint guide
  (3513-3523) with original models; complaint phrases (3561-3576).
- **Mission:** give the way from the station to a café, then repeat back a
  route you hear.
- **Writing:** formal complaint about a product with missing parts: what, when,
  facts, receipt attached, what you want, by when. 60-90 words.
- **Focus:** bifogad/bifogat/bifogade (participles); inte bara … utan också;
  kräva ersättning; återbetalning; Vet du var den ligger? (indirect question).
- **Prepares for:** phase 1's `14_4` complaint handout and the 7-criteria
  rubric; mock 38 task 2.
- **Story:** on a day trip to Vasa Alex gets lost on the way to the market
  square; at home the sofa he ordered for the new flat has no screws.
- **Fix:** 3509 "sväng till vänster" after "borde" → "svänga".

**Lecture 33 · Reagera i affären · React in shops and on the street** (Lesson 33, Jul 3, lines 3578-3666)
- **Book:** Reagera p51-52 items 16, 10, 14, 15, 9, 1, 8, 3, 2, 5, 4.
  **YKI step:** react set of 11 originals (ask a bus driver; noisy children;
  call about a used washing machine; bus directions to your home; flowers for
  an occasion; dirty café tables; bargaining; why you hire a cleaner; a friend
  used all the petrol; missing furniture parts; a falling lamp). Round of 5.
- **Teach:** be vs fråga (be någon göra något); bargaining (pruta, rabatt,
  sänka priset, stamkund); i present, tillfälle, bestick, möbel/möbler.
- **Mission:** bargain for an expensive item with two reasons.
- **Writing:** reply to a sales ad: where and when you saw it, what interests
  you, two questions, how to contact you (Skriva p54 task 1 type).
- **Prepares for:** item 26 *Ulf Unge* (an original opinion column with
  questions).
- **Story:** Alex calls about a second-hand desk for the new flat and
  bargains; at a café Maja shows him how to ask politely for a clean table.
- **Fix:** 3588 "lugna ner" → "lugna ner sig"; 3599 "tillgänlig" →
  "tillgänglig"; 3613 "vilka blommor passar" → "vilka blommor som passar";
  3649 "låna dig bilen" → "låna ut bilen till dig".

**Lecture 34 · Min vardag och en annons · My everyday life and an ad** (Lesson 34, Jul 6, lines 3667-3732)
- **Book:** Berätta p52 (time management; my everyday life; restaurants); Din
  åsikt p53 (a child under school age; everyday life in Finland). **YKI step:**
  tell set of 3 + opinion set of 2.
- **Teach:** routines (hantera tid, slösa bort tid); the ad (3712-3731):
  headline, introduction, details, conditions, contact; units tum, kvm, mil,
  hekto.
- **Mission:** Berätta: my everyday life (1 minute).
- **Writing:** an ad, item 27 (sell something, rent out a flat, or ask a
  seller more). 60-100 words; structure `27_5`; 7-criteria rubric as points.
- **Focus:** i jättebra skick; garantin gäller / är giltig; förhandla om
  priset; hyresgäst; deposition; en trea på 80 kvm; annars.
- **Story:** Maja describes her summer routine at her café job; Alex writes an
  ad to sell his old sofa bed before he moves.
- **Fix:** 3715 "min gamla bärbar" → "min gamla bärbara dator".

#### Chapter 10: Nature, environment and health

**Lecture 35 · Naturen nära · Nature and a permit call** (Lesson 35, Jul 8, lines 3733-3854)
- **Book:** Dialog 2 p60-61 (call about a fishing permit); Berätta p62 A (what
  nature means to you), B (protecting nature). **YKI step:** one original
  dialogue + tell set of 2.
- **Teach:** environment words from the teacher's quiz (miljövänlig,
  skydda/skada miljön, växthusgaser, koldioxidutsläpp, återvinna/återanvända,
  sopsortera, pant, förnybar energi, hållbar, kollektivtrafik); trees (ek,
  björk, tall); "Det är fem minuters promenad till skogen".
- **Mission:** Berätta: what nature means to me (1 minute).
- **Writing:** invitation to neighbours to a courtyard clean-up day: the
  state, what to do, what to bring, when (Skriva p64 task 1 type).
- **Focus:** minska; försvinna – försvann – försvunnit; tillstånd, syfte,
  utrustning, avgiftsbelagd; L21 waste words again.
- **Prepares for:** items 28 *Nyheter 4* and 29 *Nyheter 5*.
- **Story:** Mikko wants to take Alex fishing, so Alex needs a permit; Maja
  quizzes them; Alex compares the forests near Helsinki with Pune.
- **Fix:** 3801-3802 "hugga ner ett trä; ett trä – trän" → "ett träd – träd"
  (trä means wood).

**Lecture 36 · Miljö och förkylning · Green choices and a summer cold** (Lesson 36, Jul 13, lines 3855-3991)
- **Book:** Reagera p62 items 5, 2, 4, 1, 3, 7, 6; Din åsikt p63 B, C;
  Reagera p72 items 10, 11, 4. **YKI step:** react set of 10 originals (round
  of 5) + opinion set of 2.
- **Teach:** nature reactions (förbjudet att, soptipp, återvinningsstation,
  skänka); body and symptoms (ont i + definite form, hostar, nyser, feber,
  förkyld, täppt näsa; apotek, recept, värktabletter; allergisk mot; yr; 112);
  health advice.
- **Mission:** Din åsikt: public transport should be free (1 min 30 s).
- **Writing:** opinion text, "Folk köper för mycket onödiga saker".
- **Prepares for:** item 30 *Barn och mat* (an original article). The
  teacher's health videos go into resources (check every link).
- **Story:** Alex gives his old table and chairs to Maja's family before the
  move; days later he has a summer cold and Elin gives advice.
- **Fix:** 3922 "Jag har host" → "Jag har hosta"; 3978 "Ser upp!" → "Se upp!".

**Lecture 37 · Ring 112 · Emergencies and accidents** (Lesson 37, Jul 15, lines 3992-4093)
- **Book:** Reagera p72 items 1, 5, 7, 9; Dialog 1 p68-69 (call the emergency
  number); Dialog 2 p70-71 (a friend in hospital after an accident); questions
  p67; Berätta p73 D, E. **YKI step:** two original dialogues + react set of
  4 + tell set of 2.
- **Teach:** an emergency call (where, what happened, breathing, bleeding; som
  sagt; vänta utan att lägga på); väcka vs vakna; injuries (bruten, öm,
  hjälm); feelings (skratta, gråta, rädd för, nervös för; humor vs humör).
- **Mission:** Berätta: my wellbeing (1 minute).
- **Writing:** informal message after a friend's accident: how you heard, how
  they are, an offer of help (Skriva p75 task 2 type).
- **Prepares for:** item 31 *Nyheter 6*.
- **Story:** Maja falls off her bike (helmet on, wrist broken); Alex calls her
  in hospital; Henrik practises a 112 call in class.
- **Fix:** 4030 add "ligger" ("en ung kvinna ligger på marken"); 4034 "Nej,
  hon andas" → "Nej, hon andas inte".

#### Chapter 11: Work and studies

**Lecture 38 · Vården och jobbet · Healthcare views and calls at work** (Lesson 38, Jul 17, lines 4094-4235)
- **Book:** Din åsikt p74 A, B, C; word list p77-78; Dialog 1 p79-80 (tell your
  boss you are sick); Dialog 2 p81-82 (a seminar break); Dialog 3 p83-84 (book
  a meeting). **YKI step:** three original dialogues + opinion set of 3.
- **Teach:** healthcare views (köer, bemannad, hälsostation); work words (lön,
  arbetskontrakt, övertid, säga upp sig, säga upp, få sparken); study words
  (föreläsning, examen, betyg, studielån, sabbatsår); calling in sick
  (företagshälsovård, sjukskrivning, ersättare).
- **Mission:** Din åsikt: healthcare in Finland (1 min 30 s).
- **Writing:** formal email to your manager: you are sick, for how long, what
  needs a substitute.
- **Focus:** komma ihåg vs minnas; den tjugofemte; flytta fram ett möte; i
  alla fall.
- **Story:** Alex still has a fever, calls his team leader and books a project
  meeting for next week.
- **Fix:** 4133 "En högsta ledningen" → "den högsta ledningen"; 4134
  "samarbetpartner" → "samarbetspartner"; 4137 "reglar" → "regler"; class
  answers at 4214, 4216 and 4225 are garbled.

**Lecture 39 · Affärsresa och lönesamtal · A business trip and a pay talk** (Lesson 39, Jul 20, lines 4236-4360)
- **Book:** Dialog 4 p85-86 (back from a business trip); Reagera p87-88 items
  15, 9, 4, 8, 17, 1, 3, 14, 18, 2, 10. **YKI step:** one original dialogue +
  react set of 11 originals (round of 5).
- **Teach:** the opinion phrase bank (4256-4285); work reactions (a raise, a
  colleague who did not do the agreed work, a pay error, a meeting room, a
  bullied child, a voice message, questions after an interview, layoffs, a new
  employee, too much work).
- **Mission:** ask your boss for a raise: two reasons and a suggestion.
- **Writing:** formal email asking your manager for a meeting about your
  salary.
- **Focus:** öka/höja vs uppfostra; ske = hända; sägas upp; elak mot;
  arbetsbörda; rimlig; ändå; inte … alls.
- **Story:** Elin is back from a business trip to Stockholm; over coffee she
  tells Alex she will ask for a raise.
- **Fix:** 4296 "har tagit med arbetet och ansvar" → "har tagit mer ansvar";
  4344 "stannas kvar" → "får stanna kvar"; 4358 "mog" → "mig".

**Lecture 40 · Skolan och arbetslivet · School, first jobs and the future of work** (Lesson 40, Jul 22, lines 4361-4435)
- **Book:** Berätta p88 A-D; Din åsikt p89 A, B, C, D, F. **YKI step:** tell
  set of 4 + opinion set of 5.
- **Teach:** school systems (recycle Lecture 18: grundskola, gymnasiet,
  studentexamen); a first job (utförde, lön); opinions on work, AI and
  automation.
- **Mission:** Berätta: school in my home country compared with Finland.
- **Writing:** opinion text, "I framtiden kommer robotar att göra människans
  arbete".
- **Focus:** sträng; anstränga sig; framgång; självständig; ha bråttom; ha
  fullt upp; orsak; uppfostras.
- **Prepares for:** item 32 *Fusket* (an original article, rätt/fel).
- **Story:** Maja and Alex compare school in Pune and Helsinki; Alex says AI
  helps him write code but cannot replace him.

#### Chapter 12: Free time

**Lecture 41 · Biblioteket och baren · Library, bar and hotel** (Lesson 41, Jul 24, lines 4436-4572)
- **Book:** word list (p92-95); Dialog 1 p96-97 (a reminder for a book you
  never borrowed); Dialog 2 p98-99 (a lost coat-check ticket); Dialog 3
  p100-101 (a friend wants to lose weight); Dialog 4 p102-103 (a hotel room
  problem). **YKI step:** four original dialogues (any two make an exam round).
- **Teach:** free-time words (hyra en stuga, bada bastu, åka skidor,
  föreställning, kändis); describing a lost item; hotel complaints (byta rum,
  återbetalning, motsvara förväntningar).
- **Mission:** call a hotel reception: the problem, another room, compensation.
- **Writing:** formal email to the library about the reminder.
- **Focus:** lånas ut; det är inte meningen att; gå upp/ner i vikt; lita på;
  försämras.
- **Prepares for:** items 33 *Nyheter 7* and 34 *Nyheter 8*.
- **Story:** Alex gets a library email about a Finnish textbook he never
  borrowed; Elin lost her coat ticket at a bar.
- **Fix:** 4474 "Modern kunst" → "modern konst"; 4567 is garbled.

**Lecture 42 · Inställt tåg och en ansökan · A cancelled train and an application** (Lesson 42, Jul 27, lines 4573-4706)
- **Book:** Dialog 5 p104-105 (cancelled train); Dialog 6 p106-107 (a survey
  call); Dialog 7 p108-109 (change theatre tickets); Reagera p112-113 items 1,
  3, 5, 6, 7, 8, 9, 16. **YKI step:** three original dialogues + react set of 8.
- **Teach:** the application structure (4629-4642) with original models;
  transport problems (har ställts in, giltig, kompensation, skriftligt
  klagomål, kundtjänst).
- **Mission:** the train is cancelled: ask why, explain your meeting, ask for
  compensation and the customer-service address.
- **Writing:** application, item 35 (dream job, a course, or absence from the
  first lesson). 70-110 words; `35_6`; 7-criteria rubric.
- **Focus:** angående tjänsten; jag är övertygad om att; bidra med; utveckla
  mig; råkade; medlemskort.
- **Story:** Alex's train to Vasa is cancelled; that evening he applies for the
  autumn Swedish course; Maja applies for a weekend job.
- **Fix:** 4619 "för mitt namn" → "i mitt namn"; 4689 "simkort" (a SIM card) →
  "medlemskort".

**Lecture 43 · Fritid som betyder något · Point it out politely, and free time** (Lesson 43, Jul 29, lines 4707-4805)
- **Book:** Reagera p112 items 2, 4, 10, 11, 14; Berätta p113-114 A, B, D, F,
  G, H, I. **YKI step:** react set of 5 (one exam round) + tell set of 7.
- **Teach:** pointing things out politely (Skulle du kunna prata lite tystare?
  · sänka musiken); free-time stories (verk, pjäs, dikt; på resande fot,
  äventyr; husdjur).
- **Mission:** Berätta: my hobby.
- **Writing:** invitation to a film, play, concert or exhibition (Skriva p116
  task 2 type).
- **Prepares for:** item 36 *Nyheter 9*.
- **Story:** on the bus Alex asks a young man to turn his music down; later he
  tells Maja about an Indian film that matters to him.
- **Fix:** 4727 "Be om en hiss" → "Be om skjuts" (hiss is a lift).

**Lecture 44 · Motion – ett måste? · Opinions on free time, and old exam tasks** (Lesson 44, Jul 31, lines 4806-4903)
- **Book:** Din åsikt p115 A-E, then old YKI tasks (not book): technology in
  class, travel abroad or at home, save or enjoy. **YKI step:** opinion set of
  8 originals (round of 3).
- **Teach:** the phrase bank again; weighing both sides; frequency (två gånger
  i veckan / om veckan).
- **Mission:** Din åsikt: exercise is a must, not a choice.
- **Writing:** opinion text, "Spara pengar eller njuta av livet nu?".
- **Story:** Henrik brings the first old exam tasks; Alex, saving for
  furniture, and Elin disagree about saving; Alex moves this weekend.
- **Fix:** 4898 "saker som gör man glad" → "saker som gör en glad".

#### Chapter 13: Society and old exam tasks

**Lecture 45 · Samhället och försäkringen · Society, authorities and insurance** (Lesson 45, Aug 7, lines 4904-5040)
- **Book:** word list p118; Dialog 2 p121-122 (a home insurance claim);
  Reagera p123 items 1, 2, 3, 5; Berätta p123 A, B; Din åsikt p124 B, D. The
  book ends here. **YKI step:** one original dialogue + react 4 + tell 2 +
  opinion 2.
- **Teach:** society words (uppehållstillstånd, medborgarskap, myndighet,
  skatt, restskatt, skatteåterbäring, jämlikhet, enligt lagen; en lag / ett
  lag; för säkerhets skull); calling Migri and an insurer; volunteering.
- **Mission:** Berätta: it matters to me where I come from.
- **Writing:** formal email to the insurance company about water damage.
- **Story:** in his new tvåa water leaks under the sink; the insurer says a
  bill is unpaid; Alex also calls Migri about his residence permit.
- **Fix:** 4942 "Mindreårig" → "minderårig"; 4947 "Statlig myndigheten" →
  "statlig myndighet"; 4974 "kolla bankkonto" → "kolla mitt bankkonto";
  5028 "I nöjd" → "i nöd".

**Lecture 46 · Gamla YKI-uppgifter 1 · Gap year, grades and quick reactions** (Lesson 46, Aug 10, lines 5041-5114)
- **Book:** none. **YKI step:** opinion set of 2 (gap year; grades), react set
  of 9 (wallet left at a hotel, tracking a parcel, flu at the pharmacy, a vet
  friend's advice, changing tyres, not lending your phone, a late library
  book, an extra bank card), tell set of 2 (best trip; keeping traditions).
- **Teach:** strategy review (answer the prompt, be specific, own words);
  symptoms; bank and post services.
- **Mission:** Berätta: the best trip of my life.
- **Writing:** opinion text, "Är det bäst att ta ett sabbatsår efter
  gymnasiet?".
- **Story:** Maja is thinking about a gap year after gymnasiet; Elin and Alex
  give their views.
- **Fix:** 5069 "inte fått det ändå" → "inte fått det än".

**Lecture 47 · Gamla YKI-uppgifter 2 · Equality, siblings and a housewarming** (Lesson 47, Aug 12, lines 5115-5197)
- **Book:** none. **YKI step:** opinion set of 4 (technology in class from a new
  angle; women's and men's chances at work; siblings; holidays), react set of 6
  (taxi directions, a tired friend, a flat viewing, calling in sick, a
  housewarming invitation, the hairdresser).
- **Teach:** equality at work (jämställdhet, yrken); directions again.
- **Mission:** Din åsikt: are siblings a fortune?
- **Writing:** informal housewarming invitation with all details.
- **Story:** Alex invites Elin, Mikko, Maja and Henrik to his housewarming on
  Saturday 15 August and talks about Priya and Rohan.
- **Fix:** 5173 "Finns det fortfarande kvar?" → "Finns den fortfarande
  kvar?"; 5184 "ditt hårstil" → "din frisyr".

**Lecture 48 · Gamla YKI-uppgifter 3 · Remote work, news and a dialogue review** (Lesson 48, Aug 14, lines 5198-5293)
- **Book:** Dialog 3 p16-17 (again); Dialog 6 p22-23 (say no to a second
  meeting). **YKI step:** two original dialogues at exam timing + opinion set
  of 5 + tell set of 1 (unemployment).
- **Teach:** comforting someone (trösta, det är synd, lycka till); register in
  dialogues.
- **Mission:** Din åsikt: are social media a good news source?
- **Writing:** opinion text, "Är det bättre att arbeta hemifrån än på
  kontor?".
- **Story:** Alex, who works from home, and Elin debate remote work; Elin and
  Mikko wonder whether to buy a flat.
- **Fix:** 5282 "jag förväntar mig inte att träffa dig här" → "jag hade inte
  väntat mig att träffa dig här".

#### Chapter 14: Final rehearsal

**Lecture 49 · Dialoger igen · Dialogue review: gym and hairdresser** (Lesson 49, Aug 17, lines 5294-5394)
- **Book:** Dialog 7 p24-25 (again); Dialog 1 p41-42 (something left at the
  gym); Dialog 2 p43-44 (the hairdresser); Berätta p52-53 (debater;
  restaurants; traffic). **YKI step:** three original dialogues with the
  printed turn times (20/20/10/15/10 s and 10/20/10/10/10/25 s) + tell set of
  4 (3 book types + my schooling) + opinion (stress).
- **Mission:** Berätta: my schooling.
- **Writing:** informal blog post about a trip you will never forget (mock 38
  task 1 type).
- **Story:** after the housewarming Alex left his water bottle at the gym and
  gets a haircut; Henrik runs the dialogues at exam timing.
- **Fix:** 5331 "glömde de" → "glömde dem"; 5346 "villa" → "vill".

**Lecture 50 · Lyssna och tyck till · Listen to the dialogues, then argue** (Lesson 50, Aug 19, lines 5395-5428)
- **Book:** none named; link the Gimara SoundCloud playlists. **YKI step:**
  three original review dialogues mixing earlier types + opinion set of 4 (buy
  or rent; languages as an adult; volunteering; zoos).
- **Mission:** Din åsikt: is it better to buy or rent a home?
- **Writing:** opinion text, "Det är jättesvårt att lära sig språk i vuxen
  ålder".
- **Story:** Alex asks whether learning a language as an adult is really so
  hard; Elin and Maja answer from their Finnish lessons at school.
- **Note:** a short review lecture.

**Lecture 51 · Sista åsiktsrundan · The last opinion round** (Lesson 51, Aug 21, lines 5429-5466)
- **Book:** none. **YKI step:** opinion set of 6 (traditional or modern
  medicine; advertising; food prices; sport and outdoor life; a language
  requirement for citizenship; pets as therapy), round of 3.
- **Mission:** Din åsikt: should citizenship need a language test?
- **Writing:** formal complaint to the housing company about the laundry room
  or yard (mock 38 task 2 type).
- **Story:** Henrik's last class; Alex takes the language-requirement topic and
  gives both sides.

**Lecture 52 · Provdag · Mock exam day** (Classroom 37-39, Aug 24-26)
- **Route:** `routeProfile: "yki-mock"` with a new original set
  `stigen-original-mock-c` in `content/yki-mocks.json`, built on the task types
  of items 37 (listening: MC, rätt/fel, open), 38 (three texts: trip blog,
  complaint, opinion A/B) and 39 (six reading tasks: short news, short texts,
  blog, ad, opinion, facts). Never copy the form texts. Archived sets A and B
  stay available as extra mocks.
- **Honesty note:** the class mock (40 + 60 + 55 + 25 minutes) is much longer
  than Stigen's compressed 60-minute mock. The page says so (the sets already
  carry this notice).
- **Story:** Henrik runs a mock exam; afterwards Alex registers for the next
  Swedish YKI test.

---

## 5. Content-model fit

### 5.1 What the current model already supports

| Need | Existing field | Fit |
|---|---|---|
| Written YKI messages (informal, formal, opinion, ad, application) | `practice.writing` with `situation`, `points`, `wordRange`, `help`, `model` | **Full.** Put the teacher's rubric checks into `points` and `route.successChecks`; AI feedback already judges `points`. |
| Berätta and Din åsikt as the main speaking task | The "Do the task" mission (`missionPlan`, one recording, checks, unexpected questions, retry with a change) | **Content yes, timing no.** Frames fit the opinion structure; the mission is untimed by design. Keep it as the guided, A2-friendly attempt. |
| Follow-up questions | `unplannedQuestions` (6, three asked, 15 s) | **Yes, unchanged.** They work as the examiner-style follow-ups. |
| Listening and reading | `practice.listening`, `practice.reading`, `reading_passage`, `resources` | **Yes.** Rätt/fel = two options; open answers = typed checkpoint items; real audio = `resources` links. |
| Mock exam | `routeProfile: "yki-mock"` + `ykiMockId` + `content/yki-mocks.json` + `YkiMockFlow` | **Yes, with a validator change** (5.4). |
| Book dialogue pages via `source-practice` | 5-stage ladder for a printed two-sided dialogue | **Poor fit.** The learner's lines are not printed, the ladder has no time limits, and transcribing the partner's lines would copy the book. |

### 5.2 What it cannot do, honestly

- **YKI dialogues.** The exam gives a written situation (15 s to read), then
  partner turns, each followed by a cue and 10-25 seconds to answer. No current
  step plays a partner, times each turn and records each answer.
- **Reagera vs `QuickQuestions`/`unplannedQuestions`.** `QuickQuestions` picks
  3 random questions, has no preparation time, a fixed 15-second answer, reads
  the prompt aloud in Elin's voice, records nothing and relies on self-rating.
  The validator also requires every unplanned question to end with "?". Reagera
  needs a written situation (not a question), 20 s to prepare, 25 s to speak,
  a round of 5, and an answer that is more specific than the prompt. Bending
  `unplannedQuestions` to fit would change every phase-1 lecture's mission.
- **Exam timing for Berätta and Din åsikt.** Today it only exists through the
  `yki-workshop` and `yki-mock` profiles, which change the whole route.

### 5.3 Proposal: one new extra-step kind, `yki-speaking`

It replaces the textbook step (after `recall`), so lectures keep seven route
steps. One kind, one renderer (`components/learning/YkiSpeakingPractice.tsx`),
registered in `ExtraStep.tsx`. It holds two part types behind a part switcher,
the way `source-practice` holds pages.

```ts
type Voice = "Alex" | "Elin" | "Henrik" | "Maja";

type YkiDialoguePart = {
  type: "dialogue";
  id: string;                          // stable within the step
  title: string;                       // "Samtal · En vän hälsar på"
  bookRef?: string;                    // pointer only: "Förbered dig, Dialog 1, s. 12–13"
  situation: { fi: string; en: string }; // original situation, Swedish + meaning
  readSeconds: number;                 // 15 (Lesson 23)
  partner: { role: string; voice: Voice }; // "Vän", "Försäljare", "Disponent"
  turns: Array<
    | { who: "partner"; fi: string; en: string }
    | {
        who: "learner";
        cue: { fi: string; en: string };  // "(Svara nekande och förklara varför.)"
        seconds: number;                  // 10–25 at exam time; up to 40 in Chapters 7-8 (6.3)
        models: string[];                 // 1–2 answers: a short A2 one, a fuller B1 one
        tip?: string;
      }
  >;
  phrases?: { fi: string; en: string }[];
};

type YkiPromptSetPart = {
  type: "prompts";
  id: string;
  format: "react" | "tell" | "opinion";
  title: string;
  bookRef?: string;
  prepSeconds: number;                 // react 20 · tell 60 · opinion 60
  speakSeconds: number;                // react 25 · tell 60 · opinion 90
  roundSize?: number;                  // react 5 (the exam); default: all
  rules?: string[];                    // the teacher's YKI rules, in plain English
  frames?: { fi: string; en: string }[];
  prompts: Array<{
    id: string;
    fi: string;                        // original situation or statement
    en: string;
    bullets?: string[];                // original guiding questions (tell/opinion)
    model: string;
    modelEn: string;
  }>;
};

// LectureExtraStep union, new member:
// | { kind: "yki-speaking"; parts: Array<YkiDialoguePart | YkiPromptSetPart> }
```

**Renderer behaviour.**
- *Dialogue:* (1) read the card while `readSeconds` count down; cue words get
  plain-English glosses (svara jakande, föreslå, avsluta artigt); (2) get ready
  with `phrases`; (3) timed run: the partner speaks (existing speech API), a
  per-turn countdown runs, each answer is recorded and transcribed (existing
  `/api/transcribe`, typing as fallback); (4) compare each answer with its cue
  and `models` (Did you do what the cue asked? Did you use your own words?);
  (5) run again with the text hidden.
- *Prompt set:* the situation is shown in writing and read aloud; preparation
  countdown; speaking countdown with recording; then the model. Reuse the
  `QuickQuestions` timer by giving it optional props (`prepSeconds`,
  `answerSeconds`, `roundSize`, `showText`) whose defaults keep today's
  behaviour, so `unplannedQuestions` do not change.
- *Saving:* like `source-practice`, opening the step is enough to complete it.
  Recordings stay in the browser (the same limit as backlog item 4). No new
  API or database field.
- *Which lectures:* 23-51. Dialogue parts in 23-27, 31, 32, 35, 37, 38, 39, 41,
  42, 45, 48, 49, 50; prompt sets in 28-31, 33-40, 42-51.

**Validator (`scripts/validate-content.py`) for the new kind:** unique part and
prompt ids; voices only Alex, Elin, Henrik, Maja; `seconds` 5-40,
`readSeconds` 10-20, `prepSeconds`/`speakSeconds` 10-120 (the content stores
the seconds actually used, including the longer Chapter 7-8 times, so no code
checks a chapter or lecture number); every learner turn
has at least one model, and each model fits its time (about 2 words a second);
a `react` set has at least 5 prompts; `bookRef` page numbers fall inside the
theme ranges in section 2.1.

### 5.4 Lecture 52 and the mock

**Decision (October 3, 2026, during the build):** Lecture 52 is a standard
seven-step lecture, not the legacy `yki-mock` route (untested with the current
presentation and in need of validator exceptions). Its `yki-speaking` step holds
a full speaking mock at exam timings (Berätta, two dialogues, five Reagera
situations, Din åsikt); listening, reading and writing follow Classroom items
37-39 with original texts. The text below records the original proposal.


- Use the existing route; add set C to `content/yki-mocks.json` (shape
  `YkiMockSet`, `totalMinutes: 60`, original texts). No type change.
- The validator today demands standard-lecture fields from every lecture
  (conversation-first, `missionPlan`, six unplanned questions, writing
  `wordRange` …). **First** render archived set A in a scratch lecture to see
  what the `yki-mock` route shows under the current presentation. **Then** add
  one profile-aware branch: a `yki-mock` lecture needs a resolvable
  `ykiMockId` and is exempt from the fields its route never shows. Never branch
  on the lecture number.

### 5.5 Other shared changes

- **Glossary** (`content/grammar-terms.json`), added with the first lecture
  that needs them:

  | Lecture | New id | Example |
  |---:|---|---|
  | 24 | `particle-verb` | komma ihåg, flytta ihop, ta hand om, följa med |
  | 24 | `conditional` | skulle kunna vara, skulle vilja, det vore |
  | 25 | `s-verb` | Vi hörs / ses; later passive: kan inte stängas, levereras |
  | 30 | `relative-pronoun` | som, vilket |
  | 31 | `correlative-conjunction` | både … och, varken … eller, antingen … eller |
  | 32 | `participle` | bifogad/bifogat/bifogade, begagnad, inbjuden |
  | 32 | `indirect-question` | Vet du var den ligger? Kan du berätta vilka som passar? |

- **`content/modules.json`:** add each chapter (section 4.2) with its first
  lecture; extend `titles` to 52; set `level` A2 or B1.
- **Audit:** add rows to `scripts/fixtures/lecture-audit-plan.json` (number,
  date, book pages as pointers, 7 steps; Lecture 52: the mock profile's 6) and
  teach `scripts/ui-audit.mjs` to walk the new step's parts and stages.
- **Docs:** describe the kind in `site/docs/lecture-template.md`.
- **Not proposed:** no change to `unplannedQuestions` or the mission; no use of
  the legacy `yki-workshop` profile (untested with the current presentation
  and not needed); no lecture-number branches anywhere.

---

## 6. Level and input

### 6.1 The gap

The book targets mellannivå (levels 3-4, about B1-B2). After Lecture 22 the
learner is about A2. Citizenship needs level 3. The teacher's own rubric names
the step: "Ensure level 3 (B1): add background information + subjunctions"
(items 18-19). Phase 1 already taught the tools: perfect tense, subordinate
clauses (Lecture 19), past help verbs, comparison and *å ena sidan … å andra
sidan* (Lecture 20).

### 6.2 How each lecture bridges it

| Gap | Bridge |
|---|---|
| B1 task, A2 learner | Every learner turn and prompt has a short A2-safe model and, where useful, a fuller B1 model. |
| Time pressure | First run untimed with text; second run at exam time (6.3). |
| Missing words | The teacher's phrase banks as `phrases`/`frames`: ending a call (2585-2593), news reactions (2779-2800), advice (2943-2948), polite refusal (3252-3270), opinion (3341-3362, 4256-4285), complaints (3561-3576). |
| Structure | Recipes in teaching and `missionPlan`: informal text in six parts (2614-2621); formal email (2641-2671); compliment + question + compliment (3215); apology + reason + suggestion (3186-3198); complaint in six steps (3513-3523); opinion in three parts (3341-3362); ad (3712-3731); application (4629-4642). |
| Rubric | The teacher's rubric checks in `points` and `successChecks`, in plain English. |
| English load | Swedish first, one short English note per idea (continues phase 1's rule from Lecture 15). Full English only for new grammar words. |

The teacher's YKI rules, shown in the step's `rules` and taught in Lecture 23
and 25:

1. Answer within the time limit (line 2777).
2. Use different words from the prompt; be more specific than the instruction
   (2777, 3156-3157).
3. Answer what the prompt asks (2777).
4. Berätta: a narrative in the past tense; you need not answer every guiding
   question or keep their order; compare then and now, home country and Finland
   (3313-3318).
5. Inventing details is fine ("inventing stories for extra fluff", 2887).
6. Formal texts love numbers and facts; use ni and your full name (2636-2639,
   2660).

### 6.3 Timing ladder

| Chapters | Reagera (prep + speak) | Berätta | Din åsikt | Dialogue turns |
|---|---|---|---|---|
| 7-8 | 30 s + 35 s | 60 s + 90 s | 60 s + 120 s | printed/assigned seconds + 50% |
| 9-13 | 20 s + 25 s | 60 s + 60 s | 60 s + 90 s | printed/assigned seconds (10-25 s) |
| 14 | 20 s + 25 s | 60 s + 90 s (official practice page) | 60 s + 120 s (Finnish practice page) | exam |

The teacher's timings are the default; Chapter 14 adds the longer official
practice-page timings as a stretch (open question 3).

### 6.4 Input

`site/docs/input-plan.md` asks for 2,000+ Swedish words per lecture from
Lecture 25, a longest listening of 3-5 minutes, and 3 easy stories.

| Part | Swedish words (estimate) |
|---|---:|
| Story dialogue | 130-180 |
| `yki-speaking` step (situations, partner lines, models) | 600-1,000 |
| Teaching examples and activities | 350-500 |
| Listening text (original) | 300-450 |
| Reading text (original, YKI text type) | 250-400 |
| Writing model | 50-150 |
| Word bank examples, guided, checkpoint | 300-450 |
| **Total** | **about 2,000-3,100** |

- **Fits:** Chapters 7-9 aim for 2,000-2,500; Chapters 10-14 for
  2,300-3,000. Count the same way as phase 1 and record it in
  `docs/mapping.md`.
- **Longest listening:** an original 350-450-word listening text is about 3-4
  minutes at a natural pace. The Classroom *Nyheter* links add real
  Finland-Swedish news.
- **Not met:** three easy stories per lecture. The `stories` kind (backlog
  item 1) does not exist; the dialogue models are the closest input. Build
  that kind first if the owner wants the target met.
- **Label mismatch:** the input plan calls the 25+ stage "Toward YKI basic
  (A2)", but the goal is the intermediate test. Rename it when that file is
  next edited.

---

## 7. Build order and checklist

### 7.1 Batches

| Batch | Work | Owner check |
|---:|---|---|
| 0 | Shared work: the `yki-speaking` kind (types, renderer, `ExtraStep.tsx`, `QuickQuestions` props, validator, audit, `lecture-template.md`); glossary ids for Lectures 23-24; Chapter 7 in `modules.json`; the image decision (open question 1) | Reviews the new step on Lecture 23 |
| 1 | Lecture 23 (pilot) | Laptop and phone: does it feel like Lectures 1-22, and is the step clear? |
| 2 | Lectures 24-27 (Chapter 7) | Chapter review |
| 3 | Lectures 28-30 (Chapter 8) | Chapter review |
| 4 | Lectures 31-34 (Chapter 9) | Chapter review |
| 5 | Lectures 35-37 (Chapter 10) | Chapter review |
| 6 | Lectures 38-40 (Chapter 11) | Chapter review |
| 7 | Lectures 41-44 (Chapter 12) | Chapter review |
| 8 | Lectures 45-48 (Chapter 13) | Chapter review |
| 9 | Lectures 49-51, then Lecture 52 (mock set C and the validator branch, 5.4) | Final review |

### 7.2 Workflow changes from `docs/lecture-build-plan.md` section 4

- **Read** the lesson's exact lines, the book pages it points to (rendered to a
  scratch folder, 7.4), and the Classroom item files (`.md`,
  `_Google_Form.md`).
- **Write** `extraSteps: [{ "id": "yki-tasks", "after": "recall", "kind":
  "yki-speaking", … }]` instead of `source-practice`. Every part is original;
  `bookRef` is a pointer.
- **Keep** everything else: conversation-first presentation, an English-month
  hero date (for example "10 JUNE 2026"), two meaning checks, two sittings
  (`sittingBreakAfter: "guided"`), 6 unplanned questions, 8 review phrases, a
  typed checkpoint item, a mission plan.

### 7.3 Verify per lecture

- [ ] **Teacher boundary:** every topic in the lesson's lines appears in a
      section, the step, the mission, or a noted decision in `docs/mapping.md`.
- [ ] **Book pointers:** each referenced page rendered and checked: page
      number, item numbers or letters, task type. Edition wording differences
      recorded.
- [ ] **Originality:** the overlap check (7.4) finds no 8-word sequence shared
      with the book. No Classroom form question copied.
- [ ] **Classroom:** the item's skill is practised with new material; audio
      links open (note the date checked).
- [ ] **YKI type and timing** match sections 2.4 and 6.3.
- [ ] **Swedish:** the lecture's "Fix" lines corrected; every line reviewed;
      doubtful lines logged for native-speaker review.
- [ ] **Input** counted and recorded.
- [ ] **Gates:** `npm run content:index`, `npm run check`, `npm run build`;
      browser at 1440×900 and 390×844; Azure: partner voices, one timed run with
      transcription, one writing feedback, one pronunciation score; audit
      fixture row added.
- [ ] **Records:** design note in `docs/mapping.md`; `AGENTS.md` status and
      backlog; push to `main`.

### 7.4 Commands

Run from the repository root. `pymupdf` must be installed outside the repo (a
virtualenv or a scratch folder on `PYTHONPATH`). Set `SCR` to a scratch folder
outside the repository.

**Book text with page markers, watermark removed:**

```bash
SCR=/path/to/scratch python3 - <<'EOF'
import os, pymupdf
pdf = "docs/e-kirja-Forbered-dig-for-allman-sprakexamen-QR-16.02.2025-yyyiif (1).pdf"
with open(os.environ["SCR"] + "/book.txt", "w") as out:
    for i, page in enumerate(pymupdf.open(pdf)):
        text = "\n".join(l for l in page.get_text().splitlines() if "Omistaja" not in l)
        out.write(f"=== PDF PAGE {i + 1} ===\n{text}\n")
EOF
```

**Render one page to check it (scratch only), watermark redacted:**

```bash
SCR=/path/to/scratch PAGE=41 python3 - <<'EOF'
import os, pymupdf
pdf = "docs/e-kirja-Forbered-dig-for-allman-sprakexamen-QR-16.02.2025-yyyiif (1).pdf"
n = int(os.environ["PAGE"])
page = pymupdf.open(pdf)[n - 1]
for block in page.get_text("blocks"):
    if "Omistaja" in block[4]:
        page.add_redact_annot(pymupdf.Rect(block[:4]), fill=(1, 1, 1))
page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)
page.get_pixmap(dpi=110).save(f"{os.environ['SCR']}/yki-p{n:03d}.png")
EOF
```

Open the PNG and confirm the bottom line shows no name or email.

**Originality check (8-word overlap with the book):**

```bash
python3 - "$SCR/book.txt" site/content/lectures/lecture-24.json <<'EOF'
import json, re, sys
norm = lambda s: re.findall(r"[a-zåäöé]+", s.lower())
book = norm(open(sys.argv[1]).read())
grams = {tuple(book[i:i + 8]) for i in range(len(book) - 7)}
def strings(x):
    if isinstance(x, str): yield x
    elif isinstance(x, dict):
        for v in x.values(): yield from strings(v)
    elif isinstance(x, list):
        for v in x: yield from strings(v)
hits = set()
for s in strings(json.load(open(sys.argv[2]))):
    w = norm(s)
    hits |= {" ".join(w[i:i + 8]) for i in range(len(w) - 7) if tuple(w[i:i + 8]) in grams}
print("\n".join(sorted(hits)) or "no 8-word overlap with the book")
EOF
```

(Tested: it reports nothing for Lecture 22 and flags a copied book p13 line.)

**Page images in the app:** none by default. Only if the owner approves (open
question 1): render the *task* page (not the MODELL page) with the redaction
command above, save it as
`site/public/images/source/yki-lecture-NN-page-PPP.png`, check that no name or
email is visible, and add `image` to the part.

---

## 8. Open questions for the owner

**Decided on October 3, 2026** (the owner asked for decisions without waiting):
1 no page images in the app; the step names the book page. 2 Lecture 52 is
added. 3 the teacher's timings, with the longer official practice timings in
Chapter 14 only. 4 Lecture 52 stays mapped to Classroom items 37-39 until
notes for August 24-26 appear. 5 themes 2-7 link the Classroom Yle news
episodes; the book's SoundCloud QR links are not added.

The questions as first asked:

1. **Book page images.** The book forbids copying and scanning, and every page
   carries your name and email. Decision for now: no page images; the step
   names the page and you open your own e-book. Do you want watermark-free task
   pages shown in the app (the preview is public)?
2. **Lecture 52.** OK to add a mock exam lecture after Lesson 51? (Default: yes.)
3. **Timing.** Train the teacher's timings (Berätta 1 minute, Din åsikt 1½
   minutes), with the longer official practice-page timings only in Chapter 14?
   (Default: yes.)
4. **Missing lessons.** The notes stop on August 21, but the mocks were posted
   August 24-26. If the teacher has notes for those days, Lecture 52 should be
   re-mapped.
5. **Audio links.** Only theme 1's SoundCloud link is in the notes. Themes 2-7
   are QR codes in the book; the builder (or you, with a phone) adds them per
   chapter.
