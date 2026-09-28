import { useState } from 'react'
import { Button, Card, CategoryDot, cx, Modal, Pill } from '../components/ui'
import { MonthNav } from '../components/MonthNav'
import { OneOffForm } from '../components/OneOffForm'
import { useAppState } from '../lib/store'
import { categoryById, entriesByDay, summarize } from '../lib/calc'
import { formatMoney } from '../lib/format'
import { currentMonthKey, daysInMonth, firstWeekday, formatDay, pad2 } from '../lib/months'
import { updateMonth } from './MonthPage'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/** Month grid showing what leaves the account on each day. */
export function CalendarPage({ monthKey, onMonthChange }: { monthKey: string; onMonthChange: (k: string) => void }) {
  const state = useAppState()
  const money = (n: number, compact = true) => formatMoney(n, state.currency, { compact })
  const byDay = entriesByDay(state, monthKey)
  const days = daysInMonth(monthKey)
  const offset = firstWeekday(monthKey)
  const isCurrent = monthKey === currentMonthKey()
  const today = isCurrent ? new Date().getDate() : 0
  const [selected, setSelected] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const sum = summarize(state, monthKey)

  const dayTotal = (d: number) => (byDay.get(d) ?? []).reduce((a, e) => a + e.amount, 0)
  const maxDay = Math.max(1, ...[...byDay.keys()].map(dayTotal))
  const paidSoFar = isCurrent ? [...byDay.entries()].filter(([d]) => d <= today).reduce((a, [, es]) => a + es.reduce((x, e) => x + e.amount, 0), 0) : 0

  const selectedEntries = selected ? (byDay.get(selected) ?? []) : []

  return (
    <div className="space-y-4">
      <MonthNav value={monthKey} onChange={onMonthChange} />

      {isCurrent && (
        <Card>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Gone out so far</div>
              <div className="text-lg font-semibold tabular-nums">{money(paidSoFar, false)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Still to pay</div>
              <div className="text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-400">{money(Math.max(0, sum.expenses - paidSoFar), false)}</div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-2 sm:p-4">
        <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium uppercase text-slate-400">
          {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }, (_, i) => <div key={`pad-${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const d = i + 1
            const entries = byDay.get(d) ?? []
            const total = dayTotal(d)
            const intensity = total > 0 ? 0.15 + 0.55 * (total / maxDay) : 0
            const isToday = d === today
            const past = isCurrent && d < today
            return (
              <button key={d} onClick={() => setSelected(d)} aria-label={`Day ${d}${total ? `, ${money(total)}` : ''}`}
                className={cx('relative flex aspect-square flex-col items-center justify-start rounded-lg p-0.5 text-xs transition hover:ring-2 hover:ring-brand-500', isToday && 'ring-2 ring-brand-700', past && !total && 'opacity-50')}
                style={total > 0 ? { background: `rgba(15,118,110,${intensity})` } : undefined}>
                <span className={cx('font-medium', total > 0 && intensity > 0.45 ? 'text-white' : '')}>{d}</span>
                {total > 0 && <span className={cx('mt-auto w-full truncate text-[10px] leading-tight', intensity > 0.45 ? 'text-white' : 'text-slate-700 dark:text-slate-200')}>{money(total)}</span>}
                {entries.length > 1 && <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-amber-500" aria-hidden />}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">Tap a day to see details or add an expense. Darker = more money leaving that day.</p>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Payments without a day</h2>
        {state.recurring.some((r) => r.active && !r.dayOfMonth) ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {state.recurring.filter((r) => r.active && !r.dayOfMonth).map((r) => r.name).join(', ')} are shown on day 1. Set their "day of month" under Recurring for an accurate calendar.
          </p>
        ) : <p className="text-sm text-slate-500">All recurring payments have a day. 👍</p>}
      </Card>

      <Modal open={selected !== null} title={selected ? formatDay(`${monthKey}-${pad2(selected)}`) : ''} onClose={() => { setSelected(null); setAdding(false) }}>
        {selected && !adding && (
          <div className="space-y-3">
            {selectedEntries.length === 0 ? <p className="text-sm text-slate-500">Nothing scheduled this day.</p> : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedEntries.map((e) => {
                  const c = categoryById(state, e.categoryId)
                  return (
                    <li key={e.id} className="flex items-center gap-3 py-2">
                      <CategoryDot icon={c.icon} color={c.color} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{e.name}</div>
                        <div className="text-xs text-slate-500">{c.name}</div>
                      </div>
                      <Pill tone={e.source === 'recurring' ? 'brand' : 'neutral'}>{e.source === 'recurring' ? 'recurring' : 'one-off'}</Pill>
                      <span className="tabular-nums font-medium">{money(e.amount, false)}</span>
                    </li>
                  )
                })}
              </ul>
            )}
            {selectedEntries.length > 1 && <div className="text-right text-sm font-semibold">Total {money(dayTotal(selected), false)}</div>}
            <Button className="w-full" onClick={() => setAdding(true)}>+ Add expense on this day</Button>
          </div>
        )}
        {selected && adding && (
          <OneOffForm monthKey={monthKey} day={selected} onSave={(e) => { updateMonth(monthKey, (m) => ({ ...m, oneOffs: [...m.oneOffs, e] })); setAdding(false) }} onCancel={() => setAdding(false)} />
        )}
      </Modal>
    </div>
  )
}
