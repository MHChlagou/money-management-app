import { useState } from 'react'
import { Button, Card, CategoryDot, Empty, Input, Modal, Pill, SectionTitle } from '../components/ui'
import { RecurringForm } from '../components/RecurringForm'
import { setState, useAppState } from '../lib/store'
import { INTERVAL_LABELS, KIND_LABELS, type RecurringItem, type RecurringKind } from '../lib/types'
import { formatMoney } from '../lib/format'
import { currentMonthKey, formatMonth } from '../lib/months'
import { appliesToMonth, categoryById, monthlyEquivalent } from '../lib/calc'
import { showToast } from '../lib/toast'

const KIND_ORDER: RecurringKind[] = ['credit', 'bill', 'subscription', 'other']

export function RecurringPage() {
  const state = useAppState()
  const [editing, setEditing] = useState<RecurringItem | 'new' | null>(null)
  const [query, setQuery] = useState('')
  const money = (n: number) => formatMoney(n, state.currency)
  const now = currentMonthKey()

  const save = (item: RecurringItem) => {
    setState((s) => {
      const exists = s.recurring.some((r) => r.id === item.id)
      return { ...s, recurring: exists ? s.recurring.map((r) => (r.id === item.id ? item : r)) : [...s.recurring, item] }
    })
    setEditing(null)
  }
  const remove = (item: RecurringItem) => {
    setState((s) => ({ ...s, recurring: s.recurring.filter((r) => r.id !== item.id) }))
    setEditing(null)
    showToast(`Deleted "${item.name}"`, () => setState((s) => ({ ...s, recurring: [...s.recurring, item] })))
  }
  const toggle = (item: RecurringItem) =>
    setState((s) => ({ ...s, recurring: s.recurring.map((r) => (r.id === item.id ? { ...r, active: !r.active } : r)) }))

  const isLive = (r: RecurringItem) => r.active && r.startMonth <= now && (!r.endMonth || r.endMonth >= now)
  const live = state.recurring.filter(isLive)
  const monthlyEq = live.reduce((a, r) => a + monthlyEquivalent(r), 0)
  const q = query.trim().toLowerCase()
  const visible = q ? state.recurring.filter((r) => r.name.toLowerCase().includes(q) || categoryById(state, r.categoryId).name.toLowerCase().includes(q)) : state.recurring

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Recurring expenses</h1>
          <p className="text-sm text-slate-500">{live.length} active · ≈ {money(monthlyEq)} / month · {money(monthlyEq * 12)} / year</p>
        </div>
        <Button onClick={() => setEditing('new')}>+ New</Button>
      </div>

      {state.recurring.length > 5 && <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" type="search" />}

      {state.recurring.length === 0 && (
        <Empty>Add everything you pay regularly: rent, loans, phone, streaming, insurance. Set a day of month to see them on the calendar, and a billing frequency for yearly or quarterly charges.</Empty>
      )}

      {KIND_ORDER.map((kind) => {
        const items = visible.filter((r) => r.kind === kind).sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a))
        if (items.length === 0) return null
        return (
          <Card key={kind}>
            <SectionTitle>{KIND_LABELS[kind]}s · ≈ {money(items.filter(isLive).reduce((a, r) => a + monthlyEquivalent(r), 0))} / mo</SectionTitle>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((r) => {
                const c = categoryById(state, r.categoryId)
                const chargedNow = appliesToMonth(r, now)
                return (
                  <li key={r.id} className={`flex items-center gap-3 py-2.5 ${r.active ? '' : 'opacity-50'}`}>
                    <CategoryDot icon={c.icon} color={c.color} />
                    <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(r)}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{r.name}</span>
                        {!r.active && <Pill>paused</Pill>}
                        {r.active && !isLive(r) && <Pill tone="warn">{r.endMonth && r.endMonth < now ? 'ended' : 'starts ' + formatMonth(r.startMonth, 'short')}</Pill>}
                        {r.endMonth && isLive(r) && <Pill tone="brand">until {formatMonth(r.endMonth, 'short')}</Pill>}
                        {r.intervalMonths > 1 && <Pill tone={chargedNow ? 'warn' : 'neutral'}>{INTERVAL_LABELS[r.intervalMonths] ?? `every ${r.intervalMonths} mo`}{chargedNow ? ' · due now' : ''}</Pill>}
                      </div>
                      <div className="text-xs text-slate-500">{c.name}{r.dayOfMonth ? ` · day ${r.dayOfMonth}` : ''}{r.note ? ` · ${r.note}` : ''}</div>
                    </button>
                    <div className="text-right">
                      <div className="tabular-nums font-medium">{money(r.amount)}</div>
                      {r.intervalMonths > 1 && <div className="text-[11px] text-slate-500">≈ {money(monthlyEquivalent(r))}/mo</div>}
                    </div>
                    <button onClick={() => toggle(r)} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={r.active ? `Pause ${r.name}` : `Resume ${r.name}`}>
                      {r.active ? 'Pause' : 'Resume'}
                    </button>
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
              <div className="mt-4 border-t border-slate-100 pt-3 text-right dark:border-slate-800">
                <Button variant="danger" onClick={() => remove(editing)}>Delete</Button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
