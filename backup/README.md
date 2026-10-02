# Backup

Nothing in this folder is loaded by the app. It keeps only the originals of
material that was migrated into the live repository.

## Kept

| Folder | What it is | Migrated to |
|---|---|---|
| `source-originals-2026-09-29/` | The teacher's original `Group 3.docx` and `Group 3.pdf` | `docs/Group 3.md` (all 51 lessons; audit in `site/docs/source-analysis.md`) |

Keep these files: they are the evidence that `docs/Group 3.md` is complete and
correct.

## Removed (October 2, 2026), recoverable from git

`future-course-2026-09-29/` held the old 60-lecture course: lecture files 2-60,
the old 12-chapter plan, the old story registry, and 63 illustrations. None of
it was migrated:

- Lectures 1-22 were rebuilt from the teacher's lessons and replace the old
  lecture files and chapter plan.
- Story data now lives in `site/content/modules.json` and each lecture's
  `story` field, replacing the old `story-world.full.ts`.
- The illustrations show the old cast (Aino, Sami, Sara, Leo), not the current
  cast (Alex, Elin, Henrik, Maja), so they cannot be reused as they are.

To look at or recover any of it, use commit `359475a`, which contains the
complete folder:

```bash
git show 359475a:backup/future-course-2026-09-29/README.md
git ls-tree -r --name-only 359475a backup/future-course-2026-09-29
git checkout 359475a -- backup/future-course-2026-09-29/<path>   # one file
```

Do not restore the whole folder into the working tree.
