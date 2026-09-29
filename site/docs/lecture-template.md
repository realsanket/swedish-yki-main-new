# Extending the lecture system

The lecture engine is deliberately content-driven. Lecture 1 uses a custom `conversation-first` presentation, but that presentation is **not** selected by lecture number and is **not** the default for future lectures.

## Separation of responsibilities

| Layer | Location | Responsibility |
|---|---|---|
| Lecture content | `content/lectures/lecture-XX.json` | Goals, questions, explanations, examples, dialogue, practice, and optional presentation choices |
| Content contract | `lib/course-types.ts` | Optional, typed extension points for presentation and teaching content |
| Shared learning engine | `components/learning/LecturePlayer.tsx` | Saving, progress, questions, practice, and rendering optional presentation choices |
| Hero renderer | `components/learning/EpisodeBrief.tsx` | Neutral default hero plus explicitly requested hero variants |
| Template styles | `app/course.css` | Styles scoped below `.lecture-template-*`; never selected by lecture number |

## Defaults versus opt-in behaviour

A future lecture can omit `presentation` completely. It then receives:

- the neutral `standard` template;
- the route labels supplied by its route profile;
- dialogue in the teaching step;
- neutral teaching-section navigation;
- an open word bank;
- generic optional-resource language.

`routeProfile` is also explicit. A future lecture number does not automatically become a clinic, checkpoint, workshop, or mock. Omit the field for `standard`, or choose another profile only after the verified content requires it.

Lecture 1 explicitly opts into `presentation.template: "conversation-first"` and supplies its own hero, opening sequence, two route-label overrides, introduction builder, resource introduction, and collapsed word bank.

Every teaching section is progressively disclosed as **Understand**, optional
**See the pattern**, **Hear it**, and **Try it** beats. Put explanation in
`body`, comparison material in `table`, complete spoken models in `examples`,
and immediate retrieval in `memoryTip`/`tryIt`; do not repeat the same content
across all four fields.

## Presentation extension points

- `template`: chooses a scoped visual treatment.
- `routeSteps`: overrides only selected learner-facing step labels and descriptions.
- `opening.teacherNote`: changes the opening guidance without changing shared logic.
- `opening.questionIntro`: explains how the opening questions should be used.
- `opening.sourcePractice`: attaches an explicitly verified source-page image, accessible dialogue, listening focus, and recall cues to the opening step. Never infer or reuse a later page.
- `opening.dialogue.part`: places dialogue in `recall` or `teach`.
- `opening.dialogue`: controls the dialogue title, eyebrow, instructions, and initial text visibility.
- `teaching.builder`: attaches a typed task-specific interaction to one explicitly named teaching section. Omit it unless that section genuinely requires the interaction.
- `teaching.livePractice`: explicitly assigns `conversation` or `pronunciation` Voice Live practice to named teaching sections. Omit a section rather than guessing a mode from its position or kind.
- `teaching.wordBank`: chooses an open or collapsed word bank and optionally supplies its title.
- `teaching.resourceIntro`: supplies context appropriate to that lecture's resources.
- `hero`: opts into a specialised hero and owns every learner-facing string inside it.

## Adding a future lecture

1. Read and verify that teacher lesson first. Do not begin from the Lecture 1 layout.
2. Check `docs/character-mapping.md`. Reuse Alex, Elin, Henrik, or Maja when the role is natural; use an unnamed episodic role when continuity is unnecessary. Add a fifth recurring character only after the introduction gate is satisfied.
3. Create the new numbered lecture JSON with its actual teaching content.
4. Leave `presentation` absent until the content shows what the interface needs.
5. Use existing optional fields only when they fit the teaching purpose.
6. If the lesson needs a genuinely new visual pattern, add a new template or hero variant in `course-types.ts`, give it an isolated renderer and `.lecture-template-*` CSS scope, and leave existing templates unchanged.
7. Never add `lecture.number === X` presentation branches to shared components.
8. Regenerate `content/lectures/index.json`, then run typecheck, lint, build, and visible browser QA.

## Future lecture presentation fragment

```json
{
  "number": 2,
  "routeProfile": "standard",
  "presentation": {
    "routeSteps": {
      "recall": {
        "label": "A label justified by Lesson 2",
        "description": "An action justified by Lesson 2."
      }
    }
  }
}
```

This is a fragment to merge into a complete, validated lecture—not a complete lecture file. If Lesson 2 does not need an override, omit `presentation` entirely rather than copying Lecture 1.

## Stable progress boundary

The six stored progress parts—`recall`, `teach`, `guided`, `practice`, `check`, and `assignment`—remain stable so saved work can be resumed safely. Their visible labels and teaching treatment may vary by lecture. Adding or removing stored progress parts is a data-migration decision, not a template decision.
