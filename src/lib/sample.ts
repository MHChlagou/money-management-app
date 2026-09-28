import type { AppState } from './types'
import { emptyState } from './types'
import { pad2, shiftMonth, currentMonthKey } from './months'

/** Realistic example data so the app can be explored before entering real numbers. */
export const sampleState = (): AppState => {
  const now = currentMonthKey()
  const m = (d: number) => shiftMonth(now, d)
  const base = emptyState()
  return {
    ...base,
    defaultSalary: 2600,
    recurring: [
      { id: 'r1', name: 'Rent', amount: 850, kind: 'bill', categoryId: 'housing', startMonth: m(-12), intervalMonths: 1, dayOfMonth: 1, active: true },
      { id: 'r2', name: 'Car loan', amount: 320, kind: 'credit', categoryId: 'loans', startMonth: m(-20), endMonth: m(3), intervalMonths: 1, dayOfMonth: 5, active: true, note: '36 months, 2.9%' },
      { id: 'r3', name: 'Netflix', amount: 17.99, kind: 'subscription', categoryId: 'entertainment', startMonth: m(-12), intervalMonths: 1, dayOfMonth: 14, active: true },
      { id: 'r4', name: 'Spotify', amount: 10.99, kind: 'subscription', categoryId: 'entertainment', startMonth: m(-12), intervalMonths: 1, dayOfMonth: 20, active: true },
      { id: 'r5', name: 'Gym', amount: 39, kind: 'subscription', categoryId: 'health', startMonth: m(-4), intervalMonths: 1, dayOfMonth: 3, active: true },
      { id: 'r6', name: 'Phone plan', amount: 24.99, kind: 'subscription', categoryId: 'utilities', startMonth: m(-12), intervalMonths: 1, dayOfMonth: 10, active: true },
      { id: 'r7', name: 'Electricity', amount: 95, kind: 'bill', categoryId: 'utilities', startMonth: m(-12), intervalMonths: 1, dayOfMonth: 8, active: true },
      { id: 'r8', name: 'Car insurance', amount: 62, kind: 'bill', categoryId: 'insurance', startMonth: m(-12), intervalMonths: 1, dayOfMonth: 15, active: true },
      { id: 'r9', name: 'Amazon Prime', amount: 69.9, kind: 'subscription', categoryId: 'shopping', startMonth: m(-2), intervalMonths: 12, dayOfMonth: 22, active: true },
      { id: 'r10', name: 'Home insurance', amount: 180, kind: 'bill', categoryId: 'insurance', startMonth: m(-1), intervalMonths: 6, dayOfMonth: 1, active: true },
    ],
    months: {
      [m(-3)]: { extraIncome: 0, overrides: {}, oneOffs: [{ id: 'o0', name: 'Groceries', amount: 280, categoryId: 'groceries', date: `${m(-3)}-18` }] },
      [m(-2)]: { extraIncome: 150, overrides: {}, oneOffs: [
        { id: 'o1', name: 'Dentist', amount: 120, categoryId: 'health', date: `${m(-2)}-10` },
        { id: 'o1b', name: 'Groceries', amount: 300, categoryId: 'groceries', date: `${m(-2)}-16` },
      ] },
      [m(-1)]: { extraIncome: 0, overrides: { r5: { skipped: true } }, oneOffs: [
        { id: 'o1c', name: 'Groceries', amount: 290, categoryId: 'groceries', date: `${m(-1)}-15` },
        { id: 'o1d', name: 'Weekend trip', amount: 240, categoryId: 'travel', date: `${m(-1)}-23` },
      ] },
      [now]: { extraIncome: 0, overrides: { r3: { amount: 12.99 } }, oneOffs: [
        { id: 'o2', name: 'Birthday gift', amount: 60, categoryId: 'shopping', date: `${now}-05` },
        { id: 'o3', name: 'Groceries', amount: 310, categoryId: 'groceries', date: `${now}-12` },
        { id: 'o4', name: 'Restaurant', amount: 85, categoryId: 'restaurants', date: `${now}-${pad2(Math.min(14, new Date().getDate()))}` },
        { id: 'o5', name: 'Fuel', amount: 70, categoryId: 'transport', date: `${now}-09` },
      ] },
    },
    categories: base.categories.map((c) => (c.id === 'groceries' ? { ...c, budget: 350 } : c.id === 'restaurants' ? { ...c, budget: 100 } : c.id === 'shopping' ? { ...c, budget: 150 } : c)),
  }
}
