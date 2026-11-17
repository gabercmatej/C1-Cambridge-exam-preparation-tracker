# UX SPEC — C1 Prep (personal study tracker)

Status: **proposed, awaiting approval.** Nothing in here has been built.
Content sources: [STUDY_PLAN.md](STUDY_PLAN.md) for the schedule and prompts, [RESEARCH.md](RESEARCH.md) for score anchors and resources.

## 1. Product goals

**Success test:** within ten seconds of opening the app, Matej knows what to study today, where to click, how long it takes and where to record the result.

- Goal 1: replace the documents and chat scrolling with one screen per question ("what now?", "how am I doing?", "what do I keep getting wrong?").
- Goal 2: logging a finished task takes one click, or one click plus a number.
- Goal 3: a missed day costs nothing to recover from.
- Goal 4: scores are shown honestly, against Cambridge's official anchors, never as a predicted grade.

**Non-goals:** hosting exam questions, recreating the Cambridge interface, calling any AI API, accounts, sync, notifications, streaks, badges, charts beyond simple bars.

**Anti-goals:** an app that takes longer to maintain than it saves; a number on screen that looks like a predicted Cambridge score; a backlog that grows until the plan feels failed.

The useful life of this app is 26 days. Every feature is judged against that.

## 2. Approaches considered

| Approach | Trade-off | Verdict |
|---|---|---|
| **A. Static single-page app, localStorage, JSON export/import** | Data lives in one browser on one device. Zero infrastructure, works offline, built in a day | **Chosen** |
| B. Markdown checklist or a Notion page | No build at all, but no spaced review, no score-versus-anchor view, no copyable prompts in context | Rejected: fails Goals 2 and 4 |
| C. Next.js with Supabase sync | Phone and laptop stay in sync; adds auth, a backend and a failure mode for a 26-day tool | Rejected: explicitly out of scope |

Mobile under approach A: the layout is responsive, and the phone can load the app, but its data is separate. Moving data means export on one device and import on the other. This is a stated limitation, not something to engineer around.

## 3. MVP scope

Five tabs. In priority order, so the build can stop early and still be useful:

1. **Today**: countdown, today's tasks with links, done/skip, quick score, catch-up list, due reviews.
2. **Plan**: all 26 days, statuses, mock days marked, move or add a task.
3. **Mistakes**: add, review due items on a 1/3/7-day schedule, browse.
4. **Progress**: results per skill against the official anchors, mock log.
5. **Library**: resources by skill, tutor prompts with copy buttons, backup (export/import).

Dropped as unnecessary: onboarding, settings page (two settings live in Library), dark-mode toggle (follow the system), editing the built-in plan text, charts library, timers (the phone has one), separate "tutor feedback" screen (a task note covers it), separate "mock" screen (a mock is a group of results on Progress).

## 4. Screens

### 4.1 Today (default)

```
┌──────────────────────────────────────────────────────────────────┐
│ C1 Prep     Today  Plan  Mistakes  Progress  Library             │
├──────────────────────────────────────────────────────────────────┤
│ Tue 17 Nov · Day 2 of 26                 25 days to exam (12 Dec) │
│ Diagnostic: Reading and Use of English             ~100 min       │
│ Objective: an honest official baseline for two of the five scores │
│                                                                  │
│ ▸ NEXT                                                           │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ ○ Official digital sample: Reading & Use of English   90 min  │ │
│ │   Reading + Use of English · core                             │ │
│ │   [Open test ↗]  [Answer key ↗]                               │ │
│ │   Done when: all 56 questions attempted under time            │ │
│ │   [ Done ]  [ Skip ]                                          │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ ○ Mark with the answer key                             10 min     │
│                                                                  │
│ Short on time?  Emergency version: (text from the plan)           │
│                                                                  │
│ REVIEW DUE (4)                                   [Start review]   │
│ CATCH-UP (1)   Send email to exam centre · from Mon   [Done][Drop]│
│                                                                  │
│ Note for today: [ free text, saved on blur                      ] │
└──────────────────────────────────────────────────────────────────┘
```

- The **first unfinished task is expanded** as "Next"; the others are one-line rows that expand on click.
- **Done** on a task that has a score spec opens an inline row of number fields (for example `Part 1 __/8  Part 2 __/8`); Enter saves. Fields may be left empty.
- **Skip** marks it skipped. A skipped core task goes to catch-up; a skipped non-core task is simply dropped.
- Tasks with a tutor prompt show a **[Copy prompt]** button; it shows "Copied" for two seconds.
- Any task has an optional one-line note (for key tutor feedback).
- **Before 16 Nov:** shows Day 1 with "Starts Monday". **On 12 Dec:** shows the exam-day checklist from the plan. **After:** "Exam done", plus Progress link.
- Mock days get a distinct header label "MOCK EXAM" and the total duration.

### 4.2 Plan

```
Week 1 · 16–22 Nov   Week 2   Week 3   Week 4            [+ Add task]
Mon 16  Set up                         45 min   ●●●○○   done 3/5
Tue 17  Diagnostic: R&UoE             100 min   ○○       today
...
Sat 28  MOCK 1                         4h15     ○○○○     mock
```
- Four week sections, each day a row: date, title, minutes, status dots, a label (today, mock, light, rest).
- Click a day to expand its tasks, identical to the Today rows, fully interactive (so past days can be logged late).
- Status colours: done, skipped, overdue (core, past, unlogged), missed (non-core, past, unlogged; grey), planned.
- **Move:** each task has "Move to…" with a date picker limited to 16 Nov–11 Dec. The original day shows it struck through with "moved to Thu 19".
- **Add task:** title, date, skill, minutes, optional link. Custom tasks can be deleted; built-in tasks cannot.

### 4.3 Mistakes

```
[ + Add mistake ]                       Due today: 4   [Start review]
Filter: All · Reading · Use of English · Writing · Listening · Speaking

Wrong       "despite of the rain"
Correct     "despite the rain" / "in spite of the rain"
Why         despite takes no preposition
Use of English · preposition          next review: Thu 19 Nov  · box 1
```
- **Add form:** wrong, correct, why (optional), skill, subcategory (free text with suggestions from previous entries). Submitting keeps the form open with skill preselected, so several can be entered quickly. Keyboard: Cmd+Enter to save.
- **Review mode:** one card at a time showing only "wrong" and the category. Reveal, then **Got it** or **Missed**.
- **Schedule:** new item due next day. Got it: 1 → 3 → 7 days, then retired. Missed: back to 1 day. Items never fall due after 11 Dec; on 10 Dec everything is due once (the plan's final pass).

### 4.4 Progress

```
                 0%          C1 anchor        B est.   C2 anchor
Reading          ├──────────────│──────────────┊────────│────┤
  Diagnostic 17 Nov  ████████████████░░  30/50
  Mock 1     28 Nov  ██████████████████░ 34/50
Use of English   ...
Writing          tutor estimate, not examiner-marked
...
[ + Add result ]

Results log
28 Nov  Mock 1 · official Sample 2 · Reading 34/50 · UoE 17/28 · Listening 21/30
```
- One block per skill. Each **official** result is a horizontal bar on a 0–max scale with vertical markers at the official 160, 180 and 200 anchors and a dotted marker for the interpolated Grade B estimate, labelled "estimate".
- Under each bar, a plain-language reading generated from the anchors: "below the C1 anchor", "around the C1 anchor (uncertain)", "above the C1 anchor". "Around" means within about 10% of the anchor.
- **Unofficial** results are listed as percentages with no anchors, under a "Practice (unofficial, trend only)" subheading.
- Writing and Speaking carry a permanent caption: "Tutor estimate. Not examiner-marked."
- No overall predicted score, anywhere. A fixed footnote quotes Cambridge's caveat and links the conversion guide.
- Results come from task score fields automatically; **Add result** covers anything else (date, source, official yes/no, skill, part, raw, max, note).

### 4.5 Library

- **Resources:** the core eight plus secondary items from RESEARCH §9, grouped by skill, each with a one-line "use it for".
- **Prompts:** GPT-1 to GPT-9 from STUDY_PLAN §6, each collapsed to its title with a [Copy] button.
- **Reference:** score anchor table, exam format table, exam-day checklist.
- **Backup:** [Export JSON] [Import JSON], last export date, and two fields: Speaking test date/time, optional note.

## 5. User flows

| Flow | Steps |
|---|---|
| Daily session | Open → Today shows Next → click link, study → Done (+ numbers) → next task auto-expands → Start review → close |
| Busy day | Open → read Emergency line → do those tasks → Skip the rest → core skips appear in catch-up tomorrow |
| Missed day | Open next day → catch-up list shows yesterday's core tasks → Done or Drop each |
| After a mock | Done on each mock task with part scores → Progress updates → add mistakes → copy GPT-8 prompt |
| Writing feedback | Task shows [Copy prompt] → paste in ChatGPT with the essay → paste key feedback into the task note → add error lines to Mistakes |
| Backup | Library → Export JSON (prompted weekly by a small banner on Today) |

## 6. Data model

```ts
type Skill = 'reading' | 'useOfEnglish' | 'writing' | 'listening' | 'speaking' | 'general';

// Static seed, shipped in code, never mutated
interface PlanDay {
  date: string;            // 'YYYY-MM-DD' local
  title: string;
  objective: string;
  kind: 'normal' | 'light' | 'mock' | 'review' | 'rest';
  emergency?: string;
  doneWhen: string;
  record: string;
  tasks: PlanTask[];
}
interface PlanTask {
  id: string;              // 'd02-a', matches STUDY_PLAN.md
  title: string;
  skills: Skill[];
  minutes: number;
  core: boolean;
  links: { label: string; url: string }[];
  promptId?: string;       // 'gpt-2'
  scores?: ScoreSpec[];    // what to ask for on Done
}
interface ScoreSpec { skill: Skill; part?: string; max: number; label: string }

// Persisted user state
interface AppState {
  version: 1;
  log: Record<string, TaskLog>;        // keyed by task id
  customTasks: (PlanTask & { date: string })[];
  results: Result[];
  mistakes: Mistake[];
  dayNotes: Record<string, string>;    // keyed by date
  settings: { speakingAt?: string; lastExportAt?: string };
}
interface TaskLog {
  status: 'done' | 'skipped' | 'dropped';
  at: string;                          // ISO timestamp
  movedTo?: string;                    // date; status then applies on that date
  note?: string;
}
interface Result {
  id: string; date: string; taskId?: string;
  source: string;                      // 'Official digital sample'
  official: boolean;
  kind: 'diagnostic' | 'mock' | 'practice';
  skill: Skill; part?: string;
  raw: number; max: number; note?: string;
}
interface Mistake {
  id: string; createdAt: string;
  skill: Skill; subcategory: string;
  wrong: string; correct: string; why?: string;
  box: 0 | 1 | 2 | 3;                  // 3 = retired
  dueOn: string;                       // date
}
```
A moved task with no status has a `TaskLog` containing only `movedTo`; make `status` optional for that case or store moves in a separate `moves: Record<string, string>` map, whichever is simpler.

## 7. Persistence

- One `localStorage` key, `c1prep:v1`, holding `AppState` as JSON. Saved on every change.
- The plan, resources and prompts are static code. Only user actions are stored, so history survives any later edit to the seed.
- **Export** downloads `c1prep-backup-YYYY-MM-DD.json`. **Import** validates `version` and the top-level shape, asks for confirmation, then replaces state. Invalid files are rejected with a message and change nothing.
- A banner on Today suggests an export if none has happened in seven days.
- Every read and write is wrapped in try/catch; if storage is unavailable the app still renders and says data will not be saved.

## 8. Logic

| Rule | Definition |
|---|---|
| Today | Local calendar date, compared as `YYYY-MM-DD` strings. Never use UTC conversion |
| Day N | Days since 2026-11-16, plus one |
| Countdown | Calendar days from today to 2026-12-12 |
| Effective date of a task | `movedTo` if set, otherwise its seed date |
| Overdue | Core, effective date before today, no status. Shown in catch-up |
| Missed | Non-core, effective date before today, no status. Grey, no action needed |
| Catch-up overflow | More than three overdue: show a one-line hint to drop the oldest, per the plan's rule. Never auto-drop |
| Next action | First task today without a status, in seed order; if none, the first catch-up item; if none, due reviews; otherwise "Done for today" |
| Review due | `box < 3` and `dueOn <= today` |
| Review scheduling | Got it: box+1, due in 3 days (to box 2) or 7 days (to box 3 → retired). Missed: box 1, due tomorrow. Clamp `dueOn` to 2026-12-10 at the latest |
| Anchor reading | Official results only. Ratio `raw/max` versus the 180 anchor ratio: below by more than 10% of max → "below"; within 10% → "around (uncertain)"; above → "above" |
| Full-skill totals | A Reading bar needs a result with `max: 50` (parts 1, 5, 6, 7, 8 summed), Use of English `max: 28`, Listening `max: 30`. When a mock task collects part scores, compute and store the skill total as well |

## 9. Edge cases and constraints

- Opened before the plan starts, on exam day, and after it: all three render sensibly (§4.1).
- Two browser tabs: listen for the `storage` event and reload state, or accept last-write-wins. Either is acceptable.
- Import of a file from a newer version: reject.
- Empty states on every tab say what to do next in one sentence.
- Score fields accept integers from 0 to max; anything else is rejected inline.
- Links open in a new tab with `rel="noopener"`.
- Clipboard API unavailable: fall back to selecting the prompt text.
- No exam content is stored in the app. It links out.
- Keyboard: Tab order follows reading order; Done, Skip, Copy are real buttons; visible focus ring. Colour is never the only status signal (dots carry a text label or title).
- Layout: single column, max width about 760 px, comfortable at 375 px wide. No horizontal scroll.
- Visual direction: quiet and typographic. System font stack, one accent colour, generous spacing, light and dark from `prefers-color-scheme`. No illustrations, no animation beyond a 150 ms state change.
- UI copy contains no em dashes.

## 10. Open decisions (owner: Matej)

1. Approve this spec, or name changes.
2. Mobile: accept "separate data per device, move by export/import", or drop mobile entirely.
3. Whether the Speaking date field should also shift the two speaking tasks automatically. Proposed: no; move them by hand with "Move to…".
