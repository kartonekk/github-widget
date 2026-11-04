# github-mc-widget

Dynamically generated SVG cards for a GitHub profile README:

- a profile card — total Modrinth + CurseForge downloads with the
  per-platform split
- a creator card — a slim footer for mod READMEs with lifetime downloads
- a card per mod, drawn over that mod's own promotional art
- an organization card (one per org) with its own accent and showcase

```md
![Total Downloads](https://your-deployment.vercel.app/api/badge/profile)
[![Lifetime downloads](https://your-deployment.vercel.app/api/badge/creator)](https://github.com/kartonekk)
![Head Locator](https://your-deployment.vercel.app/api/badge/mod?id=head-locator)
[![Kart-Modding](https://your-deployment.vercel.app/api/badge/org?login=Kart-Modding)](https://github.com/Kart-Modding)
[![Kart-Forks](https://your-deployment.vercel.app/api/badge/org?login=Kart-Forks)](https://github.com/Kart-Forks)
```

Visit the deployed site's homepage for a live preview and copy/paste-ready
snippets.

## Deploy

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new) — zero config needed.
3. GitHub Actions (already set up, see below) needs no extra config — it
   just needs `contents: write` on the default `GITHUB_TOKEN`, which is
   already granted in the workflow file.

## Local dev

```
npm install
npm run dev
```

Open http://localhost:3000 for a live preview.

## API

### `GET /api/badge/profile`

Card (840×176 — spans a README at ~1:1, dark gradient): your GitHub avatar and name, total downloads,
a bar splitting it between Modrinth and CurseForge, and both platform
totals. No query params; entirely driven by
`lib/projects.config.ts` (`displayName`, `githubUser`, `accent`, `projects`).

### `GET /api/badge/creator`

Card (840×116, one slim row): your avatar and name under a "CREATOR" label,
Modrinth and CurseForge lifetime totals, the combined total, and the split
along the bottom edge. Meant as the last thing in a mod's README, wrapped in
a link. No query params; same config and numbers as the profile card.

### `GET /api/badge/mod?id=<id>`

Card (420×217) for one mod from `lib/projects.config.ts`: its promo banner
across the top, then icon, title/tagline, and total downloads in the mod's
accent — deliberately sparse so a row of them stays easy to scan.

Art comes from the mod's own repo when the entry has `art` (e.g.
`Promotional Images/Infographics/banner.png` in `Kart-Modding/HeadTracker`,
read from raw.githubusercontent.com); otherwise from Modrinth: the featured
gallery screenshot (else the first one) and the Modrinth icon. A mod with no
screenshots gets its icon blurred into the backdrop instead. To pin specific images (e.g. one Modrinth gallery photo), set
`bannerUrl` / `iconUrl` on the entry; they win over everything else. 1600×560 banners fit the card exactly. The accent is
the entry's `accent`, else Modrinth's project color.

### `GET /api/badge/org?login=<org>`

Card (420×150) with one GitHub organization's public repo count. `login` is
required and can be any public org — fetched live from the public GitHub
API, no token needed. A matching entry in `lib/orgs.config.ts` sets the
subtitle, accent, and showcase:

- `showcase: "mods"` — the promo art of the configured mods whose source is
  in this org fills the right side, with their icons in a row
- `showcase: "repos"` (default) — recently pushed repo names as chips over a
  commit-graph motif

Wrap each in a link to `https://github.com/<org>` so clicking it opens the
organization.

Images are fetched server-side, resized with `sharp` to the size they're
drawn at, and inlined as data URIs (GitHub's image proxy blocks external
images inside SVGs), so each card stays around 50KB.

All badge responses are SVG (`image/svg+xml`) and are CDN-cached for one
hour (`s-maxage=3600`) so a busy GitHub profile doesn't hammer the upstream
APIs.

## Data sources

- **Modrinth**: the public [Modrinth API](https://docs.modrinth.com/) — no
  key needed. Used to sum every project's downloads plus fetch account
  creation date.
- **CurseForge**: curseforge.com blocks plain HTTP requests (Cloudflare
  returns a `403` to `curl`/`fetch`), so this repo scrapes it with a real
  headless browser instead:
  - `scripts/scrape-curseforge.mjs` (Playwright) visits each project listed
    in `data/curseforge-projects.json` and reads the "Downloads" stat
    straight off the page, writing the result to
    `data/curseforge-downloads.json`.
  - `.github/workflows/scrape-curseforge.yml` runs that script every 6
    hours (and on manual dispatch) and commits the updated JSON back to
    the repo — Vercel then auto-redeploys with fresh numbers baked in, no
    scraping happens on the request path.
  - To track your own projects: edit `data/curseforge-projects.json`
    (`{ "slug": "...", "category": "mc-mods" }` per project — category is
    the URL segment, e.g. `mc-mods`, `texture-packs`, `modpacks`), then run
    `npm run scrape:curseforge` locally or trigger the workflow.
- Pair the same project across platforms in `lib/projects.config.ts`
  (slugs differ between Modrinth and CurseForge) so totals/"best project"
  can be computed correctly instead of guessing by name.

Brand marks are sourced from [Simple Icons](https://simpleicons.org) (CC0).
