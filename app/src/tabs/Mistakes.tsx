import { useState } from 'react'
import { Icon } from '../components/Icon'
import { StepPips } from '../components/marks'
import { Copy } from '../components/Md'
import { SKILL_NAME, type Skill } from '../data/scores'
import { addDays, fmt } from '../lib/dates'
import { ERROR_TYPES, grade, isDue, newMistake, notebookLine, type Mistake } from '../lib/review'
import type { Ctx } from '../state'

const SKILLS = Object.keys(SKILL_NAME) as Skill[]
const NUM = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
const word = (n: number) => NUM[n] ?? String(n)

function summary(got: number, missed: number) {
  if (!missed) return got === 1 ? 'It moves on to its next step.' : `All ${got} move on to their next step.`
  if (!got) return missed === 1 ? 'It comes back tomorrow.' : `All ${missed} come back tomorrow.`
  return `${word(got)} ${got === 1 ? 'moves on to its' : 'move on to their'} next step; ${word(missed).toLowerCase()} ${missed === 1 ? 'comes' : 'come'} back tomorrow.`
}

function Review({ c, done }: { c: Ctx; done: () => void }) {
  // The queue is fixed when the review starts, so a missed card does not come straight back.
  const [queue] = useState(() => c.s.mistakes.filter((m) => isDue(m, c.today)).map((m) => m.id))
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(false)
  const [tally, setTally] = useState({ got: 0, missed: 0 })
  const m = c.s.mistakes.find((x) => x.id === queue[i])
  const answer = (got: boolean) => {
    c.set((s) => ({ ...s, mistakes: s.mistakes.map((x) => (x.id === m!.id ? grade(x, got, c.today) : x)) }))
    setTally((t) => (got ? { ...t, got: t.got + 1 } : { ...t, missed: t.missed + 1 }))
    setShown(false)
    setI(i + 1)
  }
  return (
    <section className="review">
      <div className="rv-top">
        <button type="button" className="btn ghost sm" onClick={done}><Icon name="arrow" />Notebook</button>
        <span className="rv-dots" aria-hidden="true">{queue.map((id, k) => <i key={id} className={!m || k < i ? 'done' : k === i ? 'now' : ''} />)}</span>
        <span className="num">{Math.min(i + 1, queue.length)} of {queue.length}</span>
      </div>
      {m ? (
        <div className="rv-card">
          <p className="meta">{SKILL_NAME[m.skill]} · {m.type} · step {Math.min(m.box + 1, 3)} of 3</p>
          <p className={`q${shown ? ' struck' : ''}`}>{m.wrong}</p>
          {shown ? (
            <>
              <p className="a">{m.correct}</p>
              {m.why && <p className="why">{m.why}</p>}
              <div className="actions">
                <button type="button" autoFocus className="btn lg" onClick={() => answer(false)}>Missed</button>
                <button type="button" className="btn primary lg" onClick={() => answer(true)}><Icon name="check" />Got it</button>
              </div>
            </>
          ) : (
            <>
              <p className="help">Say or type the correction first, then check.</p>
              <div className="actions"><button type="button" autoFocus className="btn primary lg" onClick={() => setShown(true)}>Reveal</button></div>
            </>
          )}
        </div>
      ) : (
        <div className="rv-end" role="status">
          <h2>Review finished. {queue.length} {queue.length === 1 ? 'item' : 'items'} done.</h2>
          <p>{queue.length ? summary(tally.got, tally.missed) : 'Nothing was due.'}</p>
          <button type="button" autoFocus className="btn" onClick={done}>Back to the notebook</button>
        </div>
      )}
    </section>
  )
}

function Entry({ m, today, onDelete }: { m: Mistake; today: string; onDelete?: () => void }) {
  return (
    <div className="mk">
      <div>
        <p className="pair"><s>{m.wrong}</s><b>{m.correct}</b></p>
        {m.why && <p className="why">{m.why}</p>}
      </div>
      <div className="side">
        <span className="tag">{m.type}</span>
        <span>{SKILL_NAME[m.skill]}</span>
        {onDelete ? (isDue(m, today) ? <span className="now">Due today</span> : <span>{m.box === 3 ? 'Retired' : `Next review ${fmt(m.dueOn)}`}</span>) : <span>Comes back tomorrow</span>}
        <span><StepPips box={m.box} />{m.box === 3 ? '3 of 3 done' : `step ${m.box + 1} of 3`}</span>
        {onDelete && <button type="button" className="del" aria-label={`Delete "${m.wrong}"`} title="Delete" onClick={onDelete}><Icon name="trash" /></button>}
      </div>
    </div>
  )
}

const EXAMPLE: Mistake = { id: 'example', createdOn: '', skill: 'uoe', type: 'preposition', wrong: 'it depends of the weather', correct: 'it depends on the weather', why: 'depend on', box: 0, dueOn: '' }

export default function Mistakes({ c, autoReview }: { c: Ctx; autoReview: boolean }) {
  const { s, set, today } = c
  const [reviewing, setReviewing] = useState(autoReview)
  const [filter, setFilter] = useState<Skill | 'all'>('all')
  const [recent, setRecent] = useState(false)
  const [skill, setSkill] = useState<Skill>('uoe')
  const dueList = s.mistakes.filter((m) => isDue(m, today))
  const due = dueList.length
  const list = s.mistakes.filter((m) => (filter === 'all' || m.skill === filter) && (!recent || m.createdOn > addDays(today, -7))).reverse()
  const types = Object.entries(list.reduce<Record<string, number>>((a, m) => ({ ...a, [m.type]: (a[m.type] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1])
  const nextDue = s.mistakes.filter((m) => m.box < 3).map((m) => m.dueOn).sort()[0]

  if (reviewing) return <Review c={c} done={() => setReviewing(false)} />

  const add = (form: HTMLFormElement) => {
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>
    if (!f.wrong.trim() || !f.correct.trim()) return
    set((s) => ({ ...s, mistakes: [...s.mistakes, newMistake(today, { skill, type: f.type.trim() || 'word choice', wrong: f.wrong.trim(), correct: f.correct.trim(), why: f.why.trim() || undefined })] }))
    form.reset() // stays open with the skill kept, for entering several in a row
    form.querySelector<HTMLInputElement>('[name=wrong]')?.focus()
  }
  const minutes = Math.ceil((due * 40) / 60)

  return (
    <section>
      <header className="page-head">
        <div><h1>Mistake notebook</h1><p>Only errors you could repeat, not slips. Three to eight a day is normal.</p></div>
      </header>

      {due > 0 ? (
        <div className="due">
          <b className="num">{due}</b>
          <p><strong>due for review today</strong>About {minutes} {minutes === 1 ? 'minute' : 'minutes'}. Say the correction first, then check.</p>
          <button type="button" className="btn primary lg" onClick={() => setReviewing(true)}>Start review<Icon name="arrow" /></button>
        </div>
      ) : s.mistakes.length > 0 && <p className="nodue">Nothing due today.{nextDue && ` Next review ${fmt(nextDue)}.`}</p>}

      <form
        onSubmit={(e) => { e.preventDefault(); add(e.currentTarget) }}
        onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && e.currentTarget.requestSubmit()}
      >
        <div className="composer">
          <input name="wrong" required className="input" placeholder="What you wrote or chose" aria-label="Wrong" />
          <Icon name="arrow" />
          <input name="correct" required className="input" placeholder="The correct version" aria-label="Correct" />
        </div>
        <div className="composer-more">
          <input name="why" className="input" placeholder="Why (the rule)" aria-label="Why (the rule)" />
          <select className="input" aria-label="Skill" value={skill} onChange={(e) => setSkill(e.target.value as Skill)}>{SKILLS.map((k) => <option key={k} value={k}>{SKILL_NAME[k]}</option>)}</select>
          <input name="type" list="error-types" className="input" placeholder="Error type" aria-label="Error type" />
          <datalist id="error-types">{ERROR_TYPES.map((t) => <option key={t} value={t} />)}</datalist>
          <button className="btn">Add</button>
        </div>
        <p className="hint">Cmd+Enter saves and keeps the skill for the next one.</p>
      </form>

      {s.mistakes.length === 0 ? (
        <div className="empty">
          <h2>No mistakes yet.</h2>
          <p>Add the first one after today's timed block: three to eight a day is normal.</p>
          <div className="example">
            <p className="meta">An entry looks like this</p>
            <Entry m={EXAMPLE} today={today} />
          </div>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <div className="seg" role="group" aria-label="Skill">
              {(['all', ...SKILLS] as const).map((k) => (
                <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{k === 'all' ? `All ${s.mistakes.length}` : SKILL_NAME[k]}</button>
              ))}
            </div>
            <div className="seg" role="group" aria-label="Period">
              <button type="button" aria-pressed={!recent} onClick={() => setRecent(false)}>All time</button>
              <button type="button" aria-pressed={recent} onClick={() => setRecent(true)}>Last 7 days</button>
            </div>
            {list.length > 0 && <span className="copyr"><Copy text={list.map(notebookLine).join('\n')} label={`Copy ${list.length} as notebook lines`} /></span>}
          </div>
          <p className="toolnote">Notebook lines paste straight into GPT-8 (weekly retest, choose "Last 7 days") and GPT-5 (patterns, Day 21). A GPT-8 miss counts as Missed in the next review.</p>
          {list.length > 0 ? (
            <>
              <div className="types" aria-label="Error types in this list">{types.map(([t, n]) => <span key={t} className="tag">{t} <span className="num">{n}</span></span>)}</div>
              {list.map((m) => (
                <Entry key={m.id} m={m} today={today} onDelete={() => confirm('Delete this mistake?') && set((s) => ({ ...s, mistakes: s.mistakes.filter((x) => x.id !== m.id) }))} />
              ))}
            </>
          ) : (
            <div className="empty">
              <h2>Nothing matches this filter.</h2>
              <p>No mistakes are logged {filter === 'all' ? '' : 'for this skill '}{recent ? 'in the last 7 days.' : 'yet.'}</p>
              <button type="button" className="btn" onClick={() => { setFilter('all'); setRecent(false) }}>Show all {s.mistakes.length}</button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
