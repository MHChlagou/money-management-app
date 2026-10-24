import { useState } from 'react'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Info, OctagonAlert } from 'lucide-react'
import { Card, CategoryDot, cx, Empty, Money, PageHeader, SectionTitle, Segmented } from '../components/ui'
import { MonthNav } from '../components/MonthNav'
import { MonthSwap } from '../components/MonthSwap'
import { ForecastList } from '../components/Forecast'
import { PaceNeedle, ReserveGauge, StatCard } from '../components/StatCard'
import { CategoryDonut, TrendChart, YearChart } from '../components/charts'
import { useAppState } from '../lib/store'
import { budgetStatus, byKind, categoryDeltas, forecast, potBalance, resolveLines, summarize, totalSaved, trend, yearTrend } from '../lib/calc'
import { suggestions, type Severity } from '../lib/insights'
import { formatMoney, formatPct } from '../lib/format'
import { currentMonthKey, formatMonth, shiftMonth, splitKey } from '../lib/months'
import { useMonthDirection } from '../lib/useMonthDirection'
import { type RecurringKind } from '../lib/types'
import { kindLabel, useT } from '../lib/i18n'

const severityStyle: Record<Severity, { Icon: typeof Info; tile: string }> = {
  serious: { Icon: OctagonAlert, tile: 'bg-ebb-100 text-ebb-700 dark:bg-ebb-400/15 dark:text-ebb-300' },
  warning: { Icon: AlertTriangle, tile: 'bg-sand-100 text-sand-700 dark:bg-sand-400/15 dark:text-sand-300' },
  info: { Icon: Info, tile: 'bg-sunk text-deep-800 dark:text-mist-100' },
  good: { Icon: CheckCircle2, tile: 'bg-tide-100 text-tide-700 dark:bg-tide-400/15 dark:text-tide-300' },
}

export function InsightsPage({ monthKey, onMonthChange }: { monthKey: string; onMonthChange: (k: string) => void }) {
  const state = useAppState()
  const t = useT()
  const money = (n: number, compact = false) => formatMoney(n, state.currency, { compact })
  const [range, setRange] = useState<'6m' | 'year'>('6m')
  const { dir, moved } = useMonthDirection(monthKey)
  const tips = suggestions(state, monthKey)
  const cats = categoryDeltas(state, monthKey)
  const budgets = budgetStatus(state, monthKey)
  const points = trend(state, monthKey, 6)
  const year = yearTrend(state, monthKey)
  const kinds = byKind(resolveLines(state, monthKey))
  const sum = summarize(state, monthKey)
  const ahead = forecast(state, currentMonthKey(), 6)
  const hasHistory = points.some((p) => p.summary.income > 0 || p.summary.expenses > 0)
  const yearMonths = year.filter((p) => p.summary.income > 0)
  const projected = yearMonths.some((p) => p.key > currentMonthKey())
  const yearIncome = yearMonths.reduce((a, p) => a + p.summary.income, 0)
  const yearExpenses = yearMonths.reduce((a, p) => a + p.summary.expenses, 0)
  const yearSetAside = year.reduce((a, p) => a + p.summary.setAside, 0)
  const saved = totalSaved(state)
  const prev = summarize(state, shiftMonth(monthKey, -1))
  const spendDelta = prev.expenses > 0 ? (sum.expenses - prev.expenses) / prev.expenses : null
  const goal = state.savingsGoalPct / 100
  const top = cats[0]

  return (
    <div>
      <PageHeader title={t('nav.insights')}>
        <MonthNav value={monthKey} onChange={onMonthChange} />
      </PageHeader>

      <MonthSwap key={monthKey} dir={dir} animateIn={moved} className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-12 xl:grid-cols-4">
          <StatCard label={t('stat.kept')} tone={sum.kept < 0 ? 'bad' : 'good'} value={money(sum.kept, true)}
            sub={sum.income > 0 ? t('home.ofIncome', { income: money(sum.income, true) }) : t('hero.addSalary')}
            instrument={<ReserveGauge fraction={sum.income > 0 ? sum.kept / sum.income : 0} negative={sum.kept < 0} />} />
          <StatCard label={t('stat.savingsRate')} value={sum.income > 0 ? formatPct(sum.savingsRate) : '–'} sub={t('stat.goal', { pct: state.savingsGoalPct })}
            instrument={<PaceNeedle k={sum.income > 0 && goal > 0 ? (sum.savingsRate - goal) / goal : null} />} />
          <StatCard label={t('ins.expenses')} tone={spendDelta !== null && spendDelta > 0.02 ? 'bad' : 'neutral'} value={money(sum.expenses, true)}
            sub={spendDelta !== null ? `${spendDelta > 0 ? '+' : ''}${formatPct(spendDelta)} ${t('stat.vsLast')}` : undefined} />
          <StatCard label={t('stat.topCategory')} value={top ? money(top.amount, true) : '–'} sub={top ? `${top.category.icon} ${top.category.name}, ${formatPct(top.share)}` : t('ins.noExpenses')} />
        </div>
        <div className="contents lg:col-span-7 lg:flex lg:flex-col lg:gap-6">
          <Card className="order-1">
            <SectionTitle>{t('ins.whereToLook')}</SectionTitle>
            <ul className="-my-1 divide-y divide-hairline">
              {tips.map((tip) => {
                const s = severityStyle[tip.severity]
                return (
                  <li key={tip.id} className="flex items-start gap-3 py-3">
                    <span className={cx('flex size-8 shrink-0 items-center justify-center rounded-[10px]', s.tile)}><s.Icon size={17} /></span>
                    <div className="min-w-0">
                      <div className="font-medium leading-snug">{tip.title}</div>
                      <div className="mt-0.5 text-sm text-ink/80">{tip.detail}</div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card className="order-4">
            <SectionTitle sub={t('fc.sub')}>{t('fc.title')}</SectionTitle>
            {state.defaultSalary > 0 ? <ForecastList months={ahead} currency={state.currency} layout="columns" /> : <Empty>{t('fc.empty')}</Empty>}
          </Card>

          <Card className="order-5">
            <SectionTitle action={<Segmented value={range} onChange={setRange} options={[{ value: '6m', label: t('ins.sixMonths') }, { value: 'year', label: String(splitKey(monthKey).year) }]} />}>{t('ins.overTime')}</SectionTitle>
            {!hasHistory ? <Empty>{t('ins.fillIn')}</Empty> : range === '6m' ? (
              <>
                <TrendChart points={points} currency={state.currency} highlight={monthKey} />
                <table className="mt-4 w-full text-[13px]">
                  <thead className="text-muted"><tr><th className="pb-1 text-left font-normal">{t('ins.month')}</th><th className="pb-1 pl-3 text-right font-normal">{t('ins.income')}</th><th className="pb-1 pl-3 text-right font-normal">{t('ins.expenses')}</th><th className="pb-1 pl-3 text-right font-normal">{t('ins.kept')}</th></tr></thead>
                  <tbody className="tnum">
                    {points.map((p) => (
                      <tr key={p.key} className={cx('border-t border-hairline', p.key === monthKey && 'font-semibold')}>
                        <td className="py-1.5 capitalize">{formatMonth(p.key, 'short')}</td>
                        <td className="pl-3 text-right">{money(p.summary.income, true)}</td>
                        <td className="pl-3 text-right">{money(p.summary.expenses, true)}</td>
                        <td className={cx('pl-3 text-right', p.summary.kept < 0 && p.summary.income > 0 && 'text-ebb-600 dark:text-ebb-300')}>{p.summary.income > 0 ? <>{money(p.summary.kept, true)}<span className="max-sm:hidden"> ({formatPct(p.summary.savingsRate)})</span></> : '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <div><div className="text-[13px] text-muted">{t('ins.income')}</div><Money className="text-lg">{money(yearIncome, true)}</Money></div>
                  <div><div className="text-[13px] text-muted">{t('ins.expenses')}</div><Money className="text-lg">{money(yearExpenses, true)}</Money></div>
                  <div><div className="text-[13px] text-muted">{t('ins.kept')}</div><Money className={cx('text-lg', yearIncome - yearExpenses < 0 ? 'text-ebb-600 dark:text-ebb-300' : 'text-tide-700 dark:text-tide-300')}>{money(yearIncome - yearExpenses, true)}</Money></div>
                </div>
                <YearChart points={year} currency={state.currency} highlight={monthKey} />
                <p className="mt-3 text-[13px] text-muted">{t('ins.yearNote', { year: splitKey(monthKey).year })}{projected && t('ins.projected')}</p>
              </>
            )}
          </Card>

          <Card className="order-7">
            <SectionTitle>{t('ins.fixedByType')}</SectionTitle>
            {sum.fixed === 0 ? <Empty>{t('ins.noFixed')}</Empty> : (
              <ul className="space-y-3">
                {(Object.keys(kinds) as RecurringKind[]).filter((k) => kinds[k] > 0).map((k) => (
                  <li key={k}>
                    <div className="flex justify-between text-sm"><span>{kindLabel(k)}</span><span><Money>{money(kinds[k])}</Money> <span className="text-[12px] text-muted">{formatPct(kinds[k] / sum.fixed)}</span></span></div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunk"><div className="h-full origin-left rounded-full bg-deep-700 dark:bg-tide-400" style={{ transform: `scaleX(${Math.max(0.02, kinds[k] / sum.fixed)})` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="contents lg:col-span-5 lg:flex lg:flex-col lg:gap-6">
          {budgets.length > 0 && (
            <Card className="order-2">
              <SectionTitle sub={t('ins.budgetsSub')}>{t('ins.budgets')}</SectionTitle>
              <ul className="space-y-4">
                {budgets.map((b) => {
                  const over = b.share > 1
                  const near = !over && b.share > 0.8
                  return (
                    <li key={b.category.id}>
                      <div className="flex items-center gap-2.5 text-sm">
                        <CategoryDot icon={b.category.icon} color={b.category.color} size="sm" />
                        <span className="min-w-0 flex-1 truncate font-medium">{b.category.name}</span>
                        <span className={cx('shrink-0', over && 'text-ebb-600 dark:text-ebb-300')}><Money>{money(b.amount, true)}</Money> <span className="text-muted">{t('ins.of')} {money(b.budget!, true)}</span></span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunk">
                        <div className={cx('h-full origin-left rounded-full', over ? 'bg-ebb-500' : near ? 'bg-sand-400' : 'bg-tide-400')} style={{ transform: `scaleX(${Math.min(1, b.share)})` }} />
                      </div>
                      <div className="mt-1 text-[12px] text-muted">{over ? t('ins.over', { amount: money(b.amount - b.budget!, true) }) : t('ins.left', { amount: money(b.budget! - b.amount, true) })}</div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}

          <Card className="order-3">
            <SectionTitle sub={t('ins.byCategorySub')}>{t('ins.byCategory')}</SectionTitle>
            {cats.length === 0 ? <Empty>{t('ins.noExpenses')}</Empty> : (
              <>
                <CategoryDonut totals={cats} currency={state.currency} />
                <ul className="mt-4 divide-y divide-hairline text-sm">
                  {cats.map((c) => (
                    <li key={c.category.id} className="flex items-center gap-2.5 py-2.5">
                      <CategoryDot icon={c.category.icon} color={c.category.color} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{c.category.name}</div>
                        <div className="flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
                          <span className="whitespace-nowrap">{t('ins.ofSpending', { pct: formatPct(c.share) })}</span>
                          {c.deltaRatio !== null && Math.abs(c.delta) >= 1 && (
                            <span className={cx('flex items-center gap-0.5 font-medium', c.delta > 0 ? 'text-ebb-600 dark:text-ebb-300' : 'text-tide-700 dark:text-tide-300')}>
                              {c.delta > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{formatPct(Math.abs(c.deltaRatio))}
                            </span>
                          )}
                          {c.deltaRatio === null && c.before === 0 && <span>{t('ins.new')}</span>}
                        </div>
                      </div>
                      <Money className="shrink-0 text-right">{money(c.amount)}</Money>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          {state.pots.length > 0 && (
            <Card className="order-6">
              <SectionTitle sub={t('savings.yearAside', { amount: money(yearSetAside, true), year: splitKey(monthKey).year })}>{t('savings.title')}</SectionTitle>
              <div className="mb-4 flex flex-wrap items-baseline gap-x-2">
                <Money className="text-3xl tracking-[-0.02em]">{money(saved)}</Money>
                <span className="text-sm text-muted">{t('savings.total', { n: state.pots.length, unit: state.pots.length === 1 ? t('savings.pot1') : t('savings.potN') })}</span>
              </div>
              <ul className="space-y-3">
                {state.pots.map((p) => {
                  const b = potBalance(p)
                  return (
                    <li key={p.id}>
                      <div className="flex items-center gap-2.5 text-sm">
                        <CategoryDot icon={p.icon} color={p.color} size="sm" />
                        <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                        <span className="shrink-0"><Money>{money(b, true)}</Money>{p.target && <span className="text-[12px] text-muted"> {t('ins.of')} {money(p.target, true)}</span>}</span>
                      </div>
                      {p.target && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunk"><div className="h-full origin-left rounded-full" style={{ transform: `scaleX(${Math.min(1, Math.max(0, b / p.target))})`, background: p.color }} /></div>}
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </div>
      </MonthSwap>
    </div>
  )
}
