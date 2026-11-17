import type { KeyboardEvent } from 'react'

export type BarState = 'done' | 'part' | 'today' | 'future' | 'stub' | 'gone'
export interface Bar { n: number; date: string; minutes: number; state: BarState; mock?: string; title: string }

const WEEKS = [[0, 7], [7, 14], [14, 21], [21, 26]]
// 110 minutes fills the bar; anything shorter keeps at least 18% so light days stay visible.
const height = (min: number) => `${Math.max(Math.round((Math.min(min, 110) / 110) * 100), 18)}%`

/** 26 bars in four weeks. With onSelect each bar is a button (roving focus, arrow keys); without, the strip is one image. */
export function JourneyStrip({ days, label, onSelect, exam = true }: { days: Bar[]; label: string; onSelect?: (date: string) => void; exam?: boolean }) {
  const focusIdx = Math.max(days.findIndex((d) => d.state === 'today'), 0)
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    const bars = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button.d')]
    bars[Math.min(Math.max(bars.indexOf(document.activeElement as HTMLButtonElement) + step, 0), bars.length - 1)]?.focus()
    e.preventDefault()
  }
  const bar = (d: Bar, i: number) => {
    const cls = `d ${d.state === 'future' ? '' : d.state}${d.mock ? ' mock' : ''}`
    const style = { height: height(d.minutes) }
    return onSelect ? (
      <button key={d.n} type="button" className={cls} style={style} data-m={d.mock} title={d.title} aria-label={`${d.title}. Open on Plan`}
        tabIndex={i === focusIdx ? 0 : -1} onClick={() => onSelect(d.date)} />
    ) : <i key={d.n} className={cls} style={style} data-m={d.mock} title={d.title} />
  }
  return (
    <div className={`journey${onSelect ? '' : ' plain'}`} {...(onSelect ? { role: 'group', onKeyDown: onKey } : { role: 'img' })} aria-label={label}>
      {WEEKS.map(([a, b], w) => (
        <div key={w} className={`week${w === 3 ? ' short' : ''}`} data-label={`Week ${w + 1}`}>{days.slice(a, b).map((d, i) => bar(d, a + i))}</div>
      ))}
      {exam && <div className="exam" aria-hidden="true"><i /><span>Exam</span></div>}
    </div>
  )
}
