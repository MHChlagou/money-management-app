import type { AppState } from './types'
import { parseAmount } from './format'
import { categoryById, recentExpenses } from './calc'

export interface QuickAddDraft { name: string; amount: number; categoryId: string }

const AMOUNT_TOKEN = /^[-+]?[€$£]?\d[\d.,]*[€$£]?$/

/**
 * Reads typed text such as "Coffee 4.50", "4,50 coffee" or "Rent 1 200" into an expense draft.
 * The last run of number-like tokens is the amount; the rest is the name. Null when either is missing.
 * The category comes from the last expense with the same name, then from a category whose name matches.
 */
export const parseQuickAdd = (state: AppState, text: string): QuickAddDraft | null => {
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  let end = tokens.length - 1
  while (end >= 0 && !AMOUNT_TOKEN.test(tokens[end])) end--
  if (end < 0) return null
  let start = end
  // "1 200" is one amount written with a space as the thousands separator.
  while (start > 0 && AMOUNT_TOKEN.test(tokens[start - 1]) && /^\d{3}$/.test(tokens[start])) start--
  const amount = parseAmount(tokens.slice(start, end + 1).join(''))
  const name = [...tokens.slice(0, start), ...tokens.slice(end + 1)].join(' ').trim()
  if (!name || !(amount > 0)) return null
  const lower = name.toLowerCase()
  const known = recentExpenses(state, 200).find((r) => r.name.trim().toLowerCase() === lower)
  const byCategory = state.categories.find((c) => categoryById(state, c.id).name.toLowerCase() === lower)
  return { name, amount, categoryId: known?.categoryId ?? byCategory?.id ?? 'other' }
}
