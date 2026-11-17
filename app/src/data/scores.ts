// What each task asks you to record, and how results are classed.
// Three classes that are never mixed (STUDY_PLAN §1): official anchor, unofficial practice, tutor assessment.
export type Skill = 'reading' | 'uoe' | 'listening' | 'writing' | 'speaking'
export type Basis = 'official' | 'unofficial' | 'tutor'
export interface Field { key: string; skill: Skill; label: string; max: number; step?: number }
export interface Spec { source: string; basis: Basis; fields: Field[] }

export const SKILL_NAME: Record<Skill, string> = {
  reading: 'Reading', uoe: 'Use of English', listening: 'Listening', writing: 'Writing', speaking: 'Speaking',
}
export const BASIS_NAME: Record<Basis, string> = {
  official: 'Official anchor', unofficial: 'Unofficial practice', tutor: 'Tutor assessment',
}

// Official practice-score anchors (RESEARCH §3). `b` is the interpolated Grade B figure: an estimate, not Cambridge's.
export const ANCHORS = {
  reading: { max: 50, a160: 23, a180: 32, a200: 43, b: 39 },
  uoe: { max: 28, a160: 11, a180: 16, a200: 23, b: 20.5 },
  listening: { max: 30, a160: 13, a180: 18, a200: 26, b: 23 },
} as const

// Fixed lines from STUDY_PLAN §2: [Borderline from, Secure from, out of].
export const LINES: Record<Skill, [number, number, number]> = {
  reading: [32, 37, 50], uoe: [16, 19, 28], listening: [18, 21, 30], writing: [28, 32, 40], speaking: [3.5, 4, 5],
}
export type Label = 'Priority' | 'Borderline' | 'Secure'
export function label(skill: Skill, raw: number, max: number): Label {
  const [b, s, m] = LINES[skill]
  // cross-multiplied so 14/20 and 28/40 compare exactly
  return raw * m < b * max ? 'Priority' : raw * m < s * max ? 'Borderline' : 'Secure'
}

const RU_MAX = [8, 8, 8, 12, 12, 8, 12, 10]
/** Reading and Use of English part. Reading = Parts 1, 5, 6, 7, 8; Use of English = Parts 2, 3, 4. */
const ru = (n: number, max = RU_MAX[n - 1]): Field => ({ key: `p${n}`, skill: n >= 2 && n <= 4 ? 'uoe' : 'reading', label: `Part ${n}`, max })
const li = (n: number): Field => ({ key: `l${n}`, skill: 'listening', label: `Part ${n}`, max: [6, 8, 6, 10][n - 1] })
const wr = (task?: number): Field[] =>
  ['Content', 'Communicative Achievement', 'Organisation', 'Language'].map((c, i) => ({
    key: `w${task ?? ''}${i}`, skill: 'writing', label: task ? `Task ${task} ${c}` : c, max: 5,
  }))
const sp = (): Field[] =>
  ['Grammatical Resource', 'Lexical Resource', 'Discourse Management', 'Interactive Communication', 'Global Achievement'].map((c, i) => ({
    key: `s${i}`, skill: 'speaking', label: c, max: 5, step: 0.5,
  }))
const RU_ALL = RU_MAX.map((_, i) => ru(i + 1))
const L_ALL = [1, 2, 3, 4].map(li)
const un = (source: string, ...fields: Field[]): Spec => ({ source, basis: 'unofficial', fields })
const tu = (source: string, fields: Field[]): Spec => ({ source, basis: 'tutor', fields })

// Official results exist only for Test A (Days 2-3) and Test B (Day 20). Scores sit on the marking task,
// because that is when the numbers exist.
export const SPECS: Record<string, Spec> = {
  'd02-b': { source: 'Diagnostic, Test A', basis: 'official', fields: RU_ALL },
  'd03-b': { source: 'Diagnostic, Test A', basis: 'official', fields: L_ALL },
  'd05-b': tu('Diagnostic Writing', [...wr(1), ...wr(2)]),
  'd05-d': tu('Speaking simulation 1', sp()),
  'd06-a': un('Flo-Joe Test 1', ru(2), ru(3), ru(4)),
  'd06-d': tu('Diagnostic essay, rewrite', wr()),
  'd07-b': un('Flo-Joe Reading Test 1', ru(7, 6)),
  'd08-b': un('Flo-Joe Test 2', ru(1), ru(2)),
  'd08-d': un('engexam Listening Test 1', li(2)),
  'd09-b': un('Flo-Joe Reading Test 1', ru(5, 6), ru(6, 4)),
  'd09-c': tu('Essay 2', wr()),
  'd10-b': un('Flo-Joe Test 2', ru(3), ru(4)),
  'd10-c': un('engexam Listening Test 1', li(3), li(4)),
  'd11-d': un('engexam R&UoE Test 2', ru(6, 4)),
  'd12-b': tu('Proposal', wr()),
  'd13-d': un('Mock 1 (engexam)', ...RU_ALL, ...L_ALL),
  'd14-b': tu('Mock 1 Writing', [...wr(1), ...wr(2)]),
  'd14-c': tu('Speaking simulation 2', sp()),
  'd16-b': un('Flo-Joe Test 3', ru(1), ru(2), ru(3), ru(4)),
  'd16-c': tu('Report', wr()),
  'd17-b': un('Flo-Joe Reading Test 2', ru(5, 6), ru(7, 6), ru(8)),
  'd17-c': un('engexam Listening Test 2', li(1), li(2)),
  'd19-b': tu('Backup genre text', wr()),
  'd20-d': tu('Speaking simulation 3 (Mock 2)', sp()),
  'd20-e': { source: 'Mock 2, Test B', basis: 'official', fields: [...RU_ALL, ...L_ALL] },
  'd21-b': tu('Mock 2 Writing', [...wr(1), ...wr(2)]),
  'd22-b': un('Flo-Joe Test 4', ru(1), ru(2), ru(3), ru(4)),
  'd23-b': un('engexam Listening Test 3', ...L_ALL),
  'd24-b': tu('Final essay', wr()),
}

export interface Total {
  id: string
  taskId?: string
  date: string
  source: string
  basis: Basis
  skill: Skill
  raw: number
  max: number
  parts: { label: string; raw: number; max: number }[]
  /** A complete section (Reading /50, Use of English /28, Listening /30) or any Writing or Speaking result. */
  whole: boolean
  note?: string
}
export interface ManualResult { id: string; date: string; source: string; basis: Basis; skill: Skill; raw: number; max: number; note?: string }

const isWhole = (skill: Skill, max: number) => skill === 'writing' || skill === 'speaking' || max === ANCHORS[skill].max

/** Per-skill totals derived from task score fields (only once every field for that skill is filled) plus manual results. */
export function totals(scores: Record<string, Record<string, number>>, manual: ManualResult[], dateOf: (taskId: string) => string): Total[] {
  const out: Total[] = []
  for (const [taskId, spec] of Object.entries(SPECS)) {
    const got = scores[taskId] ?? {}
    for (const skill of new Set(spec.fields.map((f) => f.skill))) {
      const fields = spec.fields.filter((f) => f.skill === skill)
      if (!fields.every((f) => typeof got[f.key] === 'number')) continue
      const parts = fields.map((f) => ({ label: f.label, raw: got[f.key], max: f.max }))
      const raw = parts.reduce((a, p) => a + p.raw, 0)
      const max = parts.reduce((a, p) => a + p.max, 0)
      out.push({ id: `${taskId}:${skill}`, taskId, date: dateOf(taskId), source: spec.source, basis: spec.basis, skill, raw, max, parts, whole: isWhole(skill, max) })
    }
  }
  for (const r of manual) out.push({ ...r, parts: [], whole: isWhole(r.skill, r.max) })
  return out.sort((a, b) => a.date.localeCompare(b.date))
}
