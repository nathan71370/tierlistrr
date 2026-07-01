# Contributing to tierlistrr

Thanks for taking the time to contribute! Issues and pull requests are welcome —
bug fixes, features, and especially **new translations**.

## Development setup

```bash
git clone https://github.com/nathan71370/tierlistrr.git
cd tierlistrr
npm install
cp .env.example .env.local   # optional; the app runs with defaults
npm run dev                  # http://localhost:3000
```

- The database and uploads live under `./data` (created on first run, git-ignored).
- No migrations to run — the schema is applied idempotently at startup.
- Sign-in codes are printed to the terminal when SMTP isn't configured, so you can
  test auth locally.

Before opening a PR:

```bash
npm run lint
npm run build
```

Both should pass.

## 🌍 Add a language (great first contribution)

The UI is fully translated via message catalogs — no code changes needed to add
a language:

1. Copy `messages/en.json` to `messages/<code>.json` (e.g. `messages/de.json`)
   and translate the **values** (keep the keys and the `{placeholders}` /
   `<tags>` as-is).
2. Add the locale to [`src/i18n/config.ts`](src/i18n/config.ts):
   - add the code to `locales`
   - add an entry to `localeMeta` with a `label` and a `flag` emoji
3. Run `npm run dev`, switch to your language with the flag picker, and check it.

Open a PR — that's it. Even partial translations are welcome (missing keys fall
back to English).

## Project structure

```
src/
  app/         # routes (home, /t/[slug], API routes)
  components/  # UI + board + auth components
  db/          # Drizzle schema + libSQL client
  lib/         # data access, server actions, AI, image queue
  i18n/        # next-intl config, request, locale switch action
messages/      # translation catalogs (one JSON per locale)
```

## Coding notes

- TypeScript + Tailwind CSS v4. Keep components small and match the surrounding
  style; design tokens live in `src/app/globals.css`.
- User-facing strings must go through translation keys (`useTranslations` in
  client components, `getTranslations` in server code) — no hardcoded copy.
- Keep it simple and dependency-light.

## Good first issues

Some approachable things to pick up (or open an issue to claim one):

- Add a language (see above)
- Reorder tiers by drag-and-drop
- Export a tier list as an image (PNG)
- Item detail: replace the image / crop uploaded images
- Empty-state polish and small a11y improvements

## Reporting bugs / requesting features

Use the issue templates. Please include repro steps and, for deployment issues,
the relevant container logs.
