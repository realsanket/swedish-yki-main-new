# Character mapping and introduction policy

This file prevents the Swedish course from growing a new permanent character
for every textbook dialogue. It maps **source functions**, not source identities.
The textbook remains reference material; Stigen's learner-facing scenes and
dialogue stay original.

## Decision

- **Keep the live cast at Alex, Aino, and Sami for Lecture 1.** No additional
  character is needed for greetings, a four-line introduction, or the first
  pronunciation work.
- **Do not import the textbook's full 13-person cast.** The large source cast
  supports a long family and relationship plot. Stigen does not need every
  source identity to teach the same language functions.
- **Plan for no more than five recurring Stigen characters across the wider
  course.** The archived `Sara` and `Leo` designs are candidates, not approved
  live characters. Restore either only when a verified future lesson passes the
  introduction gate below.
- Keep an episode's visible cast to **two or three characters** whenever
  possible. Relatives, sellers, doctors, interviewers, and other one-scene
  roles can remain unnamed or off-screen.

## Live Stigen cast

| Stigen character | Stable function | Source function covered now | Boundary |
|---|---|---|---|
| **Alex** | Learner viewpoint; makes the first attempt | Tomas's beginner-speaker function in the opening dialogue | Do not turn Alex into a husband, parent, child, or professional merely to absorb a source role. |
| **Aino** | Peer and natural conversation partner | Anna's partner function; later she can cover ordinary friend-to-friend exchanges | Do not silently make Aino equivalent to Nora, Maria, Lena, or another source identity. |
| **Sami** | Teacher and coach | Explains and models the pronunciation notes surrounding the Anna/Tomas dialogue | Keep Sami outside family and romantic plotlines. |

For Lecture 1 the functional mapping is therefore:

```text
Anna + Tomas (source greeting pair)
            ↓ language function only
Aino + Alex (original Stigen conversation)
            +
Sami (teacher explanation and sound coaching)
```

## Textbook cast mapped by teaching function

The page references below are physical PDF pages in `docs/text-book (1).pdf`.

| Source character group | Source role and recurrence | Minimal Stigen handling | Add a recurring character now? |
|---|---|---|---|
| **Anna and Tomas** | Opening greeting and pronunciation pair on page 4; they are not the continuing story spine | Alex and Aino already cover the two-speaker function; Sami covers explicit teaching | **No** - already mapped in Lecture 1 |
| **Nora and Maria** | The most frequent friend-to-friend pair; they carry everyday conversations and the Andreas reveal from page 5 onward | Aino can cover one peer role. Add one second peer only when a verified lesson needs a repeated two-friend relationship that Alex cannot naturally fill | **Not yet** |
| **Andreas and Lena** | Married couple and parents; needed for family, possessives, work, secrecy, and later consequences | Do not assign these relationships to Alex and Aino. For isolated grammar examples, mention an unnamed couple or family. Add a household pair only if the continuing relationship is deliberately adopted into Stigen's original story | **Not yet** |
| **Peter and Maria** | Second adult couple and parents; Peter also supports work, health, shopping, complaint, and environment scenes | Reuse one future adult/neighbor character for practical scenes. Do not create a second permanent couple solely because the source has one | **Not yet** |
| **Jonas and Nils** | Brothers used for toys, school, music, possessions, and future study | One future peer plus an off-screen sibling covers most functions. A second named sibling is justified only by a verified contrast that depends on two brothers | **Not yet** |
| **Sofia and Ingrid** | Teen student and mother; school, exams, parties, films, and friends | A future student/classmate can cover Sofia's function. The parent can remain “mamma” until repeated identity matters | **Not yet** |
| **Sara and Jenny** | Teen and young-child viewpoints; school, photography, football, and environment | Reuse the same future peer for teen scenes. A younger child can be an episodic speaker in the environment lesson without entering the permanent cast | **Not yet** |
| **Doctors, sellers, interviewers, service staff** | Situational roles rather than relationship anchors | Render as role labels such as `Läkare` or `Säljare`, or let Sami model the exchange | **No** |

The source-frequency check supports this compression: Maria, Peter, Andreas,
Nora, Sofia, Sara, and Jonas recur often, while Anna and Tomas are primarily the
opening pair. Frequency alone does not authorize a Stigen character; a distinct
learner-facing relationship must also be necessary.

## Character introduction gate

A future character becomes live only when all of these are true:

1. The current teacher lesson and its exact textbook boundary have been
   verified.
2. The scene requires a stable relationship or viewpoint that Alex, Aino, and
   Sami cannot express without contradicting who they already are.
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
| Live now | **3** | Alex, Aino, Sami |
| Recurring wider-course cast | **5** | Add at most two distinct peers/neighbor roles after verification |
| Visible in one episode | **3 normally, 4 exceptionally** | Keeps names and relationships learnable |
| One-scene roles | As needed, unnamed | Service, family, and workplace practice without cast inflation |

This is a ceiling, not a target. The course can remain at three characters until
the source-aligned teaching work proves otherwise.
