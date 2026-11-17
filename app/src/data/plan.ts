// The curriculum is read straight from STUDY_PLAN.md and RESEARCH.md, never retyped here,
// so an older spec cannot overwrite it and the prompts stay verbatim.
import planMd from '../../../STUDY_PLAN.md?raw'
import researchMd from '../../../RESEARCH.md?raw'
import { addDays, START } from '../lib/dates'

export interface Task {
  id: string
  text: string // markdown, links included
  skill: string
  minutes: number
  core: boolean
  date: string
  custom?: boolean
}
export interface Day {
  n: number
  date: string
  title: string
  duration: string
  kind: 'normal' | 'light' | 'mock'
  objective: string
  doneWhen: string
  record: string
  emergency: string
  tasks: Task[]
}
export interface Prompt {
  id: string
  title: string
  body: string
  blocks: string[]
}

// Tasks whose line carries two time figures; the parser would read only the last one.
const MINUTES: Record<string, number> = { 'd21-b': 25 }

export function parsePlan(md: string): Day[] {
  const days: Day[] = []
  let day: Day | undefined
  for (const line of md.split('\n')) {
    const h = line.match(/^#### Day (\d+) · \w+ \d+ \w+(?: · (.+?))? \((.+)\)$/)
    if (h) {
      const title = h[2] ?? ''
      day = {
        n: +h[1],
        date: addDays(START, +h[1] - 1),
        title,
        duration: h[3],
        kind: /^MOCK/.test(title) ? 'mock' : /light|rest/i.test(title) ? 'light' : 'normal',
        objective: '',
        doneWhen: '',
        record: '',
        emergency: '',
        tasks: [],
      }
      days.push(day)
      continue
    }
    if (/^#{1,4} /.test(line)) day = undefined
    if (!day) continue
    const t = line.match(/^ {2}- `(d\d\d-[a-z])` (\[core\] )?(.+) · ([^·]+)$/)
    if (t) {
      const m = t[3].match(/ \((\d+)[^)]*\)$/)
      day.tasks.push({
        id: t[1],
        core: !!t[2],
        text: m ? t[3].slice(0, m.index) : t[3],
        minutes: MINUTES[t[1]] ?? (m ? +m[1] : 0),
        skill: t[4].trim(),
        date: day.date,
      })
      continue
    }
    const f = line.match(/^- \*\*(Objective|Done when|Record|Emergency)([^:*]*):\*\* (.+)$/)
    if (!f) continue
    if (f[1] === 'Objective') day.objective = f[3]
    else if (f[1] === 'Done when') day.doneWhen = f[3]
    else if (f[1] === 'Record') day.record = f[3]
    else day.emergency = `${f[2].trim()} ${f[3]}`.trim()
  }
  return days
}

/** One "## " section of a document, heading included. */
export const section = (md: string, heading: RegExp) =>
  (md.split(/^(?=## )/m).find((p) => heading.test(p.split('\n')[0])) ?? '').replace(/\n---\s*$/, '').trim()

export function parsePrompts(md: string): Prompt[] {
  return section(md, /tutor workflows/i)
    .split(/^(?=### GPT-)/m)
    .slice(1)
    .map((sec) => {
      const title = sec.split('\n')[0].replace(/^### /, '')
      return {
        id: 'gpt-' + title.match(/^GPT-(\w+)/)![1].toLowerCase(),
        title,
        body: sec.slice(sec.indexOf('\n') + 1).trim(),
        // fenced blocks, plus long inline-code follow-up messages
        blocks: [...sec.matchAll(/^```\n([\s\S]*?)\n```$|`([^`\n]{60,})`/gm)].map((m) => m[1] ?? m[2]),
      }
    })
}

export const DAYS = parsePlan(planMd)
export const PROMPTS = parsePrompts(planMd)
export const PROMPT_INTRO = section(planMd, /tutor workflows/i).split(/^(?=### GPT-)/m)[0]
export const EXAM_DAY = planMd.match(/^#### Sat 12 Dec · Exam day\n(.+)$/m)?.[1] ?? ''
export const PLAN_MD = planMd
export const RESEARCH_MD = researchMd

/** Copyable prompts a task refers to. GPT-6 and GPT-9 have two variants; the task text says which. */
export function promptRefs(text: string, prompts = PROMPTS) {
  const out: { label: string; text: string }[] = []
  for (const name of new Set(text.match(/GPT-\d\w?/g) ?? [])) {
    const p = prompts.find((x) => x.id === name.toLowerCase())
    if (!p) continue
    let idx = p.blocks.map((_, i) => i)
    if (p.id === 'gpt-6') idx = [/mode B/.test(text) ? 1 : 0]
    if (p.id === 'gpt-9') idx = [/full paper/.test(text) ? 1 : 0]
    for (const i of idx) out.push({ label: idx.length > 1 ? `${name} (${i + 1} of ${idx.length})` : name, text: p.blocks[i] })
  }
  return out
}
