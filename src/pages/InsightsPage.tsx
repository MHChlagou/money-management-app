import { useState } from 'react'
import { Card, CategoryDot, cx, Empty, SectionTitle, Segmented } from '../components/ui'
import { MonthNav } from '../components/MonthNav'
import { CategoryDonut, TrendChart, YearChart } from '../components/charts'
import { useAppState } from '../lib/store'
import { budgetStatus, byCategory, byKind, resolveLines, summarize, trend, yearTrend } from '../lib/calc'
import { suggestions, type Severity } from '../lib/insights'
import { formatMoney, formatPct } from '../lib/format'
import { currentMonthKey, formatMonth, splitKey } from '../lib/months'
import { KIND_LABELS, type RecurringKind } from '../lib/types'

const severityStyle: Record<Severity, { icon: string; cls: string }> = {
  serious: { icon: '⛔', cls: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40' },
  warning: { icon: '⚠️', cls: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40' },
  info: { icon: 'ℹ️', cls: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40' },
  good: { icon: '✅', cls: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40' },
}

export function InsightsPage({ monthKey, onMonthChange }: { monthKey: string; onMonthChange: (k: string) => void }) {
  const state = useAppState()
  const money = (n: number, compact = false) => formatMoney(n, state.currency, { compact })
  const [range, setRange] = useState<'6m' | 'year'>('6m')
  const tips = suggestions(state, monthKey)
  const cats = byCategory(state, monthKey)
  const budgets = budgetStatus(state, monthKey)
  const points = trend(state, monthKey, 6)
  const year = yearTrend(state, monthKey)
  const kinds = byKind(resolveLines(state, monthKey))
  const sum = summarize(state, monthKey)
  const hasHistory = points.some((p) => p.summary.income > 0 || p.summary.expenses > 0)
  const yearMonths = year.filter((p) => p.summary.income > 0)
  const projected = yearMonths.some((p) => p.key > currentMonthKey())
  const yearIncome = yearMonths.reduce((a, p) => a + p.summary.income, 0)
  const yearExpenses = yearMonths.reduce((a, p) => a + p.summary.expenses, 0)

  return (
    <div className="space-y-4">
      <MonthNav value={monthKey} onChange={onMonthChange} />

      <Card>
        <SectionTitle>How to optimize</SectionTitle>
        <ul className="space-y-2">
          {tips.map((t) => (
            <li key={t.id} className={`rounded-xl border p-3 ${severityStyle[t.severity].cls}`}>
              <div className="flex items-start gap-2">
                <span aria-hidden>{severityStyle[t.severity].icon}</span>
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{t.detail}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {budgets.length > 0 && (
        <Card>
          <SectionTitle>Budgets</SectionTitle>
          <ul className="space-y-2.5">
            {budgets.map((b) => {
              const over = b.share > 1
              const near = !over && b.share > 0.8
              return (
                <li key={b.category.id}>
                  <div className="flex items-center gap-2 text-sm">
                    <CategoryDot icon={b.category.icon} color={b.category.color} size="sm" />
                    <span className="font-medium">{b.category.name}</span>
                    <span className={cx('ml-auto tabular-nums', over ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300')}>
                      {money(b.amount, true)} / {money(b.budget!, true)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={cx('h-full rounded-full', over ? 'bg-red-500' : near ? 'bg-amber-500' : 'bg-brand-600')} style={{ width: `${Math.min(100, b.share * 100)}%` }} />
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{over ? `${money(b.amount - b.budget!, true)} over` : `${money(b.budget! - b.amount, true)} left`}</div>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Set budgets per category in Settings → Categories.</p>
        </Card>
      )}

      <Card>
        <SectionTitle>Spending by category</SectionTitle>
        {cats.length === 0 ? <Empty>No expenses this month.</Empty> : (
          <>
            <CategoryDonut totals={cats} currency={state.currency} />
            <ul className="mt-4 divide-y divide-slate-100 text-sm dark:divide-slate-800">
              {cats.map((c) => (
                <li key={c.category.id} className="flex items-center gap-2 py-1.5">
                  <CategoryDot icon={c.category.icon} color={c.category.color} size="sm" />
                  <span className="flex-1">{c.category.name}</span>
                  <span className="text-xs text-slate-500">{formatPct(c.share)}</span>
                  <span className="w-24 text-right tabular-nums font-medium">{money(c.amount)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card>
        <SectionTitle action={<Segmented value={range} onChange={setRange} options={[{ value: '6m', label: '6 months' }, { value: 'year', label: String(splitKey(monthKey).year) }]} />}>Over time</SectionTitle>
        {!hasHistory ? <Empty>Fill in a few months to see the trend.</Empty> : range === '6m' ? (
          <>
            <TrendChart points={points} currency={state.currency} highlight={monthKey} />
            <table className="mt-3 w-full text-xs">
              <thead className="text-slate-500"><tr><th className="text-left font-normal">Month</th><th className="text-right font-normal">Income</th><th className="text-right font-normal">Expenses</th><th className="text-right font-normal">Kept</th></tr></thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.key} className={p.key === monthKey ? 'font-semibold' : ''}>
                    <td className="py-0.5">{formatMonth(p.key, 'short')}</td>
                    <td className="text-right tabular-nums">{money(p.summary.income, true)}</td>
                    <td className="text-right tabular-nums">{money(p.summary.expenses, true)}</td>
                    <td className={cx('text-right tabular-nums', p.summary.remaining < 0 && p.summary.income > 0 && 'text-red-600 dark:text-red-400')}>{p.summary.income > 0 ? `${money(p.summary.remaining, true)} (${formatPct(p.summary.savingsRate)})` : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              <div><div className="text-[11px] uppercase text-slate-500">Income</div><div className="font-semibold tabular-nums">{money(yearIncome, true)}</div></div>
              <div><div className="text-[11px] uppercase text-slate-500">Expenses</div><div className="font-semibold tabular-nums">{money(yearExpenses, true)}</div></div>
              <div><div className="text-[11px] uppercase text-slate-500">Kept</div><div className={cx('font-semibold tabular-nums', yearIncome - yearExpenses < 0 ? 'text-red-600' : 'text-brand-700 dark:text-brand-500')}>{money(yearIncome - yearExpenses, true)}</div></div>
            </div>
            <YearChart points={year} currency={state.currency} highlight={monthKey} />
            <p className="mt-2 text-xs text-slate-500">Money kept each month of {splitKey(monthKey).year}. Months without a salary are left empty.{projected && ' Future months are a projection from your default salary and recurring costs.'}</p>
          </>
        )}
      </Card>

      <Card>
        <SectionTitle>Fixed costs by type</SectionTitle>
        {sum.fixed === 0 ? <Empty>No recurring costs this month.</Empty> : (
          <ul className="space-y-1.5">
            {(Object.keys(kinds) as RecurringKind[]).filter((k) => kinds[k] > 0).map((k) => (
              <li key={k}>
                <div className="flex justify-between text-sm">
                  <span>{KIND_LABELS[k]}</span>
                  <span className="tabular-nums text-slate-600 dark:text-slate-300">{money(kinds[k])} · {formatPct(kinds[k] / sum.fixed)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-brand-600 dark:bg-brand-500" style={{ width: `${Math.max(2, (kinds[k] / sum.fixed) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
