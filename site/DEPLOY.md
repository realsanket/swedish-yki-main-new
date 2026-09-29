# Local app and hosted preview

Stigen runs in two ways.

| | Local (your computer) | Hosted preview (Vercel) |
|---|---|---|
| Purpose | Learning with every feature | Seeing what changed after a push |
| Lessons, games, grammar notes | ✅ | ✅ |
| Azure audio, transcription, feedback | ✅ with your `.env` | Off (no keys on Vercel) |
| Live voice coach | ✅ | Off (needs the custom server) |
| Saved progress | ✅ `site/data/progress.db` | Temporary; resets when idle |
| Cost | Your Azure usage | Free (Vercel Hobby) |

## Local: everything

```bash
cd site
git pull
npm install
cp .env.example .env   # first time only; add your Azure key
npm run dev            # http://localhost:3000
```

To try a branch Claude pushed before it is merged:

```bash
git fetch origin
git checkout claude/<branch-name>
npm install
npm run dev
```

## Hosted preview: one-time setup

1. Sign in at [vercel.com](https://vercel.com) with GitHub (the free Hobby plan).
2. **Add New → Project** and import this repository.
3. Set **Root Directory** to `site`. Vercel detects Next.js; keep the default build settings.
4. Do **not** add any Azure environment variables. Without them the preview cannot spend Azure credits, so it needs no password.
5. Deploy.

After that, every push creates a deployment automatically:

- every branch Claude pushes gets its own **preview URL**, shown on the commit and pull request in GitHub;
- `main` gets the permanent **production URL**.

A small **Preview · voice off** badge in the top bar marks hosted previews. It never appears locally.
