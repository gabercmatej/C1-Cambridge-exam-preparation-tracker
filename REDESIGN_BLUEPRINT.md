# Redesign blueprint

Screen-by-screen layout for the "Ink and Paper" direction. Tokens and component specs are in `VISUAL_DESIGN_SYSTEM.md`. Open `design/prototype.html` in a browser alongside this document. All five screens and the key states are mocked there, in both themes and at both widths. The selector at the bottom right jumps between states; you can also use the hash directly: `#today`, `#today:done`, `#today:exam`, `#plan`, `#mistakes`, `#mistakes:review`, `#mistakes:empty`, `#progress`, `#library`. On Plan, click a task in the day panel to expand it. On Mistakes, pick Listening in the filter to see the no-results state. The Theme button and the Library theme control both switch theme. The selector and Theme button are prototype tools only; do not build them.

Where this document and the prototype disagree, the prototype wins for visuals (sizes, spacing, colour) and this document wins for behaviour and data.

Reference screenshots: `design/screenshots/after-*.png` (new) and `before-*.png` (current).

Every piece of data and every action named below already exists in the app. Where a screen shows something new, it is derived from existing state and the derivation is given.

## Shell

```
Desktop (>760)                              Mobile (<=760)
+--------+-------------------------------+  +----------------------+
| C1 Prep|                               |  |                      |
|        |   screen content              |  |   screen content     |
| Today  |   padding 36 / 40 / 96        |  |   padding 20 / 16    |
| Plan   |                               |  |                      |
| Mistakes 3                             |  |                      |
| Progress                               |  +----------------------+
| Library|                               |  | Today Plan Mist Prog Lib |
|        |                               |  +----------------------+
| backup |                               |
+--------+-------------------------------+
  216 px    up to 1064 px
```

- **Rail:** sticky, full height, right border `line`. Wordmark "C1 *Prep*" (serif 20 px, "Prep" italic in accent). Five nav items. The Mistakes item shows the due count as a badge when it is above zero.
- **Rail footer:** "Saved in this browser. Last backup N days ago." and an "Export backup" text button calling the existing `downloadBackup`. When the backup is 7 or more days old the sentence turns `borderline`. This replaces the backup reminder at the bottom of Today on desktop; on mobile the reminder stays at the bottom of Today as now.
- **Tab bar (mobile):** fixed bottom, `surface`, top border, five icon-over-label items. No badge; the due count is on Today.
- The load-error and storage-blocked alerts keep their copy and sit at the top of the content area as a full-width notice: `priority-soft` fill, 12 px radius, `priority` bold lead-in, no border stripe.

## A. Today

### Desktop composition

```
Tuesday 24 November · Day 9 of 26 · 85 min                        18
Close the essay cycle;                                days to the exam
timed long-text reading.                                    Sat 12 Dec

▂▆▅▆▆▇▃  ▄█▅▅▃ M1▅  ▅▅▅▆▃ M2▅  ▅▅▅▂▁  ○ Exam        <- journey strip
Week 1    Week 2     Week 3     Week 4
-----------------------------------------------------------------------
1 of 4 done  ▬▬ ▬▬▬▬▬▬▬ ▬▬▬▬▬▬ ▬▬  75 min left   |  Review due 3
+--------------------------------------------+   |  "She insisted to pay..."
| Next · Reading · Core · 35 min             |   |  [Start review ->]
| Flo-Joe Reading Test 1, Parts 5 and 6      |   |  ----------------------
| Timed, 27 minutes. Then highlight ...      |   |  Today's brief
| [Open exercise ↗] [✓ Done]     Skip  [cal] |   |  Done when ...
| ------------------------------------------ |   |  Record ...
| Record your result  ┄ Unofficial practice  |   |  Short on time? 30 min
| Part 5 [  ]/6   Part 6 [  ]/4              |   |  ----------------------
| [ Note ...                               ] |   |  Note for today
+--------------------------------------------+   |  [                    ]
Today  4 tasks
(✓) Notebook review                    10 min
( ) Essay 2: GPT-2 diagnosis ...       30 min
( ) Speaking shadow test ...           10 min
Catch-up  2 missed core tasks, at most 45 min a day
(┄) FJ Reading Test 1 Part 7 ...       15 min
```

Grid: main column `minmax(0,1fr)`, aside 312 px, gap 48 px.

### Elements, top to bottom

1. **Meta line** (13 px `ink-3`): full weekday and date, "Day N of 26", the day's duration. Before the start date append "starts Monday" as now.
2. **Headline** (serif 34): the day's objective with its first letter capitalised. When the day has a title, show the title as the headline and the objective as a 15 px `ink-2` line beneath. On mock days prefix the meta line with "Mock exam" in weight 600 `ink`; no filled badge.
3. **Countdown** (right, bottom-aligned with the headline): the number in serif 56, then "days to the exam / Sat 12 Dec" in 13 px `ink-3`. Singular "day" at 1. If `settings.speakingAt` is set, add a third line "Speaking: {value}" in `ink-2`.
4. **Journey strip.** Spec in the design system, section 7. Data: for each of `DAYS`, height from the sum of its tasks' minutes (use the parsed task minutes, not the heading text), state from `tasksOn(date, s)`: all logged done gives done, at least one done gives partial, date equals today gives today, otherwise future. `kind === 'mock'` adds the label. Each bar has a `title` of "Day N · X min". The strip as a whole is one `role="img"` with a sentence label. Each bar is a button that calls `go('plan')` with that day opened (Plan already accepts an open day in local state; pass the date as the hash argument, `#plan:2026-11-28`, and read it the way Mistakes reads `review`).
5. **Day progress row.** "K of N done", the segmented bar, "M min left" (sum of minutes of today's tasks with no status). Hidden when there are no tasks today.
6. **Next-task card.** Rendered for the task `nextAction` returns when its kind is `task` or `catchup`. It is the existing expanded `TaskRow` content, restyled:
   - Row 1: "Next" in accent weight 600 (or "Catch-up" in `borderline` for a catch-up task), then skill, "Core" or "Optional" or "Added by you", minutes.
   - Title (serif 24): the task text up to its first sentence break or link, as plain text. Body (15 px `ink-2`): the full task text through the existing `Inline` renderer, links underlined in `line-strong`, accent on hover. If splitting title from body is not clean for a task, render the whole text as the body and use "{skill}, {minutes} min" as the title. Do not edit the plan text.
   - **Actions.** If the task text contains at least one link: "Open exercise ↗" is the `primary lg` button and opens the first link in a new tab; "Done" is a default `lg` button with a check icon. If there is no link: "Done" is the `primary lg` button. Then a spacer, then ghost "Skip" (or "Drop" for catch-up, or "Undo" once logged) and a ghost icon button that reveals the existing "Move to" date input inline beneath the actions. "Delete" for custom tasks is a ghost button in the same group.
   - Copy buttons for prompts (`promptRefs`) and the Day 1 email sit in a row above the actions as default `sm` buttons with a copy icon: "Copy GPT-2".
   - "Flex by the rule" line for flex tasks: 13 px section title plus the `flexLine` text in 15 px.
   - **Record block** (only when `SPECS[t.id]` exists), separated by a top border: "Record your result" in weight 600, the basis mark with its short caption, then the score inputs in a wrapping row, then the note input. The longer caption text (marks versus question counts, band steps) stays, as a 12 px `ink-3` line under the inputs. Invalid inputs show the `priority` border as now.
   - When `nextAction` is `review`: the card shows "Next · Review", the title "{count} mistakes to review", and one primary button "Start review".
   - When it is `done`: no card. In its place, a single serif 24 line, "Done for today.", with a 15 px `ink-2` line under it: "Day N of 26 complete. {days} days to go."
7. **Today list.** Section title "Today" with the task count. All of today's tasks as task rows, including the one shown in the card (marked by its accent segment in the progress bar, not duplicated styling). Clicking a row makes it the card's subject, exactly as `openId` works now; closing returns to the next task.
8. **Catch-up list** (only when non-empty). Section title "Catch-up" with "{n} missed core tasks, at most 45 min a day". Rows show "skipped {date}" or "from {date}" on the second line. The existing "more than three" warning appears under the title in `borderline` text.
9. **Three-days-lost notice:** full-width notice above the day progress row, `borderline-soft` fill, 12 px radius, existing copy.

### Aside

- **Review due.** Title with count. If above zero: the wrong text of the first due mistake as a struck-through serif 17 line (a real prompt to recall it), then a default button "Start review →" going to `#mistakes:review`. If zero: "Nothing due. New mistakes come back tomorrow."
- **Today's brief.** `DayInfo` as a definition list: term in 13 px weight 600 `ink-2`, description in 13 px `ink-2` on the next line. Terms: "Done when", "Record", "Short on time? {minutes}".
- **Note for today.** The existing textarea, 3 rows.

### Mobile composition

Single column in this order: meta, headline with the countdown to its right (40 px numeral), journey strip (bars flex to fit, week gap 8 px, "Exam" label hidden, ring kept), day progress, next-task card (20 px padding; Open and Done share the first row equally, Skip and Move on a second row), Today list, Catch-up, Review due, Today's brief, Note, backup reminder. The primary button must be visible without scrolling on a 375 × 812 screen.

### Completed day (`#today:done`)
When `nextAction` is `done`, the next-task card is replaced by a quiet close, not a celebration:
- Day progress row stays, all segments `ink`, and the right label becomes "{minutes} min logged".
- "Done for today." in serif 28, then "Day N of 26 complete. {days} days to go." in 15 px `ink-2`.
- Under a top border: a "Tomorrow" block. Meta line "Tomorrow · {weekday date} · {duration}", the next day's objective in serif 19 (max 40ch), and a default button "See it on Plan →" that opens Plan with that day selected (`#plan:YYYY-MM-DD`). On the last plan day, show "Tomorrow is the exam." in place of the block.
- The Today list keeps every task, all checked and struck through. Catch-up is hidden when empty, as now.
- In the aside, "Review due 0" with "Nothing due. New mistakes come back tomorrow."
- No confetti, no streaks, no badges.

### Exam day and after (`#today:exam`)
Same shell. No strip, no countdown, no aside. Content width 720 px.
- Meta line: "Saturday 12 December", plus " · Speaking: {settings.speakingAt}" when set.
- "Exam day" in serif 34, then one 15 px `ink-2` line: "Nothing to study today. One reminder per paper, in the order you will sit them."
- One row per paper, split from `EXAM_DAY` at the paper names (the split regex in `Today.tsx` already does this). Each row has a top border and a 168 px left column with the paper name in serif 17 weight 500 and its duration in 13 px `ink-3` beneath (90, 90, about 40, 15 min). The right column has the advice in serif 17 at line height 1.5. On mobile the columns stack.
- After the exam: "Exam done" headline and the existing sentence linking to Progress and Library, in the same lede style.

## B. Plan

### Desktop composition

```
The 26 days                                          [Add task]
The calendar never shifts. Past days stay open ...

Week 1  Baseline, then start        6 of 7 days   +----------------------+
[16][17][18][19][20][21][22]                      | Tuesday 24 Nov · Day 9|
Week 2  Technique and volume        In progress   | Close the essay cycle |
[23][24*][25][26][27][M1][29]                     | (✓) Notebook review   |
Week 3  Targeted improvement                      | ( ) FJ Reading ...    |
[30][ 1][ 2][ 3][ 4][M2][ 6]                      | ( ) Essay 2 ...       |
Week 4  Consolidation                             | Done when / Record    |
[ 7][ 8][ 9][10][11][Exam]                        +----------------------+
```

Grid: calendar `minmax(0,1fr)`, detail panel 360 px sticky at 36 px from the top, gap 40 px.

- **Week header:** "Week N" in serif 17, the phase name in serif italic `ink-3` (from the existing `WEEKS` strings, split at the dot), and at the right "K of 7 days complete" or "In progress" for the current week, nothing for future weeks.
- **Day cell** (a button, min height 84 px, radius 8): weekday (12 px `ink-3`), date number (serif 22), duration (12 px), task dots. Top right: "light" for light days.
  - Past: `sunken` fill, no border. Future: transparent, `line` border. Today: 2 px accent ring, weekday replaced by "Today" in accent. Selected: `surface` fill, `ink` border (accent if it is today). Mock: `ink` fill, `bg` text, first line "Mock 1" or "Mock 2". Hover: border `ink-3`.
  - Dots: one per task from `tasksOn`; done filled, `isOverdue` in `borderline`, others outlined. More than six tasks: show five and "+n".
  - Final cell of week 4: the exam, dashed border, "Sat 12 / Exam", not a button.
  - `aria-label` per cell: "Tuesday 24 November, day 9, 1 of 4 done, today". `aria-pressed` for the selected one.
- **Detail panel** (raised, 12 px radius): meta line, the objective or title in serif 22, then the day's task rows using the same `TaskRow` as today (expanding one shows its full content inline in the panel, see "Expanded task row" below), then the "moved to" lines, then `DayInfo` as on Today. Default selection is today (as `openDay` is now).
- **Add task:** the existing form opens inside the detail panel above the task list, with the date defaulting to the selected day. Same fields, same validation.
- Arrow keys move the selection between cells; Enter or Space selects.

### Expanded task row
Prototyped in the Plan panel (click "Essay 2"). This is the `row` variant of `TaskRow` when open.
- Each row ends with a 14 px chevron after the minutes; it rotates 180 degrees when open (180 ms, `--ease`). The open row's title goes to weight 500. The row has `aria-expanded`.
- The content is indented 36 px to line up with the title (0 on mobile), 20 px bottom padding: the full task text in 14 px `ink-2`, then prompt copy buttons (`sm`, copy icon, "Copy GPT-2"), then actions: "Done" as the primary button (default size here, not `lg`), ghost "Skip", ghost move icon. Only one primary button is visible at a time, so the Next card on Today never sits next to an open row with its own primary.
- Record block as on the card, but the score fields are a single column of label and 56 px input pairs (max 280 px wide), because the panel is narrow. The 12 px `ink-3` caption follows the note input.
- Every task row, done or not, has a check circle. An empty circle carries the check glyph in `transparent`, so the fill-in on Done is a colour change, not a layout change.

### Mobile composition
The four week rows stay as 7-column grids (cells about 46 px wide, centred, weekday, date, dots; duration hidden; mock cells show "Mock 1" above the date in 10 px, never wrapping). The detail panel is not sticky: it renders directly under the week row that contains the selected day, so the tapped day and its tasks are on screen together. Selecting a day scrolls the panel into view only if it is outside the viewport.

## C. Mistakes

### Desktop composition

```
Mistake notebook
Only errors you could repeat, not slips. Three to eight a day is normal.

+--------------------------------------------------------------+
| 3   due for review today                    [Start review ->] |
|     About two minutes. Say the correction first, then check.  |
+--------------------------------------------------------------+
[ What you wrote or chose      ] -> [ The correct version      ]
[ Why (the rule)        ] [Use of English v] [Error type] [Add]
Cmd+Enter saves and keeps the skill for the next one.

(All 5 | Reading | Use of English | ...)        [Copy 5 as notebook lines]
preposition 1  collocation 1  register 1 ...

She insisted to pay for dinner (struck)                 preposition
She insisted on paying for dinner                    Use of English
insist on + -ing                                          Due today
                                                    ▬▬▬ step 1 of 3
```

- **Review banner** (only when the due count is above zero): `accent-soft` fill, 12 px radius, the count in serif 34 accent, one bold line and one helper line, primary `lg` button. The helper estimates 40 seconds per item, rounded up to the minute. When nothing is due: no banner; a 13 px line "Nothing due today. Next review {earliest dueOn}."
- **Composer.** Same form, same field names, same submit and Cmd+Enter behaviour. Row 1: Wrong and Correct as 48 px serif 17 inputs with an arrow between them. Row 2: Why, Skill select, Error type with its datalist, and a default "Add" button. Row 2 is always visible on desktop.
- **Toolbar.** Segmented control for the skill filter, with the total in the first item ("All 5"). The "Last 7 days" checkbox becomes a second two-item segmented control ("All time", "Last 7 days") beside it. "Copy N as notebook lines" is a default `sm` button with a copy icon, right-aligned. The existing GPT-8 and GPT-5 sentence stays as a 12 px `ink-3` line under the toolbar.
- **Type summary.** A row of tags, one per error type present in the filtered list, with counts, most frequent first. Read-only. (Derived: count `m.type` over the visible list.)
- **Entry row** (no card; top border): left, the wrong text in serif 19 `ink-3` with a 1.5 px `priority` strike-through, the correct text on the next line in serif 19 weight 500 `ink`, the rule in 13 px `ink-2` beneath. Right column (190 px, right-aligned, 12 px): type tag, skill, due state ("Due today" in accent weight 600, or "Next review Sat 28 Nov", or "Retired" with all three pips filled), pips with "step N of 3". Delete is a ghost icon button (trash) that appears on row hover and on keyboard focus, and is always visible on touch; it keeps the existing confirm.
- **Delete:** a 28 px ghost icon button (trash) placed just outside the row's right edge on desktop, at the bottom right of the row (44 px) on mobile. Hidden until row hover or keyboard focus; always visible on touch (`@media (hover:none)`). Hover turns it `priority`.
- **Empty notebook (`#mistakes:empty`):** no review banner, no toolbar, no type tags. Under the composer, a top border, then "No mistakes yet." in serif 22 and the existing sentence in 15 px `ink-2`. Below that, one example entry inside a 12 px radius dashed `line-strong` frame headed "An entry looks like this" (13 px `ink-3`). The example is static markup in the component, not data: "it depends of the weather" to "it depends on the weather", rule "depend on", preposition, Use of English. It teaches the format the composer produces.
- **No results for a filter:** the toolbar stays, the type tags hide, and in place of the list: "Nothing matches this filter." in serif 22, one line "No mistakes are logged for this skill yet." (or "...in the last 7 days." when that filter is on), and a default button "Show all {n}" that resets both filters. The copy button count follows the visible list.

### Review session
Replaces the screen content, centred, max width 560 px.
- Top row: a ghost `sm` "← Notebook" button that leaves the session (as the current back control does), then at the right a row of 8 px dots, one per queued item (done `ink`, current accent, remaining `line-strong`), and "1 of 3". The card sits 5vh below the top of the content.
- The card: `surface`, 12 px radius, shadow, 32 px padding (24 / 20 on mobile). First line: skill, type and "step N of 3" in 13 px `ink-3`.
- The wrong text in serif 24. Before reveal: "Say or type the correction first, then check." and a primary `lg` "Reveal" button.
- After reveal: the wrong text turns `ink-3` and gains the 1.5 px `priority` strike-through, the correct text appears beneath in serif 24 weight 500, the rule in 15 px `ink-2`, then two `lg` buttons: default "Missed" and primary "Got it". Order and focus behaviour as now (focus lands on the first button).
- Finished: the card goes, all dots turn `ink`, and in its place "Review finished. N items done." in serif 28, one 15 px `ink-2` line summarising the outcome ("Two move on to their next step; one comes back tomorrow.", derived from the session's Got it and Missed counts), and a default button "Back to the notebook".
- On mobile the buttons are full width and sit at the bottom of the card.

### Mobile composition
Banner stacks (count, text, full-width button). Composer fields stack: Wrong, Correct, Why, then Skill and Type side by side, then a full-width Add. Segmented controls wrap. Entry meta moves under the pair as one wrapping line.

## D. Progress

### Desktop composition

```
Progress                                                  [Add result]
No predicted exam score, on purpose. Three kinds of result, never mixed.
■ Official anchor · Test A and B only   ┄ Unofficial practice · trend only   •• Tutor assessment
-----------------------------------------------------------------------
+---------------------------------------------------------------------+
| This week's flex blocks go to          Gap to the Secure line       |
| Writing, Task 1 Communicative ...      Writing        ▬▬▬▬▬▬▬▬ 15   |
| (guards)                               Use of English ▬▬ 4          |
+---------------------------------------------------------------------+
Practice activity   ▂▆▅▆▆▇▃ ▄█ ...  (minutes logged per day)
-----------------------------------------------------------------------
Reading            ■ Official  Diagnostic, Test A · Tue 17 Nov
● Borderline            160·B2        180·C1     B est.  200
35 / 50            ▬▬▬▬▬▬▬▬▬▬▬|▬▬▬▬▬▬▬▬▬▬|▬▬      ┊      |
                                          35
```

- **Legend** under the header: the three basis marks with their one-line definitions. This is the only place the definitions are spelled out.
- **Flex panel** (raised): left, a 13 px line "This week's flex blocks go to" and the `flexLine` result in serif 22; guards beneath in 13 px `borderline`; "Run this on Days 7, 14 and 21 ..." in 12 px `ink-3`. Right, gap bars from `alloc.ranked` with the tie-break sentence in 12 px `ink-3` under them. With no whole-section result yet, the panel shows only the existing empty sentence.
- **Practice activity.** The journey strip again, with a different encoding: bar height is minutes of tasks logged done on that day (by effective date), all in `ink`, days with nothing logged as a 2 px `line-strong` stub, future days omitted. A 13 px line under it: "{total} minutes logged over {n} days." (Derived from `log` and task minutes; no new stored data.)
- **Skill sections**, one per skill, top border, grid 200 px + flexible:
  - Left: skill name (serif 22), status mark from `alloc.latest[skill]` (with "(provisional)" when unofficial), and the latest whole result as a big number (serif 34) with "/ max" in 15 px `ink-3`. Speaking shows the mean band with "mean band". No result: "No result yet" in `ink-3`.
  - Right: result blocks, newest last, grouped by class in the order official, tutor, unofficial. Each block starts with a caption row: basis mark, source, date.
    - Official: the anchor bar. Parts as a 13 px line under it: "Part 1 6/8 · Part 5 8/12 ...".
    - Unofficial: one trend chart per skill containing all unofficial results in date order, then one 13 px line per result: source, raw/max, percent, parts, note, and a ghost "Delete" for manual ones.
    - Tutor Writing: per task, four rows of band pips (Content, Communicative Achievement, Organisation, Language) with the total "13/20" at the end of the caption. Two tasks sit side by side on desktop.
    - Tutor Speaking: five rows of band pips with half steps, mean in the caption.
  - The per-skill lines sentence ("31/50 or less Priority, 37+ Secure", the tutor caveats, the Writing orientation note) stays, once per section, as a 12 px `ink-3` line at the bottom of the right column.
- **Footer note** (12 px `ink-3`, max 70ch): the "within about 3 scale points" caveat, the "B est." explanation, the Cambridge quotation and the conversion-guide link.
- **Add result:** the existing form in a raised panel under the header. Unchanged fields and rules.

### Mobile composition
Legend wraps. Flex panel stacks. Each skill section stacks: name, status and number on one wrapping row, then the blocks. Anchor tick labels shrink to "160", "180 C1", "B", "200" when the track is under 340 px wide so that the last two never collide. Writing tasks stack.

## E. Library

Prototyped: `#library`.

```
Library                                                    
Prompts to paste, the resources the plan uses, ...         
Tutor prompts  Resources  Reference          | Backup
-------------------------------------------  | Everything you log ... Last export Sun 22 Nov.
Tutor prompts                                | [Export JSON] [Import JSON]
Paste into ChatGPT. GPT-1 goes in once ...   | -----------------------
      Setup and rules                     v  | Exam details
GPT-1  Tutor setup              [Copy]    v  | Speaking test date and time [          ]
       Once, as Project instructions         | Note (keyboard layout, ...)  [          ]
GPT-2  Writing diagnosis        [Copy]    ^  | If Speaking falls before 12 December ...
       No rewrite                            | -----------------------
       +-------------------------------+     | Theme  (System | Light | Dark)
       | verbatim prompt, pre-wrap     |     |
       +-------------------------------+     |
GPT-6  Full Speaking simulation [Copy 1][Copy 2] v
Resources
[sealed Test B notice]
Core       (table, scrolls inside its frame on mobile)
Secondary  (link + when, two columns)
Reference  (disclosure rows)
```

Grid: main `minmax(0,1fr)`, aside 296 px, gap 56 px. At 1080 px and below the aside drops under the main column and the section nav gains a fourth item, "Your data". The aside is sticky at 36 px on desktop.

- **Section nav:** plain text buttons (13 px weight 500 `ink-2`, 32 px tall, `sunken` on hover) that scroll to each section (smooth, instant with reduced motion). The bar is sticky at the top with the `bg` fill and a bottom `line` border. On mobile it scrolls horizontally inside its own track and the buttons are 40 px tall. Sections have `scroll-margin-top: 64px` so headings are not hidden under the bar.
- **Section headings:** serif 22, then a 14 px `ink-3` lede (max 60ch), 52 px between sections. Sub-headings ("Core", "Secondary, only when the plan points to them") use the 13 px weight 600 `ink-2` section-title style.
- **Prompt row:** a 56 px minimum-height disclosure button holding the id (mono 12 px `ink-3`, 56 px column), the title (15 px weight 500, the part of the title after the dot) and, on its own line under the title, the parenthetical in 13 px `ink-3`. Then the Copy buttons (`sm`, copy icon), then a 28 px chevron. Hovering the row turns the title accent. Copy acts on `p.blocks` without expanding: one block gives "Copy"; several give "Copy 1", "Copy 2". The button shows "Copied" for 1.5 s. Expanding shows the prompt in a `sunken` block (8 px radius, 16 / 18 px padding, 13.5 px, `pre-wrap`, max 72ch) with the explanatory prose in 14 px `ink-2` around it, indented to the title column. "Setup and rules" is the first row, with no id and no Copy button.
- **Mobile prompt row:** the Copy buttons drop to a second line under the title, indented to the title column, and the chevron stays on the first line. Buttons are 44 px tall.
- **Resources:** the sealed Test B warning first, as a notice (`borderline-soft` fill, 12 px radius, bold lead-in in `borderline`, no border). The core table in a framed container (1 px `line`, 8 px radius, `sunken` header row, 13 px cells, links underlined in `line-strong` turning accent on hover); it scrolls horizontally inside its frame on mobile (min width 640 px). The secondary list as two columns: the link at 15 px, and when to use it at 14 px `ink-3`, stacking on mobile. The rendered markdown from `RESEARCH_MD` keeps its content; only its classes change.
- **Reference:** disclosure rows like the prompt rows without id or Copy: 15 px weight 500 titles, top borders, chevron rotating 180 degrees when open. Tables inside use the same framed table style.
- **Your data (aside):** no card. Three groups separated by `line` borders, each with a section title: "Backup" (the existing sentence, then Export JSON and Import JSON as default buttons; nothing on this screen is primary), "Exam details" (the two settings inputs with labels above, the Note label's parenthetical in `ink-3`, then the Speaking-date hint in 12 px `ink-3`), and "Theme" (a three-item segmented control: System, Light, Dark). The import message appears under the buttons as now.
- **Theme control:** System removes `data-theme` from `<html>`; Light and Dark set it. Stored in `localStorage` under `c1prep:theme`, read before first paint (a 3-line inline script in `index.html`) so there is no flash. Not part of `State` or backups.

## Interaction summary

| Interaction | Behaviour |
|---|---|
| Mark done | Check circle fills (240 ms), row text strikes, day progress segment turns ink, card moves to the next task |
| Undo | Reverses instantly, no animation beyond the colour change |
| Open exercise | New tab, `rel="noopener noreferrer"`, nothing is logged |
| Expand task | Row becomes the card subject (Today) or expands inline (Plan detail); chevron rotates, 180 ms |
| Copy | Label becomes "Copied" for 1.5 s; announce with `aria-live="polite"` |
| Hover a journey bar | Tooltip via `title`; click goes to that day on Plan |
| Expand a Library row | Chevron rotates 180 ms; body appears without a height animation |
| Delete a mistake | Trash button on row hover or focus (always on touch); existing `confirm()` |
| Theme | System, Light, Dark in Library; persists in `localStorage` |
| Keyboard | Tab order follows reading order; focus ring always visible; arrow keys in the Plan grid |
