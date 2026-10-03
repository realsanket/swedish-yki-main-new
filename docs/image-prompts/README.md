# Image prompts

Pictures the app can show but does not have yet. Until a picture exists, the
app shows the characters' portraits in its place, so nothing is broken without
them.

| File | What it is | Where it shows |
|---|---|---|
| [`chapters.md`](chapters.md) | One picture per chapter, Chapters 2-6 | Home screen "next scene" card and the chapter cards on the Story path |
| [`episodes.md`](episodes.md) | One picture per lecture, Lectures 3-22 | Story notebook cards |

## How to make one

1. Copy the **style block** and the **cast block** below, then the prompt for
   the picture you want.
2. Generate at **16:9**; the app uses **1672 x 941** pixels. Check that each
   character matches their portrait in
   `site/public/images/onboarding/characters/` and that there is no text in the
   image.
3. Save as **WebP** with the exact file name given in the prompt.
4. Give the files to the agent (or put them in the path shown). The agent then
   sets `story.art` for that chapter in `site/content/modules.json`, or for that
   lecture in its JSON, and runs the checks. The validator rejects a path that
   does not exist.

## Style block

> Warm painterly illustration in gouache and watercolour, soft natural Nordic
> daylight, light wood furniture, green plants, calm everyday scene in
> Helsinki, gentle friendly expressions, slightly textured brush strokes,
> muted warm palette with greens, rust and soft blues. 16:9, no text, no
> letters, no logos.

Reference for the look: `site/public/images/story/chapters/chapter-01-first-class.webp`
and `site/public/images/story/episodes/episode-01-sound-workshop.webp`.

## Cast block (use only these four, exactly as they look)

- **Alex:** young man in his twenties, warm brown skin, short dark curly hair,
  dark green crew-neck sweater, dark trousers, often holds a spiral notebook.
- **Elin:** young woman in her twenties, blonde hair in a loose messy bun,
  freckles, rust-red knit sweater, black trousers.
- **Henrik:** man in his thirties, curly brown hair, round black glasses, short
  beard, dark green overshirt over a blue T-shirt, brown trousers.
- **Maja:** teenage student, auburn wavy hair in a bun, freckles, teal corduroy
  overshirt, white T-shirt, black jeans, mustard backpack, headphones round her
  neck.

Do not add other recurring people. Background people (a waiter, other
students) are fine if they stay small and unnamed.
