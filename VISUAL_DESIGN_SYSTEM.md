# Visual design system: "Ink and Paper"

The reference implementation of every token and component below is `design/prototype.html`. Where this document and the prototype disagree, the prototype's CSS wins for values and this document wins for rules.

## 1. Direction

Two directions were considered.

| | A. Ink and Paper (chosen) | B. Night Desk |
|---|---|---|
| Idea | A well-set study journal. Serif for language, sans for interface, one ink-blue accent, near-black for everything finished. | A Linear or Raycast style instrument. Dark first, one grotesk, cool graphite, dense rows, a bright accent. |
| Strengths | The content is sentences: task instructions, objectives, wrong and corrected phrases. A serif gives them weight and makes the mistake notebook feel like a notebook. Calm in long sessions. Light and dark are equally natural. | Very crisp. Excellent density for the Plan and Progress screens. Dark mode is the hero. |
| Weaknesses | Needs discipline: a serif in the wrong place (buttons, labels, data) looks precious. | Reads as a developer tool. Long task prose and mistake pairs look like log lines. Motivation becomes metrics. Light mode would be the afterthought. |

A is chosen because this product is about reading and writing English for 26 days. The interface should look like it cares about sentences.

**Scene.** One student at a desk with a MacBook, 60 to 100 minutes on most days, often in the evening, sometimes a phone on the sofa for the mistake review. Both themes get real use, so the theme follows the system with a manual override.

**Colour strategy.** Restrained. Neutrals carry about 90% of every screen. Ink (near-black) means "done" and "data". Ink blue means "now" and "act". Three status colours appear only on status marks.

## 2. Colour tokens

Contrast ratios were computed (WCAG 2) against `bg` unless stated.

### Light

| Token | HEX | Use | Contrast |
|---|---|---|---|
| `bg` | `#F4F3EF` | Page | |
| `surface` | `#FCFBF9` | Raised: next-task card, day detail, inputs, tab bar | |
| `sunken` | `#ECEAE4` | Recessed: active nav item, tags, past day cells, chart tracks, segmented control | |
| `line` | `#DEDBD3` | Dividers, card borders | decorative |
| `line-strong` | `#C9C5BB` | Button borders, empty check circles, future journey bars | decorative |
| `field` | `#8E8C85` | Borders of inputs, selects, textareas | about 3:1 |
| `ink` | `#1B1C1F` | Primary text, done states, chart fills | 15.4 |
| `ink-2` | `#4A4B50` | Secondary text, section titles | 7.8 |
| `ink-3` | `#686970` | Meta text, placeholders | 4.9 (4.5 on `sunken`) |
| `accent` | `#2A45C9` | Primary button, today, current nav icon, due marks, focus ring | 6.8 |
| `accent-hover` | `#2139AD` | Primary button hover | |
| `accent-soft` | `#E6E9F8` | Review banner, focus halo | accent on it: 6.2 |
| `on-accent` | `#FFFFFF` | Text on accent | 7.5 |
| `secure` / `secure-soft` | `#2C7A4B` / `#E3F0E7` | Secure label, completed review steps | 4.7 |
| `borderline` / `borderline-soft` | `#9A5B00` / `#F6EBD6` | Borderline label, overdue dot, warnings | 4.9 |
| `priority` / `priority-soft` | `#B93A26` / `#F8E4DF` | Priority label, strike-through on wrong text, errors | 5.1 |

### Dark

Chosen for dark, not inverted: the accent becomes a soft periwinkle so a filled button does not outshine text, and status colours are desaturated.

| Token | HEX | Contrast on `bg` |
|---|---|---|
| `bg` | `#131416` | |
| `surface` | `#1B1C1F` | |
| `sunken` | `#0E0F10` | |
| `line` | `#2E2F34` | |
| `line-strong` | `#3F4047` | |
| `field` | `#6B6C74` | about 3:1 |
| `ink` | `#ECEAE4` | 15.3 |
| `ink-2` | `#B5B3AD` | 8.8 |
| `ink-3` | `#8C8B87` | 5.4 (5.0 on `surface`) |
| `accent` | `#8FA2FF` | 7.7 |
| `accent-hover` | `#A6B5FF` | |
| `accent-soft` | `#1E2440` | |
| `on-accent` | `#10142B` | 7.6 on accent |
| `secure` / soft | `#6CC08B` / `#16271D` | 8.4 |
| `borderline` / soft | `#E0A84E` / `#2B2213` | 8.7 |
| `priority` / soft | `#F0836F` / `#2E1915` | 7.2 |

### Colour rules

- One filled accent button per view. If a second action competes, it is outlined.
- Accent is never used for the corrected text of a mistake, for chart fills, or for decoration.
- Status colours appear only as: the 8 px dot plus label of a status mark, the overdue dot, the review step pips (secure), the strike-through line on wrong text (priority), warning and error message text.
- Done is ink, not green. Finished work looks like ink on the page.
- No gradients except the two-stop hard gradient used to draw a half-filled bar or pip.

## 3. Typography

| Role | Family | Fallback stack |
|---|---|---|
| Reading and display | **Newsreader** (variable, optical size 6 to 72, weights 400 and 500, italic 400) | `Charter, "Iowan Old Style", Georgia, serif` |
| Interface | **Schibsted Grotesk** (400, 500, 600) | `system-ui, -apple-system, "Segoe UI", sans-serif` |
| Code (task ids only) | system mono | `ui-monospace, SFMono-Regular, Menlo, monospace` |

Loaded from Google Fonts with `display=swap`; the fallback stacks above keep the app readable offline. Self-hosting is out of scope for the first implementation.

**Where the serif is allowed:** screen titles, the day objective, the next-task title, week names, mistake pairs and the review card, large numerals (countdown, section scores), the wordmark. **Never** in buttons, labels, inputs (except the two mistake composer fields), navigation, tags, tables or captions.

### Scale (fixed px, no fluid sizing)

| Token | Size / line height | Family, weight | Use |
|---|---|---|---|
| `display` | 56 / 0.9, tracking -0.03em | serif 500 | Countdown numeral (40 on mobile) |
| `title` | 34 / 1.15, tracking -0.015em | serif 500 | Screen title, day objective, big score (26 on mobile) |
| `heading` | 24 / 1.25, tracking -0.01em | serif 500 | Next-task title (21 on mobile) |
| `subheading` | 22 / 1.25 | serif 500 | Skill names, day detail title, flex headline |
| `reading` | 19 / 1.35 | serif 400, correct text 500 | Mistake pairs |
| `lead` | 17 / 1.4 | serif 400 | Week names, review peek, composer fields |
| `body` | 15 / 1.5 | sans 400 | Default text, task titles |
| `ui` | 14 / 1.4 | sans 500 | Buttons, nav, inputs |
| `meta` | 13 / 1.4 | sans 400 or 600 | Section titles (600, `ink-2`), captions, minutes |
| `micro` | 12 / 1.3 | sans 400 or 500 | Tags, journey labels, rail footer |
| `tick` | 11 / 1.2 | sans 400 or 600 | Chart tick labels, tab bar labels, "Mock 1" |

Rules: nothing below 11 px, and 11 px only for chart ticks and tab labels. Headings use `text-wrap: balance`, prose uses `text-wrap: pretty`. Prose is capped at 60ch. `font-variant-numeric: tabular-nums` on integers in aligned columns (minutes, counts, scores out of a maximum), not on decimals such as band values.

**Section titles replace the uppercase label.** A section title is 13 px, weight 600, `ink-2`, sentence case, with an optional count in weight 400 `ink-3` beside it ("Review due 3"). No uppercase, no letter-spacing, anywhere.

## 4. Space, shape, depth

- **Spacing scale (px):** 4, 8, 12, 16, 20, 24, 28, 32, 40, 48. Inside a component use 8 to 16. Between a section title and its content use 12. Between sections use 28 to 40. Rhythm should vary: tight inside groups, generous between them.
- **Radii:** 4 (tags, code, small pips), 8 (buttons, inputs, nav items, day cells, segmented control), 12 (the three raised panels: next-task card, day detail, review banner and flex panel). Circles only for check marks, dots and pips. Nothing larger than 12.
- **Borders:** 1 px `line` for dividers and panel borders. 1 px `line-strong` for buttons. 1 px `field` for inputs. Lists are separated by a top border on each row, not by cards.
- **Shadow:** exactly one, on raised panels in light mode: `0 1px 0 rgba(27,28,31,.04), 0 12px 28px -16px rgba(27,28,31,.18)`. In dark mode there is no shadow; `surface` against `bg` plus the border carries the elevation.
- **Cards:** only for the single thing the screen is about (next task, selected day, review card, flex recommendation). Never nested. Never in a repeated list.
- **z-index scale:** `tabbar` 40, `overlay` 50 (nothing else is layered).

## 5. Icons

Lucide-style line icons, 24 px view box, drawn at 18 px (22 px in the tab bar), stroke 1.6, round caps and joins, `currentColor`. The set is closed: sun (Today), calendar (Plan, also "move to another day"), pencil-line (Mistakes), line chart (Progress), book (Library), arrow-up-right (external link), check, arrow-right, copy, plus, trash, more (three dots), chevron-down. Path data for the first nine is in the prototype's `ICONS` object. Icons accompany a text label except: the check inside a check circle, and the calendar-only "move" button, which carries an `aria-label`.

## 6. Components

All measurements are desktop; mobile overrides are in section 9.

### Buttons
| Variant | Look | Use |
|---|---|---|
| `primary` | fill `accent`, text `on-accent`, no visible border | The one main action |
| default | fill `surface`, border `line-strong`, text `ink` | Secondary actions |
| `ghost` | no fill, no border, text `ink-2` | Tertiary (Skip, Cancel, Undo) |
| sizes | `sm` 30 px, default 36 px, `lg` 44 px high; padding 10, 14, 18 | `lg` only inside the next-task card and review |

States: hover (primary to `accent-hover`; default border to `ink-3`; ghost gets `sunken` fill), active (translate down 1 px), focus-visible (2 px `accent` outline, 2 px offset), disabled (opacity 0.5, no pointer). Radius 8. Weight 500. An icon sits 8 px from the label.

### Inputs
36 px high, radius 8, fill `surface`, border `field`, 14 px text. Hover: border `ink-3`. Focus: border `accent` plus a 3 px `accent-soft` halo (this replaces the outline on inputs). Invalid (`aria-invalid="true"`): border `priority`. Placeholder `ink-3`. Score inputs are 56 px wide, right-aligned, tabular.

### Check circle (task status)
20 px circle. Open: 1.5 px `line-strong` border. Done: `ink` fill with a 12 px check in `bg`. Skipped: dashed border. Dropped: `line` border with a 12 px x in `ink-3`. The accessible status name stays in an `sr-only` span as today.

### Task row
Grid: 24 px check, flexible text, right-aligned minutes. 14 px vertical padding, top border `line`. Title 15 px `ink`, wraps to as many lines as it needs. Second line 13 px `ink-3`: skill, core or optional, and any "from" or "skipped" date. Done: title `ink-3` with a `line-strong` strike-through. The whole row is the expand button.

### Tag
22 px high, radius 4, fill `sunken`, 12 px weight 500 `ink-2`. For error types and "light".

### Status mark
8 px dot plus 13 px weight 600 label, both in the status colour: Secure, Borderline, Priority. "(provisional)" follows in weight 400 `ink-3`.

### Basis mark
A 14 × 8 px glyph plus a 12 px label. This is how the three result classes are told apart everywhere, by shape as well as words:
- **Official:** solid `ink` block.
- **Unofficial:** dashed outline.
- **Tutor:** two dots.

### Segmented control
`sunken` track with 2 px padding, radius 8. Items 30 px high, radius 6, 13 px weight 500 `ink-2`. Selected: `surface` fill, `ink` text, a 1 px soft shadow. Uses `aria-pressed`.

### Navigation
Desktop rail item: 36 px high, radius 8, icon plus 14 px weight 500 label in `ink-2`. Current: `sunken` fill, `ink` label, icon in `accent`. Count badge right-aligned in `accent`, 12 px weight 600. Mobile tab bar item: 22 px icon above an 11 px label, `ink-3`; current in `accent`.

## 7. Progress indicators and charts

- **Journey strip.** 26 vertical bars in four week groups (gap 4 px inside a week, 14 px between weeks), bottom-aligned, then an "Exam" ring. Bar height encodes planned minutes, capped at 110 minutes equals full height, minimum 18%. Fill: all tasks done `ink`; some done, a hard split `ink` below and `line-strong` above; today `accent` with a 5 px dot beneath; future `line-strong`. Mock days carry an 11 px "Mock 1" or "Mock 2" label above. Week labels sit under the baseline. Radius 3.
- **Day progress bar.** One 6 px segment per task for today, width proportional to minutes, 3 px gap. Done `ink`, the next task `accent`, the rest `line-strong`. Text either side: "1 of 4 done" and "75 min left".
- **Day cell dots.** 6 px circles, one per task: done `ink`, overdue `borderline`, open outlined.
- **Review step pips.** Three 14 × 4 px bars; completed steps in `secure`.
- **Anchor bar (official results only).** A 10 px `sunken` track with an `ink` fill to the score. Ticks cross the track 6 px above and below, 1.5 px wide, each **labelled directly above**: "160 · B2", "180 · C1" (weight 600, `ink`), "B est." (dotted tick), "200". The score sits under the end of the fill in 12 px weight 600. No caption paragraph under each bar; the two caveats appear once in the page footer.
- **Trend (unofficial results only).** Hollow 11 px circles positioned by percent correct above a dashed baseline, date under each. Never a filled bar, never drawn against the anchors.
- **Band pips (tutor results only).** Five 10 px circles per criterion, filled to the band, half-filled for .5 values, with the number beside them.
- **Gap bars (flex allocation).** 6 px `ink` bars, widest equals the largest gap, value at the right.
- Every chart keeps a `role="img"` and an `aria-label` that states the numbers, as the current anchor bar does.

## 8. Motion

| What | Duration | Easing |
|---|---|---|
| Hover colour and border | 120 ms | linear |
| Button press | 120 ms | `cubic-bezier(.25,1,.5,1)` |
| Check circle fill and check draw on Done | 240 ms | same |
| Day progress segment and journey bar changing state | 320 ms | same |
| Expand or collapse a task or prompt (opacity plus a `grid-template-rows` 0fr to 1fr reveal) | 180 ms | same |
| Screen change | none | |

No page-load choreography, no bounce, no parallax, no scroll effects. Under `prefers-reduced-motion: reduce` every transition is removed. Completing the last task of the day changes the text to "Done for today." and fills the journey bar; that is the whole celebration.

## 9. Responsive rules

| Width | Layout |
|---|---|
| 1081 px and up | Left rail 216 px, content max 1280 px, two-column screens (Today 1fr + 312, Plan 1fr + 360) |
| 761 to 1080 px | Rail stays, second columns drop below the first, day detail is no longer sticky |
| 760 px and below | Rail hidden, fixed bottom tab bar, 16 px side padding, single column |

Mobile overrides: buttons and inputs at least 44 px high (`sm` 36), tab bar items at least 48 px, the countdown shrinks to 40 px, titles to 26 px, the two main buttons in the next-task card share the row equally, day cells centre their content and drop the minutes line, mistake meta moves under the pair, bottom padding leaves room for the tab bar plus `env(safe-area-inset-bottom)`. No horizontal scrolling anywhere.

## 10. Theme handling

`:root` holds the light tokens. Dark tokens apply under `@media (prefers-color-scheme: dark)` when the root has no `data-theme="light"`, and under `:root[data-theme="dark"]`. A three-way control in Library (System, Light, Dark) sets or removes `data-theme` and stores the choice in its own `localStorage` key, separate from the app state.
