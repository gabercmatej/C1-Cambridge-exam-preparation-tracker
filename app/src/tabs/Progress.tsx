import { useState } from 'react'
import { Icon } from '../components/Icon'
import { JourneyStrip, type Bar } from '../components/JourneyStrip'
import { BandPips, BasisMark, StatusMark } from '../components/marks'
import { DAYS } from '../data/plan'
import { ANCHORS, BASIS_NAME, LINES, SKILL_NAME, type Basis, type Skill, type Total } from '../data/scores'
import { fmt } from '../lib/dates'
import { allocation, flexLine } from '../lib/flex'
import { allTasks, effDate } from '../lib/schedule'
import { allTotals, type Ctx } from '../state'

const SKILLS = Object.keys(SKILL_NAME) as Skill[]
const pct = (t: Total) => Math.round((t.raw / t.max) * 100)
const SHORT: Record<Basis, string> = { official: 'Official', unofficial: 'Unofficial', tutor: 'Tutor' }
const meanBand = (t: Total) => (t.parts.length ? t.raw / t.parts.length : t.raw)

/** An official result drawn against the 160 / 180 / 200 anchors. Only Reading, Use of English and Listening. */
function AnchorBar({ t }: { t: Total }) {
  const a = ANCHORS[t.skill as keyof typeof ANCHORS]
  const at = (v: number) => `${(v / a.max) * 100}%`
  const tick = (v: number, long: string, short: string, cls = '') => (
    <div className={`tick ${cls}`} style={{ left: at(v) }}><span><span className="long">{long}</span><span className="short">{short}</span></span></div>
  )
  return (
    <div className="anchor-wrap">
      <div className="anchor" role="img" aria-label={`${t.raw} out of ${t.max}. Anchors: ${a.a160} for scale 160, ${a.a180} for scale 180, ${a.a200} for scale 200.`}>
        <div className="fill" style={{ width: at(Math.min(t.raw, a.max)) }} />
        {tick(a.a160, '160 · B2', '160')}
        {tick(a.a180, '180 · C1', '180 C1', 'pass')}
        {tick(a.b, 'B est.', 'B', 'est')}
        {tick(a.a200, '200', '200')}
        <div className="you num" style={{ left: at(Math.min(t.raw, a.max)) }}>{t.raw}</div>
      </div>
    </div>
  )
}

const partsLine = (t: Total) => t.parts.map((p) => `${p.label} ${p.raw}${t.basis === 'tutor' ? '' : '/' + p.max}`).join(' · ')
const Del = ({ on }: { on?: () => void }) => on ? <button type="button" className="btn ghost sm" onClick={on}>Delete</button> : null

function Tutor({ t, onDelete }: { t: Total; onDelete?: () => void }) {
  const speaking = t.skill === 'speaking'
  // Writing parts are "Task 1 Content" ... "Task 2 Language" for two-task papers; one group otherwise.
  const groups = Object.entries(t.parts.reduce<Record<string, Total['parts']>>((g, p) => {
    const k = p.label.match(/^Task \d/)?.[0] ?? ''
    return { ...g, [k]: [...(g[k] ?? []), { ...p, label: p.label.replace(/^Task \d /, '') }] }
  }, {}))
  const bands = (parts: Total['parts']) => (
    <div className="bands">{parts.map((p) => <div key={p.label}><span>{p.label}</span><BandPips v={p.raw} /><span>{p.raw}</span></div>)}</div>
  )
  return (
    <div className="result">
      <div className="cap tight">
        <BasisMark basis="tutor">{SHORT.tutor}</BasisMark>
        <span>{t.source} · {fmt(t.date)}{t.note ? ` · ${t.note}` : ''}</span>
        <span className={`tot${speaking ? '' : ' num'}`}>{speaking ? `mean band ${meanBand(t).toFixed(1)}` : `${t.raw}/${t.max}`}</span>
        <Del on={onDelete} />
      </div>
      {groups.length > 1
        ? <div className="bandpair">{groups.map(([k, ps]) => <div key={k}><p className="sec">{k}</p>{bands(ps)}</div>)}</div>
        : groups.length === 1 && bands(groups[0][1])}
    </div>
  )
}

function AddResult({ c, close }: { c: Ctx; close: () => void }) {
  const [err, setErr] = useState('')
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
        const raw = +f.raw, max = +f.max
        if (!(max > 0) || !(raw >= 0) || raw > max) return setErr('The score must be between 0 and the maximum.')
        const skill = f.skill as Skill
        // Writing and Speaking marks are always tutor assessments, whatever the task they were written on.
        const basis: Basis = skill === 'writing' || skill === 'speaking' ? 'tutor' : 'unofficial'
        c.set((s) => ({ ...s, results: [...s.results, { id: crypto.randomUUID(), date: f.date, source: f.source.trim(), basis, skill, raw, max, note: f.note.trim() || undefined }] }))
        close()
      }}
    >
      <label className="field">Date<input name="date" type="date" required defaultValue={c.today} className="input" /></label>
      <label className="field">Skill<select name="skill" className="input">{SKILLS.map((k) => <option key={k} value={k}>{SKILL_NAME[k]}</option>)}</select></label>
      <label className="field wide">Source<input name="source" required autoFocus className="input" placeholder="engexam Test 5, Part 7" /></label>
      <label className="field">Score<input name="raw" required inputMode="decimal" className="input" /></label>
      <label className="field">Out of<input name="max" required inputMode="decimal" className="input" /></label>
      <label className="field wide">Note<input name="note" className="input" /></label>
      <p className="caption wide">Extra results are stored as unofficial practice (or tutor assessment for Writing and Speaking; enter a Speaking mean band out of 5). Official results come only from the Test A and Test B marking tasks.</p>
      {err && <p role="alert" className="err-text wide">{err}</p>}
      <div className="actions wide"><button className="btn primary">Add result</button><button type="button" className="btn ghost" onClick={close}>Cancel</button></div>
    </form>
  )
}

export default function Progress(c: Ctx) {
  const [adding, setAdding] = useState(false)
  const all = allTotals(c.s)
  const alloc = allocation(all)
  const manual = new Set(c.s.results.map((r) => r.id))
  const del = (t: Total) => (manual.has(t.id) ? () => confirm('Delete this result?') && c.set((s) => ({ ...s, results: s.results.filter((r) => r.id !== t.id) })) : undefined)
  const maxGap = Math.max(...alloc.ranked.map((r) => r.gap), 1)

  // Practice activity: minutes of tasks logged done, by the day they were done on (effective date).
  const logged: Record<string, number> = {}
  for (const t of allTasks(c.s)) if (c.s.log[t.id]?.status === 'done') logged[effDate(t, c.s)] = (logged[effDate(t, c.s)] ?? 0) + t.minutes
  const bars: Bar[] = DAYS.map((d) => ({
    n: d.n, date: d.date, minutes: logged[d.date] ?? 0, title: `Day ${d.n} · ${logged[d.date] ?? 0} min logged`,
    state: d.date > c.today ? 'gone' : logged[d.date] ? 'done' : 'stub',
  }))
  const active = bars.filter((b) => b.state === 'done')
  const totalMin = active.reduce((a, b) => a + b.minutes, 0)

  return (
    <section>
      <header className="page-head">
        <div><h1>Progress</h1><p>No predicted exam score, on purpose. Three kinds of result, never mixed.</p></div>
        {!adding && <button type="button" className="btn" onClick={() => setAdding(true)}><Icon name="plus" />Add result</button>}
      </header>
      {adding && <AddResult c={c} close={() => setAdding(false)} />}

      <div className="legend">
        <BasisMark basis="official">{BASIS_NAME.official} · Test A and Test B only</BasisMark>
        <BasisMark basis="unofficial">{BASIS_NAME.unofficial} · trend only</BasisMark>
        <BasisMark basis="tutor">{BASIS_NAME.tutor} · not examiner-marked</BasisMark>
      </div>

      <div className={`flexp${alloc.ranked.length ? '' : ' single'}`}>
        <div>
          <p className="meta">This week's flex blocks go to</p>
          <h2>{flexLine(alloc)}</h2>
          {alloc.guards.map((g) => <p key={g} className="guard">{g}</p>)}
          <p className="caption">Run this on Days 7, 14 and 21 and write the choice in the flex task's note.</p>
        </div>
        {alloc.ranked.length > 0 && (
          <div>
            <p className="meta mb-2.5">Gap to the Secure line, in points</p>
            {alloc.ranked.map((r) => (
              <div key={r.skill} className="gap"><span>{SKILL_NAME[r.skill]}</span><i style={{ width: `${(r.gap / maxGap) * 100}%` }} /><span className="num">{Math.round(r.gap)}</span></div>
            ))}
            <p className="caption">Ties within 5 points go to Use of English, then Listening, Reading, Writing. The part is where the most marks were lost.</p>
          </div>
        )}
      </div>

      <div className="activity">
        <h2 className="sec">Practice activity <span className="count">minutes logged per day</span></h2>
        <JourneyStrip days={bars} exam={false} label={`Minutes logged: ${totalMin} over ${active.length} days.`} />
        <p className="meta">{totalMin} minutes logged over {active.length} {active.length === 1 ? 'day' : 'days'}.</p>
      </div>

      {SKILLS.map((skill) => {
        const mine = all.filter((t) => t.skill === skill)
        const of = (b: Basis) => mine.filter((t) => t.basis === b)
        const latest = alloc.latest[skill]
        const tutor = skill === 'writing' || skill === 'speaking'
        const [b, sec, m] = LINES[skill]
        const un = of('unofficial')
        return (
          <div key={skill} className="skill">
            <div>
              <h2>{SKILL_NAME[skill]}</h2>
              {latest ? (
                <>
                  <StatusMark label={latest.label} provisional={latest.total.basis === 'unofficial'} />
                  <p className={`big${skill === 'speaking' ? '' : ' num'}`}>
                    {skill === 'speaking' ? <>{meanBand(latest.total).toFixed(1)}<small> mean band</small></> : <>{latest.total.raw}<small> / {latest.total.max}</small></>}
                  </p>
                </>
              ) : <p className="none">No result yet</p>}
            </div>
            <div>
              {mine.length === 0 && <p className="meta mb-4">Results appear here when you fill in the score fields on a task.</p>}
              {of('official').filter((t) => t.skill in ANCHORS).map((t) => (
                <div key={t.id} className="result">
                  <div className="cap"><BasisMark basis="official">{SHORT.official}</BasisMark><span>{t.source} · {fmt(t.date)}</span></div>
                  <AnchorBar t={t} />
                  {t.parts.length > 1 && <p className="line">{partsLine(t)}</p>}
                  {t.note && <p className="line">{t.note}</p>}
                </div>
              ))}
              {of('official').filter((t) => !(t.skill in ANCHORS)).map((t) => (
                <div key={t.id} className="result"><div className="cap"><BasisMark basis="official">{SHORT.official}</BasisMark><span>{t.source} · {fmt(t.date)}</span><span className="tot num">{t.raw}/{t.max}</span></div></div>
              ))}
              {of('tutor').map((t) => <Tutor key={t.id} t={t} onDelete={del(t)} />)}
              {un.length > 0 && (
                <div className="result">
                  <div className="cap"><BasisMark basis="unofficial">{SHORT.unofficial}</BasisMark><span>Practice sets, percent correct</span></div>
                  <div className="trendbox">
                    <div className="trend" role="img" aria-label={un.map((t) => `${t.source}: ${pct(t)} percent`).join('; ')}>
                      {un.map((t) => <div key={t.id}><i style={{ bottom: `${pct(t)}%` }} /><b style={{ bottom: `${pct(t)}%` }}>{pct(t)}%</b><span>{fmt(t.date).replace(/^\w+ /, '')}</span></div>)}
                    </div>
                  </div>
                  {un.map((t) => (
                    <p key={t.id} className="line">
                      <b>{t.source}</b> · <span className="num">{t.raw}/{t.max}</span> · {pct(t)}%{t.parts.length > 1 && ` · ${partsLine(t)}`}{t.note && ` · ${t.note}`}
                      <Del on={del(t)} />
                    </p>
                  ))}
                </div>
              )}
              <p className="lines">
                {tutor ? 'Tutor estimate. Not examiner-marked. Probably generous: never read as a position on the official scale. ' : ''}
                {skill === 'speaking' ? `Lines on the mean of five bands: below ${b} Priority, ${sec}+ Secure. No Pronunciation band, so no mark out of 75.` : `Lines: ${b - 1}/${m} or less Priority, ${sec}+ Secure.`}
                {skill === 'writing' && ' Four bands per task (C, CA, O, L). For orientation only: the official 180 anchor is 24/40.'}
              </p>
            </div>
          </div>
        )
      })}

      <p className="foot">
        Within about 3 scale points of a line is uncertain. "B est." is an interpolated estimate of Grade B, not a Cambridge figure.
        There is no predicted exam score here, on purpose. {BASIS_NAME.official}s (Test A and Test B only), {BASIS_NAME.unofficial.toLowerCase()} and {BASIS_NAME.tutor.toLowerCase()}s are never mixed. Cambridge: the conversion tables apply only to official practice tests and "should not be used to try to predict precise scores in the live exam".{' '}
        <a className="prose" href="https://www.cambridgeenglish.org/Images/210434-converting-practice-test-scores-to-cambridge-english-scale-scores.pdf" target="_blank" rel="noopener noreferrer">Conversion guide<Icon name="ext" className="ext" /></a>
      </p>
    </section>
  )
}
