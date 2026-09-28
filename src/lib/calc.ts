import type { AppState, Category, MonthRecord, RecurringItem, RecurringKind } from './types'
import { emptyMonth } from './types'
import { daysInMonth, lastMonths, monthsBetween, monthsOfYear, splitKey } from './months'

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
  const remaining = income - expenses
  return {
    income, salary, fixed, variable, expenses, remaining,
    savingsRate: income > 0 ? remaining / income : 0,
    usesDefaultSalary: state.months[key]?.salary === undefined,
  }
}

export interface CategoryTotal { category: Category; amount: number; share: number; budget?: number }

export const categoryById = (state: AppState, id: string): Category =>
  state.categories.find((c) => c.id === id) ?? { id, name: 'Other', icon: '📦', color: '#64748b' }

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
