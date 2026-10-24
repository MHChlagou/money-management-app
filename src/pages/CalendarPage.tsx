import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, Card, CategoryDot, cx, Modal, Money, PageHeader, Pill, Row, SectionTitle } from '../components/ui'
import { MonthNav } from '../components/MonthNav'
import { MonthSwap } from '../components/MonthSwap'
import { useAppState } from '../lib/store'
import { appliesToMonth, categoryById, entriesByDay, summarize, type DayEntry } from '../lib/calc'
import { formatMoney, formatMoneyFit, formatPct } from '../lib/format'
import { ReserveGauge, StatCard } from '../components/StatCard'
import { currentMonthKey, daysInMonth, firstWeekday, formatDay, pad2, weekdayNames } from '../lib/months'
import { openExpenseSheet } from '../lib/ui'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useMonthDirection } from '../lib/useMonthDirection'
import { useT } from '../lib/i18n'

/** Month grid showing what leaves the account on each day. Darker berry means more money out. */
export function CalendarPage({ monthKey, onMonthChange }: { monthKey: string; onMonthChange: (k: string) => void }) {
  const state = useAppState()
  const t = useT()
  const money = (n: number, compact = true) => formatMoney(n, state.currency, { compact })
  const byDay = entriesByDay(state, monthKey)
  const days = daysInMonth(monthKey)
  const offset = firstWeekday(monthKey)
  const isCurrent = monthKey === currentMonthKey()
  const [today] = useState(() => new Date().getDate())
  const todayDay = isCurrent ? today : 0
  const isWide = useMediaQuery('(min-width: 1024px)')
  const [picked, setPicked] = useState<{ monthKey: string; day: number } | null>(null)
  const { dir, moved } = useMonthDirection(monthKey)
  const sum = summarize(state, monthKey)

  const dayTotal = (d: number) => (byDay.get(d) ?? []).reduce((a, e) => a + e.amount, 0)
  const maxDay = Math.max(1, ...[...byDay.keys()].map(dayTotal))
  const paidSoFar = isCurrent ? [...byDay.entries()].filter(([d]) => d <= todayDay).reduce((a, [, es]) => a + es.reduce((x, e) => x + e.amount, 0), 0) : 0
  const noDay = state.recurring.filter((r) => !r.dayOfMonth && appliesToMonth(r, monthKey))
  // On desktop the side panel always shows a day: the one picked, else today, else the busiest one.
  const busiest = [...byDay.keys()].sort((a, b) => dayTotal(b) - dayTotal(a))[0] ?? 1
  // Next day with something going out: after today in this month, the first such day in a future one.
  const nextDay = [...byDay.keys()].sort((a, b) => a - b).find((d) => (isCurrent ? d > todayDay : monthKey > currentMonthKey()))
  const selected = picked?.monthKey === monthKey ? picked.day : isWide ? (todayDay || busiest) : null

  return (
    <div>
      <PageHeader title={t('nav.calendar')}>
        <MonthNav value={monthKey} onChange={onMonthChange} />
      </PageHeader>

      <MonthSwap key={monthKey} dir={dir} animateIn={moved} className="grid gap-4 lg:grid-cols-12 lg:items-start lg:gap-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-12 lg:grid-cols-4">
            <StatCard label={isCurrent ? t('cal.goneOut') : t('ins.expenses')} value={money(isCurrent ? paidSoFar : sum.expenses)}
              sub={isCurrent && sum.expenses > 0 ? formatPct(paidSoFar / sum.expenses) : undefined}
              instrument={isCurrent ? <ReserveGauge fraction={sum.expenses > 0 ? paidSoFar / sum.expenses : 0} /> : undefined} />
            <StatCard label={t('cal.stillToPay')} tone={isCurrent && sum.expenses > paidSoFar ? 'bad' : 'neutral'}
              value={isCurrent ? money(Math.max(0, sum.expenses - paidSoFar)) : '–'} sub={isCurrent ? t('stat.daysLeft', { n: days - todayDay + 1 }) : undefined} />
            <StatCard label={t('stat.biggestDay')} value={byDay.size ? money(dayTotal(busiest)) : '–'} sub={byDay.size ? formatDay(`${monthKey}-${pad2(busiest)}`) : undefined} />
            <StatCard label={t('stat.nextCharge')} value={nextDay ? money(dayTotal(nextDay)) : '–'}
              sub={nextDay ? `${(byDay.get(nextDay) ?? []).map((e) => e.name).join(', ')}, ${formatDay(`${monthKey}-${pad2(nextDay)}`)}` : t('stat.none')} />
          </div>
        <div className="space-y-4 lg:col-span-8">

          <Card className="p-2.5 sm:p-5">
            <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-medium capitalize text-muted sm:text-xs">
              {weekdayNames().map((w) => <div key={w}>{w}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5 min-[360px]:gap-1 sm:gap-1.5">
              {Array.from({ length: offset }, (_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: days }, (_, i) => {
                const d = i + 1
                const entries = byDay.get(d) ?? []
                const total = dayTotal(d)
                // Capped so text keeps its contrast on the busiest day.
                const heat = total > 0 ? Math.round(14 + 34 * (total / maxDay)) : 0
                const past = isCurrent && d < todayDay
                return (
                  <button key={d} onClick={() => setPicked({ monthKey, day: d })} aria-pressed={selected === d}
                    aria-label={`${formatDay(`${monthKey}-${pad2(d)}`)}${total ? `, ${money(total)}` : ''}`}
                    className={cx('relative flex min-h-11 flex-col items-center justify-start rounded-xl p-1 text-xs sm:aspect-square sm:min-h-0 transition-[transform,box-shadow] duration-150 ease-ui active:scale-[0.95] sm:rounded-2xl sm:p-1.5',
                      selected === d ? 'ring-2 ring-deep-900 dark:ring-tide-300' : 'hover:ring-1 hover:ring-hairline', past && !total && 'text-muted', !total && 'bg-sunk/50')}
                    style={total > 0 ? { background: `color-mix(in srgb, var(--color-ebb-400) ${heat}%, var(--surface))` } : undefined}>
                    <span className={cx('flex size-6 items-center justify-center rounded-full font-display font-semibold sm:size-7 sm:text-sm', d === todayDay && 'bg-accent text-on-accent')}>{d}</span>
                    {total > 0 && <span className="tnum mt-auto w-full truncate text-center text-[10px] font-medium leading-tight max-[359px]:hidden sm:text-xs">{money(total)}</span>}
                    {entries.length > 1 && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-ebb-600 dark:bg-ebb-300 sm:right-1.5 sm:top-1.5" aria-hidden />}
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-center text-xs text-muted">{t('cal.hint')}</p>
          </Card>

          {noDay.length > 0 && (
            <p className="rounded-2xl bg-sand-100 px-4 py-3 text-sm text-sand-700 dark:bg-sand-400/10 dark:text-sand-300">
              {t('cal.noDay', { names: noDay.map((r) => r.name).join(', '), verb: noDay.length === 1 ? t('cal.has') : t('cal.have'), shows: noDay.length === 1 ? t('cal.itShows') : t('cal.theyShow') })}
            </p>
          )}
        </div>

        {isWide && selected !== null && (
          <Card className="lg:sticky lg:top-8 lg:col-span-4">
            <SectionTitle>{formatDay(`${monthKey}-${pad2(selected)}`)}</SectionTitle>
            <DayDetails entries={byDay.get(selected) ?? []} total={dayTotal(selected)} currency={state.currency} onAdd={() => openExpenseSheet({ monthKey, day: selected })} />
          </Card>
        )}
      </MonthSwap>

      {!isWide && (
        <Modal open={selected !== null} title={selected ? formatDay(`${monthKey}-${pad2(selected)}`) : ''} onClose={() => setPicked(null)}>
          {selected !== null && <DayDetails entries={byDay.get(selected) ?? []} total={dayTotal(selected)} currency={state.currency} onAdd={() => { setPicked(null); openExpenseSheet({ monthKey, day: selected }) }} />}
        </Modal>
      )}
    </div>
  )
}

function DayDetails({ entries, total, currency, onAdd }: { entries: DayEntry[]; total: number; currency: string; onAdd: () => void }) {
  const state = useAppState()
  const t = useT()
  return (
    <div className="space-y-4">
      {entries.length === 0 ? <p className="text-sm text-muted">{t('cal.nothing')}</p> : (
        <ul className="-my-1 divide-y divide-hairline">
          {entries.map((e) => {
            const c = categoryById(state, e.categoryId)
            return <Row key={e.id} icon={<CategoryDot icon={c.icon} color={c.color} size="sm" />} title={e.name} badges={<Pill tone={e.source === 'recurring' ? 'brand' : 'neutral'}>{e.source === 'recurring' ? t('src.recurring') : t('src.oneoff')}</Pill>} subtitle={c.name} trailing={<Money>{formatMoneyFit(e.amount, currency)}</Money>} />
          })}
        </ul>
      )}
      {entries.length > 1 && <div className="flex justify-between border-t border-hairline pt-3 text-sm"><span className="text-muted">{t('cal.total')}</span><Money>{formatMoney(total, currency)}</Money></div>}
      <Button variant="secondary" className="w-full" onClick={onAdd}><Plus size={16} /> {t('cal.addOnDay')}</Button>
    </div>
  )
}
