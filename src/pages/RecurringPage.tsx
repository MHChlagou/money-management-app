import { useState } from 'react'
import { Pause, Play, Plus, Search } from 'lucide-react'
import { Button, Card, CategoryDot, cx, Empty, Input, Modal, Money, Pill, SectionTitle } from '../components/ui'
import { RecurringForm } from '../components/RecurringForm'
import { setState, useAppState } from '../lib/store'
import { INTERVAL_LABELS, KIND_LABELS, type RecurringItem, type RecurringKind } from '../lib/types'
import { formatMoney } from '../lib/format'
import { currentMonthKey, formatMonth } from '../lib/months'
import { appliesToMonth, categoryById, creditProgress, monthlyEquivalent, nextCharge } from '../lib/calc'
import { showToast } from '../lib/toast'

const KIND_ORDER: RecurringKind[] = ['credit', 'bill', 'subscription', 'other']

export function RecurringPage() {
  const state = useAppState()
  const [editing, setEditing] = useState<RecurringItem | 'new' | null>(null)
  const [query, setQuery] = useState('')
  const money = (n: number, compact = false) => formatMoney(n, state.currency, { compact })
  const now = currentMonthKey()

  const save = (item: RecurringItem) => {
    setState((s) => {
      const exists = s.recurring.some((r) => r.id === item.id)
      return { ...s, recurring: exists ? s.recurring.map((r) => (r.id === item.id ? item : r)) : [...s.recurring, item] }
    })
    setEditing(null)
    showToast(item.id && state.recurring.some((r) => r.id === item.id) ? `Saved ${item.name}` : `Added ${item.name}`)
  }
  const remove = (item: RecurringItem) => {
    setState((s) => ({ ...s, recurring: s.recurring.filter((r) => r.id !== item.id) }))
    setEditing(null)
    showToast(`Deleted ${item.name}`, () => setState((s) => ({ ...s, recurring: [...s.recurring, item] })))
  }
  const toggle = (item: RecurringItem) =>
    setState((s) => ({ ...s, recurring: s.recurring.map((r) => (r.id === item.id ? { ...r, active: !r.active } : r)) }))

  const isLive = (r: RecurringItem) => r.active && r.startMonth <= now && (!r.endMonth || r.endMonth >= now)
  const live = state.recurring.filter(isLive)
  const monthlyEq = live.reduce((a, r) => a + monthlyEquivalent(r), 0)
  const q = query.trim().toLowerCase()
  const visible = q ? state.recurring.filter((r) => r.name.toLowerCase().includes(q) || categoryById(state, r.categoryId).name.toLowerCase().includes(q)) : state.recurring

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h1 className="font-display text-2xl font-bold">Recurring</h1>
          <p className="text-sm text-slate-500">{live.length} active, about <Money>{money(monthlyEq, true)}</Money> a month, <Money>{money(monthlyEq * 12, true)}</Money> a year</p>
        </div>
        <Button onClick={() => setEditing('new')}><Plus size={16} /> New</Button>
      </div>

      {state.recurring.length > 5 && (
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or category" type="search" className="pl-9" />
        </div>
      )}

      {state.recurring.length === 0 && (
        <Empty action={<Button onClick={() => setEditing('new')}><Plus size={16} /> Add the first one</Button>}>
          Add everything you pay regularly: rent, loans, phone, streaming, insurance. Give each a payment day to see it on the calendar.
        </Empty>
      )}

      {KIND_ORDER.map((kind) => {
        const items = visible.filter((r) => r.kind === kind).sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a))
        if (items.length === 0) return null
        return (
          <Card key={kind}>
            <SectionTitle sub={`about ${money(items.filter(isLive).reduce((a, r) => a + monthlyEquivalent(r), 0), true)} a month`}>{KIND_LABELS[kind]}s</SectionTitle>
            <ul className="divide-y divide-line dark:divide-line-dark">
              {items.map((r) => {
                const c = categoryById(state, r.categoryId)
                const chargedNow = appliesToMonth(r, now)
                const next = r.intervalMonths > 1 ? nextCharge(r, now) : null
                const credit = kind === 'credit' ? creditProgress(r, now) : null
                return (
                  <li key={r.id} className={cx('py-2.5', !r.active && 'opacity-50')}>
                    <div className="flex items-center gap-3">
                      <CategoryDot icon={c.icon} color={c.color} />
                      <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(r)}>
                        <div className="flex flex-wrap items-center gap-1.5 font-medium leading-tight">
                          {r.name}
                          {!r.active && <Pill>paused</Pill>}
                          {r.active && !isLive(r) && <Pill tone="warn">{r.endMonth && r.endMonth < now ? 'ended' : `starts ${formatMonth(r.startMonth, 'short')}`}</Pill>}
                          {r.endMonth && isLive(r) && !credit && <Pill tone="brand">until {formatMonth(r.endMonth, 'short')}</Pill>}
                          {r.intervalMonths > 1 && <Pill tone={chargedNow ? 'warn' : 'neutral'}>{INTERVAL_LABELS[r.intervalMonths] ?? `every ${r.intervalMonths} months`}</Pill>}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {c.name}{r.dayOfMonth ? `, day ${r.dayOfMonth}` : ''}{next && next !== now ? `, next ${formatMonth(next, 'short')}` : chargedNow && r.intervalMonths > 1 ? ', charged this month' : ''}{r.note ? `. ${r.note}` : ''}
                        </div>
                      </button>
                      <div className="text-right">
                        <Money>{money(r.amount)}</Money>
                        {r.intervalMonths > 1 && <div className="whitespace-nowrap text-[11px] text-slate-500">{money(monthlyEquivalent(r), true)}/month</div>}
                      </div>
                      <button onClick={() => toggle(r)} className="inline-flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-900/5 dark:hover:bg-white/10" aria-label={r.active ? `Pause ${r.name}` : `Resume ${r.name}`} title={r.active ? 'Pause' : 'Resume'}>
                        {r.active ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                    </div>
                    {credit && (
                      <div className="ml-13 mt-2">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>{credit.done} of {credit.total} payments made</span>
                          <span>{credit.left === 0 ? 'Paid off' : <>{money(credit.remaining, true)} left, ends {formatMonth(r.endMonth!, 'short')}</>}</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-900/5 dark:bg-white/10"><div className="h-full rounded-full bg-mint-400" style={{ width: `${credit.ratio * 100}%` }} /></div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        )
      })}

      <Modal open={editing !== null} title={editing === 'new' ? 'New recurring expense' : 'Edit recurring expense'} onClose={() => setEditing(null)}>
        {editing && (
          <>
            <RecurringForm initial={editing === 'new' ? undefined : editing} onSave={save} onCancel={() => setEditing(null)} />
            {editing !== 'new' && (
              <div className="mt-4 border-t border-line pt-3 text-right dark:border-line-dark">
                <Button variant="danger" onClick={() => remove(editing)}>Delete</Button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
