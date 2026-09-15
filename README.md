# Momentum OS

A local-first personal operating system for a software engineering career: the job pipeline, interview readiness, portfolio projects, an engineering journal and the daily plan, in one dashboard. Built by and for one engineer working toward a stronger role and, long-term, a career in Europe.

![Stack](https://img.shields.io/badge/React%2018-TypeScript%20strict-blue) ![Build](https://img.shields.io/badge/Vite%205-Tailwind%203-8b5cf6) ![Data](https://img.shields.io/badge/local--first-versioned%20localStorage-199e70)

## What it does

| Area | Page | Purpose |
| --- | --- | --- |
| **Home** | Command Center | Today's status, pipeline health, active projects, skill gaps, long-term direction, in one screen |
| | Today | Editable time blocks with checklists, a live "now" marker, quick counters for what you did |
| **Career** | Job Tracker | Nine-stage pipeline (Saved → Offer / Rejected / Withdrawn), table + board views, follow-up and interview reminders, response / interview / offer conversion |
| | Interview Prep | 31 topics across Frontend, Backend, Engineering and AI Engineering; readiness, weak/strong self-assessment, last studied, markdown notes, a question bank per topic |
| | Career Roadmap | Ordered milestones with status, progress and optional target dates |
| **Build** | Projects | Portfolio work written up as interview evidence: problem, architecture, deployment, achievements, tasks, lessons |
| | Engineering Log | Dated entries for bugs, incidents, decisions, performance work, AI experiments, with impact and lessons |
| **Personal** | Goals | Daily / weekly / monthly targets by category, measured against what you log; achievements |
| | Statistics | Career, engineering, learning and productivity trends over 14 / 30 / 90 days |
| | Notes | Markdown scratchpad |
| | Focus | Sprint timer; completed sessions are recorded and feed goals and stats |
| | Why | Your own reasons, editable, next to the active milestone |

Keyboard: `1`–`9`, `0`, `f`, `w` jump between pages; `t` theme; `s` sound; `?` help. Dark-first with a full light theme.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build → dist/
npm run preview  # serve the production build
```

No backend and no accounts. Use **Load demo data** from any empty state to populate a realistic month across every page.

## Security

On first launch the app asks you to set a username and password. Only a random salt and a PBKDF2-SHA256 hash are stored, in this browser's localStorage. The session lives in `sessionStorage` (cleared when the tab closes) unless you choose to stay signed in for 30 days. Five wrong attempts trigger a 30-second lockout. Change or remove the password, export a JSON backup, or erase all data from the shield icon in the top bar.

**Be clear about what this protects.** It stops someone who opens the app on your machine from browsing your data. It does not protect against anyone with access to the browser profile or the device: the data itself is not encrypted, and the password check runs client-side. There is deliberately no credential in this repository. If you forget the password there is no reset; clearing the site's storage removes both the lock and the data, so export a backup first.

## Data

Everything is stored under `momentum-os:*` keys in localStorage, one key per collection.

- **Schema versioning.** `momentum-os:schemaVersion` records the shape in use. `src/lib/migrate.ts` runs before first render and upgrades older data in place; steps are idempotent and never delete rows.
- **Normalize on read.** Every collection passes through `src/lib/normalize.ts`, which fills missing fields, coerces wrong types and drops entries too broken to repair. Hand-edited or partially migrated storage degrades instead of crashing a page.
- **Honest history.** Each day log snapshots the plan it was scored against (`planIds`), so editing the day plan never rewrites past completion percentages or the streak.
- **Upgrading from the 2025 version** keeps every application, note, prep note and day log. The four original statuses map 1:1 into the new pipeline; the original checklist ids are pinned onto historical days.

The layout (`src/lib/storage.ts` → `normalize.ts` → `src/store/*` hooks → `DataContext`) is arranged so a sync backend can be added behind the same hooks later.

## Stack

React 18 · TypeScript (strict) · Vite · Tailwind CSS · Radix primitives · Recharts (lazy-loaded) · Lucide · React Router · react-markdown · WebAudio for feedback sounds, no audio assets.

## Layout

```
src/
  components/   layout (sidebar, top bar), shared widgets, UI primitives
  context/      Settings, Auth, Data providers
  data/         static catalogues and defaults (plan, topics, goals, roadmap, pipeline metadata)
  features/     one folder per page
  hooks/        useLocalStorage, useNow, keyboard shortcuts
  lib/          storage, normalize, migrate, stats, auth, dates, demo data
  store/        per-collection state hooks composed by DataContext
  types/        every persisted model
```
