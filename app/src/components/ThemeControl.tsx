import { useState } from 'react'

// Kept outside State and backups on purpose: a display preference, not study data.
const KEY = 'c1prep:theme'
type Theme = '' | 'light' | 'dark'
const read = (): Theme => {
  try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : '' } catch { return '' }
}

export function ThemeControl() {
  const [theme, setTheme] = useState(read)
  const pick = (v: Theme) => {
    setTheme(v)
    if (v) document.documentElement.dataset.theme = v
    else delete document.documentElement.dataset.theme
    try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY) } catch { /* storage blocked: the choice lasts for this page only */ }
  }
  return (
    <div className="seg" role="group" aria-label="Theme">
      {([['', 'System'], ['light', 'Light'], ['dark', 'Dark']] as const).map(([v, l]) => (
        <button key={l} type="button" aria-pressed={theme === v} onClick={() => pick(v)}>{l}</button>
      ))}
    </div>
  )
}
