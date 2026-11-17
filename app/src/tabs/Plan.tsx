import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react'
import { Icon } from '../components/Icon'
import { Inline, plain } from '../components/Md'
import { TaskRow } from '../components/TaskRow'
import { DAYS, type Day } from '../data/plan'
import { addDays, fmt, LAST, START } from '../lib/dates'
import { effDate, isOverdue, tasksOn } from '../lib/schedule'
import type { Ctx } from '../state'
import { DayInfo, headline, long } from './Today'

const SKILLS = ['General', 'Reading', 'Use of English', 'Writing', 'Listening', 'Speaking']
const WEEKS = ['Week 1 · Baseline, then start', 'Week 2 · Technique and volume', 'Week 3 · Targeted improvement', 'Week 4 · Consolidation']
const clampDay = (d: string) => (d < START ? START : d > LAST ? LAST : d)

// Below 1080 px the day detail sits under the week that holds the selected day.
const NARROW = '(max-width: 1080px)'
const useNarrow = () => useSyncExternalStore(
  (cb) => { const m = matchMedia(NARROW); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) },
  () => matchMedia(NARROW).matches,
)

function AddTask({ c, date, close }: { c: Ctx; date: string; close: () => void }) {
  const [err, setErr] = useState('')
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
        if (f.url && !/^https?:\/\/\S+$/.test(f.url)) return setErr('The link must start with http:// or https://')
        const text = f.title.trim().replace(/[[\]]/g, '') + (f.url ? ` [open link](${f.url})` : '')
        c.set((s) => ({ ...s, customTasks: [...s.customTasks, { id: `c-${crypto.randomUUID()}`, text, date: f.date, skill: f.skill, minutes: +f.minutes || 0 }] }))
        close()
      }}
    >
      <label className="field wide">Task<input name="title" required autoFocus className="input" /></label>
      <label className="field">Date<input name="date" type="date" required min={START} max={LAST} defaultValue={date} className="input" /></label>
      <label className="field">Skill<select name="skill" className="input">{SKILLS.map((k) => <option key={k}>{k}</option>)}</select></label>
      <label className="field">Minutes<input name="minutes" type="number" min={0} max={300} defaultValue={15} className="input" /></label>
      <label className="field">Link <small>(optional)</small><input name="url" type="url" className="input" placeholder="https://" /></label>
      {err && <p role="alert" className="err-text wide">{err}</p>}
      <div className="actions wide"><button className="btn primary">Add task</button><button type="button" className="btn ghost" onClick={close}>Cancel</button></div>
    </form>
  )
}

export default function Plan({ c, initial }: { c: Ctx; initial?: string }) {
  const { s, today } = c
  const [openDay, setOpenDay] = useState(() => clampDay(initial && /^\d{4}-\d\d-\d\d$/.test(initial) ? initial : today))
  const [openTask, setOpenTask] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const narrow = useNarrow()
  const detailRef = useRef<HTMLDivElement>(null)
  const picked = useRef(false)
  const grid = useRef<HTMLDivElement>(null)
  const day = DAYS.find((d) => d.date === openDay)!

  useEffect(() => {
    if (!picked.current || !narrow) return
    const r = detailRef.current?.getBoundingClientRect()
    if (r && (r.top < 0 || r.top > innerHeight - 80)) detailRef.current!.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [openDay, narrow])

  const select = (d: string) => { picked.current = true; setOpenDay(d); setOpenTask(null) }
  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]
    if (!step || !(e.target as HTMLElement).dataset.date) return // only from a day cell, never from inputs in the panel
    const to = addDays(openDay, step)
    if (to < START || to > LAST) return
    e.preventDefault()
    select(to)
    requestAnimationFrame(() => grid.current?.querySelector<HTMLButtonElement>(`[data-date="${to}"]`)?.focus())
  }

  const mocks = DAYS.filter((d) => d.kind === 'mock').map((d) => d.date)
  const cell = (d: Day) => {
    const tasks = tasksOn(d.date, s)
    const done = tasks.filter((t) => s.log[t.id]?.status === 'done').length
    const isToday = d.date === today
    const mock = d.kind === 'mock' ? `Mock ${mocks.indexOf(d.date) + 1}` : ''
    const cls = ['cell', d.date < today && 'past', isToday && 'today', d.date === openDay && 'sel', mock && 'mock', d.kind === 'light' && 'light'].filter(Boolean).join(' ')
    const shown = tasks.length > 6 ? tasks.slice(0, 5) : tasks
    return (
      <button key={d.date} type="button" className={cls} data-date={d.date} aria-pressed={d.date === openDay}
        tabIndex={d.date === openDay ? 0 : -1} onClick={() => select(d.date)}
        aria-label={`${long(d.date)}, day ${d.n}${mock ? `, ${mock}` : ''}, ${done} of ${tasks.length} done${isToday ? ', today' : ''}`}>
        {mock ? <span className="kind">{mock}</span> : d.kind === 'light' && <span className="kind">light</span>}
        <span className="wd">{isToday ? 'Today' : fmt(d.date).slice(0, 3)}</span>
        <span className="dn num">{+d.date.slice(8)}</span>
        {/* compact so it never wraps in a cell: "90–100", "4 h 15", "85 min" */}
        <span className="mn num" title={d.duration}>{d.duration.replace(/^about /, '').replace(/(\d+ h \d+|\d+–\d+) min$/, '$1')}</span>
        <span className="dots" aria-hidden="true">
          {shown.map((t) => <i key={t.id} className={s.log[t.id]?.status === 'done' ? 'on' : isOverdue(t, s, today) ? 'late' : ''} />)}
          {tasks.length > 6 && `+${tasks.length - 5}`}
        </span>
      </button>
    )
  }

  const tasks = tasksOn(day.date, s)
  const away = day.tasks.filter((t) => effDate(t, s) !== day.date)
  const detail = (
    <div className="detail" ref={detailRef}>
      <p className="meta">{long(day.date)} · Day {day.n} · {day.duration}</p>
      <h3>{headline(day)}</h3>
      {day.title && <p className="sub"><Inline text={day.objective.replace(/^./, (ch) => ch.toUpperCase())} /></p>}
      {adding && <AddTask key={day.date} c={c} date={day.date} close={() => setAdding(false)} />}
      <div className="tlist">
        {tasks.map((t) => <TaskRow key={t.id} t={t} c={c} open={openTask === t.id} onToggle={(o) => setOpenTask(o ? t.id : null)} />)}
        {!tasks.length && <p className="meta">No tasks on this day.</p>}
      </div>
      {away.map((t) => <p key={t.id} className="away"><s>{plain(t.text)}</s> moved to {fmt(effDate(t, s))}</p>)}
      <DayInfo day={day} />
    </div>
  )

  return (
    <section>
      <header className="page-head">
        <div>
          <h1>The 26 days</h1>
          <p>The calendar never shifts. Past days stay open so you can log late. Optional tasks you miss are simply dropped.</p>
        </div>
        {!adding && <button type="button" className="btn" onClick={() => setAdding(true)}><Icon name="plus" />Add task</button>}
      </header>
      <div className="plan-grid">
        <div ref={grid} onKeyDown={onKey}>
          {WEEKS.map((week, w) => {
            const days = DAYS.slice(w * 7, w * 7 + 7)
            const [name, phase] = week.split(' · ')
            const complete = days.filter((d) => { const t = tasksOn(d.date, s); return t.length && t.every((x) => s.log[x.id]?.status === 'done') }).length
            const status = days[0].date > today ? '' : days[days.length - 1].date < today ? `${complete} of ${days.length} days complete` : 'In progress'
            return (
              <div key={week}>
                <div className="wk">
                  <h2>{name} <em>{phase}</em>{status && <span>{status}</span>}</h2>
                  <div className="cells">
                    {days.map(cell)}
                    {w === 3 && <div className="cell exam-cell" aria-label="Saturday 12 December, the exam"><span className="wd">Sat</span><span className="dn num">12</span><span className="mn">Exam</span></div>}
                  </div>
                </div>
                {narrow && days.some((d) => d.date === openDay) && detail}
              </div>
            )
          })}
        </div>
        {!narrow && detail}
      </div>
    </section>
  )
}
