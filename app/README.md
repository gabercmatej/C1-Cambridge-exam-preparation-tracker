# C1 Prep

Personal tracker for the 26-day C1 Advanced plan (16 Nov to 11 Dec 2026, exam 12 Dec).

## Run

```
cd app
npm install   # first time only
npm run dev   # opens the app in your browser
```

`npm test` runs the logic tests, `npm run build` type-checks and builds.

## Where things live

- **The curriculum is not in this folder.** Days, tasks, prompts, resources and reference tables are read directly from `../STUDY_PLAN.md` and `../RESEARCH.md` each time the app starts. Edit those files to change the plan. Keep the task line format (`` - `d02-a` [core] text (90) · Skill ``); `npm test` checks that every task line was understood.
- What each task records is in `src/data/scores.ts`.
- **Your data** (done/skipped, scores, mistakes, notes) lives only in this browser, under the localStorage key `c1prep:v1`. Always open the app at the same address (the one `npm run dev` prints), because a different port is a different storage.

- **Look and feel** is in `src/index.css` (colour tokens for light and dark at the top, then components). Fonts (Newsreader, Schibsted Grotesk) load from Google Fonts; offline, the app falls back to system fonts.
- **Theme** (System, Light, Dark) is set in Library > Theme and stored under the separate key `c1prep:theme`. It is not part of your study data or backups.

## Backup

Library > Export JSON, or Export backup at the bottom of the sidebar, once a week (the sidebar shows the last backup date; on phones, Today reminds you after 7 days). Import checks the file first and replaces everything only after you confirm; a bad file changes nothing. To move to another device: export there, import here.

## Preview another day

Add `?today=2026-12-05` to the address. Anything you log while previewing is saved as real data.
