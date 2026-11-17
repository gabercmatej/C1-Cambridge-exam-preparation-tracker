# Design audit: C1 Prep as built

Inspected 17 Nov 2026 in a real browser: all five screens at 1440 × 900 (light), Today and Progress at 390 × 844 (dark), with demo data previewed as Day 9. Before screenshots are in `design/screenshots/before-*.png`. Not inspected in a browser: Plan, Mistakes and Library on mobile, Plan, Mistakes and Library in dark, the review session, the exam-day screen, the error banners. Findings for those come from reading the components.

## Verdict

The app is well built and honest, and it looks like a default. Nothing is broken. What makes it feel generic is that no visual decision was ever made: one font size does most of the work, the page is a single narrow column, and the things that should motivate you (the countdown, the 26-day journey, today's progress) are rendered as lines of grey text.

## Why it reads as generic

1. **One column, 760 px wide, on a 1440 px screen.** Half the MacBook display is empty margin on every screen (`max-w-[47.5rem]` in `App.tsx`). Today stacks seven sections vertically, so review, catch-up and the note sit below the fold while the sides are blank.
2. **No typographic hierarchy.** System font throughout. Task text, objective, plan rows, mistake text and body copy are all 16 px regular. The only heading is 24 px semibold. Screen titles ("Plan", "Progress") are labels, not content.
3. **Uppercase tracked labels carry all the structure.** `NEXT`, `REVIEW DUE (3)`, `CATCH-UP (2)`, `NOTE FOR TODAY`, `WRONG / CORRECT / WHY`, `BACKUP`, `CHATGPT TUTOR PROMPTS`. The `.label` class is used about 20 times. This is the most recognisable template tell in the app.
4. **The palette is the 2026 default.** Cream page (`#faf9f6`), white cards, one teal (`#0f6b5c`). Competent, and identical to a thousand generated dashboards.
5. **Nothing is drawn.** Status is a Unicode glyph (`○ ✓ ↷ ×`). There are no icons, no progress indicator for the day, no picture of the 26 days. The only graphic in the whole app is the anchor bar on Progress.
6. **Cards are used for forms, not for emphasis.** The one card on Today appears only because a row is expanded. Mistakes is a form card followed by a stack of identical cards.

## Screen by screen

### Today
- The headline is "Day 9". It says nothing. The objective, which is the actual content, is a grey sentence under it.
- The countdown is `18 days to the exam (12 Dec)` in 14 px grey, top right. The single most motivating number in the product has the visual weight of a timestamp.
- The next task does not look like the next task. It is an expanded list row with an uppercase meta line and 16 px body. The filled button is "Done", but the first thing you need is to open the exercise, and the link only appears inside the task text.
- Collapsed tasks truncate to one line. On mobile that leaves about 20 characters ("Essay 2: GPT-2 diagnosis → self-co..."), so you cannot tell tasks apart without opening them.
- No daily progress: nothing says "1 of 4 done, 75 minutes left".
- "Done when / Record / Emergency" is a three-line paragraph of bold-plus-grey that reads like a footnote.
- "Move to" with a native date input is always visible next to Done and Skip, giving a rare action the same prominence as the main ones.
- Good, keep: the auto-opened next task, the keep-order catch-up, the three-days-lost notice, the backup reminder.

### Plan
- 26 near-identical rows under four uppercase labels. Weeks have no shape; mock days are only a small tag at the far right; light days look the same as full days.
- Rows without a title show the objective in sentence case, rows with a title show the title. The mix reads as inconsistent data.
- "5/5 done" is text. Completion is not visible at a glance.
- Past days are greyed by text colour only, so the list looks faded rather than accomplished.
- Good, keep: one day open at a time, late logging on past days, the "moved to" line.

### Mistakes
- It opens with a five-field form in a card. The screen says "data entry", not "notebook".
- Wrong / Correct / Why are 14 px lines with uppercase prefixes. The pair, which is the whole point, has no typographic presence. The correction is teal, the same colour as buttons and links.
- Six bordered filter buttons, a checkbox, and a "Copy 5 as notebook lines" button wrap onto two ragged rows.
- "Due today: 3" is plain text beside the title.
- "Delete" is an underlined link on every card.
- Good, keep: the reveal-then-grade flow, Cmd+Enter with sticky skill, the notebook-line export.

### Progress
- Each official result is a bar with four unlabeled ticks, followed by a two-line caption that explains what the ticks mean. The same caption repeats under every bar. The chart needs its legend read three times.
- Status is coloured bold text ("Borderline", "Priority") repeated in the heading and again in the row.
- The three result classes (official, unofficial, tutor) are distinguished only by sentences of small print. Visually a tutor row and an unofficial row are the same.
- Writing bands are one run-on line: "Task 1 Content 4 · Task 1 Communicative Achievement 3 · ...".
- There is no practice-activity view and no overview: you scroll five sections to learn where you stand.
- Good, keep: the refusal to predict a score, the anchor concept, the flex allocation and its guards.

### Library
- The first thing on the screen is a Backup card with two settings inputs. The library looks like a settings page.
- Sixteen identical `<details>` rows with browser-default triangles. Prompts, resources and reference are told apart only by uppercase labels.
- Copying a prompt takes two steps: expand, then find the button inside the body.
- Good, keep: the sealed Test B warning, verbatim prompts parsed from the plan.

### Navigation and shell
- Top text tabs with an inverted black pill for the active one. Fine on desktop, but on mobile five tabs fill the full width at 14 px with tap targets about 36 px high, at the top of the screen where the thumb is not.
- No theme control: dark follows the system only.
- No persistent sense of place in the plan outside Today.

### Dark mode
- A straight inversion that works. The teal becomes a mint (`#5cc2ad`) filled button, which is the brightest thing on screen and pulls the eye from the task text. Warn text in amber on near-black is the second brightest. Hierarchy flips: buttons and warnings outrank content.

## Priorities

| # | Change | Why first |
|---|---|---|
| P0 | New tokens, two typefaces, type scale | Every screen improves at once |
| P0 | Shell: left rail on desktop, bottom tab bar on mobile, wider content grid | Fixes the empty-screen problem and mobile reach |
| P0 | Today: objective as headline, countdown, journey strip, next-task card with "Open exercise", day progress | The screen you see daily |
| P1 | Task rows that wrap, drawn check states, replace `.label` | Removes the two biggest tells |
| P1 | Plan as four week rows of day cells with a detail panel | Turns a list into a calendar |
| P1 | Mistakes: review banner, serif pair rows, one-line composer | Makes it a notebook |
| P2 | Progress: labelled anchor bar, basis marks, band pips, overview column | Makes scoring legible |
| P2 | Library: prompts with row-level Copy, data controls moved to the end | Stops it reading as settings |
| P3 | Motion, theme toggle, review keyboard keys | Polish |

## Worth preserving exactly

- All logic in `src/lib/` and `src/data/`: scheduling, review intervals, flex allocation, score specs, storage, backup validation.
- `nextAction` driving which task opens.
- The copy that states rules (keep-order, three lost days, sealed Test B, "no predicted score"). It is precise and well written. Restyle it, do not rewrite it.
- Accessibility already present: `aria-expanded`, `aria-current`, `aria-invalid`, `role="img"` with a text label on charts, `sr-only` status names, visible focus ring.
- Hash routing (`#today`, `#mistakes:review`) and `?today=` preview.
