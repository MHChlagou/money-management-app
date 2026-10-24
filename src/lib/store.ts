import { useSyncExternalStore } from 'react'
import { DEFAULT_CATEGORIES, emptyMonth, emptyState, type AppState, type Category, type MonthRecord, type OneOffExpense } from './types'

/**
 * A tiny external store persisted to localStorage.
 * Every update replaces the state object immutably, then writes it through to disk,
 * so a reload (or the app being killed on a phone) never loses data.
 */
const STORAGE_KEY = 'monthly-money:v1'

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'other'

/** Upgrades any older saved shape to the current one. Safe to run on current data too. */
export const migrate = (input: unknown): AppState => {
  const raw = (input ?? {}) as Record<string, unknown>
  const base = emptyState()
  const version = typeof raw.version === 'number' ? raw.version : 0

  const categories: Category[] = Array.isArray(raw.categories) && raw.categories.length
    ? (raw.categories as Category[])
    : DEFAULT_CATEGORIES.map((c) => ({ ...c }))

  // v1 stored the category as a free-text name; map names to category ids, creating any missing ones.
  const ensureCategory = (name: unknown): string => {
    const label = typeof name === 'string' && name.trim() ? name.trim() : 'Other'
    const found = categories.find((c) => c.name.toLowerCase() === label.toLowerCase())
    if (found) return found.id
    const created: Category = { id: slug(label), name: label, icon: '🏷️', color: '#64748b' }
    categories.push(created)
    return created.id
  }

  type LegacyItem = Record<string, unknown> & { category?: string; categoryId?: string }
  const recurring = (Array.isArray(raw.recurring) ? (raw.recurring as LegacyItem[]) : []).map((r) => ({
    ...r,
    categoryId: r.categoryId ?? ensureCategory(r.category),
    intervalMonths: typeof r.intervalMonths === 'number' ? r.intervalMonths : 1,
  })) as AppState['recurring']

  const months: AppState['months'] = {}
  for (const [key, m] of Object.entries((raw.months ?? {}) as Record<string, Record<string, unknown>>)) {
    const oneOffs = (Array.isArray(m.oneOffs) ? (m.oneOffs as LegacyItem[]) : []).map((e) => ({
      ...e,
      categoryId: e.categoryId ?? ensureCategory(e.category),
    })) as AppState['months'][string]['oneOffs']
    months[key] = {
      salary: typeof m.salary === 'number' && (version >= 2 || m.salary > 0) ? m.salary : undefined,
      extraIncome: typeof m.extraIncome === 'number' ? m.extraIncome : 0,
      overrides: (m.overrides as AppState['months'][string]['overrides']) ?? {},
      oneOffs,
      note: typeof m.note === 'string' ? m.note : undefined,
    }
  }

  return {
    ...base,
    currency: typeof raw.currency === 'string' ? raw.currency : base.currency,
    savingsGoalPct: typeof raw.savingsGoalPct === 'number' ? raw.savingsGoalPct : base.savingsGoalPct,
    defaultSalary: typeof raw.defaultSalary === 'number' ? raw.defaultSalary : base.defaultSalary,
    theme: raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system' ? (raw.theme as AppState['theme']) : base.theme,
    categories,
    recurring,
    months,
    pots: Array.isArray(raw.pots) ? (raw.pots as AppState['pots']) : [],
    language: raw.language === 'fr' || raw.language === 'en' ? raw.language : base.language,
    userName: typeof raw.userName === 'string' && raw.userName.trim() ? raw.userName.trim() : undefined,
    // Existing users (anything already saved) skip the welcome sheet; brand-new installs see it.
    onboarded: typeof raw.onboarded === 'boolean' ? raw.onboarded : version > 0,
    version: 3,
  }
}

const load = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    return migrate(JSON.parse(raw))
  } catch {
    return emptyState()
  }
}

let state: AppState = load()
const listeners = new Set<() => void>()

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Could not persist state', err)
  }
}

export const getState = () => state

export const setState = (updater: (prev: AppState) => AppState) => {
  state = updater(state)
  persist()
  listeners.forEach((l) => l())
}

export const replaceState = (next: AppState) => setState(() => next)

/** Applies `fn` to one month's record, creating the record if the month has none yet. */
export const updateMonth = (key: string, fn: (m: MonthRecord) => MonthRecord) =>
  setState((s) => ({ ...s, months: { ...s.months, [key]: fn(s.months[key] ?? emptyMonth()) } }))

/** Adds a one-off expense, or replaces the one with the same id. The month comes from the expense's date. */
export const saveOneOff = (e: OneOffExpense, previousMonthKey?: string) => {
  const key = e.date.slice(0, 7)
  setState((s) => {
    const months = { ...s.months }
    // An edit can move the expense to another month; drop it from where it was first.
    if (previousMonthKey && previousMonthKey !== key && months[previousMonthKey]) {
      months[previousMonthKey] = { ...months[previousMonthKey], oneOffs: months[previousMonthKey].oneOffs.filter((x) => x.id !== e.id) }
    }
    const m = months[key] ?? emptyMonth()
    const exists = m.oneOffs.some((x) => x.id === e.id)
    months[key] = { ...m, oneOffs: exists ? m.oneOffs.map((x) => (x.id === e.id ? e : x)) : [...m.oneOffs, e] }
    return { ...s, months }
  })
}

export const deleteOneOff = (e: OneOffExpense) =>
  updateMonth(e.date.slice(0, 7), (m) => ({ ...m, oneOffs: m.oneOffs.filter((x) => x.id !== e.id) }))

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useAppState = () => useSyncExternalStore(subscribe, getState, getState)

/** Ask the browser to keep this origin's storage from being evicted under storage pressure. */
export const requestPersistentStorage = async () => {
  if (navigator.storage?.persist) {
    try { await navigator.storage.persist() } catch { /* best effort */ }
  }
}
