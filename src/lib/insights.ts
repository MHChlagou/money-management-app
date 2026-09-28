import type { AppState } from './types'
import { budgetStatus, byKind, categoryById, resolveLines, summarize, trend, type ResolvedLine } from './calc'
import { currentMonthKey, formatMonth, shiftMonth } from './months'
import { formatMoney, formatPct } from './format'
import { t } from './i18n'

export type Severity = 'good' | 'info' | 'warning' | 'serious'

export interface Suggestion {
  id: string
  severity: Severity
  title: string
  detail: string
}

/** Everything a rule may look at, pre-computed once. */
export interface InsightContext {
  state: AppState
  monthKey: string
  lines: ResolvedLine[]
  income: number
  expenses: number
  /** Income minus expenses. */
  kept: number
  /** Kept minus what went into savings pots. */
  remaining: number
  setAside: number
  savingsRate: number
  subscriptionsTotal: number
  creditsTotal: number
  money: (n: number) => string
}

export const buildContext = (state: AppState, monthKey: string): InsightContext => {
  const s = summarize(state, monthKey)
  const lines = resolveLines(state, monthKey)
  const kinds = byKind(lines)
  return {
    state, monthKey, lines,
    income: s.income, expenses: s.expenses, kept: s.kept, remaining: s.remaining, setAside: s.setAside, savingsRate: s.savingsRate,
    subscriptionsTotal: kinds.subscription, creditsTotal: kinds.credit,
    money: (n) => formatMoney(n, state.currency, { compact: true }),
  }
}

const builtInRules = (ctx: InsightContext): Suggestion[] => {
  const out: Suggestion[] = []
  const { state, monthKey, lines, income, kept, remaining, setAside, savingsRate, subscriptionsTotal, creditsTotal, money } = ctx
  const goal = state.savingsGoalPct / 100

  if (income === 0) {
    out.push({ id: 'no-income', severity: 'info', title: t('rule.noIncome.t'), detail: t('rule.noIncome.d') })
    return out
  }

  if (kept < 0) {
    out.push({ id: 'overspend', severity: 'serious', title: t('rule.overspend.t'), detail: t('rule.overspend.d', { amount: money(-kept) }) })
  } else if (savingsRate < goal) {
    const gap = goal * income - kept
    out.push({ id: 'below-goal', severity: 'warning', title: t('rule.belowGoal.t', { pct: state.savingsGoalPct }), detail: t('rule.belowGoal.d', { rate: formatPct(savingsRate), gap: money(gap) }) })
  } else {
    out.push({ id: 'on-track', severity: 'good', title: t('rule.onTrack.t'), detail: t('rule.onTrack.d', { rate: formatPct(savingsRate), amount: money(kept) }) })
  }

  if (remaining < 0 && kept >= 0) {
    out.push({ id: 'pot-too-much', severity: 'warning', title: t('rule.potTooMuch.t'), detail: t('rule.potTooMuch.d', { aside: money(setAside), kept: money(kept), back: money(-remaining) }) })
  } else if (state.pots.length > 0 && setAside <= 0 && kept > 0 && monthKey <= currentMonthKey()) {
    out.push({ id: 'pot-nothing', severity: 'info', title: t('rule.potNothing.t'), detail: t('rule.potNothing.d', { kept: money(kept) }) })
  }

  budgetStatus(state, monthKey).filter((b) => b.share > 1).forEach((b) =>
    out.push({ id: `budget-${b.category.id}`, severity: 'warning', title: t('rule.budget.t', { name: `${b.category.icon} ${b.category.name}` }), detail: t('rule.budget.d', { spent: money(b.amount), budget: money(b.budget!), pct: formatPct(b.share) }) }))

  if (subscriptionsTotal / income > 0.1) {
    const subs = lines.filter((l) => l.kind === 'subscription' && !l.skipped)
    out.push({ id: 'subs-heavy', severity: 'warning', title: t('rule.subs.t'), detail: t('rule.subs.d', { n: subs.length, total: money(subscriptionsTotal), pct: formatPct(subscriptionsTotal / income), free: money(subs.slice(-3).reduce((a, l) => a + l.amount, 0)) }) })
  }

  if (creditsTotal / income > 0.35) {
    out.push({ id: 'debt-heavy', severity: 'serious', title: t('rule.debt.t'), detail: t('rule.debt.d', { pct: formatPct(creditsTotal / income) }) })
  }

  const endingNext = state.recurring.filter((r) => r.active && r.endMonth && r.endMonth >= monthKey && r.endMonth <= shiftMonth(monthKey, 2))
  endingNext.forEach((r) => out.push({ id: `ending-${r.id}`, severity: 'good', title: t('rule.ending.t', { name: r.name, month: formatMonth(r.endMonth!, 'short') }), detail: t('rule.ending.d', { amount: money(r.amount) }) }))

  const yearly = lines.filter((l) => l.intervalMonths > 1 && !l.skipped)
  yearly.forEach((l) => out.push({ id: `yearly-${l.id}`, severity: 'info', title: t('rule.yearly.t', { name: l.name }), detail: t('rule.yearly.d', { n: l.intervalMonths, amount: money(l.amount) }) }))

  const biggest = lines.find((l) => !l.skipped)
  if (biggest && biggest.amount / income > 0.3) {
    out.push({ id: 'biggest', severity: 'info', title: t('rule.biggest.t', { name: biggest.name }), detail: t('rule.biggest.d', { amount: money(biggest.amount), pct: formatPct(biggest.amount / income) }) })
  }

  const history = trend(state, shiftMonth(monthKey, -1), 3).filter((p) => p.summary.income > 0)
  if (history.length >= 2) {
    const avg = history.reduce((a, p) => a + p.summary.expenses, 0) / history.length
    if (ctx.expenses > avg * 1.15) {
      out.push({ id: 'spike', severity: 'warning', title: t('rule.spike.t'), detail: t('rule.spike.d', { now: money(ctx.expenses), avg: money(avg), n: history.length }) })
    }
  }

  return out
}

/**
 * Your own rules go here. Each rule looks at the context and returns zero or more suggestions.
 *
 * Ideas:
 *  - flag any single subscription above a threshold you choose
 *  - warn when one-off "Restaurants" spending passes a monthly cap
 *  - celebrate when remaining money beats last month
 *
 * Example:
 *   if (ctx.lines.some((l) => l.kind === 'subscription' && l.amount > 30)) {
 *     return [{ id: 'pricey-sub', severity: 'info', title: 'A subscription costs over 30', detail: 'Is it still worth it?' }]
 *   }
 * Category names are available via categoryById(ctx.state, line.categoryId).name
 */
export const personalRules = (_ctx: InsightContext): Suggestion[] => {
  // TODO: add your own rules here
  return []
}

export { categoryById }

const order: Record<Severity, number> = { serious: 0, warning: 1, info: 2, good: 3 }

export const suggestions = (state: AppState, monthKey: string): Suggestion[] => {
  const ctx = buildContext(state, monthKey)
  return [...builtInRules(ctx), ...personalRules(ctx)].sort((a, b) => order[a.severity] - order[b.severity])
}
