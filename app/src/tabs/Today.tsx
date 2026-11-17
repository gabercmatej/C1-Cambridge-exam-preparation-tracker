import { useState } from 'react'
import { Icon } from '../components/Icon'
import { JourneyStrip, type Bar } from '../components/JourneyStrip'
import { Inline, plain } from '../components/Md'
import { TaskRow } from '../components/TaskRow'
import { DAYS, EXAM_DAY, type Day } from '../data/plan'
import { addDays, countdown, dayNumber, diffDays, EXAM, START } from '../lib/dates'
import { isDue } from '../lib/review'
import { catchUp, lostDays, nextAction, tasksOn } from '../lib/schedule'
import type { State } from '../lib/storage'
import { downloadBackup, type Ctx } from '../state'

export const KEEP_ORDER = 'Mock 2, closing a writing cycle, notebook review, Mock 1, timed Use of English sets, flex blocks, Speaking practice'

/** "Tuesday 24 November" */
export const long = (d: string) => new Date(`${d}T00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
/** Mock titles are upper case in the plan ("MOCK 1, unofficial"); shown in sentence case. */
export const dayTitle = (d: Day) => d.title.replace(/^MOCK/, 'Mock')
export const headline = (d: Day) => dayTitle(d) || plain(d.objective).replace(/^./, (ch) => ch.toUpperCase())
export const planned = (d: Day) => d.tasks.reduce((a, t) => a + t.minutes, 0)
const mockName = (d: Day) => (d.kind === 'mock' ? d.title.match(/MOCK \d/)?.[0].replace('MOCK', 'Mock') : undefined)

/** Journey strip data for planned minutes: done, partly done, today or still ahead. */
export function journey(s: State, today: string): Bar[] {
  return DAYS.map((d) => {
    const tasks = tasksOn(d.date, s)
    const done = tasks.filter((t) => s.log[t.id]?.status === 'done').length
    const state = tasks.length && done === tasks.length ? 'done' : d.date === today ? 'today' : done ? 'part' : 'future'
    return { n: d.n, date: d.date, minutes: planned(d), state, mock: mockName(d), title: `Day ${d.n} · ${planned(d)} min` }
  })
}

export function DayInfo({ day }: { day: Day }) {
  // emergency is "(15 min) `d01-a` only." or "none. ..."; the minutes move into the term
  const em = day.emergency.match(/^\((\d+ min)\)\s*(.*)$/)
  return (
    <dl className="brief">
      {([['Done when', day.doneWhen], ['Record', day.record], [em ? `Short on time? ${em[1]}` : 'Short on time?', em ? em[2] : day.emergency]] as const).map(
        ([k, v]) => v && <div key={k}><dt>{k}</dt><dd><Inline text={v.replace(/^[a-z]/, (ch) => ch.toUpperCase())} /></dd></div>,
      )}
    </dl>
  )
}

function ExamDay({ c }: { c: Ctx }) {
  const { today, s, go } = c
  if (today !== EXAM)
    return (
      <section className="examday">
        <p className="meta">{long(today)}</p>
        <h1>Exam done</h1>
        <p className="lede">The plan is finished. Your results are on <button type="button" onClick={() => go('progress')}>Progress</button>, and a final backup is in <button type="button" onClick={() => go('library')}>Library</button>.</p>
      </section>
    )
  const papers = EXAM_DAY.split(/(?<=\.) (?=(?:Reading and Use of English|Writing|Listening|Speaking):)/).map((l) => l.match(/^([^:]+): (.+)$/) ?? [l, '', l])
  const length: Record<string, string> = { 'Reading and Use of English': '90 min', Writing: '90 min', Listening: 'about 40 min', Speaking: '15 min' }
  return (
    <section className="examday">
      <p className="meta">{long(today)}{s.settings.speakingAt && ` · Speaking: ${s.settings.speakingAt}`}</p>
      <h1>Exam day</h1>
      <p className="lede">Nothing to study today. One reminder per paper, in the order you will sit them.</p>
      {papers.map(([l, name, advice]) => (
        <div key={l} className="paper">
          <h2>{name}{length[name] && <span>{length[name]}</span>}</h2>
          <p>{advice.replace(/^./, (ch) => ch.toUpperCase())}</p>
        </div>
      ))}
    </section>
  )
}

export default function Today(c: Ctx) {
  const { s, set, today, go } = c
  const [openId, setOpenId] = useState<string | null>()
  if (today >= EXAM) return <ExamDay c={c} />

  const before = today < START
  const date = before ? START : today
  const day = DAYS.find((d) => d.date === date)
  const tasks = tasksOn(date, s)
  const next = nextAction(s, date)
  const autoOpen = next.kind === 'task' || next.kind === 'catchup' ? next.task.id : null
  const open = openId === undefined ? autoOpen : openId
  const toggle = (id: string) => (o: boolean) => setOpenId(o ? id : undefined) // closing returns to "follow the next task"
  const late = before ? [] : catchUp(s, today)
  const dueList = s.mistakes.filter((m) => isDue(m, today))
  const lost = before ? 0 : lostDays(s, today)
  const left = countdown(today)
  const backupAge = diffDays(s.settings.lastExportAt ?? START, today)

  const subject = [...tasks, ...late].find((t) => t.id === open)
  const isLate = !!subject && late.includes(subject)
  const doneN = tasks.filter((t) => s.log[t.id]?.status === 'done').length
  const minLeft = tasks.filter((t) => !s.log[t.id]?.status).reduce((a, t) => a + t.minutes, 0)
  const minLogged = tasks.filter((t) => s.log[t.id]?.status === 'done').reduce((a, t) => a + t.minutes, 0)
  const nowId = subject && !isLate ? subject.id : undefined
  const tomorrow = DAYS.find((d) => d.date === addDays(date, 1))
  const bars = journey(s, today)
  const doneDays = bars.filter((b) => b.state === 'done').length

  const lead = !subject ? null
    : subject.id === autoOpen ? <b className={isLate ? 'late' : ''}>{isLate ? 'Catch-up' : 'Next'}</b>
    : <b className={isLate ? 'late' : 'quiet'}>{isLate ? 'Catch-up' : s.log[subject.id]?.status === 'done' ? 'Done' : 'Selected'}</b>

  return (
    <section>
      <header className="today-head">
        <div>
          <p className="meta">{day?.kind === 'mock' && <b>Mock exam · </b>}{long(date)} · Day {dayNumber(date)} of 26{day && ` · ${day.duration}`}{before && ' · starts Monday'}</p>
          {day && <h1>{headline(day)}</h1>}
          {day?.title && <p className="sub"><Inline text={day.objective.replace(/^./, (ch) => ch.toUpperCase())} /></p>}
        </div>
        <div className="countdown">
          <b className="num">{left}</b>
          <span>{left === 1 ? 'day' : 'days'} to the exam</span>
          <span>Sat 12 Dec</span>
          {s.settings.speakingAt && <span className="sp">Speaking: {s.settings.speakingAt}</span>}
        </div>
      </header>

      <JourneyStrip days={bars} onSelect={(d) => go('plan', d)}
        label={`26-day plan: ${doneDays} ${doneDays === 1 ? 'day' : 'days'} complete${before ? '' : `, today is day ${dayNumber(date)}`}, Mock 1 on day 13, Mock 2 on day 20, exam on 12 December. Each day opens on Plan.`} />

      {lost >= 3 && (
        <p role="status" className="notice warn">
          <strong>{lost} days lost in a row.</strong> Do not try to catch up. Resume with today, carry over only Mock 2 and any open writing cycle, drop the rest below, and re-run the weekly allocation on Progress.
        </p>
      )}

      <div className="today-grid">
        <div>
          {tasks.length > 0 && (
            <div className="dayprog">
              <span><strong className="num">{doneN} of {tasks.length}</strong> done</span>
              <div className="bar" aria-hidden="true">
                {tasks.map((t) => <i key={t.id} className={s.log[t.id]?.status === 'done' ? 'done' : t.id === nowId ? 'now' : ''} style={{ flex: Math.max(t.minutes, 5) }} />)}
              </div>
              <span className="num">{next.kind === 'done' ? `${minLogged} min logged` : `${minLeft} min left`}</span>
            </div>
          )}

          {subject ? (
            <TaskRow key={subject.id} variant="card" lead={lead} t={subject} c={c} catchup={isLate} open onToggle={toggle(subject.id)} />
          ) : next.kind === 'review' ? (
            <article className="next">
              <div className="row1"><b>Next</b><span aria-hidden="true">·</span><span>Review</span></div>
              <h2>{next.count} {next.count === 1 ? 'mistake' : 'mistakes'} to review</h2>
              <p className="body">About {Math.ceil((next.count * 40) / 60)} {Math.ceil((next.count * 40) / 60) === 1 ? 'minute' : 'minutes'}. Say the correction first, then check.</p>
              <div className="actions"><button type="button" className="btn primary lg" onClick={() => go('mistakes', 'review')}>Start review<Icon name="arrow" /></button></div>
            </article>
          ) : next.kind === 'done' ? (
            <div className="donecard">
              <h2>Done for today.</h2>
              <p>Day {dayNumber(date)} of 26 complete. {left} {left === 1 ? 'day' : 'days'} to go.</p>
              <div className="tomorrow">
                {tomorrow ? (
                  <>
                    <p className="meta">Tomorrow · {long(tomorrow.date)} · {tomorrow.duration}</p>
                    <p className="serif">{headline(tomorrow)}</p>
                    <button type="button" className="btn" onClick={() => go('plan', tomorrow.date)}>See it on Plan<Icon name="arrow" /></button>
                  </>
                ) : <p className="serif">Tomorrow is the exam.</p>}
              </div>
            </div>
          ) : null}

          <div className="tasks">
            <h2 className="sec">Today <span className="count">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span></h2>
            {tasks.length ? tasks.map((t) => <TaskRow key={t.id} variant="list" t={t} c={c} open={open === t.id} onToggle={toggle(t.id)} />) : <p className="meta">No tasks today.</p>}
          </div>

          {late.length > 0 && (
            <div className="tasks">
              <h2 className="sec">Catch-up <span className="count">{late.length} missed core {late.length === 1 ? 'task' : 'tasks'}, in keep-order, before optional tasks, at most 45 min a day</span></h2>
              {late.length > 3 && <p className="warn-text">More than three are waiting: keep them in this order and drop from the bottom ({KEEP_ORDER}).</p>}
              {late.map((t) => <TaskRow key={t.id} variant="list" t={t} c={c} catchup open={open === t.id} onToggle={toggle(t.id)} />)}
            </div>
          )}
        </div>

        <aside className="side-col">
          <section>
            <h2 className="sec">Review due <span className="count num">{dueList.length}</span></h2>
            {dueList.length ? (
              <>
                <p className="peek"><s>{dueList[0].wrong}</s></p>
                <button type="button" className="btn" onClick={() => go('mistakes', 'review')}>Start review<Icon name="arrow" /></button>
              </>
            ) : <p className="meta">Nothing due. New mistakes come back tomorrow.</p>}
          </section>
          {day && (
            <section>
              <h2 className="sec">Today's brief</h2>
              <DayInfo day={day} />
            </section>
          )}
          <section>
            <label>
              <span className="sec">Note for today</span>
              <textarea key={date} className="input" rows={3} defaultValue={s.dayNotes[date] ?? ''} onBlur={(e) => set((s) => ({ ...s, dayNotes: { ...s.dayNotes, [date]: e.target.value } }))} />
            </label>
          </section>
          {backupAge >= 7 && (
            <section className="backup-m">
              <span>No backup in {backupAge} days. Your data lives only in this browser.</span>
              <button type="button" className="btn" onClick={() => downloadBackup(c)}>Export backup</button>
            </section>
          )}
        </aside>
      </div>
    </section>
  )
}
