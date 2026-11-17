import { DAYS, type Task } from '../data/plan'
import { addDays, START } from './dates'
import { isDue } from './review'
import type { State } from './storage'

export const allTasks = (s: State): Task[] => [
  ...DAYS.flatMap((d) => d.tasks),
  ...s.customTasks.map((t) => ({ ...t, core: false, custom: true })),
]
export const effDate = (t: Task, s: State) => s.log[t.id]?.movedTo ?? t.date
export const tasksOn = (date: string, s: State) => allTasks(s).filter((t) => effDate(t, s) === date)
const open = (t: Task, s: State) => !s.log[t.id]?.status

/** Core, past, and not done or dropped. A skipped core task stays here until done or dropped. */
export const isOverdue = (t: Task, s: State, today: string) =>
  t.core && effDate(t, s) < today && (open(t, s) || s.log[t.id]?.status === 'skipped')
/** Non-core, past, unlogged: dropped silently, no backlog. */
export const isMissed = (t: Task, s: State, today: string) => !t.core && effDate(t, s) < today && open(t, s)

/** The plan's keep-order for an overfull catch-up list (STUDY_PLAN §4): lower is kept first. */
export function keepRank(t: Task): number {
  if (t.id.startsWith('d20')) return 1 // Mock 2 on Test B
  if (t.skill === 'Writing' && /GPT-2|rewrite/i.test(t.text)) return 2 // closing a writing cycle
  if (/notebook (review|pass)/i.test(t.text)) return 3
  if (t.id.startsWith('d13')) return 4 // Mock 1
  if (t.skill === 'Flex') return 6
  if (t.skill === 'Speaking') return 7
  return 5 // timed sets and everything else
}
export const catchUp = (s: State, today: string) =>
  allTasks(s).filter((t) => isOverdue(t, s, today)).sort((a, b) => keepRank(a) - keepRank(b) || effDate(a, s).localeCompare(effDate(b, s)))

/** Plan days in a row, directly before today, with nothing logged at all. Three or more triggers the reset rule. */
export function lostDays(s: State, today: string): number {
  let n = 0
  for (let d = addDays(today, -1); d >= START; d = addDays(d, -1)) {
    const tasks = DAYS.find((x) => x.date === d)?.tasks ?? []
    if (!tasks.length || tasks.some((t) => s.log[t.id]?.status)) break
    n++
  }
  return n
}

export type Next = { kind: 'task' | 'catchup'; task: Task } | { kind: 'review'; count: number } | { kind: 'done' }
export function nextAction(s: State, today: string): Next {
  const task = tasksOn(today, s).find((t) => open(t, s))
  if (task) return { kind: 'task', task }
  const c = catchUp(s, today)[0]
  if (c) return { kind: 'catchup', task: c }
  const count = s.mistakes.filter((m) => isDue(m, today)).length
  return count ? { kind: 'review', count } : { kind: 'done' }
}
