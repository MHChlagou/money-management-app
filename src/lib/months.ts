/** Month keys are "YYYY-MM" strings: they sort lexicographically, which keeps range checks trivial. */
import { getLocale } from './i18n'

export const pad2 = (n: number) => String(n).padStart(2, '0')

export const monthKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`

export const currentMonthKey = () => monthKey(new Date())

export const splitKey = (key: string) => {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m }
}

export const shiftMonth = (key: string, delta: number) => {
  const { year, month } = splitKey(key)
  return monthKey(new Date(year, month - 1 + delta, 1))
}

/** Whole months from `a` to `b` (positive when b is later). */
export const monthsBetween = (a: string, b: string) => {
  const A = splitKey(a), B = splitKey(b)
  return (B.year - A.year) * 12 + (B.month - A.month)
}

export const formatMonth = (key: string, style: 'long' | 'short' = 'long') => {
  const { year, month } = splitKey(key)
  return new Date(year, month - 1, 1).toLocaleDateString(getLocale(), {
    month: style === 'long' ? 'long' : 'short',
    year: style === 'long' ? 'numeric' : '2-digit',
  })
}

export const monthName = (m: number, style: 'long' | 'short' = 'short') =>
  new Date(2000, m - 1, 1).toLocaleDateString(getLocale(), { month: style })

export const daysInMonth = (key: string) => {
  const { year, month } = splitKey(key)
  return new Date(year, month, 0).getDate()
}

/** 0 = Monday … 6 = Sunday, for the first day of the month. */
export const firstWeekday = (key: string) => {
  const { year, month } = splitKey(key)
  return (new Date(year, month - 1, 1).getDay() + 6) % 7
}

export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export const formatDay = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString(getLocale(), { weekday: 'short', day: 'numeric', month: 'short' })

/** Short weekday names Monday..Sunday in the current locale. */
export const weekdayNames = () => Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(getLocale(), { weekday: 'short' }).replace(/\.$/, ''))

/** Last N month keys ending at `end`, oldest first. */
export const lastMonths = (end: string, n: number) =>
  Array.from({ length: n }, (_, i) => shiftMonth(end, i - (n - 1)))

export const monthsOfYear = (year: number) => Array.from({ length: 12 }, (_, i) => `${year}-${pad2(i + 1)}`)
