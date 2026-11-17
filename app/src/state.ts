import { useEffect, useState } from 'react'
import { totals } from './data/scores'
import { allTasks, effDate } from './lib/schedule'
import { KEY, load, save, type State, type TaskLog } from './lib/storage'

export type Tab = 'today' | 'plan' | 'mistakes' | 'progress' | 'library'
export interface Ctx {
  s: State
  set: (fn: (s: State) => State) => void
  today: string
  go: (tab: Tab, arg?: string) => void
}

export function useAppState() {
  const [first] = useState(load)
  const [state, setState] = useState(first.state)
  // While stored data is unreadable we do not save, so a damaged store is never overwritten by an empty one.
  const [loadError, setLoadError] = useState(first.error)
  const [saved, setSaved] = useState(true)
  useEffect(() => {
    if (!loadError) setSaved(save(state))
  }, [state, loadError])
  useEffect(() => {
    const on = (e: StorageEvent) => {
      if (e.key === KEY) setState(load().state) // another tab wrote: last write wins
    }
    addEventListener('storage', on)
    return () => removeEventListener('storage', on)
  }, [])
  return { state, setState, loadError, clearLoadError: () => setLoadError(undefined), saved }
}

export const logTask = (set: Ctx['set'], id: string, patch: TaskLog) =>
  set((s) => ({ ...s, log: { ...s.log, [id]: { ...s.log[id], ...patch } } }))

export const allTotals = (s: State) => {
  const tasks = allTasks(s)
  return totals(s.scores, s.results, (id) => effDate(tasks.find((t) => t.id === id)!, s))
}

export function downloadBackup(c: Ctx) {
  const next = { ...c.s, settings: { ...c.s.settings, lastExportAt: c.today } }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(next, null, 2)], { type: 'application/json' }))
  a.download = `c1prep-backup-${c.today}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  c.set(() => next)
}
