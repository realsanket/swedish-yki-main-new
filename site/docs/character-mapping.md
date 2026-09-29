# Character mapping and introduction policy

This file prevents the Swedish course from growing a new permanent character
for every textbook dialogue. It maps **source functions**, not source identities.
The textbook remains reference material; Stigen's learner-facing scenes and
dialogue stay original.

## Decision

- **Use a Swedish-specific cast.** The earlier Finnish-course identities have
  been replaced by Elin and Henrik, while Alex remains the newcomer viewpoint.
  Their roles are now broad story functions rather than labels tied to one
  exercise.
- **Keep the live cast at Alex, Elin, and Henrik for Lecture 1.** No additional
  character is needed for greetings, a four-line introduction, or the first
  pronunciation work.
- **Do not import the textbook's full 13-person cast.** The large source cast
  supports a long family and relationship plot. Stigen does not need every
  source identity to teach the same language functions.
- **Plan for no more than five recurring Stigen characters across the wider
  course.** The archived `Sara` and `Leo` designs are candidates, not approved
  live characters. Restore either only when a verified future lesson passes the
  introduction gate below.
- **The likely next need is one student/teen viewpoint, not another adult
  household.** The full-book review repeatedly found school, exam, party,
  friendship, hobby, household-rule, future-study, and environment situations.
  Keep this role unnamed and inactive until verified teacher lessons require it
  across at least three Stigen episodes.
- Keep an episode's visible cast to **two or three characters** whenever
  possible. Relatives, sellers, doctors, interviewers, and other one-scene
  roles can remain unnamed or off-screen.

## Live Stigen cast

| Stigen character | Stable function | Source function covered now | Boundary |
|---|---|---|---|
| **Alex** | Newcomer viewpoint; learns Swedish for daily life in Finland and makes the first attempt | Tomas's beginner-speaker function in the opening dialogue | Do not turn Alex into a husband, parent, child, or unrelated professional merely to absorb a source role. |
| **Elin** | Local friend; creates natural reasons for everyday conversation | Anna's partner function; later she can cover ordinary friend-to-friend exchanges | Do not silently make Elin equivalent to Nora, Maria, Lena, or another source identity. |
| **Henrik** | Language coach; explains only what the learner needs before returning to use | Explains and models the pronunciation notes surrounding the Anna/Tomas dialogue | Keep Henrik outside family and romantic plotlines. |

For Lecture 1 the functional mapping is therefore:

```text
Anna + Tomas (source greeting pair)
            ↓ language function only
Elin + Alex (original Stigen conversation)
            +
Henrik (teacher explanation and sound coaching)
```

## Textbook cast mapped by teaching function

The page references below are physical PDF pages in
`docs/text-book-images/text-book.pdf`.

| Source character group | Source role and recurrence | Minimal Stigen handling | Add a recurring character now? |
|---|---|---|---|
| **Anna and Tomas** | Opening greeting and pronunciation pair on page 4; they are not the continuing story spine | Alex and Elin already cover the two-speaker function; Henrik covers explicit teaching | **No** - already mapped in Lecture 1 |
| **Nora and Maria** | The most frequent friend-to-friend pair; they carry everyday conversations and the Andreas reveal from page 5 onward | Elin can cover one peer role. Add one second peer only when a verified lesson needs a repeated two-friend relationship that Alex cannot naturally fill | **Not yet** |
| **Andreas and Lena** | Married couple and parents; needed for family, possessives, work, secrecy, and later consequences | Do not assign these relationships to Alex and Elin. For isolated grammar examples, mention an unnamed couple or family. Add a household pair only if the continuing relationship is deliberately adopted into Stigen's original story | **Not yet** |
| **Peter and Maria** | Second adult couple and parents; Peter also supports work, health, shopping, complaint, and environment scenes | Reuse one future adult/neighbor character for practical scenes. Do not create a second permanent couple solely because the source has one | **Not yet** |
| **Jonas and Nils** | Brothers used for toys, school, music, possessions, and future study | One future peer plus an off-screen sibling covers most functions. A second named sibling is justified only by a verified contrast that depends on two brothers | **Not yet** |
| **Sofia and Ingrid** | Teen student and mother; school, exams, parties, films, and friends | A future student/classmate can cover Sofia's function. The parent can remain “mamma” until repeated identity matters | **Not yet** |
| **Sara and Jenny** | Teen and young-child viewpoints; school, photography, football, and environment | Reuse the same future peer for teen scenes. A younger child can be an episodic speaker in the environment lesson without entering the permanent cast | **Not yet** |
| **Doctors, sellers, interviewers, service staff** | Situational roles rather than relationship anchors | Render as role labels such as `Läkare` or `Säljare`, or let Henrik model the exchange | **No** |

The source-frequency check supports this compression: Maria, Peter, Andreas,
Nora, Sofia, Sara, and Jonas recur often, while Anna and Tomas are primarily the
opening pair. Frequency alone does not authorize a Stigen character; a distinct
learner-facing relationship must also be necessary.

The page-by-page evidence for all 52 content pages is in
[`textbook-page-map.md`](textbook-page-map.md). The complete read found three
separate source structures:

| Source structure | Main pages | Stigen decision |
|---|---|---|
| Adult affair/reveal plot | 5, 19-20, 22, 33, 37, 42, 46, 53 | Do not reproduce it. Its grammar works with original neutral situations, while preserving it would require several distinct adults. |
| Two connected households | 7, 9, 13, 15, 23-28, 33-39, 42-43, 50-52, 55 | Use off-screen relatives, neutral family trees, and role labels unless a verified lesson needs recurring family continuity. |
| Youth/student viewpoints | 8-9, 12-13, 16-17, 23, 25, 28, 30, 34-35, 38-39, 43, 45, 50, 55 | This is the only strong candidate for one future recurring character. Do not choose a name, image, or voice yet. |

The source also contains continuity ambiguity. Page 39 says Peter bought a
laptop for Jonas, while pages 28 and 50 establish Andreas and Lena as Jonas's
parents; page 22 leaves Nora's date unnamed. Do not fill such gaps by silently
rewriting a Stigen character's relationships.

## Character introduction gate

A future character becomes live only when all of these are true:

1. The current teacher lesson and its exact textbook boundary have been
   verified.
2. The scene requires a stable relationship or viewpoint that Alex, Elin, and
   Henrik cannot express without contradicting who they already are.
3. The character is expected to recur in at least **three mapped episodes**, or
   the relationship itself is essential to the current chapter's learning.
4. Reusing an existing character would remain natural; do not change a
   character's age, family, job, or relationship simply to avoid one new name.
5. The new character has an explicit role, image, Swedish and English voice
   assignment, and first-appearance note before being added to
   `lib/story-world.ts`.

If a lesson needs only a one-off interaction, use a role label or off-screen
reference instead of creating a profile.

## Recommended long-term ceiling

| Layer | Maximum | Purpose |
|---|---:|---|
| Live now | **3** | Alex, Elin, Henrik |
| Likely next stage | **4** | Add one student/teen viewpoint only after the gate is met |
| Hard wider-course ceiling | **5** | Keep one slot unallocated unless later teacher notes prove a second distinct recurring viewpoint |
| Visible in one episode | **3 normally, 4 exceptionally** | Keeps names and relationships learnable |
| One-scene roles | As needed, unnamed | Service, family, and workplace practice without cast inflation |

This is a ceiling, not a target. The course can remain at three characters until
the source-aligned teaching work proves otherwise.
