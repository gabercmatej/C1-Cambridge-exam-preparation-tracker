import { describe, expect, it } from 'vitest'
import { DAYS, PROMPTS, promptRefs } from '../data/plan'
import { SPECS, label, totals, type Total } from '../data/scores'
import { addDays, countdown, dayNumber, localDate } from './dates'
import { allocation } from './flex'
import { grade, isDue, newMistake } from './review'
import { catchUp, isMissed, lostDays, nextAction, tasksOn } from './schedule'
import { empty, parseState, type State } from './storage'

const tasks = DAYS.flatMap((d) => d.tasks)
const st = (p: Partial<State> = {}): State => ({ ...empty(), ...p })

describe('dates', () => {
  it('numbers days and counts down', () => {
    expect([dayNumber('2026-11-16'), dayNumber('2026-12-11'), dayNumber('2026-12-12')]).toEqual([1, 26, 27])
    expect([countdown('2026-11-16'), countdown('2026-12-11'), countdown('2026-12-12')]).toEqual([26, 1, 0])
  })
  it('keeps the local date near midnight', () => {
    expect(localDate(new Date(2026, 10, 17, 23, 30))).toBe('2026-11-17')
    expect(localDate(new Date(2026, 10, 17, 0, 30))).toBe('2026-11-17')
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
  })
})

describe('plan parsed from STUDY_PLAN.md', () => {
  it('has 26 consecutive days and unique ids', () => {
    expect(DAYS.map((d) => d.n)).toEqual(Array.from({ length: 26 }, (_, i) => i + 1))
    expect(DAYS[0].date).toBe('2026-11-16')
    expect(DAYS[25].date).toBe('2026-12-11')
    expect(new Set(tasks.map((t) => t.id)).size).toBe(tasks.length)
    expect(tasks.length).toBeGreaterThan(90)
  })
  it('captures every task line in the document', async () => {
    const md = (await import('../../../STUDY_PLAN.md?raw')).default
    const ids = [...md.matchAll(/^ {2}- `(d\d\d-[a-z])`/gm)].map((m) => m[1])
    expect(tasks.map((t) => t.id)).toEqual(ids)
  })
  it('fills every day and task field', () => {
    for (const d of DAYS) {
      expect(d.objective && d.doneWhen && d.tasks.length, `day ${d.n}`).toBeTruthy()
      if (d.n !== 26) expect(d.emergency, `day ${d.n}`).toBeTruthy()
    }
    for (const t of tasks) {
      expect(t.text && t.skill, t.id).toBeTruthy()
      if (t.id !== 'd26-c') expect(t.minutes, t.id).toBeGreaterThan(0)
      for (const m of t.text.matchAll(/\]\(([^)]+)\)/g)) expect(m[1], t.id).toMatch(/^https:\/\//)
    }
    expect(tasks.find((t) => t.id === 'd02-a')).toMatchObject({ minutes: 90, core: true, skill: 'Reading + Use of English' })
    expect(tasks.find((t) => t.id === 'd21-b')!.minutes).toBe(25)
    expect(DAYS.filter((d) => d.kind === 'mock').map((d) => d.n)).toEqual([13, 20])
  })
  it('resolves every prompt a task names', () => {
    expect(PROMPTS.map((p) => p.id)).toEqual(['gpt-1', 'gpt-1b', 'gpt-2', 'gpt-3', 'gpt-4', 'gpt-5', 'gpt-6', 'gpt-7', 'gpt-8', 'gpt-9'])
    for (const p of PROMPTS) expect(p.blocks.length, p.id).toBeGreaterThan(0)
    for (const t of tasks) expect(promptRefs(t.text).length, t.id).toBe(new Set(t.text.match(/GPT-\d\w?/g) ?? []).size + (/GPT-1b/.test(t.text) ? 1 : 0) + (/GPT-2/.test(t.text) ? 1 : 0))
    expect(promptRefs('simulation with GPT-6, mode B')[0].text).toMatch(/^Run a complete C1 Advanced Speaking test with me in the real format/)
    expect(promptRefs('run GPT-9 in "full paper" mode')[0].text).toMatch(/^Write a complete C1 Advanced Writing paper/)
    expect(PROMPTS[0].blocks[0]).toMatch(/^You are my Cambridge C1 Advanced \(CAE\) tutor[\s\S]*Confirm you understand in one sentence\.$/)
  })
  it('attaches score specs only to real tasks, official only on Test A and Test B', () => {
    for (const id of Object.keys(SPECS)) expect(tasks.some((t) => t.id === id), id).toBe(true)
    expect(Object.entries(SPECS).filter(([, s]) => s.basis === 'official').map(([id]) => id)).toEqual(['d02-b', 'd03-b', 'd20-e'])
    expect(SPECS['d13-d'].basis).toBe('unofficial')
    expect(Object.values(SPECS).flatMap((s) => s.fields).filter((f) => f.skill === 'speaking').every((f) => f.max === 5)).toBe(true)
  })
})

describe('schedule', () => {
  it('sends missed core tasks to catch-up and drops non-core ones', () => {
    const s = st()
    const c = catchUp(s, '2026-11-17').map((t) => t.id)
    expect(c).toEqual(['d01-a', 'd01-b', 'd01-c'])
    expect(isMissed(tasks.find((t) => t.id === 'd01-d')!, s, '2026-11-17')).toBe(true)
    const s2 = st({ log: { 'd01-a': { status: 'done' }, 'd01-b': { status: 'dropped' }, 'd01-c': { status: 'skipped' }, 'd01-d': { status: 'skipped' } } })
    expect(catchUp(s2, '2026-11-17').map((t) => t.id)).toEqual(['d01-c'])
  })
  it('uses the moved date', () => {
    const s = st({ log: { 'd01-c': { movedTo: '2026-11-18' } } })
    expect(tasksOn('2026-11-18', s).map((t) => t.id)).toContain('d01-c')
    expect(tasksOn('2026-11-16', s).map((t) => t.id)).not.toContain('d01-c')
    expect(catchUp(s, '2026-11-18').map((t) => t.id)).not.toContain('d01-c')
  })
  it('orders catch-up by the keep-order: Mock 2 first, Speaking last', () => {
    const c = catchUp(st(), '2026-12-07').map((t) => t.id)
    expect(c[0].startsWith('d20')).toBe(true)
    expect(c.at(-1)).toMatch(/^d(05|14|20)-[cd]$/)
  })
  it('falls through tasks, catch-up, reviews, done', () => {
    const done = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { status: 'done' as const }]))
    const day1 = DAYS[0].tasks.map((t) => t.id)
    const day2 = DAYS[1].tasks.map((t) => t.id)
    expect(nextAction(st(), '2026-11-16')).toMatchObject({ kind: 'task', task: { id: 'd01-a' } })
    expect(nextAction(st({ log: done(day2) }), '2026-11-17')).toMatchObject({ kind: 'catchup', task: { id: 'd01-a' } })
    const m = newMistake('2026-11-16', { skill: 'uoe', type: 'preposition', wrong: 'a', correct: 'b' })
    expect(nextAction(st({ log: done([...day1, ...day2]), mistakes: [m] }), '2026-11-17')).toEqual({ kind: 'review', count: 1 })
    expect(nextAction(st({ log: done([...day1, ...day2]) }), '2026-11-17')).toEqual({ kind: 'done' })
  })
  it('counts days lost in a row', () => {
    expect(lostDays(st(), '2026-11-19')).toBe(3)
    expect(lostDays(st({ log: { 'd03-a': { status: 'done' } } }), '2026-11-20')).toBe(1)
    expect(lostDays(st(), '2026-11-16')).toBe(0)
  })
})

describe('review', () => {
  const m0 = newMistake('2026-11-16', { skill: 'uoe', type: 'preposition', wrong: 'despite of', correct: 'despite' })
  it('is due the next day and advances 1, 3, 7, retired', () => {
    expect(isDue(m0, '2026-11-16')).toBe(false)
    expect(isDue(m0, '2026-11-17')).toBe(true)
    const a = grade(m0, true, '2026-11-17')
    expect([a.box, a.dueOn]).toEqual([1, '2026-11-20'])
    const b = grade(a, true, '2026-11-20')
    expect([b.box, b.dueOn]).toEqual([2, '2026-11-27'])
    const c = grade(b, true, '2026-11-27')
    expect(c.box).toBe(3)
    expect(isDue(c, '2026-12-01')).toBe(false)
  })
  it('resets a miss to one day', () => {
    const a = grade(grade(m0, true, '2026-11-17'), false, '2026-11-20')
    expect([a.box, a.dueOn]).toEqual([0, '2026-11-21'])
  })
  it('never schedules past 10 Dec, when everything is due once', () => {
    expect(grade({ ...m0, box: 1 }, true, '2026-12-08').dueOn).toBe('2026-12-10')
    expect(newMistake('2026-12-10', m0).dueOn).toBe('2026-12-10')
    const retired = { ...m0, box: 3 as const }
    expect(isDue(retired, '2026-12-10')).toBe(true)
    expect(isDue(grade(retired, true, '2026-12-10'), '2026-12-10')).toBe(false)
  })
})

describe('storage', () => {
  const full = st({
    log: { 'd01-a': { status: 'done', at: 'x', note: 'n' }, 'd01-c': { movedTo: '2026-11-18' } },
    scores: { 'd02-b': { p1: 6 } },
    mistakes: [newMistake('2026-11-16', { skill: 'uoe', type: 'article', wrong: 'a', correct: 'b' })],
    results: [{ id: 'r', date: '2026-11-20', source: 's', basis: 'unofficial', skill: 'reading', raw: 3, max: 6 }],
    customTasks: [{ id: 'c1', text: 't', date: '2026-11-20', skill: 'General', minutes: 10 }],
    dayNotes: { '2026-11-16': 'hi' },
    settings: { speakingAt: '2026-12-10 14:00' },
  })
  it('round-trips', () => expect(parseState(JSON.stringify(full))).toEqual(full))
  it('rejects bad files', () => {
    expect(() => parseState('{nope')).toThrow(/not valid JSON/)
    expect(() => parseState('[]')).toThrow(/not a C1 Prep backup/)
    expect(() => parseState(JSON.stringify({ ...full, version: 2 }))).toThrow(/version/)
    const { mistakes: _, ...missing } = full
    expect(() => parseState(JSON.stringify(missing))).toThrow(/mistakes/)
    expect(() => parseState(JSON.stringify({ ...full, scores: { a: { b: 'x' } } }))).toThrow(/score/)
    expect(() => parseState(JSON.stringify({ ...full, mistakes: [{ id: 1 }] }))).toThrow(/mistake/)
    expect(() => parseState(JSON.stringify({ ...full, log: { a: { status: 'weird' } } }))).toThrow(/task entry/)
  })
})

describe('results and flex allocation', () => {
  it('labels with the fixed lines', () => {
    expect([label('reading', 31, 50), label('reading', 32, 50), label('reading', 37, 50)]).toEqual(['Priority', 'Borderline', 'Secure'])
    expect([label('uoe', 15, 28), label('uoe', 18, 28), label('uoe', 19, 28)]).toEqual(['Priority', 'Borderline', 'Secure'])
    expect([label('writing', 27, 40), label('writing', 14, 20), label('writing', 16, 20)]).toEqual(['Priority', 'Borderline', 'Secure'])
    expect([label('speaking', 17, 25), label('speaking', 17.5, 25), label('speaking', 20, 25)]).toEqual(['Priority', 'Borderline', 'Secure'])
  })
  it('derives Reading /50 and Use of English /28 once all parts are in', () => {
    const scores = { 'd02-b': { p1: 6, p2: 5, p3: 4, p4: 5, p5: 8, p6: 4, p7: 6, p8: 7 }, 'd03-b': { l1: 4 } }
    const t = totals(scores, [], () => '2026-11-17')
    expect(t.map((x) => [x.skill, x.raw, x.max, x.basis, x.whole])).toEqual([['reading', 31, 50, 'official', true], ['uoe', 14, 28, 'official', true]])
  })
  const tot = (skill: Total['skill'], raw: number, max: number, parts: Total['parts'] = []): Total => ({ id: skill, date: '2026-11-20', source: '', basis: 'official', skill, raw, max, parts, whole: true })
  it('ranks by gap, breaks ties toward Use of English, picks the part by marks lost', () => {
    const a = allocation([
      tot('reading', 31, 50), // gap 12
      tot('uoe', 14, 28, [{ label: 'Part 2', raw: 4, max: 8 }, { label: 'Part 3', raw: 5, max: 8 }, { label: 'Part 4', raw: 5, max: 12 }]), // gap 17.9
      tot('listening', 13, 30), // gap 26.7
      tot('writing', 34, 40),
      tot('speaking', 21, 25, [{ label: 'Lexical Resource', raw: 4, max: 5 }]),
    ])
    expect(Math.round(a.latest.uoe!.gap)).toBe(18)
    expect(a.ranked.map((r) => r.skill)).toEqual(['listening', 'uoe', 'reading'])
    expect(a.ranked[1].part).toBe('Part 4')
    expect(a.guards.join(' ')).toMatch(/over-served/)
    const tie = allocation([tot('reading', 30, 50), tot('uoe', 15, 28), tot('listening', 17, 30)]) // gaps 14, 14.3, 13.3
    expect(tie.ranked.map((r) => r.skill)).toEqual(['uoe', 'listening', 'reading'])
  })
  it('gives Speaking a block only when a band is weak, and falls back to 80% when nothing has a gap', () => {
    expect(allocation([tot('speaking', 19, 25, [{ label: 'Lexical Resource', raw: 2.5, max: 5 }])]).ranked[0]).toMatchObject({ skill: 'speaking', part: 'Lexical Resource' })
    expect(allocation([tot('speaking', 19, 25, [{ label: 'Lexical Resource', raw: 3.5, max: 5 }])]).ranked).toEqual([])
    expect(allocation([tot('reading', 38, 50), tot('listening', 28, 30)]).ranked.map((r) => r.skill)).toEqual(['reading'])
  })
})
