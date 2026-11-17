import { useState, type ReactNode } from 'react'
import { promptRefs, RESEARCH_MD, type Task } from '../data/plan'
import { SPECS, type Basis, type Field } from '../data/scores'
import { fmt, LAST, START } from '../lib/dates'
import { allocation, flexLine } from '../lib/flex'
import { effDate } from '../lib/schedule'
import { allTotals, logTask, type Ctx } from '../state'
import { Icon } from './Icon'
import { BasisMark } from './marks'
import { Copy, Inline, plain } from './Md'

const EMAIL = RESEARCH_MD.match(/^> (Dear JANTAR.+)$/m)?.[1] ?? ''
const STATUS = { done: 'Done', skipped: 'Skipped', dropped: 'Dropped', open: 'To do' } as const
const ROW_CLASS = { done: 'done', skipped: 'skip', dropped: 'drop', open: '' } as const
const BASIS_SHORT: Record<Basis, string> = { official: 'Official anchor', unofficial: 'Unofficial practice · trend only', tutor: 'Tutor assessment' }
const CAPTION = {
  official: 'Official anchor result. Enter marks, not question counts: Parts 5 to 7 are 2 marks each, Part 4 up to 2 per item.',
  unofficial: 'Unofficial practice. Trend only, never compared with the anchors.',
  tutor: 'Tutor assessment, not examiner-marked.',
}

function ScoreInput({ f, value, onChange }: { f: Field; value?: number; onChange: (v?: number) => void }) {
  const [txt, setTxt] = useState(value === undefined ? '' : String(value))
  const step = f.step ?? 1
  const valid = (v: string) => v === '' || (/^\d+(\.\d+)?$/.test(v) && +v <= f.max && Number.isInteger(+v / step))
  return (
    <label className="score">
      <span>{f.label}</span>
      <input
        className="input" inputMode="decimal" value={txt} aria-invalid={!valid(txt)}
        title={`0 to ${f.max}${step === 1 ? ', whole numbers' : ', steps of ' + step}`}
        onChange={(e) => {
          const v = e.target.value.trim().replace(',', '.')
          setTxt(v)
          if (valid(v)) onChange(v === '' ? undefined : +v)
        }}
      />
      <span className="muted num">/ {f.max}</span>
    </label>
  )
}

/** Card title: the first sentence, when it splits cleanly (never inside a link). Otherwise null. */
function split(text: string): [string, string] | null {
  const m = text.match(/^(.+?[.!?])\s+(?=[A-Z(])/)
  const head = m?.[1]
  const balanced = (s: string) => s.split('[').length === s.split(']').length && s.split('(').length === s.split(')').length
  if (head && balanced(head)) return [head, text.slice(m[0].length)]
  return plain(text).length <= 120 ? [text, ''] : null
}

export function TaskRow({ t, c, open, onToggle, catchup, variant = 'row', lead }: {
  t: Task; c: Ctx; open: boolean; onToggle: (open: boolean) => void; catchup?: boolean
  /** row: list row that expands inline. card: the next-task card on Today. list: row only, the card shows it. */
  variant?: 'row' | 'card' | 'list'
  lead?: ReactNode
}) {
  const { s, set } = c
  const log = s.log[t.id] ?? {}
  const st = log.status ?? 'open'
  const statusName = STATUS[st]
  const spec = SPECS[t.id]
  const isFlex = t.skill === 'Flex' || /weekly allocation/i.test(t.text)
  const [moving, setMoving] = useState(false)
  const mark = (status: 'done' | 'skipped' | 'dropped' | undefined) => {
    logTask(set, t.id, { status, at: new Date().toISOString() })
    onToggle(false)
  }
  const setScore = (key: string, v?: number) =>
    set((s) => {
      const cur = { ...s.scores[t.id] }
      if (v === undefined) delete cur[key]
      else cur[key] = v
      return { ...s, scores: { ...s.scores, [t.id]: cur } }
    })
  const when = effDate(t, s)
  const moved = when !== t.date
  const kind = t.custom ? 'Added by you' : t.core ? 'Core' : 'Optional'

  if (variant !== 'card') {
    const second = [t.skill, kind, catchup ? (st === 'skipped' ? `skipped ${fmt(when)}` : `from ${fmt(when)}`) : moved && `moved from ${fmt(t.date)}`].filter(Boolean).join(' · ')
    return (
      <>
        <button type="button" className={`task ${ROW_CLASS[st]}`} aria-expanded={open} onClick={() => onToggle(!open)}>
          <span className="check" title={statusName}>
            <Icon name={st === 'dropped' ? 'plus' : 'check'} className={st === 'dropped' ? 'rotate-45' : ''} />
            <span className="sr-only">{statusName}:</span>
          </span>
          <span><span className="t">{plain(t.text)}</span><span className="s block">{second}</span></span>
          <span className="m num">{t.minutes ? `${t.minutes} min` : ''}<Icon name="chev" /></span>
        </button>
        {variant === 'row' && open && <div className="more">{details()}</div>}
      </>
    )
  }

  const parts = split(t.text)
  return (
    <article className="next" aria-label={`${plain(t.text)}, ${t.skill}`}>
      <div className="row1">
        {lead}
        {[t.skill, kind, t.minutes ? `${t.minutes} min` : ''].filter(Boolean).map((x, i) => <span key={i} className="contents">{(lead || i > 0) && <span aria-hidden="true">·</span>}<span className={i === 2 ? 'num' : ''}>{x}</span></span>)}
      </div>
      {parts ? (
        <>
          <h2><Inline text={parts[0]} /></h2>
          {parts[1] && <p className="body"><Inline text={parts[1]} /></p>}
        </>
      ) : (
        <>
          <h2>{t.skill}{t.minutes ? `, ${t.minutes} min` : ''}</h2>
          <p className="body"><Inline text={t.text} /></p>
        </>
      )}
      {details()}
    </article>
  )

  function details() {
    const card = variant === 'card'
    const link = t.text.match(/https?:\/\/[^\s)\]]+/)?.[0]
    const size = card ? ' lg' : ''
    const openPrimary = card && !!link
    const refs = promptRefs(t.text)
    const note = (
      <input
        className="input" aria-label="Note" defaultValue={log.note ?? ''}
        placeholder={isFlex ? 'Chosen flex skill and part, and the score' : 'Note: key feedback, time left, genre chosen'}
        onBlur={(e) => e.target.value !== (log.note ?? '') && logTask(set, t.id, { note: e.target.value })}
      />
    )
    return (
      <>
        {/* the row title already shows the plain text; repeat it only when it carries links */}
        {!card && /\]\(/.test(t.text) && <p className="body"><Inline text={t.text} /></p>}
        {(log.status || moved) && (
          <p className="meta mt-2">{[log.status && statusName, moved && `moved from ${fmt(t.date)} to ${fmt(when)}`].filter(Boolean).join(' · ')}</p>
        )}
        {(refs.length > 0 || t.id === 'd01-c') && (
          <div className="copies">
            {t.id === 'd01-c' && <Copy text={EMAIL} label="Copy email text" />}
            {refs.map((p) => <Copy key={p.label} text={p.text} label={`Copy ${p.label}`} />)}
          </div>
        )}
        {isFlex && <div className="flexby"><p className="sec">Flex by the rule</p><p>{flexLine(allocation(allTotals(s)))}</p></div>}
        <div className="actions">
          {openPrimary && <a className="btn primary lg" href={link} target="_blank" rel="noopener noreferrer">Open exercise<Icon name="ext" /></a>}
          {log.status !== 'done' && <button type="button" className={`btn${openPrimary ? '' : ' primary'}${size}`} onClick={() => mark('done')}><Icon name="check" />Done</button>}
          {card && <span className="spacer" />}
          {!log.status && !catchup && <button type="button" className={`btn ghost${size}`} onClick={() => mark('skipped')}>Skip</button>}
          {catchup && <button type="button" className={`btn ghost${size}`} onClick={() => mark('dropped')}>Drop</button>}
          {log.status && !catchup && <button type="button" className={`btn ghost${size}`} onClick={() => mark(undefined)}>Undo</button>}
          {log.status !== 'done' && (
            <button type="button" className={`btn ghost icon${size}`} aria-label="Move to another day" title="Move to another day" aria-expanded={moving} onClick={() => setMoving(!moving)}><Icon name="plan" /></button>
          )}
          {t.custom && <button type="button" className={`btn ghost${size}`} onClick={() => confirm('Delete this task?') && set((s) => ({ ...s, customTasks: s.customTasks.filter((x) => x.id !== t.id) }))}><Icon name="trash" />Delete</button>}
        </div>
        {moving && log.status !== 'done' && (
          <label className="moveto">
            Move to
            <input type="date" className="input" min={START} max={LAST} value={when}
              onChange={(e) => e.target.value >= START && e.target.value <= LAST && logTask(set, t.id, { movedTo: e.target.value === t.date ? undefined : e.target.value })} />
          </label>
        )}
        {spec ? (
          <div className="record">
            <div className="head"><b>Record your result</b><BasisMark basis={spec.basis}>{BASIS_SHORT[spec.basis]}</BasisMark><span className="muted">{spec.source}</span></div>
            <div className="scores">
              {spec.fields.map((f) => <ScoreInput key={f.key} f={f} value={s.scores[t.id]?.[f.key]} onChange={(v) => setScore(f.key, v)} />)}
            </div>
            {note}
            <p className="caption">
              {CAPTION[spec.basis]}
              {spec.fields[0].skill === 'speaking' && ' Bands 0 to 5 in steps of 0.5. No Pronunciation band and no total.'}
              {spec.fields[0].skill === 'writing' && ' Whole bands 0 to 5 per criterion.'}
            </p>
          </div>
        ) : <div className="note-only">{note}</div>}
      </>
    )
  }
}
