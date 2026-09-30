# CLAUDE.md

@AGENTS.md

## Notes for Claude sessions

- The full project handbook is `AGENTS.md` (imported above). Keep it current:
  when a feature, rule or decision changes, update its status and backlog
  sections in the same commit.
- Cloud sessions: the app runs from `site/` with `npm run dev`; Azure keys
  arrive through the cloud environment's variables (they apply to new
  sessions only). Chromium for Playwright is at `/opt/pw-browsers`.
- Finish every change with `npm run check`, `npm run build`, a browser check at
  laptop and phone widths, then push the working branch and fast-forward
  `main` (merge `main` first if the owner pushed to it).
- Kill the dev server with `pgrep -f '^node server' | xargs -r kill`. A broader
  pattern such as `pkill -f server.mjs` also matches your own shell command
  and ends it.
