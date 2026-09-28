import type { AppState } from './types'
import { budgetStatus, byKind, categoryById, resolveLines, summarize, trend, type ResolvedLine } from './calc'
import { formatMonth, shiftMonth } from './months'
import { formatMoney, formatPct } from './format'

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
  remaining: number
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
    income: s.income, expenses: s.expenses, remaining: s.remaining, savingsRate: s.savingsRate,
    subscriptionsTotal: kinds.subscription, creditsTotal: kinds.credit,
    money: (n) => formatMoney(n, state.currency, { compact: true }),
  }
}

const builtInRules = (ctx: InsightContext): Suggestion[] => {
  const out: Suggestion[] = []
  const { state, monthKey, lines, income, remaining, savingsRate, subscriptionsTotal, creditsTotal, money } = ctx
  const goal = state.savingsGoalPct / 100

  if (income === 0) {
    out.push({ id: 'no-income', severity: 'info', title: 'Enter your salary', detail: 'Add this month\'s salary (or a default salary in Settings) to get savings rate and optimization tips.' })
    return out
  }

  if (remaining < 0) {
    out.push({ id: 'overspend', severity: 'serious', title: 'Spending exceeds income', detail: `You are ${money(-remaining)} over budget this month.` })
  } else if (savingsRate < goal) {
    const gap = goal * income - remaining
    out.push({ id: 'below-goal', severity: 'warning', title: `Below your ${state.savingsGoalPct}% savings goal`, detail: `You keep ${formatPct(savingsRate)}. Trim ${money(gap)} to reach the goal.` })
  } else {
    out.push({ id: 'on-track', severity: 'good', title: 'Savings goal reached', detail: `You keep ${formatPct(savingsRate)} of your income (${money(remaining)}).` })
  }

  budgetStatus(state, monthKey).filter((b) => b.share > 1).forEach((b) =>
    out.push({ id: `budget-${b.category.id}`, severity: 'warning', title: `${b.category.icon} ${b.category.name} over budget`, detail: `${money(b.amount)} spent of a ${money(b.budget!)} budget (${formatPct(b.share)}).` }))

  if (subscriptionsTotal / income > 0.1) {
    const subs = lines.filter((l) => l.kind === 'subscription' && !l.skipped)
    out.push({ id: 'subs-heavy', severity: 'warning', title: 'Subscriptions above 10% of income', detail: `${subs.length} subscriptions cost ${money(subscriptionsTotal)} this month (${formatPct(subscriptionsTotal / income)}). Cancelling the smallest three would free ${money(subs.slice(-3).reduce((a, l) => a + l.amount, 0))}.` })
  }

  if (creditsTotal / income > 0.35) {
    out.push({ id: 'debt-heavy', severity: 'serious', title: 'Credit repayments above 35% of income', detail: `Loans take ${formatPct(creditsTotal / income)} of your income. Lenders consider this the ceiling; avoid new credit.` })
  }

  const endingNext = state.recurring.filter((r) => r.active && r.endMonth && r.endMonth >= monthKey && r.endMonth <= shiftMonth(monthKey, 2))
  endingNext.forEach((r) => out.push({ id: `ending-${r.id}`, severity: 'good', title: `${r.name} ends in ${formatMonth(r.endMonth!, 'short')}`, detail: `${money(r.amount)}/month will be freed up. Consider redirecting it to savings.` }))

  const yearly = lines.filter((l) => l.intervalMonths > 1 && !l.skipped)
  yearly.forEach((l) => out.push({ id: `yearly-${l.id}`, severity: 'info', title: `${l.name} is charged this month`, detail: `A ${l.intervalMonths}-month payment of ${money(l.amount)} lands now, not every month.` }))

  const biggest = lines.find((l) => !l.skipped)
  if (biggest && biggest.amount / income > 0.3) {
    out.push({ id: 'biggest', severity: 'info', title: `${biggest.name} is your largest cost`, detail: `${money(biggest.amount)} is ${formatPct(biggest.amount / income)} of income. Small wins elsewhere won't move the needle as much as renegotiating this one.` })
  }

  const history = trend(state, shiftMonth(monthKey, -1), 3).filter((p) => p.summary.income > 0)
  if (history.length >= 2) {
    const avg = history.reduce((a, p) => a + p.summary.expenses, 0) / history.length
    if (ctx.expenses > avg * 1.15) {
      out.push({ id: 'spike', severity: 'warning', title: 'Spending is up vs. recent months', detail: `${money(ctx.expenses)} this month vs. an average of ${money(avg)} over the last ${history.length} months.` })
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
