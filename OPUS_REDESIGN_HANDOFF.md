# Redesign handoff for the implementing session

You are implementing a visual redesign of a working app. Read this file fully, then `VISUAL_DESIGN_SYSTEM.md` and `REDESIGN_BLUEPRINT.md`, and open `design/prototype.html` in a browser. `DESIGN_AUDIT.md` explains why; you do not need it to build.

The prototype is complete: all five screens plus the completed day, exam day, review session (before and after reveal, and finished), empty notebook, no-results filter and expanded task. Serve it with `python3 -m http.server` from `design/` and use the selector at the bottom right, or the hashes listed at the top of the blueprint. **The prototype is the visual source of truth.** When it and the blueprint disagree on a visual detail, copy the prototype; when they disagree on behaviour or data, follow the blueprint and the existing code.

## Design skill and visual verification

Before writing UI code, load the installed design skill. In this environment that is `impeccable` (`/impeccable polish`, using its product register). There is no `frontend-design` skill here; if one is installed later, either works. Use it as a quality bar while you port the prototype, not as a licence to redesign. The Ink and Paper direction is approved and fixed.

Check the rendered app, not just the code. After each screen, open the real app in a browser (Playwright is available) at 1440 × 900 and 375 × 812, in light and dark, and compare it side by side with the prototype at the same hash and the matching `design/screenshots/after-*.png`. Fix differences in spacing, type size, weight and colour before moving on. Check that the page never scrolls horizontally, and that mobile tap targets are at least 44 px (a short `page.evaluate` that lists visible buttons under 40 px is enough). Do not report a screen as done until you have looked at it in both themes and both widths.

## The rule that overrides everything else

**This is a presentational change. The app's behaviour, data and curriculum must be identical afterwards.**

Do not modify:

| Path | Why |
|---|---|
| `app/src/lib/*` (dates, schedule, review, flex, storage) | All logic, all tested |
| `app/src/data/scores.ts` | Score specs, anchors, lines, totals |
| `app/src/data/plan.ts` | Curriculum parser |
| `app/src/lib/lib.test.ts` | Must pass unchanged |
| `STUDY_PLAN.md`, `RESEARCH.md` | The curriculum and resources themselves |
| The `State` shape and the `c1prep:v1` key | Backups must stay compatible both ways |

If a design detail seems to need a change in one of these, stop and derive it in the component instead. Everything in the blueprint can be computed from `State`, `DAYS`, `tasksOn`, `allTotals`, `allocation`, `catchUp`, `nextAction` and `isDue`.

Also unchanged: all rule copy (keep-order, three lost days, sealed Test B, score captions, "no predicted score"), hash routes (`#today`, `#plan`, `#mistakes:review`, ...), the `?today=` preview, every `confirm()` on destructive actions, every `aria-*` attribute and `sr-only` text already present.

## What you are changing

`app/index.html`, `app/src/index.css`, `app/src/App.tsx`, `app/src/components/TaskRow.tsx`, `app/src/components/Md.tsx` (class names only), the five files in `app/src/tabs/`, and a few new presentational components.

## Styling approach

Stay on Tailwind 4 with the `@theme` block in `src/index.css`. No new styling library.

1. Replace the `@theme` colour tokens with the token set in the design system (names: `bg`, `surface`, `sunken`, `line`, `line-strong`, `field`, `ink`, `ink-2`, `ink-3`, `accent`, `accent-hover`, `accent-soft`, `on-accent`, `secure`, `secure-soft`, `borderline`, `borderline-soft`, `priority`, `priority-soft`). Rename usages: `card` to `surface`, `fg` to `ink`, `muted` to `ink-3` (or `ink-2` for section titles and secondary prose), `warn` to `borderline`, `bad` to `priority`. Search for every old name afterwards; none may remain.
2. Dark tokens: keep the `prefers-color-scheme` block but scope it to `:root:not([data-theme="light"])`, and duplicate it under `:root[data-theme="dark"]`. Copy the three blocks from the top of `design/prototype.html`.
3. **Fonts: use Google Fonts. This is decided; do not ask.** Copy the three `<link>` tags (two preconnects and the stylesheet) from the prototype's `<head>` into `app/index.html`, unchanged. Set the tokens exactly as the prototype does:
   - `--font-serif: "Newsreader", Charter, "Iowan Old Style", Georgia, serif;`
   - `--font-sans: "Schibsted Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif;`
   - Mono stays `ui-monospace, SFMono-Regular, Menlo, monospace`.
   `display=swap` is in the URL, so text renders in the fallback while the fonts load and the app still works offline. Self-hosting can come later and is out of scope.
4. Port the component classes from the prototype's `<style>` into `index.css` under `@layer components`: `.btn` (+ `.primary`, `.ghost`, `.lg`, `.sm`), `.input`, `.tag`, `.status`, `.basis`, `.seg`, `.sec`, `.check`, `.task`. Delete `.card` and `.label`; every use of `.label` becomes a `.sec` section title in sentence case. Layout stays in Tailwind utilities in the JSX.
5. No icon package. Create `src/components/Icon.tsx` exporting one `Icon` component with the closed set of paths in the prototype's `ICONS` object: today, plan, mistakes, progress, library, ext, check, arrow, chev, plus, trash, copy. All are 24 px viewBox, 1.6 stroke, round caps and joins, `fill: none`. The back arrow is `arrow` rotated 180 degrees. Icons are 18 px by default, 14 px in task rows, 16 px in chevron and delete buttons, 22 px in the tab bar.
6. Port the state and Library classes too: `.more` (expanded row), `.donecard` and `.tomorrow`, `.examday` and `.paper`, `.review` / `.rv-*`, `.empty` and `.example`, `.mk .del`, `.lib-*`, `.prow*`, `.pid`, `.pt`, `.chev`, `.prompt`, `.notice`, `.tbl`, `.reslist`, `.data`, `.field`. Copy the values; the blueprint explains them.

## Component plan

Reuse first. New components are presentational and take already-computed props.

| Component | Status | Notes |
|---|---|---|
| `App.tsx` shell | change | Rail plus main grid on desktop, `TabBar` on mobile. Compute the due count here for the rail badge. Keep the alerts and the `main key={tab}`. Read an optional hash argument for Plan (`#plan:YYYY-MM-DD`) the same way `mistakes:review` is read. |
| `Icon.tsx` | new | As above |
| `TaskRow.tsx` | change | Keep every handler, `ScoreInput` and its validation exactly. Change only markup and classes. Add a `variant` prop: `row` (default, collapsed row or inline-expanded) and `card` (the next-task card layout). Replace the `STATUS` glyphs with the check circle; keep the status names for `sr-only`. Add the "Open exercise" button: first `https?://` URL found in `t.text` (the markdown link target). |
| `JourneyStrip.tsx` | new | Props: `days: { n, date, minutes, state, mock?: string }[]`, `onSelect(date)`. Used on Today (planned minutes) and Progress (logged minutes). |
| `DayProgress.tsx` | new | Props: today's tasks with minutes and status, the id of the next task |
| `DayInfo` (in `Today.tsx`) | change | Same data, definition-list markup |
| `BasisMark`, `StatusMark`, `BandPips`, `Trend` | new, small | Can live in one `src/components/marks.tsx` |
| `AnchorBar` (in `Progress.tsx`) | change | Same maths (`at()`), labelled ticks, keep the `aria-label` |
| `Md.tsx`, `Copy` | change | Classes only. `Copy` gets the "Copied" state if it does not already have one, with `aria-live="polite"`. Tables rendered by `Md` get the `.tbl` wrapper. |
| `Disclosure` (in `Library.tsx`) | change | Replaces `Fold`. Keep native `<details>`/`<summary>` for accessibility, styled as `.prow`. Prompt rows put the Copy buttons outside the `<summary>` so clicking Copy does not toggle the row. |
| `ThemeControl` | new, small | Three-item `.seg`; writes `c1prep:theme` and the `data-theme` attribute |
| Tabs | change | Recompose per the blueprint. State hooks and handlers stay as they are. |

Derivations you will need (all in components, none stored):
- Day state for the strip: `tasksOn(d.date, s)`; done if every task has `status === 'done'`, partial if some do.
- Planned minutes per day: sum of `t.minutes` over `d.tasks`.
- Logged minutes per day: sum of `t.minutes` over `allTasks(s)` where `status === 'done'`, grouped by `effDate`.
- Minutes left today: sum over today's tasks with no status.
- Error-type counts: count `m.type` over the filtered mistakes list.

## Order of work

Do these in order. After each step run `npm test` and `npm run build` in `app/`, and look at the result in the browser before moving on.

1. **Foundation.** Tokens, fonts, component classes, `Icon`. The app should already look different with no layout change.
2. **Shell.** Rail, tab bar, content widths, alerts.
3. **TaskRow** restyle with both variants.
4. **Today** including `JourneyStrip` and `DayProgress`.
5. **Plan.**
6. **Mistakes** including the review session.
7. **Progress.**
8. **Library** including the theme control (`localStorage` key `c1prep:theme`; not in `State`, not in backups) and the inline pre-paint script.
9. **States and polish.** Completed day, exam day and after, empty notebook, no-results filter, review finished, both error banners. Motion per the design system, reduced motion, focus states. Compare every state with the prototype.

If the session runs short, steps 1 to 4 alone deliver most of the visible change and leave the app consistent.

## Checking your work

Use a separate port so the user's saved data is never touched: `npx vite --port 5199 --strictPort` (a different port is a different `localStorage`). Preview a mid-plan day with `?today=2026-11-24` and seed demo data through the UI or the console. Never run against, clear or overwrite the storage on the user's normal dev address.

Compare against `design/screenshots/after-*.png`. They were captured from the final prototype at 1440 × 900 (desktop) and 375 × 812 (mobile), full page. File names are `after-{screen}[-{state}]-{desktop|mobile}-{light|dark}.png`; mobile captures show the tab bar at the end of the page instead of fixed. `before-*.png` are the current app.

### Visual acceptance

- [ ] No uppercase tracked labels anywhere. No Unicode status glyphs.
- [ ] Serif appears only where the design system allows it.
- [ ] Exactly one filled accent button per view (Library has none). An expanded task row in the Plan panel counts as its own view.
- [ ] Accent is used only for the primary action, today, current nav and due marks.
- [ ] Cards only for: next task, day detail, review banner and card, flex panel, add forms.
- [ ] Today at 1440 × 900 shows headline, countdown, journey strip, day progress and the whole next-task card without scrolling. At 375 × 812 the primary button is visible without scrolling.
- [ ] Task titles wrap; nothing is truncated with an ellipsis.
- [ ] Plan shows four week rows with today ringed, both mock days filled, the exam cell last.
- [ ] Official, unofficial and tutor results are each drawn in their own form (anchor bar, hollow trend dots, band pips) and carry their basis mark. An unofficial or tutor result is never drawn against the 160, 180, 200 anchors.
- [ ] Anchor ticks are labelled on the chart; the explanatory caption is not repeated per bar.
- [ ] Dark theme uses the dark tokens (periwinkle accent, no shadows). Theme control works and persists.
- [ ] No horizontal scroll at 375 px on any screen or state. Tap targets at least 44 px on mobile (`sm` buttons and segmented items grow to 44 px below 760 px).
- [ ] Completed day, exam day, review (three steps), empty notebook and no-results filter match their screenshots.
- [ ] Library: Copy works without expanding a row; the aside drops below the main column at 1080 px; the theme control persists across reloads with no flash.
- [ ] Every text and background pair meets 4.5:1 (the token table lists the ratios; do not introduce new pairs).
- [ ] Focus ring visible on every interactive element by keyboard.
- [ ] With `prefers-reduced-motion: reduce`, nothing animates.

### Functional regression (walk each in the browser)

- [ ] `npm test` passes with `lib.test.ts` unmodified. `npm run build` is clean.
- [ ] Done, Skip and Undo on a task today; the next task advances; closing a manually opened task returns to the next one.
- [ ] Score entry: valid values save; an over-maximum or wrong-step value shows the invalid state and is not saved; clearing a field removes the score.
- [ ] Day 2 marking task (`?today=2026-11-17`): all eight part fields; the totals appear on Progress as official Reading and Use of English with anchor bars.
- [ ] Speaking fields accept 0.5 steps and show a mean, no total.
- [ ] Move a task to another date on Plan; it leaves the old day with a "moved to" line and appears on the new one.
- [ ] Add and delete a custom task; the link validation message still appears for a bad URL.
- [ ] A skipped core task from a past day appears under Catch-up; Drop removes it.
- [ ] Three empty past days in a row show the reset notice.
- [ ] Add a mistake with Cmd+Enter; the skill is kept and focus returns to Wrong. Filter by skill and by last 7 days. Copy as notebook lines gives the same text as before.
- [ ] Review: Reveal, Got it and Missed reschedule as before (1, 3, 7 days; Missed back to 1); the queue does not re-serve a missed card in the same session; `#mistakes:review` opens straight into review.
- [ ] Add and delete a manual result; Writing and Speaking are stored as tutor, others as unofficial.
- [ ] Flex allocation text and guards on Progress match the old screen for the same data.
- [ ] Prompt copy from a task and from Library gives the verbatim prompt; GPT-6 and GPT-9 variants still resolve.
- [ ] Export, then Import the same file: the confirm shows the same counts and the state is identical. Import a file exported **before** the redesign: it loads. A malformed file changes nothing and shows the message.
- [ ] Exam day (`?today=2026-12-12`) and after (`?today=2026-12-13`) render.
- [ ] The storage-blocked and unreadable-data alerts still render, and "Start fresh" still asks first.

## Data model and behaviour: confirmed unchanged

Nothing in the final prototype needs a new stored field, a schema change, a new route handler beyond the `#plan:DATE` hash argument, or a change to scoring. Every new visual is derived: the completed-day "min logged" from task minutes and `log`, "Tomorrow" from `DAYS`, the review summary from the session's own counts, the example entry is static markup, and the theme lives in its own `localStorage` key outside `State`. Curriculum text, score specs, anchors, allocation and review scheduling stay exactly as they are.

## Things not to do

- Do not rewrite components from scratch; change markup and classes around the existing hooks and handlers.
- Do not add features that are not in the blueprint (streaks, charts of predicted scores, badges, sounds).
- Do not predict or combine scores in any new visual.
- Do not add dependencies without asking the user. Google Fonts is a `<link>`, not a dependency.
- Do not build the prototype's state selector or its floating Theme button.
- Do not use em dashes in interface copy.
- Do not commit or push unless asked.
