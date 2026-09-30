# Build plan: Lectures 3-22 (the textbook phase)

This is the working plan for an AI agent (or a person) building the rest of the
textbook phase of Stigen on the owner's laptop. It turns the mapping in
`docs/mapping.md` ("Planned mapping: Lectures 3-22") into concrete work.

**Authority.** On September 30, 2026 the owner asked for this plan so an agent
can build Lectures 3-22 locally. That request is the "owner asks" that
`AGENTS.md` requires before a lecture is activated. Build **one lecture at a
time**, in order, and activate a lecture only when it passes the definition of
done (section 5).

**How to start a session.** Give the agent this prompt:

> Read `AGENTS.md`, then `docs/lecture-build-plan.md`. Build Lecture N exactly
> as its section in the plan describes, following the workflow in section 4.
> Stop and ask me if a source contradicts the plan.

---

## 1. Read these first (every session)

| File | Why |
|---|---|
| `AGENTS.md` | Rules, content model, route, Azure facts, known weaknesses |
| `docs/mapping.md` | Lesson-to-page-to-homework plan and the ambiguities list |
| `site/docs/lecture-template.md` | Every lecture field and how each renders |
| `site/docs/textbook-page-map.md` | What each textbook page teaches and how to handle its cast |
| `site/docs/character-mapping.md` | Alex, Elin, Henrik, Maja and the gate for any new character |
| `site/docs/input-plan.md` | How much Swedish each lecture must contain |
| `site/docs/voice-casting.md` | Which voice speaks which character |
| `site/content/lectures/lecture-02.json` | **The reference lecture.** Copy its structure, not its content |

Then read only the sources for the lecture being built: its line range in
`docs/Group 3.md`, its page images in `docs/text-book-images/`, and its
homework files in `docs/excercise/` (the `_Google_Form.md` file holds the
questions).

---

## 2. Rules that apply to every lecture

1. **One teacher lesson = one lecture.** Keep the teacher's order, even when
   it jumps around the book (Lessons 6-9).
2. **Content only.** A lecture is one JSON file. Never branch on the lecture
   number in shared code. If a lecture truly needs new behaviour, add an
   optional content field or a new activity/step kind (see `AGENTS.md` section
   5) and document it in `site/docs/lecture-template.md`.
3. **Swedish must be correct and natural.** It is the model the learner copies.
   Prefer the teacher's own example sentences. When unsure, choose the simpler
   sentence. Record any doubtful line in `docs/mapping.md` for the teacher to
   check (known weakness 9).
4. **Original story, real textbook page.** The Elin-Alex dialogue and all
   exercises are original. The textbook step shows the real page image and its
   short dialogue lines, as Lectures 1-2 do. Keep the textbook's own names
   (Nora, Maria, Peter…) inside the textbook step only; never bring the
   textbook's affair and family plot into the story cast.
5. **Homework is evidence, not content.** Use each Classroom form to learn
   what the teacher expects the learner to master. Write new questions that
   test the same thing. Do not copy the form's items.
6. **English support.** Keep the full plain-English explanations for Lectures
   3-8 (owner's decision). From Lecture 9, shorten `body` text: one idea per
   paragraph, no repeated explanations. From Lecture 15, put the Swedish example
   first and the English note second.
7. **Grammar words.** Every new grammar word gets an entry in
   `site/content/grammar-terms.json` (plain explanation, English example,
   Swedish example, aliases) and is listed in the lecture's `grammarTerms`.
8. **Recycling.** Each lecture's dialogue and writing task reuse at least three
   chunks from earlier lectures. The warm-up already pulls earlier
   `reviewPhrases`; make sure each lecture's phrases are worth recalling later.
9. **Production in every check.** At least one `checkpoint` item per lecture
   asks the learner to type the Swedish (answers list the accepted versions).
10. **Secrets and data.** Never commit keys or `site/data/progress.db*`. Revert
    `site/next-env.d.ts` before committing.

---

## 3. Shared work to do once (before or with Lecture 3)

### 3.1 Chapters in `site/content/modules.json`

Add each chapter when its first lecture is built. Extend `last` as lectures
land, and add one title per lecture to `titles` (the array index is the
lecture number minus one). `level` sets the lecture's level everywhere.

| Chapter | Title (suggested) | Lectures | Level |
|---:|---|---|---|
| 1 | Your first Swedish conversation (exists) | 1-5 | A0 |
| 2 | The past and many things | 6-8 | A1 |
| 3 | Everyday life | 9-10 | A1 |
| 4 | Plans, rules and complaints | 11-14 | A1 |
| 5 | Mine, yours and the future | 15-16 | A2 |
| 6 | Experience, school, work and home | 17-22 | A2 |

Also update each chapter's `outcome`, `description` and `vocabularyTargets`
(active, recognition, functional, recycled), in the style of Chapter 1.

### 3.2 Grammar glossary additions

Existing ids: noun, verb, subject, object, pronoun, adjective,
singular-plural, question-word, word-order, verb-second, yes-no-question,
compound-word, formal-informal, spoken-form, vowel, consonant, front-vowel,
back-vowel, syllable, stress, dialect, loanword, chunk.

Add these when the lecture that first needs them is built:

| Lecture | New ids |
|---:|---|
| 3 | `present-tense`, `infinitive`, `imperative`, `modal-verb` (help verb), `negation`, `adverb` |
| 4 | `gender` (en/ett words), `article` |
| 5 | `conjunction`, `definite-form`, `agreement` (adjective follows the noun) |
| 6 | `past-tense`, `regular-irregular` (weak and strong verbs) |
| 7 | `plural-group` |
| 10 | `ordinal-number` |
| 11 | `object-pronoun` |
| 12 | `comparative`, `superlative` |
| 15 | `possessive`, `reflexive` |
| 16 | `future` |
| 17 | `present-perfect`, `supine` |
| 18 | `main-clause` |
| 19 | `subordinate-clause` (after a subjunction) |

### 3.3 Growing numbers per lecture

| Lectures | Swedish words in the lecture (input plan) | Writing `wordRange` | Speaking mission length |
|---|---:|---|---|
| 3-4 | 250-600 | about 20-45 | 4-5 lines |
| 5-12 | 600-1,200 | about 30-70 | 5-7 lines |
| 13-22 | 1,200-2,000 | about 50-100 | 6-8 lines, one opinion with a reason |

Count Swedish words the same way every time (all Swedish the learner meets:
dialogue, textbook lines, examples, listening, reading). Record the count in
`docs/mapping.md`.

### 3.4 Validator additions (optional, recommended)

In `site/scripts/validate-content.py`, add checks that every lecture has:
`reviewPhrases` (6-10), `unplannedQuestions` (at least 6), `missionPlan`,
`sittingBreakAfter`, `practice.writing.points` and `wordRange`,
`route.requiredSkills` containing speaking and writing, and at least one
typed-production checkpoint item (a question without `options`). Add them
before Lecture 3 so every new lecture is held to the template.

---

## 4. Workflow for one lecture

1. **Branch.** `git switch main && git pull`, then `git switch -c lecture-NN`.
2. **Read the sources** listed in the lecture's section below. Confirm the
   pages match the teacher's topics. If they do not, stop and write the
   finding into `docs/mapping.md`, then ask the owner.
3. **Write a short design note** in `docs/mapping.md` under a new heading
   "Lecture NN": source boundary (line range, pages, homework), a concept map
   (teacher content → where it appears in the lecture), and accuracy decisions.
   Lectures 1 and 2 have examples of both.
4. **Create `site/content/lectures/lecture-NN.json`** by copying the structure
   of `lecture-02.json`, then replacing every value. Required parts:
   - `number`, `routeProfile: "standard"`, `objectives` (3-4 can-do lines),
     `focusSkills`, `grammarTerms`.
   - `presentation`: only the route labels and opening note the lecture needs.
     Omit fields that would just copy Lecture 2.
   - `recall`: two meaning checks about the opening dialogue.
   - `dialogue`: the Elin-Alex (and Henrik or Maja) story scene, 8-14 lines,
     continuing the story from the previous lecture.
   - `extraSteps`: one `source-practice` step with the lecture's pages (see the
     lecture section). Each page needs `image`, `lines` (speaker, voice,
     Swedish, English, glossary), `listenQuestions`, `naturalNotes`,
     `backchain`, `recallCues` (same count as lines), and `hunt` where the page
     marks words in colour. Use the page images to transcribe lines exactly.
   - `sections`: one teaching section per teacher topic, each with `body`,
     `examples`, optional `table`, `memoryTip`/`tryIt`, and at least one
     activity (`sort`, `match`, `question-gap`, or `sound-map`).
   - `guided`: 5-8 build-the-line items, including one that targets the
     lecture's most common mistake.
   - `sittingBreakAfter: "guided"`.
   - `missionPlan`: sentence frames for the speaking mission.
   - `practice`: `words` (15-35), `pronunciation`, `listening`, `reading`,
     `speaking`, `writing` (with `situation`, `points`, `wordRange`, `help`,
     `model`).
   - `route`: `expectedOutput` (speaking, then writing), `transferPrompt`,
     `returnPrompt`, `successChecks`, `primarySkill: "speaking"`,
     `requiredSkills: ["speaking", "writing"]`.
   - `unplannedQuestions` (6), `reviewPhrases` (8), `checkpoint` (3-5, at least
     one typed), `assignment`, `takeaways`, `resources`.
5. **Glossary and chapter.** Add the grammar ids (3.2) and the chapter or
   title (3.1).
6. **Build and check** from `site/`:
   `npm run content:index && npm run check && npm run build`.
7. **Look at it in a browser** (restart `npm run dev` after the build). Walk
   every step at 1440x900 and 390x844: nothing scrolls sideways, every activity
   completes, the textbook step shows the right page, both missions save, and
   the route reaches "Take it forward". Check that the new grammar words are
   underlined.
8. **Test with Azure** (keys in `site/.env`): play the dialogue (every line,
   right voices), play each textbook line, score one phrase with pronunciation
   scoring, get AI feedback on the writing task, and try the live coach once.
   Write down anything that could not be tested.
9. **Record.** Update `docs/mapping.md` (design note, word count), `AGENTS.md`
   (scope line, status, backlog) and `README.md` if it lists lectures.
10. **Ship.** `git checkout -- site/next-env.d.ts`, commit ("Add Lecture NN:
    <title>"), `git push -u origin lecture-NN`, then fast-forward `main`
    (`git switch main && git merge --ff-only lecture-NN && git push`). If
    `main` moved, merge it into the branch first. Never force-push `main`.

---

## 5. Definition of done (per lecture)

- [ ] Every teacher topic in the lesson's line range appears in a section, the
      textbook step, or a noted decision in `docs/mapping.md`.
- [ ] The textbook step uses exactly the mapped pages.
- [ ] The homework skills are practised (guided or checkpoint items).
- [ ] Swedish reviewed line by line; doubtful lines listed for the teacher.
- [ ] Input word count inside the target (3.3).
- [ ] Speaking and writing missions both save; the route completes.
- [ ] `npm run check` and `npm run build` pass.
- [ ] Browser check at both widths; Azure checks done or listed as untested.
- [ ] `docs/mapping.md` and `AGENTS.md` updated; pushed to `main`.

---

## 6. Lecture by lecture

Line ranges refer to `docs/Group 3.md`. Pages are physical textbook pages
(`docs/text-book-images/page-0NN.png`). Homework numbers refer to
`docs/excercise/`. Swedish seed lines below come from the teacher's notes or are
simple standard Swedish; still check each one before use.

### Chapter 1: Your first Swedish conversation (A0)

#### Lecture 3: What you do, what you can, what you don't (Lesson 3, Apr 20)

- **Sources:** lines 218-393; pages 7 *Du ska sitta!*, 8 *Jag kan inte plugga
  mer!*; homework 2 Hjälpverb 1, 3 Infinitive or present, 4 Command form,
  5 Word order.
- **Can-do:** say what you do now and what you can, want to, must or will do;
  say what you do not do; give a simple instruction; keep the verb second.
- **Sections:**
  1. Three verb forms (present -r, command, infinitive): the teacher's
     ar/er/r table with gilla, tala, köpa, ringa, må. Activity: `sort` verbs
     into present / command / infinitive.
  2. Help verbs kan, vill, måste, ska (+ hinner, orkar) take the infinitive.
     Activity: `match` help verb → meaning, then say a sentence.
  3. *Inte* goes after the first verb. Activity: `sort` where *inte* goes.
  4. Word order: the verb is always second (teacher's position table).
     Activity: `sort` or a build-the-line guided item with time words first
     (*Idag bakar min mamma en kaka.*).
- **Story:** Alex has a Swedish exam tomorrow and is tired; Elin gives advice
  and orders (*Plugga lite till! Sov nu!*). Maja can appear as the student who
  cannot study more (page 8's situation, original lines).
- **Speaking mission:** tell Elin three things you can do, one you want to do,
  one you must do, and one you do not do this week.
- **Writing:** a text message to a friend: why you cannot meet tonight (must
  study, are tired), and what you can do instead. `wordRange` 20-40.
- **Review seeds:** Jag kan inte i dag. / Jag måste plugga. / Jag vill ha
  kaffe. / Jag orkar inte. / Tala långsamt, snälla! / I dag ska jag träna.
- **Watch-outs:** *Jag är pluggar* is wrong (teacher's own warning);
  infinitive exceptions bo, må; *vara → är → var!*.

#### Lecture 4: Things, work and free time (Lesson 4, Apr 22)

- **Sources:** lines 394-511; pages 9 (birthday wish list), 10 (*ett*-word
  list), 11 *Jobb*, 12 *Fritid*; teacher task "What do you do in your free
  time?"
- **Can-do:** use en/ett correctly for common things; say what you work as and
  where; say what you usually do in your free time.
- **Sections:**
  1. En and ett (80% are en; people are en; a compound word takes the gender
     of its last part: *ett datorspel*). Activity: `sort` en/ett with the page-10
     list.
  2. Work: *jobbar som + job* (no article), *jobbar på + place*, *hemifrån*,
     *på distans*. Activity: `match` job → workplace, then say it.
  3. Free time and *brukar* for habits; time phrases (*på helgen, på kvällen,
     då och då*). Activity: `question-gap` asking Maja/Elin about their week.
- **Story:** Elin asks Alex about his job; Alex asks about Elin's weekend.
- **Speaking mission:** introduce your job and your free time (5 lines).
- **Writing:** a profile for a language-exchange website: job, workplace, two
  free-time habits, one wish. `wordRange` 25-45.
- **Review seeds:** Jag jobbar som … / Jag jobbar på ett företag. / Jag jobbar
  hemifrån. / På helgen brukar jag … / Jag läser en bok. / ett jobb, en dator.
- **Watch-outs:** no article after *som* (*Jag jobbar som lärare*).

#### Lecture 5: My dream, linking ideas, "the" and describing (Lesson 5, Apr 24)

- **Sources:** lines 512-632; pages 13 *Min dröm*, 15 *En rolig film, ett
  roligt jobb* (page 14 is a divider); homework 6 Definite form of nouns.
- **Can-do:** talk about a dream and interests; link ideas with och, men, så,
  eller, för, sedan; say "the" (boken, huset); describe with adjectives that
  agree (en rolig bok, ett roligt jobb).
- **Sections:**
  1. My dream (*intresserad av, vill bli, byta jobb*).
  2. Linking words (teacher's list and examples). Activity: `match` two halves
     of a sentence.
  3. Definite form: en bok → boken, ett hus → huset, en kvinna → kvinnan,
     ett äpple → äpplet; *skolan, jobbet* almost always definite. Activity:
     `sort` by ending.
  4. Adjectives follow the noun: -t for ett words; *liten/litet*; *lite* is not
     *liten*. Activity: `sort` rolig/roligt.
- **Story:** Maja tells Elin about her dream job; Alex says what he is
  interested in.
- **Speaking mission:** your dream in 5-6 linked sentences (use men, så, för).
- **Writing:** reply to a friend's question "Vad drömmer du om?" with your
  dream, why, and one thing you will try. `wordRange` 30-55.
- **Chapter note:** after this lecture, Chapter 1 is complete; update its
  `outcome` and `vocabularyTargets`.

### Chapter 2: The past and many things (A1)

#### Lecture 6: What happened? The past tense (Lesson 6, Apr 27)

- **Sources:** lines 633-730; pages 16 *Vilka fantastiska nyheter!*,
  17 *Hur var det på festen?*, 18 strong-verb list; homework 7 Preteritum
  (regular verbs), 8 Diary (recurring).
- **Can-do:** tell what you did yesterday with regular past forms (-ade, -de,
  -te, -dde) and the common strong verbs; react to news.
- **Sections:** past-tense groups (teacher's table); the common irregular
  verbs to learn first, taken from the page-18 list (for example var, hade,
  åt, drack, gick, sov); reacting to news (*Vad
  roligt! Grattis!*); *hem* vs *hemma*.
- **Story:** Maja passed an exam (good news); Alex asks Elin how the party was.
- **Speaking mission:** tell what you did yesterday, from morning to evening.
- **Writing:** the first diary entry (the teacher's recurring task): yesterday
  in 5-7 sentences. `wordRange` 35-60.
- **Extra:** mention in `assignment` that the diary continues every day
  (5-10 minutes), as the teacher asked.

#### Lecture 7: One car, two cars: plurals (Lesson 7, Apr 29)

- **Sources:** lines 731-835; pages 22 *Blommor och flaskor vin*, 23 *En bil,
  två bilar* (page 21 is a divider); homework 9 Noun plural.
- **Can-do:** make the plural of any noun in the five groups and count things
  (*många* for countable, *mycket* for uncountable).
- **Sections:** the teacher's five-group table and her clues: group 1 en words
  ending in -a → -or; group 2 short concrete words, -e or -ing endings → -ar;
  group 3 foreign words → -er (plus her exceptions: saker, katter, chefer,
  vänner, museer); group 4 ett words ending in a vowel → -n; group 5 ett words
  ending in a consonant (and en words for jobs and origins such as lärare) →
  no ending. Activity: `sort` nouns into the five groups.
- **Story:** Alex buys flowers and a bottle of wine for a dinner at Elin's.
- **Speaking mission:** say what you have at home (plural things and numbers).
- **Writing:** a shopping list with a short message to a flatmate. `wordRange`
  30-55.
- **Watch-out:** keep the teacher's exact groups and exceptions; do not invent
  rules beyond her notes. Pages 24-25 (groups 4-5 in the book) come in
  Lecture 9 as practice.

#### Lecture 8: Diary and good friends (Lesson 8, May 4)

- **Sources:** lines 836-962; pages 19 *Dagbok*, 20 *Det är viktigt att ha
  bra vänner* (page 18 again for strong verbs); no Classroom homework (diary
  continues).
- **Can-do:** narrate a past day in order (*först, sedan, efter det*); write a
  short informal letter to a friend.
- **Sections:** past-tense practice with time words first (verb second:
  *Förra veckan läste vi en bok.*); the structure of an informal letter
  (greeting, news, question, closing); *det handlar om*.
- **Textbook note:** page 19 is part of the affair plot: use it only as a
  diary-form model inside the textbook step, with its own names.
- **Story:** Elin writes to Alex about her week; Alex answers.
- **Speaking mission:** tell a friend about last weekend.
- **Writing:** an informal letter to a friend about your week (greeting, two
  events, a question, closing). `wordRange` 40-70.

### Chapter 3: Everyday life (A1)

#### Lecture 9: Health, pets and shopping (Lesson 9, May 8)

- **Sources:** lines 963-1109; pages 24 *Du är frisk!*, 25 *Många djur, många
  problem*, 26 *Det är spännande att spendera pengar!*; no Classroom homework.
- **Can-do:** say how you feel when ill (*Jag är förkyld, jag har feber*);
  practise plural groups 4-5 again (pages 24-25); use plural and definite adjectives (*nya
  skor, den nya jackan*); name clothes.
- **Sections:** at the doctor; plural review (groups 4-5 from the pages); adjectives in plural and
  definite form (teacher's table); clothes.
- **Heavy lesson:** use two sittings. Put clothes in the textbook step and
  word bank rather than a full section if the lecture gets too long.
- **Story:** Alex is ill; Elin takes him shopping when he is better.
- **Speaking mission:** at the doctor: symptoms, since when, what you did.
- **Writing:** message to your manager: you are ill today, your symptoms, when
  you hope to be back. `wordRange` 40-70.

#### Lecture 10: Food, numbers, family and weather (Lesson 10, May 11)

- **Sources:** lines 1110-1266; pages 27 *Inköpslista*, 28 *Familjen*,
  29 numbers, 30 *Jag blev kär i…*, 31 *Vad har ni för väder?*; no Classroom
  homework.
- **Can-do:** shop for food with quantities and prices; count to 1,000; present
  your family with ages; tell the time; talk about the weather.
- **Sections:** food and quantities; numbers; family (build on Lecture 2);
  clock time and frequency; weather.
- **Heavy lesson:** five pages. Keep every topic but make weather and clock
  time short sections with one activity each.
- **Story:** Elin and Alex plan a picnic: shopping list, prices, weather
  check.
- **Speaking mission:** present your family (names, ages, where they live).
- **Writing:** a message to invite a friend to a picnic: day, time, what to
  bring, the weather forecast. `wordRange` 40-70.

### Chapter 4: Plans, rules and complaints (A1)

#### Lecture 11: The things, him and her (Lesson 11, May 13)

- **Sources:** lines 1267-1353; pages 33 *Skvaller*, 34 *Vill du gå på bio med
  mig?*, 29 (ordinals) (page 32 is a divider); homework 10 Definite plural of
  nouns, 11 Objektspronomen.
- **Can-do:** say "the" in plural (bilarna, äpplena, barnen); use object
  pronouns (mig, dig, honom, henne, oss, er, dem); give dates with ordinals
  (den tjugofjärde).
- **Sections:** definite plural (teacher's exercise list is a good model);
  object pronouns; ordinal numbers and dates; invitations (accept, decline,
  suggest).
- **Story:** Maja invites a classmate to the cinema; Elin models a polite no.
- **Speaking mission:** invite someone, agree a date and time.
- **Writing:** an invitation message with a date (ordinal) and a reply
  request. `wordRange` 40-70.

#### Lecture 12: Better, best, and the days of the week (Lesson 12, May 15)

- **Sources:** lines 1354-1514; pages 35 *Bättre än Barbie*, 36 special
  adjectives, 37 *Veckodagar*; homework 12 Komparation.
- **Can-do:** compare (dyr, dyrare, dyrast; mer intressant); use the irregular
  ones (bra, bättre, bäst…); say *på måndag / i måndags / på måndagar*.
- **Sections:** comparison with -are/-ast and mer/mest; irregular adjectives;
  weekdays with the three meanings (teacher's exercise is a strong model).
- **Story:** Elin and Maja compare two films; Alex compares his weekday
  routine.
- **Speaking mission:** compare two cities or two films, with reasons.
- **Writing:** a short review of a film or a café, comparing it with another.
  `wordRange` 50-80.

#### Lecture 13: Should, may, don't have to (Lesson 13, May 18)

- **Sources:** lines 1515-1566; page 38 *Jag kan inte sova!*; homework 13
  Hjälpverb 2.
- **Can-do:** use help verbs in the past (kunde, ville, skulle, brukade); give
  advice with *borde*; ask and give permission with *får*; say what is not
  necessary with *behöver inte*.
- **Sections:** help verbs past forms; borde (advice); får (permission, *får
  inte* = not allowed); måste vs behöver inte. Activity: `sort` rules
  (must / may / should / needn't).
- **Story:** Maja cannot sleep before an exam; Henrik and Elin give advice.
- **Speaking mission:** give a friend three pieces of advice about sleep or
  stress.
- **Writing:** reply to a friend who cannot sleep: two pieces of advice, one
  thing they must not do. `wordRange` 50-80.

#### Lecture 14: Complaints and directions (Lesson 14, May 20)

- **Sources:** lines 1567-1676; pages 39 *Klagomål*, 40 *Vägbeskrivning*;
  homework 14 Formal email: complaint, with `14_4_FORMELLT_BREV_KLAGOMAL.pdf`
  and the 7-criteria rubric `14_27_35_Writing_Rubric_7_criteria.md`.
- **Can-do:** write a formal complaint (greeting, problem, what you want,
  closing); give and follow directions (*gå rakt fram, sväng till vänster, på
  din högra sida*).
- **Sections:** help verbs 2 review; the formal letter's structure and fixed
  phrases (from the PDF, reworded); directions with imperatives.
- **Writing:** this lecture's writing task **is** the teacher's homework: a
  formal complaint (topics from homework 14). `wordRange` 60-100. Put the
  rubric's criteria into `points` and `successChecks` in plain English.
- **Speaking mission:** explain the way from the station to your home.
- **Idea:** this is the first YKI-shaped writing task; keep its points close to
  the rubric so AI feedback judges the same things.

### Chapter 5: Mine, yours and the future (A2)

#### Lecture 15: Mine, yours, his own (Lesson 15, May 22)

- **Sources:** lines 1677-1833; pages 42 *Din fru och hennes vän*, 43 *Något
  eget* (page 41 is a divider); homework 15 Possessiva pronomen.
- **Can-do:** use min/mitt/mina and the whole possessive system; choose
  *sin/sitt/sina* vs *hans/hennes/deras*; use reflexive verbs (*tvätta sig*);
  use *man* for people in general.
- **Sections:** possessives by gender and number (table); reflexive object
  pronouns; *sin* vs *hans* (the hardest point: build a `sort` with pairs);
  *man*.
- **Textbook note:** page 42 is the affair plot. Use the grammar, rewrite the
  context with the core cast in the teaching sections.
- **Story:** Alex and Elin sort out whose things are whose after a party.
- **Speaking mission:** describe your home and family things (min lägenhet,
  mitt rum, mina böcker, hans/hennes…).
- **Writing:** a message to a neighbour about a lost item: what it is, whose
  it is, where you last saw it. `wordRange` 50-90.

#### Lecture 16: Next year, and what you think (Lesson 16, May 25)

- **Sources:** lines 1834-1962; pages 44 *Nästa år…*, 45 *Tror du på mig?*;
  homework 16 SKA vs KOMMER ATT, 17 TYCKER vs TROR.
- **Can-do:** talk about the future four ways (present + time word, *ska*,
  *kommer att*, *tänker*); say what you think with *tycker* (opinion), *tror*
  (belief, guess) and *tänker* (plan, think about).
- **Sections:** the four futures with the teacher's rule for each (control vs
  prediction); tycker / tror / tänker. Activity: `sort` sentences by the right
  verb.
- **Story:** Elin and Alex plan next summer; Maja predicts her exam results.
- **Speaking mission:** your plans for next year and one prediction.
- **Writing:** a blog post "Nästa år": two plans, one prediction, one opinion.
  `wordRange` 60-100.

### Chapter 6: Experience, school, work and home (A2)

#### Lecture 17: Predictions, personality and "have you ever…?" (Lesson 17, May 27)

- **Sources:** lines 1963-2076; pages 46 *Vad kommer att hända nu?*, 48 *Har
  du varit i Sverige någon gång?*, 49 strong verbs with supine (page 47 is a
  divider); no Classroom homework.
- **Can-do:** describe personality (teacher's list); use the present perfect
  (*har varit, har bott, har ätit*) for experiences and duration.
- **Sections:** personality traits; present perfect (har + supine), with the
  page-49 list; *någon gång, aldrig, sedan, i … år*.
- **Story:** Henrik asks Alex which Nordic countries he has visited.
- **Speaking mission:** tell about a place you have been and how long you have
  lived in Finland.
- **Writing:** a message to a new colleague introducing yourself: personality,
  experience, how long you have lived here. `wordRange` 60-100.

#### Lecture 18: School, and joining sentences (Lesson 18, May 29)

- **Sources:** lines 2077-2175; page 50 *Skolan*; no Classroom homework.
- **Can-do:** talk about your school years; join main clauses with och, men,
  eller, så, för (independent linkers).
- **Sections:** the linkers and word order after them (normal order);
  school vocabulary and subjects.
- **Story:** Maja talks about her school; Alex compares school in India.
- **Speaking mission:** your school years in 6 linked sentences.
- **Writing:** a short text for a class blog: your school, a favourite
  subject, a teacher you remember. `wordRange` 60-100.

#### Lecture 19: Because, when, if: dependent clauses (Lesson 19, Jun 1)

- **Sources:** lines 2176-2258; page 50 again (no new page); no Classroom
  homework.
- **Can-do:** use att, när, om, eftersom, för att, trots att; put *inte* and
  adverbs before the verb after them (*…eftersom jag inte hade tid*).
- **Sections:** the subjunctions with the teacher's examples; word order in
  the dependent clause (subject first, *inte* before the verb); opinions about
  school (the teacher's discussion questions).
- **Textbook step:** revisit page 50 with new hunt items (the linkers), or
  omit the extra step for this lecture (allowed).
- **Speaking mission:** answer the teacher's discussion questions (*Gillade du
  skolan? Borde lärare vara stränga?*) with reasons.
- **Writing:** an opinion paragraph "Är det viktigt att barn trivs i skolan?"
  with two reasons. `wordRange` 70-110.

#### Lecture 20: Work-life balance and the restaurant (Lesson 20, Jun 3)

- **Sources:** lines 2259-2375; pages 51 *Jobbar du för mycket?*,
  52 *Balansen*, 53 *Restaurang*; teacher task: the UR Play video *Amira är
  här: Vegan* with questions, and "Gör pengar oss lyckliga?".
- **Can-do:** discuss work and stress (*å ena sidan … å andra sidan*); order in
  a restaurant, state dietary needs, ask for the bill.
- **Sections:** work vocabulary (lön, arbetsgivare, utbränd, sjukskriven,
  deltid); weighing two sides; restaurant phrases.
- **Resources:** link the UR Play video in `resources` with the teacher's four
  questions as a listening task.
- **Story:** Elin and Alex have dinner; Elin says she works too much.
- **Speaking mission:** order a meal with a dietary need and a complaint.
- **Writing:** "Gör pengar oss lyckliga?" in a short argued paragraph using
  *å ena sidan / å andra sidan*. `wordRange` 70-110.

#### Lecture 21: Home and environment (Lesson 21, Jun 5)

- **Sources:** lines 2376-2491; pages 54 *Boende*, 55 *Miljö*; teacher task:
  the videos and "prepare to talk about your ideal home".
- **Can-do:** describe where and how you live and what you need; talk about
  environmental choices and their causes (*på grund av, därför*); use
  *den här / denna*, *när det gäller*.
- **Sections:** housing words and needs; environment and cause/consequence;
  this/that; work-vocabulary review (the teacher's gap text as a model).
- **Story:** Alex looks for a new flat; Maja talks about recycling at school.
- **Speaking mission:** describe your home and one thing you would change.
- **Writing:** an answer to a flat advert: who you are, what you need, one
  question. `wordRange` 70-110.

#### Lecture 22: My ideal home, and my opinion (Lesson 22, Jun 8)

- **Sources:** lines 2492-2539; no textbook page (builds on 54); later
  reinforcement: homework 24 Opinion piece and
  `24_3_STRUKTUR_FOR_ARGUMENTERANDE_TEXT.pdf`.
- **Can-do:** describe your ideal home (*tillräckligt stort, delvis,
  mestadels*); write a short argumentative text (intro with *Många tycker
  att… Jag håller (inte) med*, two sides, conclusion).
- **Sections:** ideal-home speaking frames; the argumentative text structure
  (teacher's intro/body/conclusion with the city-life example as a model).
- **No extra step.** This lecture has no textbook page.
- **Speaking mission:** your ideal home, with two reasons.
- **Writing:** a short argumentative text: "Är det bättre att bo i stan eller
  på landet?" with both sides and your view. `wordRange` 80-120.
- **Phase end:** after this lecture, update `AGENTS.md` and
  `docs/mapping.md`: the textbook phase is complete; the next phase (Lessons
  23-51, the YKI book and Classroom items 18 onward) needs its own plan.

---

## 7. Suggested order of work and checkpoints with the owner

1. Shared work (section 3) plus Lecture 3. **Owner reviews on the laptop**
   before continuing: does the new lecture feel like Lectures 1-2?
2. Lectures 4-5 (Chapter 1 complete). Owner review.
3. One chapter at a time after that, with an owner review at the end of each
   chapter. Push each lecture to `main` as it is done, so progress is never lost.

## 8. Things that will go wrong (and what to do)

| Problem | Fix |
|---|---|
| A textbook line is hard to read on the image | Transcribe carefully; if unsure, leave the line out and note it |
| Dialogue audio fails for one lecture | An SSML element outside a `<voice>`; see the Azure facts in `AGENTS.md` |
| The dev server shows 500 after a build | Restart `npm run dev` |
| `site/next-env.d.ts` shows as changed | `git checkout -- site/next-env.d.ts` |
| Validator: "writing model is longer than its wordRange" | Shorten the model or widen the range |
| A lecture feels too long | Move one topic to the textbook step or the word bank; keep two sittings |
| A source contradicts this plan | Stop, write it in `docs/mapping.md`, ask the owner |
