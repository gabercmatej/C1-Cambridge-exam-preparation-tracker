import { addDays, FINAL_PASS } from './dates'
import type { Skill } from '../data/scores'

export interface Mistake {
  id: string
  createdOn: string
  skill: Skill
  type: string // one of ERROR_TYPES, or free text
  wrong: string
  correct: string
  why?: string
  box: 0 | 1 | 2 | 3 // 3 = retired
  dueOn: string
  reviewedOn?: string
}

// The fixed list from GPT-1, so notebook entries can be counted by type.
export const ERROR_TYPES = ['article', 'tense/aspect', 'preposition', 'collocation', 'word choice', 'word form', 'word order', 'agreement', 'punctuation', 'spelling', 'register', 'linking', 'task/content']

const INTERVAL = [1, 3, 7]
const clamp = (d: string) => (d > FINAL_PASS ? FINAL_PASS : d)

export const newMistake = (today: string, f: Pick<Mistake, 'skill' | 'type' | 'wrong' | 'correct' | 'why'>): Mistake => ({
  ...f, id: crypto.randomUUID(), createdOn: today, box: 0, dueOn: clamp(addDays(today, 1)),
})

/** On 10 Dec every item is due once (the plan's final pass); otherwise unretired items whose date has come. */
export const isDue = (m: Mistake, today: string) =>
  today === FINAL_PASS ? m.reviewedOn !== today : m.box < 3 && m.dueOn <= today

/** Got it: 1 -> 3 -> 7 days -> retired. Missed (also a GPT-8 miss): back to one day. */
export function grade(m: Mistake, gotIt: boolean, today: string): Mistake {
  const box = (gotIt ? Math.min(m.box + 1, 3) : 0) as Mistake['box']
  return { ...m, box, reviewedOn: today, dueOn: box === 3 ? m.dueOn : clamp(addDays(today, INTERVAL[box])) }
}

export const notebookLine = (m: Mistake) => `${m.wrong} → ${m.correct} → ${m.why || '(no rule noted)'} → ${m.type}`
