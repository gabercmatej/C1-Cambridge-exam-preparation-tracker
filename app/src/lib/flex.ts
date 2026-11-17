// Weekly allocation rule from STUDY_PLAN §4: five minutes, no AI.
import { LINES, SKILL_NAME, label, type Label, type Skill, type Total } from '../data/scores'

const TIE_ORDER: Skill[] = ['uoe', 'listening', 'reading', 'writing', 'speaking']

export interface Allocation {
  latest: Partial<Record<Skill, { total: Total; label: Label; gap: number }>>
  /** Weakest first. Empty until there is at least one whole-section result. */
  ranked: { skill: Skill; gap: number; part?: string }[]
  guards: string[]
}

export function allocation(totals: Total[]): Allocation {
  const latest: Allocation['latest'] = {}
  for (const t of totals) {
    if (!t.whole) continue
    const [, secure, max] = LINES[t.skill]
    // gap = Secure line minus result, in percentage points of the maximum
    latest[t.skill] = { total: t, label: label(t.skill, t.raw, t.max), gap: Math.max(0, (secure / max - t.raw / t.max) * 100) }
  }
  const sp = latest.speaking
  // Speaking earns a flex block only if its mean band is below 3.5 or one band is 2.5 or lower.
  const speakingWeak = !!sp && (sp.label === 'Priority' || sp.total.parts.some((p) => p.raw <= 2.5))
  let pool = TIE_ORDER.filter((s) => latest[s] && (s !== 'speaking' || speakingWeak)).map((s) => ({ skill: s, gap: latest[s]!.gap }))
  if (pool.length && pool.every((p) => p.gap === 0))
    // No skill has a gap: flex goes to the skill furthest below about 80%.
    pool = pool.map((p) => ({ skill: p.skill, gap: Math.max(0, 80 - (latest[p.skill]!.total.raw / latest[p.skill]!.total.max) * 100) }))
  pool = pool.filter((p) => p.gap > 0)

  const ranked: Allocation['ranked'] = []
  while (pool.length) {
    const top = Math.max(...pool.map((p) => p.gap))
    // gaps within 5 points are a tie; pool is already in tie-break order
    const pick = pool.find((p) => top - p.gap <= 5)!
    pool = pool.filter((p) => p !== pick)
    // the part where the most marks were lost, not the lowest percentage
    const parts = latest[pick.skill]!.total.parts
    const worst = parts.reduce<(typeof parts)[0] | undefined>((w, p) => (!w || p.max - p.raw > w.max - w.raw ? p : w), undefined)
    ranked.push({ ...pick, part: worst?.label })
  }

  const guards: string[] = []
  const prio = (['reading', 'uoe', 'listening'] as Skill[]).filter((s) => latest[s]?.label === 'Priority')
  if (latest.writing && latest.writing.label !== 'Priority' && prio.length >= 2)
    guards.push(`Writing is over-served: make d15-c and d18-b ten-minute plans and give the freed 80 minutes to ${prio.map((s) => SKILL_NAME[s]).join(' and ')}.`)
  if (latest.listening?.label === 'Priority') guards.push('Listening is Priority: add ten minutes of dictation from an engexam tapescript on the light days (12 and 19).')
  if (ranked.some((r) => r.skill === 'writing')) guards.push('Writing as a flex block is one plan, an introduction and one body paragraph on a GPT-9 prompt, marked with GPT-2. Not another full text.')
  if (ranked.some((r) => r.skill === 'speaking')) guards.push('Speaking as a flex block is a shadow test on the weak part.')
  return { latest, ranked, guards }
}

export const flexLine = (a: Allocation) =>
  a.ranked.length
    ? a.ranked.slice(0, 2).map((r) => `${SKILL_NAME[r.skill]}${r.part ? ' ' + r.part : ''}`).join(', then ')
    : Object.keys(a.latest).length ? 'No skill is below its Secure line or 80%.' : 'No whole-section result yet. The first one arrives with the diagnostic.'
