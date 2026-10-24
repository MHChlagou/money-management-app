import type { AppState, Category, MonthRecord, OneOffExpense, RecurringItem, RecurringKind, SavingsPot } from './types'
import { emptyMonth } from './types'
import { daysInMonth, lastMonths, monthKey, monthsBetween, monthsOfYear, splitKey } from './months'
import { categoryName, t } from './i18n'
import { parseAmount } from './format'

export interface ResolvedLine {
  id: string
  name: string
  categoryId: string
  kind: RecurringKind
  /** Amount charged this month (override wins over the template default). */
  amount: number
  defaultAmount: number
  intervalMonths: number
  dayOfMonth?: number
  skipped: boolean
  isLastMonth: boolean
}

export interface MonthSummary {
  income: number
  salary: number
  fixed: number
  variable: number
  expenses: number
  /** Net moved into savings pots this month. */
  setAside: number
  /** Income minus expenses: what was not spent, whether or not it went into a pot. */
  kept: number
  /** Kept minus what went into pots: what is still free to spend. */
  remaining: number
  savingsRate: number
  /** True when the salary shown is the default, not a value typed for this month. */
  usesDefaultSalary: boolean
}

export const getMonth = (state: AppState, key: string): MonthRecord => state.months[key] ?? emptyMonth()

export const monthSalary = (state: AppState, key: string) => state.months[key]?.salary ?? state.defaultSalary

export const hasData = (state: AppState, key: string) => {
  const m = state.months[key]
  return Boolean(m && (m.salary !== undefined || m.extraIncome || m.oneOffs.length || Object.keys(m.overrides).length))
}

export const appliesToMonth = (item: RecurringItem, key: string) => {
  if (!item.active || item.startMonth > key || (item.endMonth && item.endMonth < key)) return false
  const interval = item.intervalMonths || 1
  return monthsBetween(item.startMonth, key) % interval === 0
}

export const resolveLines = (state: AppState, key: string): ResolvedLine[] => {
  const month = getMonth(state, key)
  return state.recurring
    .filter((item) => appliesToMonth(item, key))
    .map((item) => {
      const ov = month.overrides[item.id] ?? {}
      return {
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        kind: item.kind,
        amount: ov.amount ?? item.amount,
        defaultAmount: item.amount,
        intervalMonths: item.intervalMonths || 1,
        dayOfMonth: item.dayOfMonth,
        skipped: ov.skipped ?? false,
        isLastMonth: item.endMonth === key || (item.endMonth !== undefined && monthsBetween(key, item.endMonth) < (item.intervalMonths || 1)),
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

export const summarize = (state: AppState, key: string): MonthSummary => {
  const month = getMonth(state, key)
  const salary = monthSalary(state, key)
  const income = salary + month.extraIncome
  const fixed = sum(resolveLines(state, key).filter((l) => !l.skipped).map((l) => l.amount))
  const variable = sum(month.oneOffs.map((e) => e.amount))
  const expenses = fixed + variable
  const setAside = monthSetAside(state, key)
  const kept = income - expenses
  return {
    income, salary, fixed, variable, expenses, setAside, kept,
    remaining: kept - setAside,
    savingsRate: income > 0 ? kept / income : 0,
    usesDefaultSalary: state.months[key]?.salary === undefined,
  }
}

/** Net contributions to all pots in a month. */
export const monthSetAside = (state: AppState, key: string) =>
  sum(state.pots.flatMap((p) => p.contributions.filter((c) => c.date.startsWith(key)).map((c) => c.amount)))

export const potBalance = (pot: SavingsPot) => sum(pot.contributions.map((c) => c.amount))

export const potMonthTotal = (pot: SavingsPot, key: string) => sum(pot.contributions.filter((c) => c.date.startsWith(key)).map((c) => c.amount))

export const totalSaved = (state: AppState) => sum(state.pots.map(potBalance))

export interface CategoryTotal { category: Category; amount: number; share: number; budget?: number }

export const categoryById = (state: AppState, id: string): Category => {
  const c = state.categories.find((c) => c.id === id)
  return c ? { ...c, name: categoryName(c.id, c.name) } : { id, name: categoryName('other', 'Other'), icon: '📦', color: '#64748b' }
}

export const byCategory = (state: AppState, key: string): CategoryTotal[] => {
  const totals = new Map<string, number>()
  const add = (id: string, amt: number) => totals.set(id, (totals.get(id) ?? 0) + amt)
  resolveLines(state, key).filter((l) => !l.skipped).forEach((l) => add(l.categoryId, l.amount))
  getMonth(state, key).oneOffs.forEach((e) => add(e.categoryId, e.amount))
  const total = sum([...totals.values()])
  return [...totals.entries()]
    .map(([id, amount]) => {
      const category = categoryById(state, id)
      return { category, amount, share: total > 0 ? amount / total : 0, budget: category.budget }
    })
    .sort((a, b) => b.amount - a.amount)
}

/** Budget status for every category that has a budget, whether or not anything was spent. */
export const budgetStatus = (state: AppState, key: string): CategoryTotal[] => {
  const spent = new Map(byCategory(state, key).map((c) => [c.category.id, c.amount]))
  return state.categories
    .filter((c) => c.budget && c.budget > 0)
    .map((c) => ({ category: c, amount: spent.get(c.id) ?? 0, share: (spent.get(c.id) ?? 0) / c.budget!, budget: c.budget }))
    .sort((a, b) => b.share - a.share)
}

export interface TrendPoint { key: string; summary: MonthSummary }

export const trend = (state: AppState, endKey: string, n = 6): TrendPoint[] =>
  lastMonths(endKey, n).map((key) => ({ key, summary: summarize(state, key) }))

export const yearTrend = (state: AppState, key: string): TrendPoint[] =>
  monthsOfYear(splitKey(key).year).map((k) => ({ key: k, summary: summarize(state, k) }))

export const byKind = (lines: ResolvedLine[]) => {
  const out: Record<RecurringKind, number> = { subscription: 0, credit: 0, bill: 0, other: 0 }
  lines.filter((l) => !l.skipped).forEach((l) => { out[l.kind] += l.amount })
  return out
}

/** Recurring payments due within the next `days` days from today, crossing into next month if needed. */
export const upcomingPayments = (state: AppState, days = 7): (DayEntry & { monthKey: string })[] => {
  const now = new Date()
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const today = now.getDate()
  const last = daysInMonth(nowKey)
  const nextKey = shiftMonthKey(nowKey, 1)
  const out: (DayEntry & { monthKey: string })[] = []
  const take = (key: string, from: number, to: number) =>
    [...entriesByDay(state, key).entries()].filter(([d]) => d >= from && d <= to).forEach(([, es]) => es.filter((e) => e.source === 'recurring').forEach((e) => out.push({ ...e, monthKey: key })))
  take(nowKey, today, today + days)
  if (today + days > last) take(nextKey, 1, today + days - last)
  return out.sort((a, b) => (a.monthKey + String(a.day).padStart(2, '0')).localeCompare(b.monthKey + String(b.day).padStart(2, '0')))
}

/** Everything that hits the account on a given day of the month, for the calendar. */
export interface DayEntry {
  id: string
  name: string
  amount: number
  categoryId: string
  source: 'recurring' | 'oneoff'
  day: number
}

export const entriesByDay = (state: AppState, key: string): Map<number, DayEntry[]> => {
  const map = new Map<number, DayEntry[]>()
  const last = daysInMonth(key)
  const push = (e: DayEntry) => map.set(e.day, [...(map.get(e.day) ?? []), e])
  resolveLines(state, key).filter((l) => !l.skipped).forEach((l) =>
    push({ id: l.id, name: l.name, amount: l.amount, categoryId: l.categoryId, source: 'recurring', day: Math.min(l.dayOfMonth ?? 1, last) }))
  getMonth(state, key).oneOffs.forEach((e) =>
    push({ id: e.id, name: e.name, amount: e.amount, categoryId: e.categoryId, source: 'oneoff', day: Number(e.date.slice(8, 10)) }))
  return map
}

/** Monthly-equivalent cost of a recurring item, for "what does this really cost per month". */
export const monthlyEquivalent = (item: RecurringItem) => item.amount / (item.intervalMonths || 1)

export interface SpendingPace {
  /** Days left in the month, today included. 0 for past months. */
  daysLeft: number
  /** What can be spent per day from now on so the month ends at zero. */
  perDay: number
  isCurrent: boolean
  /**
   * Current month only: how far one-off spending so far is below (positive) or above (negative) an even pace
   * through the money left for one-offs after fixed costs and savings. Null when there is no such money.
   */
  ahead: number | null
}

/** Safe daily spend for the rest of the month, and whether one-off spending is ahead of or behind an even pace. */
export const spendingPace = (state: AppState, key: string, now = new Date()): SpendingPace => {
  const s = summarize(state, key)
  const nowKey = monthKey(now)
  const days = daysInMonth(key)
  const isCurrent = key === nowKey
  const daysLeft = isCurrent ? days - now.getDate() + 1 : key > nowKey ? days : 0
  const perDay = daysLeft > 0 ? Math.max(0, s.remaining) / daysLeft : 0
  const flexible = s.income - s.fixed - s.setAside
  if (!isCurrent || flexible <= 0) return { daysLeft, perDay, isCurrent, ahead: null }
  const today = now.getDate()
  const spentSoFar = sum(getMonth(state, key).oneOffs.filter((e) => Number(e.date.slice(8, 10)) <= today).map((e) => e.amount))
  return { daysLeft, perDay, isCurrent, ahead: flexible * (today / days) - spentSoFar }
}

/** One point per day with what is left after everything dated up to and including that day. Day 0 is the start. */
export interface BalancePoint { day: number; balance: number; out: number; entries: DayEntry[] }

/** The month as a draining balance: income at the start, minus expenses and pot moves on the day they happen. */
export const dailyBalance = (state: AppState, key: string): BalancePoint[] => {
  const income = summarize(state, key).income
  const byDay = entriesByDay(state, key)
  const potsByDay = new Map<number, number>()
  state.pots.forEach((p) => p.contributions.filter((c) => c.date.startsWith(key)).forEach((c) => {
    const d = Number(c.date.slice(8, 10))
    potsByDay.set(d, (potsByDay.get(d) ?? 0) + c.amount)
  }))
  const points: BalancePoint[] = [{ day: 0, balance: income, out: 0, entries: [] }]
  let balance = income
  for (let d = 1; d <= daysInMonth(key); d++) {
    const entries = byDay.get(d) ?? []
    const out = sum(entries.map((e) => e.amount)) + (potsByDay.get(d) ?? 0)
    balance -= out
    points.push({ day: d, balance, out, entries })
  }
  return points
}

export interface ForecastMonth {
  key: string
  summary: MonthSummary
  /** Recurring items whose last payment falls in this month. */
  ending: RecurringItem[]
  /** Non-monthly charges (quarterly, yearly) that land in this month. */
  lumps: ResolvedLine[]
}

/** The next `n` months after `fromKey`, projected from default salary, recurring costs and anything already entered. */
export const forecast = (state: AppState, fromKey: string, n = 6): ForecastMonth[] =>
  Array.from({ length: n }, (_, i) => shiftMonthKey(fromKey, i + 1)).map((key) => ({
    key,
    summary: summarize(state, key),
    ending: state.recurring.filter((r) => r.active && r.endMonth === key),
    lumps: resolveLines(state, key).filter((l) => l.intervalMonths > 1 && !l.skipped),
  }))

export type SearchHit =
  | { kind: 'oneoff'; expense: OneOffExpense; category: Category }
  | { kind: 'recurring'; item: RecurringItem; category: Category }

/** Every one-off and recurring line whose name, category or exact amount matches. Newest one-offs first. */
export const searchEntries = (state: AppState, query: string, limit = 30): SearchHit[] => {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const amount = /\d/.test(q) ? parseAmount(q) : 0
  const matches = (name: string, category: Category, value: number) =>
    name.toLowerCase().includes(q) || category.name.toLowerCase().includes(q) || (amount > 0 && Math.abs(value - amount) < 0.005)
  const recurring: SearchHit[] = state.recurring
    .map((item) => ({ kind: 'recurring' as const, item, category: categoryById(state, item.categoryId) }))
    .filter((h) => matches(h.item.name, h.category, h.item.amount))
  const oneOffs: SearchHit[] = Object.values(state.months).flatMap((m) => m.oneOffs)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((expense) => ({ kind: 'oneoff' as const, expense, category: categoryById(state, expense.categoryId) }))
    .filter((h) => matches(h.expense.name, h.category, h.expense.amount))
  return [...recurring, ...oneOffs].slice(0, limit)
}

export interface RecentExpense { name: string; amount: number; categoryId: string }

/** The most recent one-offs with distinct names, for one-tap quick add. */
export const recentExpenses = (state: AppState, limit = 6): RecentExpense[] => {
  const seen = new Set<string>()
  const out: RecentExpense[] = []
  const all = Object.values(state.months).flatMap((m) => m.oneOffs).sort((a, b) => b.date.localeCompare(a.date))
  for (const e of all) {
    const name = e.name.trim().toLowerCase()
    if (seen.has(name)) continue
    seen.add(name)
    out.push({ name: e.name, amount: e.amount, categoryId: e.categoryId })
    if (out.length === limit) break
  }
  return out
}

/** Progress of a credit with an end month: payments made, payments left, remaining balance. */
export const creditProgress = (item: RecurringItem, nowKey: string) => {
  if (!item.endMonth) return null
  const interval = item.intervalMonths || 1
  const total = Math.floor(monthsBetween(item.startMonth, item.endMonth) / interval) + 1
  // Counts every charge month up to and including the current one, since this month's payment is already in the budget.
  const done = nowKey < item.startMonth ? 0 : Math.min(total, Math.floor(monthsBetween(item.startMonth, nowKey) / interval) + 1)
  const left = Math.max(0, total - done)
  return { total, done, left, remaining: left * item.amount, ratio: total > 0 ? done / total : 0 }
}

/** Next month key on or after `fromKey` in which the item is charged, or null if it has ended. */
export const nextCharge = (item: RecurringItem, fromKey: string): string | null => {
  if (!item.active) return null
  const interval = item.intervalMonths || 1
  let key = item.startMonth
  if (fromKey > key) {
    const steps = Math.ceil(monthsBetween(item.startMonth, fromKey) / interval)
    key = shiftMonthKey(item.startMonth, steps * interval)
  }
  return item.endMonth && key > item.endMonth ? null : key
}

const shiftMonthKey = (key: string, delta: number) => {
  const { year, month } = splitKey(key)
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Category totals with the change versus the previous month. */
export const categoryDeltas = (state: AppState, key: string) => {
  const prev = new Map(byCategory(state, shiftMonthKey(key, -1)).map((c) => [c.category.id, c.amount]))
  return byCategory(state, key).map((c) => {
    const before = prev.get(c.category.id) ?? 0
    return { ...c, before, delta: c.amount - before, deltaRatio: before > 0 ? (c.amount - before) / before : null }
  })
}

/** Flat list of every expense line across all months, for CSV export. */
export const allTransactions = (state: AppState) => {
  // Every month from the earliest record or recurring start up to the latest record or today (capped at 10 years).
  const now = new Date()
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const candidates = [...Object.keys(state.months), ...state.recurring.map((r) => r.startMonth), nowKey].filter((k) => /^\d{4}-\d{2}$/.test(k)).sort()
  const first = candidates[0] ?? nowKey
  const last = candidates[candidates.length - 1] ?? nowKey
  const span = Math.min(120, monthsBetween(first, last))
  const sorted = Array.from({ length: span + 1 }, (_, i) => shiftMonthKey(first, i))
  const rows: { month: string; date: string; name: string; category: string; type: 'recurring' | 'one-off' | 'savings'; amount: number }[] = []
  state.pots.forEach((p) => p.contributions.forEach((c) => rows.push({ month: c.date.slice(0, 7), date: c.date, name: c.note ? `${p.name}: ${c.note}` : p.name, category: t('cat.savings'), type: 'savings', amount: c.amount })))
  for (const key of sorted) {
    resolveLines(state, key).filter((l) => !l.skipped).forEach((l) =>
      rows.push({ month: key, date: `${key}-${String(Math.min(l.dayOfMonth ?? 1, daysInMonth(key))).padStart(2, '0')}`, name: l.name, category: categoryById(state, l.categoryId).name, type: 'recurring', amount: l.amount }))
    getMonth(state, key).oneOffs.forEach((e) =>
      rows.push({ month: key, date: e.date, name: e.name, category: categoryById(state, e.categoryId).name, type: 'one-off', amount: e.amount }))
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date))
}
