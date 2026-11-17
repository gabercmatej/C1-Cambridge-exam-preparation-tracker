export const START = '2026-11-16'
export const LAST = '2026-12-11'
export const EXAM = '2026-12-12'
export const FINAL_PASS = '2026-12-10'

const pad = (n: number) => String(n).padStart(2, '0')
// Built from local parts on purpose: toISOString() is UTC and shifts the date around midnight.
export const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s: string, n: number) => {
  const d = parse(s)
  d.setDate(d.getDate() + n)
  return localDate(d)
}
export const diffDays = (from: string, to: string) => Math.round((parse(to).getTime() - parse(from).getTime()) / 864e5)
export const dayNumber = (today: string) => diffDays(START, today) + 1
export const countdown = (today: string) => diffDays(today, EXAM)
export const fmt = (s: string) => parse(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

// ?today=YYYY-MM-DD previews another day (used for checking the app; real use has no parameter).
export const today = () => {
  const q = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('today')
  return q && /^\d{4}-\d\d-\d\d$/.test(q) ? q : localDate()
}
