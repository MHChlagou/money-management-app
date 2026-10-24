import { useSyncExternalStore } from 'react'
import type { OneOffExpense } from './types'

/**
 * App-level UI requests that any screen can make: open the expense sheet, open the command palette,
 * or ask the Recurring tab to open one item. Kept out of AppState because none of it is saved.
 */
export interface ExpenseSheetRequest {
  /** Month the sheet opens in; the date field defaults to today when it falls in this month. */
  monthKey: string
  initial?: OneOffExpense
  /** Pre-selected day, when opened from the calendar. */
  day?: number
}

interface UiState {
  expenseSheet: ExpenseSheetRequest | null
  paletteOpen: boolean
  editRecurringId: string | null
}

let ui: UiState = { expenseSheet: null, paletteOpen: false, editRecurringId: null }
const listeners = new Set<() => void>()
const set = (patch: Partial<UiState>) => { ui = { ...ui, ...patch }; listeners.forEach((l) => l()) }

export const openExpenseSheet = (request: ExpenseSheetRequest) => set({ expenseSheet: request, paletteOpen: false })
export const closeExpenseSheet = () => set({ expenseSheet: null })
export const setPaletteOpen = (paletteOpen: boolean) => set({ paletteOpen })
export const requestRecurringEdit = (id: string | null) => set({ editRecurringId: id })

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l) }
export const useUi = () => useSyncExternalStore(subscribe, () => ui, () => ui)
