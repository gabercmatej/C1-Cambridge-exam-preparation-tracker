import { useRef, useState, type ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { Copy, Inline, Md, parseRefs } from '../components/Md'
import { ThemeControl } from '../components/ThemeControl'
import { EXAM_DAY, PLAN_MD, PROMPT_INTRO, PROMPTS, RESEARCH_MD, section } from '../data/plan'
import { fmt } from '../lib/dates'
import { parseState, type State } from '../lib/storage'
import { downloadBackup, type Ctx } from '../state'

const REFS = parseRefs(RESEARCH_MD)
const body = (md: string) => md.replace(/^## .*\n/, '')
const cap = (s: string) => s.replace(/^./, (ch) => ch.toUpperCase())
// The resources section opens with one intro paragraph; it becomes the lede, the rest renders as is.
const RESOURCES = body(section(RESEARCH_MD, /free resources/i)).trim()
const RES_INTRO = RESOURCES.split('\n')[0]
const RES_BODY = RESOURCES.slice(RES_INTRO.length)

/** "GPT-2 · Writing diagnosis (no rewrite)" -> id, title and the parenthetical as a second line. */
function parts(title: string) {
  const [id, rest = ''] = title.split(' · ')
  const i = rest.indexOf(' (')
  return { id, name: i < 0 ? rest : rest.slice(0, i), small: i < 0 ? '' : cap(rest.slice(i + 2).replace(/[()]/g, '')) }
}

function Row({ id, title, small, copies, reference: isRef, children }: { id?: string; title: string; small?: string; copies?: string[]; reference?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const toggle = (
    <button type="button" className="ptog" aria-expanded={open} onClick={() => setOpen(!open)}>
      {!isRef && <span className="pid">{id}</span>}
      <span className="pt">{title}{small && <small>{small}</small>}</span>
      {isRef && <span className="chev"><Icon name="chev" /></span>}
    </button>
  )
  return (
    <div className={`prow${isRef ? ' ref' : ''}${open ? ' open' : ''}`}>
      <div className="prow-h">
        {toggle}
        {/* Copy sits outside the toggle, so copying never opens the row. */}
        {copies?.map((text, i) => <Copy key={i} text={text} label={copies.length > 1 ? `Copy ${i + 1}` : 'Copy'} />)}
        {!isRef && <span className="chev" aria-hidden="true"><Icon name="chev" /></span>}
      </div>
      {open && <div className="prow-b">{children}</div>}
    </div>
  )
}

const REFERENCE: [string, () => ReactNode][] = [
  ['Score anchors and the three result classes', () => <Md text={body(section(RESEARCH_MD, /^## 3\. Scoring/))} refs={REFS} />],
  ['Exam format', () => <Md text={body(section(RESEARCH_MD, /^## 2\. Exam structure/))} refs={REFS} />],
  ['How the plan works: daily blocks, rules, timings', () => <Md text={body(section(PLAN_MD, /^## 1\./))} />],
  ['Baseline labels: Priority, Borderline, Secure', () => <Md text={body(section(PLAN_MD, /^## 2\./))} />],
  ['Adaptive rules, flex pool and missed days', () => <Md text={body(section(PLAN_MD, /^## 4\./))} />],
  ['Mock strategy and reading the results', () => <Md text={body(section(PLAN_MD, /^## 5\./))} />],
  ['Skill methods in brief', () => <Md text={body(section(PLAN_MD, /^## 7\./))} />],
  ['Exam day', () => <div className="md"><p>{EXAM_DAY}</p></div>],
]

export default function Library({ c, onImport }: { c: Ctx; onImport: (s: State) => void }) {
  const { s, set } = c
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>()
  const setting = (k: 'speakingAt' | 'note') => (e: { target: { value: string } }) => set((s) => ({ ...s, settings: { ...s.settings, [k]: e.target.value || undefined } }))
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })

  const importFile = async (f: File) => {
    try {
      const next = parseState(await f.text())
      const n = Object.keys(next.log).length
      if (!confirm(`Replace everything in this browser with the backup "${f.name}" (${n} task entries, ${next.mistakes.length} mistakes)? This cannot be undone.`)) return
      onImport(next)
      setMsg({ ok: true, text: 'Backup restored.' })
    } catch (e) {
      setMsg({ ok: false, text: `${e instanceof Error ? e.message : e} Nothing was changed.` })
    }
  }

  return (
    <section>
      <header className="page-head">
        <div><h1>Library</h1><p>Prompts to paste, the resources the plan uses, and the rules behind it.</p></div>
      </header>
      <div className="lib-grid">
        <div className="lib-main">
          <nav className="lib-nav" aria-label="On this page">
            <button type="button" onClick={() => jump('lib-prompts')}>Tutor prompts</button>
            <button type="button" onClick={() => jump('lib-resources')}>Resources</button>
            <button type="button" onClick={() => jump('lib-reference')}>Reference</button>
            <button type="button" className="narrow" onClick={() => jump('lib-data')}>Your data</button>
          </nav>

          <section id="lib-prompts">
            <h2>Tutor prompts</h2>
            <p className="lede">Paste into ChatGPT. GPT-1 goes in once, as the Project instructions.</p>
            <Row title="Setup and rules" small="Read once on Day 5"><Md text={body(PROMPT_INTRO)} /></Row>
            {PROMPTS.map((p) => {
              const t = parts(p.title)
              return <Row key={p.id} id={t.id} title={t.name} small={t.small} copies={p.blocks}><Md text={p.body} /></Row>
            })}
          </section>

          <section id="lib-resources">
            <h2>Resources</h2>
            <p className="lede"><Inline text={RES_INTRO} refs={REFS} /></p>
            <p className="notice warn"><strong>Test B (official Sample 2) is sealed until 4 Dec.</strong> Do not unzip it or browse the handbook's sample-paper pages before then. It is used once, for Mock 2 on 5 Dec. The digital sample and paper Sample 1 are the same test (Test A): never count them as two.</p>
            <Md text={RES_BODY} refs={REFS} />
          </section>

          <section id="lib-reference">
            <h2>Reference</h2>
            <p className="lede">The reasoning behind the plan, for when a rule needs checking.</p>
            {REFERENCE.map(([title, render]) => <Row key={title} title={title} reference>{render()}</Row>)}
          </section>
        </div>

        <aside className="data" id="lib-data">
          <section>
            <h2 className="sec">Backup</h2>
            <p>Everything you log lives only in this browser. Export once a week; import replaces all data after a check. Last export: {s.settings.lastExportAt ? fmt(s.settings.lastExportAt) : 'never'}.</p>
            <div className="actions">
              <button type="button" className="btn" onClick={() => downloadBackup(c)}>Export JSON</button>
              <button type="button" className="btn" onClick={() => file.current?.click()}>Import JSON</button>
              <input ref={file} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-label="Backup file"
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importFile(f) }} />
            </div>
            {msg && <p role="alert" className={`msg ${msg.ok ? 'ok-text' : 'err-text'}`}>{msg.text}</p>}
          </section>
          <section>
            <h2 className="sec">Exam details</h2>
            <label className="field">Speaking test date and time<input className="input" defaultValue={s.settings.speakingAt ?? ''} onBlur={setting('speakingAt')} placeholder="from the Confirmation of Entry" /></label>
            <label className="field"><span>Note <small>(keyboard layout, results date)</small></span><input className="input" defaultValue={s.settings.note ?? ''} onBlur={setting('note')} /></label>
            <p className="hint">If Speaking falls before 12 December, move d24-c to two days before it and d25-c to the evening before, with "Move to" on the Plan tab.</p>
          </section>
          <section>
            <h2 className="sec">Theme</h2>
            <ThemeControl />
          </section>
        </aside>
      </div>
    </section>
  )
}
