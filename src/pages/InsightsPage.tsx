import { useState } from 'react'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Info, OctagonAlert } from 'lucide-react'
import { Card, CategoryDot, cx, Empty, Money, SectionTitle, Segmented } from '../components/ui'
import { MonthNav } from '../components/MonthNav'
import { CategoryDonut, TrendChart, YearChart } from '../components/charts'
import { useAppState } from '../lib/store'
import { budgetStatus, byKind, categoryDeltas, potBalance, resolveLines, summarize, totalSaved, trend, yearTrend } from '../lib/calc'
import { suggestions, type Severity } from '../lib/insights'
import { formatMoney, formatPct } from '../lib/format'
import { currentMonthKey, formatMonth, splitKey } from '../lib/months'
import { type RecurringKind } from '../lib/types'
import { kindLabel, useT } from '../lib/i18n'

const severityStyle: Record<Severity, { Icon: typeof Info; cls: string; icon: string }> = {
  serious: { Icon: OctagonAlert, cls: 'border-l-coral-500', icon: 'text-coral-600 dark:text-coral-400' },
  warning: { Icon: AlertTriangle, cls: 'border-l-amber-400', icon: 'text-amber-600 dark:text-amber-400' },
  info: { Icon: Info, cls: 'border-l-ink-500', icon: 'text-ink-600 dark:text-ink-200' },
  good: { Icon: CheckCircle2, cls: 'border-l-mint-400', icon: 'text-mint-600 dark:text-mint-300' },
}

export function InsightsPage({ monthKey, onMonthChange }: { monthKey: string; onMonthChange: (k: string) => void }) {
  const state = useAppState()
  const t = useT()
  const money = (n: number, compact = false) => formatMoney(n, state.currency, { compact })
  const [range, setRange] = useState<'6m' | 'year'>('6m')
  const tips = suggestions(state, monthKey)
  const cats = categoryDeltas(state, monthKey)
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
  const yearSetAside = year.reduce((a, p) => a + p.summary.setAside, 0)
  const saved = totalSaved(state)

  return (
    <div className="space-y-3">
      <Card className="py-3"><MonthNav value={monthKey} onChange={onMonthChange} /></Card>

      <Card>
        <SectionTitle>{t('ins.whereToLook')}</SectionTitle>
        <ul className="space-y-2">
          {tips.map((t) => {
            const s = severityStyle[t.severity]
            return (
              <li key={t.id} className={cx('rounded-xl border border-l-4 border-line bg-paper/60 p-3 dark:border-line-dark dark:bg-white/5', s.cls)}>
                <div className="flex items-start gap-2.5">
                  <s.Icon size={18} className={cx('mt-0.5 shrink-0', s.icon)} />
                  <div>
                    <div className="font-medium leading-tight">{t.title}</div>
                    <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{t.detail}</div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      {budgets.length > 0 && (
        <Card>
          <SectionTitle sub={t('ins.budgetsSub')}>{t('ins.budgets')}</SectionTitle>
          <ul className="space-y-3">
            {budgets.map((b) => {
              const over = b.share > 1
              const near = !over && b.share > 0.8
              return (
                <li key={b.category.id}>
                  <div className="flex items-center gap-2 text-sm">
                    <CategoryDot icon={b.category.icon} color={b.category.color} size="sm" />
                    <span className="font-medium">{b.category.name}</span>
                    <span className={cx('ml-auto', over && 'text-coral-600 dark:text-coral-400')}><Money>{money(b.amount, true)}</Money> <span className="text-slate-500">{t('ins.of')} {money(b.budget!, true)}</span></span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-900/5 dark:bg-white/10">
                    <div className={cx('h-full rounded-full', over ? 'bg-coral-500' : near ? 'bg-amber-400' : 'bg-mint-400')} style={{ width: `${Math.min(100, b.share * 100)}%` }} />
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{over ? t('ins.over', { amount: money(b.amount - b.budget!, true) }) : t('ins.left', { amount: money(b.budget! - b.amount, true) })}</div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <Card>
        <SectionTitle sub={t('ins.byCategorySub')}>{t('ins.byCategory')}</SectionTitle>
        {cats.length === 0 ? <Empty>{t('ins.noExpenses')}</Empty> : (
          <>
            <CategoryDonut totals={cats} currency={state.currency} />
            <ul className="mt-4 divide-y divide-line text-sm dark:divide-line-dark">
              {cats.map((c) => (
                <li key={c.category.id} className="flex items-center gap-2.5 py-2">
                  <CategoryDot icon={c.category.icon} color={c.category.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{c.category.name}</div>
                    <div className="text-xs text-slate-500">{t('ins.ofSpending', { pct: formatPct(c.share) })}</div>
                  </div>
                  {c.deltaRatio !== null && Math.abs(c.delta) >= 1 && (
                    <span className={cx('flex items-center gap-0.5 text-xs font-medium', c.delta > 0 ? 'text-coral-600 dark:text-coral-400' : 'text-mint-600 dark:text-mint-300')}>
                      {c.delta > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{formatPct(Math.abs(c.deltaRatio))}
                    </span>
                  )}
                  {c.deltaRatio === null && c.before === 0 && <span className="text-xs text-slate-400">{t('ins.new')}</span>}
                  <Money className="w-24 text-right">{money(c.amount)}</Money>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card>
        <SectionTitle action={<Segmented value={range} onChange={setRange} options={[{ value: '6m', label: t('ins.sixMonths') }, { value: 'year', label: String(splitKey(monthKey).year) }]} />}>{t('ins.overTime')}</SectionTitle>
        {!hasHistory ? <Empty>{t('ins.fillIn')}</Empty> : range === '6m' ? (
          <>
            <TrendChart points={points} currency={state.currency} highlight={monthKey} />
            <table className="mt-3 w-full text-xs">
              <thead className="text-slate-500"><tr><th className="text-left font-normal">{t('ins.month')}</th><th className="text-right font-normal">{t('ins.income')}</th><th className="text-right font-normal">{t('ins.expenses')}</th><th className="text-right font-normal">{t('ins.kept')}</th></tr></thead>
              <tbody className="tnum">
                {points.map((p) => (
                  <tr key={p.key} className={p.key === monthKey ? 'font-semibold' : ''}>
                    <td className="py-0.5">{formatMonth(p.key, 'short')}</td>
                    <td className="text-right">{money(p.summary.income, true)}</td>
                    <td className="text-right">{money(p.summary.expenses, true)}</td>
                    <td className={cx('text-right', p.summary.kept < 0 && p.summary.income > 0 && 'text-coral-600 dark:text-coral-400')}>{p.summary.income > 0 ? `${money(p.summary.kept, true)} (${formatPct(p.summary.savingsRate)})` : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <div><div className="text-xs text-slate-500">{t('ins.income')}</div><Money>{money(yearIncome, true)}</Money></div>
              <div><div className="text-xs text-slate-500">{t('ins.expenses')}</div><Money>{money(yearExpenses, true)}</Money></div>
              <div><div className="text-xs text-slate-500">{t('ins.kept')}</div><Money className={yearIncome - yearExpenses < 0 ? 'text-coral-600' : 'text-mint-600 dark:text-mint-300'}>{money(yearIncome - yearExpenses, true)}</Money></div>
            </div>
            <YearChart points={year} currency={state.currency} highlight={monthKey} />
            <p className="mt-2 text-xs text-slate-500">{t('ins.yearNote', { year: splitKey(monthKey).year })}{projected && t('ins.projected')}</p>
          </>
        )}
      </Card>

      {state.pots.length > 0 && (
        <Card>
          <SectionTitle sub={t('savings.yearAside', { amount: money(yearSetAside, true), year: splitKey(monthKey).year })}>{t('savings.title')}</SectionTitle>
          <div className="mb-3 flex items-baseline gap-2">
            <Money className="text-2xl">{money(saved)}</Money>
            <span className="text-sm text-slate-500">{t('savings.total', { n: state.pots.length, unit: state.pots.length === 1 ? t('savings.pot1') : t('savings.potN') })}</span>
          </div>
          <ul className="space-y-2">
            {state.pots.map((p) => {
              const b = potBalance(p)
              return (
                <li key={p.id}>
                  <div className="flex items-center gap-2 text-sm">
                    <CategoryDot icon={p.icon} color={p.color} size="sm" />
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-auto"><Money>{money(b, true)}</Money>{p.target && <span className="text-xs text-slate-500"> {t('ins.of')} {money(p.target, true)}</span>}</span>
                  </div>
                  {p.target && <div className="mt-1.5 h-1.5 rounded-full bg-slate-900/5 dark:bg-white/10"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (b / p.target) * 100)}%`, background: p.color }} /></div>}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <Card>
        <SectionTitle>{t('ins.fixedByType')}</SectionTitle>
        {sum.fixed === 0 ? <Empty>{t('ins.noFixed')}</Empty> : (
          <ul className="space-y-2">
            {(Object.keys(kinds) as RecurringKind[]).filter((k) => kinds[k] > 0).map((k) => (
              <li key={k}>
                <div className="flex justify-between text-sm"><span>{kindLabel(k)}</span><span className="text-slate-600 dark:text-slate-300"><Money>{money(kinds[k])}</Money> <span className="text-xs text-slate-500">{formatPct(kinds[k] / sum.fixed)}</span></span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-900/5 dark:bg-white/10"><div className="h-full rounded-full bg-ink-500" style={{ width: `${Math.max(2, (kinds[k] / sum.fixed) * 100)}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
