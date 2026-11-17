import { useEffect, useState } from 'react'
import { Icon } from './components/Icon'
import { diffDays, today as getToday } from './lib/dates'
import { isDue } from './lib/review'
import { empty, KEY } from './lib/storage'
import { downloadBackup, useAppState, type Ctx, type Tab } from './state'
import Library from './tabs/Library'
import Mistakes from './tabs/Mistakes'
import Plan from './tabs/Plan'
import Progress from './tabs/Progress'
import Today from './tabs/Today'

const TABS: Tab[] = ['today', 'plan', 'mistakes', 'progress', 'library']
const NAME: Record<Tab, string> = { today: 'Today', plan: 'Plan', mistakes: 'Mistakes', progress: 'Progress', library: 'Library' }
const read = (): [Tab, string | undefined] => {
  const [tab, arg] = location.hash.slice(1).split(':')
  return [TABS.includes(tab as Tab) ? (tab as Tab) : 'today', arg]
}

export default function App() {
  const { state, setState, loadError, clearLoadError, saved } = useAppState()
  const [[tab, arg], setRoute] = useState(read)
  const [today, setToday] = useState(getToday)
  useEffect(() => {
    const onHash = () => setRoute(read())
    const onFocus = () => setToday(getToday()) // the tab may stay open past midnight
    addEventListener('hashchange', onHash)
    addEventListener('focus', onFocus)
    return () => { removeEventListener('hashchange', onHash); removeEventListener('focus', onFocus) }
  }, [])
  const go: Ctx['go'] = (t, a) => { location.hash = a ? `${t}:${a}` : t; scrollTo(0, 0) }
  const c: Ctx = { s: state, set: setState, today, go }
  const due = state.mistakes.filter((m) => isDue(m, today)).length
  const last = state.settings.lastExportAt
  const age = last ? diffDays(last, today) : undefined

  return (
    <div className="shell">
      <nav className="rail" aria-label="Sections">
        <div className="brand">C1 <i>Prep</i></div>
        {TABS.map((t) => (
          <button key={t} type="button" className="nav" aria-current={tab === t ? 'page' : undefined} onClick={() => go(t)}>
            <Icon name={t} />{NAME[t]}
            {t === 'mistakes' && due > 0 && <span className="badge num" aria-label={`${due} due`}>{due}</span>}
          </button>
        ))}
        <div className="rail-foot">
          <span className={age === undefined || age >= 7 ? 'old' : ''}>
            Saved in this browser.<br />
            {age === undefined ? 'No backup yet.' : age === 0 ? 'Last backup today.' : `Last backup ${age} ${age === 1 ? 'day' : 'days'} ago.`}
          </span>
          <button type="button" className="linkbtn" onClick={() => downloadBackup(c)}>Export backup</button>
        </div>
      </nav>

      <div className="main">
        {loadError && (
          <div role="alert" className="notice bad">
            <p><strong>Saved data could not be read.</strong> {loadError} Nothing is being saved, so the stored data is untouched. Import a backup in Library, or start fresh.</p>
            <button type="button" className="btn" onClick={() => { if (confirm('Erase the unreadable saved data and start fresh?')) { localStorage.removeItem(KEY); setState(empty); clearLoadError() } }}>Start fresh</button>
          </div>
        )}
        {!saved && <p role="alert" className="notice bad"><strong>This browser is not saving data</strong> (storage is blocked or full). Changes will be lost when you close the page.</p>}
        <main key={tab}>
          {tab === 'today' && <Today {...c} />}
          {tab === 'plan' && <Plan c={c} initial={arg} />}
          {tab === 'mistakes' && <Mistakes c={c} autoReview={arg === 'review'} />}
          {tab === 'progress' && <Progress {...c} />}
          {tab === 'library' && <Library c={c} onImport={(s) => { setState(s); clearLoadError() }} />}
        </main>
      </div>

      <nav className="tabbar" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t} type="button" aria-current={tab === t ? 'page' : undefined} onClick={() => go(t)}><Icon name={t} />{NAME[t]}</button>
        ))}
      </nav>
    </div>
  )
}
