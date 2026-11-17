import type { ManualResult } from '../data/scores'
import type { Mistake } from './review'

export interface TaskLog { status?: 'done' | 'skipped' | 'dropped'; at?: string; movedTo?: string; note?: string }
export interface CustomTask { id: string; text: string; date: string; skill: string; minutes: number }
export interface State {
  version: 1
  log: Record<string, TaskLog>
  scores: Record<string, Record<string, number>>
  customTasks: CustomTask[]
  results: ManualResult[]
  mistakes: Mistake[]
  dayNotes: Record<string, string>
  settings: { speakingAt?: string; lastExportAt?: string; note?: string }
}

export const KEY = 'c1prep:v1'
export const empty = (): State => ({ version: 1, log: {}, scores: {}, customTasks: [], results: [], mistakes: [], dayNotes: {}, settings: {} })

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown) => typeof v === 'string'
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
const DATE = /^\d{4}-\d\d-\d\d$/
const date = (v: unknown) => typeof v === 'string' && DATE.test(v)

/** Parses and checks a backup. Throws with a readable message; never returns a half-valid state. */
export function parseState(json: string): State {
  let v: unknown
  try { v = JSON.parse(json) } catch { throw new Error('This file is not valid JSON.') }
  if (!isObj(v)) throw new Error('This file is not a C1 Prep backup.')
  if (v.version !== 1) throw new Error(`Unsupported backup version (${String(v.version)}). This app reads version 1.`)
  const bad = (what: string): never => { throw new Error(`Backup is damaged: ${what}.`) }
  for (const k of ['log', 'scores', 'dayNotes', 'settings']) if (!isObj(v[k])) bad(`"${k}" is missing`)
  for (const k of ['customTasks', 'results', 'mistakes']) if (!Array.isArray(v[k])) bad(`"${k}" is missing`)
  const s = v as unknown as State
  for (const l of Object.values(s.log))
    if (!isObj(l) || (l.status !== undefined && !['done', 'skipped', 'dropped'].includes(l.status as string)) || (l.movedTo !== undefined && !date(l.movedTo))) bad('a task entry is malformed')
  for (const sc of Object.values(s.scores)) if (!isObj(sc) || !Object.values(sc).every(num)) bad('a score is not a number')
  if (!Object.values(s.dayNotes).every(str)) bad('a day note is not text')
  for (const t of s.customTasks) if (!isObj(t) || !str(t.id) || !str(t.text) || !date(t.date) || !str(t.skill) || !num(t.minutes)) bad('a custom task is malformed')
  for (const r of s.results) if (!isObj(r) || !str(r.id) || !date(r.date) || !str(r.source) || !num(r.raw) || !num(r.max) || !['official', 'unofficial', 'tutor'].includes(r.basis) || !['reading', 'uoe', 'listening', 'writing', 'speaking'].includes(r.skill)) bad('a result is malformed')
  for (const m of s.mistakes) if (!isObj(m) || !str(m.id) || !str(m.wrong) || !str(m.correct) || !str(m.type) || !str(m.skill) || !date(m.dueOn) || ![0, 1, 2, 3].includes(m.box)) bad('a mistake is malformed')
  return s
}

export function load(): { state: State; error?: string } {
  try {
    const raw = localStorage.getItem(KEY)
    return { state: raw ? parseState(raw) : empty() }
  } catch (e) {
    // Never overwrite stored data we could not read: App stops saving while `error` is set.
    return { state: empty(), error: e instanceof Error ? e.message : String(e) }
  }
}

export function save(state: State): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true } catch { return false }
}
