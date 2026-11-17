# CLAUDE CODE HANDOFF — build the C1 Prep tracker

You are implementing a small personal study tracker. All research, the study plan and the UX design are finished. Do not redo them.

## Read first, in this order

1. `UX_SPEC.md` — what to build. This is the source of truth for behaviour.
2. `STUDY_PLAN.md` — the content to seed: 26 days of tasks (§3), tutor prompts (§6), exam-day checklist.
3. `RESEARCH.md` — §3 score anchors, §9 resource list. Reference only.

If `UX_SPEC.md` still says "awaiting approval" in its status line, confirm with Matej that it is approved before writing code, and ask about its §10 open decisions.

## Context

- One user, one Mac, 26 days of use (16 Nov – 11 Dec 2026, exam 12 Dec). The plan has already started, so **speed of delivery matters more than polish**. A working Today screen on the first evening is worth more than a complete app three days later.
- Success test: within ten seconds of opening, he knows what to study today, where, for how long, and where to record it.

## Stack

- Vite + React + TypeScript + Tailwind CSS. Check current Vite and Tailwind setup docs before scaffolding.
- State: React state plus one `localStorage` key. No state library.
- Navigation: five tabs held in state and mirrored to `location.hash`. No router library.
- Charts: plain divs or inline SVG. No chart library.
- Tests: Vitest, for the pure logic only.
- Dates: native `Date` with local `YYYY-MM-DD` strings. No date library.

Scaffold into a new `app/` folder inside this project. Do not touch the four planning documents or `Confirmation email.png`. Installing dependencies needs Matej's go-ahead.

## Project layout

```
app/
  src/
    data/plan.ts        26 PlanDay objects transcribed from STUDY_PLAN.md §3
    data/prompts.ts     GPT-1 … GPT-9 from STUDY_PLAN.md §6, verbatim
    data/resources.ts   RESEARCH.md §9 tables, with skill tags
    data/anchors.ts     RESEARCH.md §3 anchor table + interpolated Grade B estimates
    lib/dates.ts        today, day number, countdown
    lib/schedule.ts     effective date, overdue, missed, next action
    lib/review.ts       1/3/7-day box logic
    lib/storage.ts      load, save, export, import + validation
    lib/*.test.ts
    state.ts            AppState type, reducer or setter helpers, useAppState hook
    tabs/Today.tsx  Plan.tsx  Mistakes.tsx  Progress.tsx  Library.tsx
    components/TaskRow.tsx  (shared by Today and Plan)  + whatever else is truly reused
    App.tsx  main.tsx  index.css
```
Keep it this flat. Add a file only when something is used twice.

## Seeding rules

- Task ids must match the plan exactly (`d01-a` … `d26-c`). Dates: Day 1 = 2026-11-16, Day 26 = 2026-12-11.
- Carry over for each day: title, objective, kind (normal, light, mock, review, rest), "Done when", "Record", "Emergency".
- Carry over for each task: title, skills, minutes, `[core]` flag, every link with a short label, and the prompt id where the task names a GPT-n prompt.
- Add `scores` specs wherever the day's "Record" line asks for raw scores. Use these maxima: R&UoE Parts 1, 2, 3 = 8; Part 4 = 12; Part 5 = 12; Part 6 = 8; Part 7 = 12; Part 8 = 10; Reading total 50; Use of English total 28; Listening Parts 1–4 = 6, 8, 6, 10; total 30; Writing 20 per task, 40 per paper; Speaking 75. For single Flo-Joe reading parts the plan records question counts (Part 5 /6, Part 6 /4, Part 7 /6); store those as unofficial practice results with that max.
- Official sources (flag `official: true`): the digital sample, paper Sample 2, the handbook sample. Everything else is unofficial.
- The exam-day text under "Sat 12 Dec" becomes the checklist shown on 12 December.

## Build order

Each step leaves the app usable. Stop and show Matej after step 2.

1. Scaffold, data files, `lib/dates.ts`, `lib/schedule.ts` with tests.
2. **Today** tab with done/skip, links, emergency text, persistence. Ship this first.
3. **Plan** tab reusing `TaskRow`; move and add task.
4. **Mistakes** tab with review mode; due count on Today.
5. Score fields on Done; **Progress** tab with anchors.
6. **Library** tab: resources, prompts with copy, export/import, speaking date.
7. Pass over responsive layout, keyboard use, empty states, dark mode.

## Requirements that are easy to get wrong

- **No predicted Cambridge score anywhere.** Raw scores against the official anchors, with the wording in UX_SPEC §4.4. The Grade B marker is labelled "estimate". Writing and Speaking are captioned "Tutor estimate. Not examiner-marked."
- **The calendar never shifts.** Missed core tasks go to catch-up; missed non-core tasks go grey. Nothing is auto-rescheduled or auto-dropped.
- **Local dates.** `new Date().toISOString().slice(0, 10)` is wrong after 23:00 or before 01:00 in Ljubljana. Build the string from local year, month and day.
- **Seed data is immutable.** User state is an overlay keyed by task id.
- **Import must not destroy data on a bad file.** Validate, confirm, then replace.
- No exam questions or copyrighted text in the app; it links out.
- UI copy has no em dashes.

## Do not build

Authentication, a backend, Supabase, any API call, AI integration, sync, service workers or PWA install, notifications, streaks or points, a settings screen, a rich-text editor, i18n, analytics, a component library, a timer, editing of built-in plan text, undo history, animations beyond simple state transitions. If something seems to need one of these, stop and ask.

## Tests (Vitest, logic only)

- `dates`: day number and countdown on 2026-11-16, 2026-12-11, 2026-12-12; local-date string does not shift near midnight.
- `schedule`: overdue versus missed; moved task uses its new date; next action falls through tasks → catch-up → reviews → done.
- `review`: Got it advances 1 → 3 → 7 → retired; Missed resets to one day; due date never exceeds 2026-12-10.
- `storage`: round trip export → import; rejects wrong version, malformed JSON and missing keys without changing state.
- `plan` data: exactly 26 days, consecutive dates, unique task ids, every link is an absolute https URL, every `promptId` exists in `prompts.ts`.

No component tests, no end-to-end suite.

## Acceptance criteria

1. `npm run dev` in `app/` opens to Today with the correct day for the current local date.
2. On 17 Nov 2026 the Today tab shows Day 2, the R&UoE diagnostic expanded as Next, with working links to the test and the answer key.
3. Done with part scores on a diagnostic or mock task makes a bar appear on Progress for that skill, positioned against the 160/180/200 markers.
4. Skipping a core task makes it appear under catch-up the next day; Drop removes it; a non-core skip never appears there.
5. A mistake added today is due tomorrow; Got it moves it out three days; Missed brings it back tomorrow.
6. Copy on any prompt puts the exact text from STUDY_PLAN §6 on the clipboard.
7. Reloading the page loses nothing. Export, clear site data, import restores everything.
8. Usable at 375 px width with no horizontal scroll; fully operable by keyboard; light and dark both readable.
9. `npm test` and `npm run build` pass with no TypeScript errors.
10. Checked in a real browser, not only by tests: walk criteria 2–7 by hand and report what you saw.

## Definition of done

All ten acceptance criteria met; the app runs from `app/` with one command; a short `app/README.md` says how to run it, where the data lives and how to back it up; nothing from the "Do not build" list exists; total source is small enough to read in one sitting.

## How to start

1. Read the three documents.
2. Confirm spec approval and the open decisions in UX_SPEC §10.
3. Write the implementation plan to `docs/plans/001-c1-prep-app.md` (checkboxes, Non-goals, Gates) following the build order above.
4. Scaffold and deliver step 2 (Today) the same session.
