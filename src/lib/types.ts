/** A recurring line configured once and applied automatically to every month in its range. */
export type RecurringKind = 'subscription' | 'credit' | 'bill' | 'other'

export interface Category {
  id: string
  name: string
  /** An emoji. */
  icon: string
  /** Hex colour, used consistently in lists and charts. */
  color: string
  /** Optional monthly budget for this category. */
  budget?: number
}

export interface RecurringItem {
  id: string
  name: string
  amount: number
  kind: RecurringKind
  categoryId: string
  /** First month it applies to, "YYYY-MM". Also the anchor for non-monthly billing. */
  startMonth: string
  /** Last month it applies to (inclusive), "YYYY-MM". Credits usually have one. */
  endMonth?: string
  /** 1 = monthly, 3 = quarterly, 12 = yearly. Charged only in months where (months since start) % interval == 0. */
  intervalMonths: number
  /** Day of month the payment leaves the account (1-31). Undefined = unknown. */
  dayOfMonth?: number
  active: boolean
  note?: string
}

/** An expense that happens once, in a specific month. */
export interface OneOffExpense {
  id: string
  name: string
  amount: number
  categoryId: string
  /** ISO date "YYYY-MM-DD". */
  date: string
}

/** Per-month tweak to a recurring line: a different amount, or skipped entirely. */
export interface LineOverride {
  amount?: number
  skipped?: boolean
}

export interface MonthRecord {
  /** Undefined = fall back to the default salary from settings. */
  salary?: number
  extraIncome: number
  overrides: Record<string, LineOverride>
  oneOffs: OneOffExpense[]
  note?: string
}

/** Money moved into a pot (positive) or taken out (negative). */
export interface Contribution {
  id: string
  /** ISO date "YYYY-MM-DD"; the month it belongs to is derived from it. */
  date: string
  amount: number
  note?: string
}

/** A named savings goal: emergency fund, holiday, new laptop. */
export interface SavingsPot {
  id: string
  name: string
  icon: string
  color: string
  /** Optional target amount to reach. */
  target?: number
  contributions: Contribution[]
}

export type Theme = 'system' | 'light' | 'dark'

export interface AppState {
  version: 3
  currency: string
  /** Target share of income to keep, as a percentage (e.g. 20). */
  savingsGoalPct: number
  /** Pre-filled salary for months you have not edited. */
  defaultSalary: number
  theme: Theme
  categories: Category[]
  recurring: RecurringItem[]
  months: Record<string, MonthRecord>
  pots: SavingsPot[]
}

export const KIND_LABELS: Record<RecurringKind, string> = {
  subscription: 'Subscription',
  credit: 'Credit / loan',
  bill: 'Bill',
  other: 'Other',
}

export const INTERVAL_LABELS: Record<number, string> = {
  1: 'Monthly',
  2: 'Every 2 months',
  3: 'Quarterly',
  6: 'Every 6 months',
  12: 'Yearly',
}

/**
 * Colours available for categories. The first eight are the validated categorical palette
 * (colour-blind safe in adjacent pairs); the rest are extra choices for the user's own categories.
 */
export const CATEGORY_COLORS = [
  '#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948',
  '#0891b2', '#7c3aed', '#b45309', '#64748b',
]

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'housing', name: 'Housing', icon: '🏠', color: '#2a78d6' },
  { id: 'utilities', name: 'Utilities', icon: '💡', color: '#eda100' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#1baf7a' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#4a3aa7' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', color: '#0891b2' },
  { id: 'loans', name: 'Loans', icon: '🏦', color: '#e34948' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#e87ba4' },
  { id: 'health', name: 'Health', icon: '❤️', color: '#008300' },
  { id: 'restaurants', name: 'Restaurants', icon: '🍽️', color: '#eb6834' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#7c3aed' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#b45309' },
  { id: 'other', name: 'Other', icon: '📦', color: '#64748b' },
]

export const emptyMonth = (): MonthRecord => ({ extraIncome: 0, overrides: {}, oneOffs: [] })

export const emptyState = (): AppState => ({
  version: 3,
  currency: 'EUR',
  savingsGoalPct: 20,
  defaultSalary: 0,
  theme: 'system',
  categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
  recurring: [],
  months: {},
  pots: [],
})
