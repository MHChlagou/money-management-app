import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, Card, CategoryDot, cx, Modal, Money, Pill, Row } from '../components/ui'
import { MonthNav } from '../components/MonthNav'
import { OneOffForm } from '../components/OneOffForm'
import { useAppState } from '../lib/store'
import { appliesToMonth, categoryById, entriesByDay, summarize } from '../lib/calc'
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
  const noDay = state.recurring.filter((r) => !r.dayOfMonth && appliesToMonth(r, monthKey))
  const selectedEntries = selected ? (byDay.get(selected) ?? []) : []

  return (
    <div className="space-y-3">
      <Card className="py-3"><MonthNav value={monthKey} onChange={onMonthChange} /></Card>

      {isCurrent && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <div className="text-xs text-slate-500">Gone out so far</div>
            <Money className="text-xl">{money(paidSoFar, false)}</Money>
          </Card>
          <Card>
            <div className="text-xs text-slate-500">Still to pay</div>
            <Money className="text-xl text-coral-600 dark:text-coral-400">{money(Math.max(0, sum.expenses - paidSoFar), false)}</Money>
          </Card>
        </div>
      )}

      <Card className="p-2 sm:p-4">
        <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-slate-400">
          {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }, (_, i) => <div key={`pad-${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const d = i + 1
            const entries = byDay.get(d) ?? []
            const total = dayTotal(d)
            const intensity = total > 0 ? 0.18 + 0.62 * (total / maxDay) : 0
            const isToday = d === today
            const past = isCurrent && d < today
            const dark = intensity > 0.5
            return (
              <button key={d} onClick={() => setSelected(d)} aria-label={`Day ${d}${total ? `, ${money(total)}` : ''}`}
                className={cx('relative flex aspect-square flex-col items-center justify-start rounded-xl p-0.5 text-xs transition hover:ring-2 hover:ring-ink-500', isToday && 'ring-2 ring-ink-600 dark:ring-mint-400', past && !total && 'opacity-40')}
                style={total > 0 ? { background: `rgba(75,72,201,${intensity})` } : undefined}>
                <span className={cx('font-display font-semibold', dark && 'text-white')}>{d}</span>
                {total > 0 && <span className={cx('tnum mt-auto w-full truncate text-[10px] leading-tight', dark ? 'text-white' : 'text-ink-900 dark:text-white')}>{money(total)}</span>}
                {entries.length > 1 && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-coral-400" aria-hidden />}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">Tap a day for details or to add an expense. Darker means more money leaving.</p>
      </Card>

      {noDay.length > 0 && (
        <Card>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <b>{noDay.map((r) => r.name).join(', ')}</b> {noDay.length === 1 ? 'has' : 'have'} no payment day, so {noDay.length === 1 ? 'it shows' : 'they show'} on the 1st. Set the day under Recurring for an accurate calendar.
          </p>
        </Card>
      )}

      <Modal open={selected !== null} title={selected ? formatDay(`${monthKey}-${pad2(selected)}`) : ''} onClose={() => { setSelected(null); setAdding(false) }}>
        {selected && !adding && (
          <div className="space-y-3">
            {selectedEntries.length === 0 ? <p className="text-sm text-slate-500">Nothing scheduled this day.</p> : (
              <ul className="divide-y divide-line dark:divide-line-dark">
                {selectedEntries.map((e) => {
                  const c = categoryById(state, e.categoryId)
                  return <Row key={e.id} icon={<CategoryDot icon={c.icon} color={c.color} size="sm" />} title={<>{e.name}<Pill tone={e.source === 'recurring' ? 'brand' : 'neutral'}>{e.source}</Pill></>} subtitle={c.name} trailing={<Money>{money(e.amount, false)}</Money>} />
                })}
              </ul>
            )}
            {selectedEntries.length > 1 && <div className="text-right text-sm">Total <Money>{money(dayTotal(selected), false)}</Money></div>}
            <Button className="w-full" onClick={() => setAdding(true)}><Plus size={16} /> Add expense on this day</Button>
          </div>
        )}
        {selected && adding && (
          <OneOffForm monthKey={monthKey} day={selected} onSave={(e) => { updateMonth(monthKey, (m) => ({ ...m, oneOffs: [...m.oneOffs, e] })); setAdding(false) }} onCancel={() => setAdding(false)} />
        )}
      </Modal>
    </div>
  )
}
