import { useState } from 'react'
import { Pause, Play, Plus, Search } from 'lucide-react'
import { Button, Card, CategoryDot, cx, Empty, Input, Modal, Money, PageHeader, Pill, SectionTitle } from '../components/ui'
import { RecurringForm } from '../components/RecurringForm'
import { setState, useAppState } from '../lib/store'
import { type RecurringItem, type RecurringKind } from '../lib/types'
import { formatMoney, formatMoneyFit, formatPct } from '../lib/format'
import { StatCard } from '../components/StatCard'
import { currentMonthKey, formatDay, formatMonth, pad2, shiftMonth } from '../lib/months'
import { appliesToMonth, categoryById, creditProgress, monthlyEquivalent, nextCharge, upcomingPayments } from '../lib/calc'
import { showToast } from '../lib/toast'
import { requestRecurringEdit, useUi } from '../lib/ui'
import { intervalLabel, kindLabel, useT } from '../lib/i18n'

const KIND_ORDER: RecurringKind[] = ['credit', 'bill', 'subscription', 'other']

export function RecurringPage() {
  const state = useAppState()
  const t = useT()
  const { editRecurringId } = useUi()
  const [localEditing, setLocalEditing] = useState<RecurringItem | 'new' | null>(null)
  const [query, setQuery] = useState('')
  const money = (n: number, compact = false) => formatMoney(n, state.currency, { compact })
  const fit = (n: number) => formatMoneyFit(n, state.currency)
  const now = currentMonthKey()

  // Search in the command bar can ask for one item to open here; that request wins until the sheet closes.
  const requested = editRecurringId ? state.recurring.find((r) => r.id === editRecurringId) ?? null : null
  const editing = requested ?? localEditing
  const setEditing = (value: RecurringItem | 'new' | null) => {
    if (editRecurringId) requestRecurringEdit(null)
    setLocalEditing(value)
  }

  const save = (item: RecurringItem) => {
    const existed = state.recurring.some((r) => r.id === item.id)
    setState((s) => ({ ...s, recurring: existed ? s.recurring.map((r) => (r.id === item.id ? item : r)) : [...s.recurring, item] }))
    setEditing(null)
    showToast(existed ? t('toast.saved', { name: item.name }) : t('toast.added', { name: item.name }))
  }
  const remove = (item: RecurringItem) => {
    setState((s) => ({ ...s, recurring: s.recurring.filter((r) => r.id !== item.id) }))
    setEditing(null)
    showToast(t('toast.deleted', { name: item.name }), () => setState((s) => ({ ...s, recurring: [...s.recurring, item] })))
  }
  const toggle = (item: RecurringItem) =>
    setState((s) => ({ ...s, recurring: s.recurring.map((r) => (r.id === item.id ? { ...r, active: !r.active } : r)) }))

  const isLive = (r: RecurringItem) => r.active && r.startMonth <= now && (!r.endMonth || r.endMonth >= now)
  const live = state.recurring.filter(isLive)
  const monthlyEq = live.reduce((a, r) => a + monthlyEquivalent(r), 0)
  const q = query.trim().toLowerCase()
  const visible = q ? state.recurring.filter((r) => r.name.toLowerCase().includes(q) || categoryById(state, r.categoryId).name.toLowerCase().includes(q)) : state.recurring
  const subsEq = live.filter((r) => r.kind === 'subscription').reduce((a, r) => a + monthlyEquivalent(r), 0)
  const endingSoon = live.filter((r) => r.endMonth && r.endMonth <= shiftMonth(now, 3)).length
  const next = upcomingPayments(state, 31)[0]

  return (
    <div>
      <PageHeader title={t('rec.heading')} sub={state.recurring.length > 0 ? t('rec.summary', { n: live.length, month: money(monthlyEq, true), year: money(monthlyEq * 12, true) }) : undefined}>
        <Button onClick={() => setEditing('new')}><Plus size={16} /> {t('common.new')}</Button>
      </PageHeader>

      {state.recurring.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:mb-6 xl:grid-cols-4">
          <StatCard label={t('stat.perMonth')} value={money(monthlyEq, true)} sub={monthlyEq > 0 ? t('stat.subsShare', { pct: formatPct(subsEq / monthlyEq) }) : undefined} />
          <StatCard label={t('stat.perYear')} value={money(monthlyEq * 12, true)} />
          <StatCard label={t('stat.active')} value={String(live.length)} sub={endingSoon > 0 ? t('stat.endingSoon', { n: endingSoon }) : undefined} />
          <StatCard label={t('stat.nextCharge')} value={next ? money(next.amount, true) : '–'} sub={next ? `${next.name}, ${formatDay(`${next.monthKey}-${pad2(next.day)}`)}` : t('stat.none')} />
        </div>
      )}

      {state.recurring.length > 5 && (
        <div className="relative mb-4 max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('rec.search')} type="search" className="rounded-full pl-10" />
        </div>
      )}

      {state.recurring.length === 0 && (
        <Empty action={<Button onClick={() => setEditing('new')}><Plus size={16} /> {t('rec.addFirst')}</Button>}>{t('rec.empty')}</Empty>
      )}

      <div className="gap-6 lg:columns-2">
        {KIND_ORDER.map((kind) => {
          const items = visible.filter((r) => r.kind === kind).sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a))
          if (items.length === 0) return null
          return (
            <Card key={kind} className="mb-4 break-inside-avoid lg:mb-6">
              <SectionTitle sub={t('common.aboutPerMonth', { amount: money(items.filter(isLive).reduce((a, r) => a + monthlyEquivalent(r), 0), true) })}>{kindLabel(kind, true)}</SectionTitle>
              <ul className="-my-1 divide-y divide-hairline">
                {items.map((r) => {
                  const c = categoryById(state, r.categoryId)
                  const chargedNow = appliesToMonth(r, now)
                  const next = r.intervalMonths > 1 ? nextCharge(r, now) : null
                  const credit = kind === 'credit' ? creditProgress(r, now) : null
                  return (
                    <li key={r.id} className={cx('py-3', !r.active && 'opacity-55')}>
                      <div className="flex items-center gap-3">
                        <button className="-mx-2 flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 text-left transition-colors duration-150 hover:bg-sunk/60" onClick={() => setEditing(r)}>
                          <CategoryDot icon={c.icon} color={c.color} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 font-medium leading-tight">
                              <span className="line-clamp-2 break-words">{r.name}</span>
                              {!r.active && <Pill>{t('pill.paused')}</Pill>}
                              {r.active && !isLive(r) && <Pill tone="warn">{r.endMonth && r.endMonth < now ? t('pill.ended') : t('pill.starts', { month: formatMonth(r.startMonth, 'short') })}</Pill>}
                              {r.endMonth && isLive(r) && !credit && <Pill tone="brand">{t('pill.until', { month: formatMonth(r.endMonth, 'short') })}</Pill>}
                              {r.intervalMonths > 1 && <Pill tone={chargedNow ? 'warn' : 'neutral'}>{intervalLabel(r.intervalMonths)}</Pill>}
                            </div>
                            <div className="mt-0.5 line-clamp-2 text-[13px] text-muted">
                              {c.name}{r.dayOfMonth ? <>, <span className="whitespace-nowrap">{t('recurring.day', { n: r.dayOfMonth })}</span></> : null}{next && next !== now ? `, ${t('recurring.next', { month: formatMonth(next, 'short') })}` : chargedNow && r.intervalMonths > 1 ? `, ${t('recurring.chargedNow')}` : ''}{r.note ? `. ${r.note}` : ''}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <Money>{fit(r.amount)}</Money>
                            {r.intervalMonths > 1 && <div className="whitespace-nowrap text-[11px] text-muted">{t('common.perMonth', { amount: money(monthlyEquivalent(r), true) })}</div>}
                          </div>
                        </button>
                        <button onClick={() => toggle(r)} className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-[transform,background-color] duration-150 ease-ui after:absolute after:-inset-1 after:content-[''] hover:bg-sunk hover:text-ink active:scale-[0.92] max-[359px]:hidden" aria-label={r.active ? t('rec.pauseA', { name: r.name }) : t('rec.resumeA', { name: r.name })} title={r.active ? t('rec.pause') : t('rec.resume')}>
                          {r.active ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                      </div>
                      {credit && (
                        <div className="ml-13 mt-2.5 mr-12">
                          <div className="flex flex-wrap justify-between gap-x-3 text-[12px] text-muted">
                            <span>{t('rec.payments', { done: credit.done, total: credit.total })}{chargedNow && credit.done > 0 ? t('rec.inclThisMonth') : ''}</span>
                            <span>{credit.left === 0 ? (chargedNow ? t('rec.lastPayment') : t('rec.paidOff')) : t('rec.toGo', { amount: money(credit.remaining, true), month: formatMonth(r.endMonth!, 'short') })}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunk"><div className="h-full origin-left rounded-full bg-tide-400" style={{ transform: `scaleX(${credit.ratio})` }} /></div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Card>
          )
        })}
      </div>

      <Modal open={editing !== null} title={editing === 'new' ? t('rec.newTitle') : t('rec.editTitle')} onClose={() => setEditing(null)}>
        {editing && (
          <>
            <RecurringForm initial={editing === 'new' ? undefined : editing} onSave={save} onCancel={() => setEditing(null)} />
            {editing !== 'new' && (
              <div className="mt-5 flex items-center justify-between border-t border-hairline pt-4">
                <Button variant="secondary" onClick={() => { toggle(editing); setEditing(null) }}>{editing.active ? <Pause size={16} /> : <Play size={16} />} {editing.active ? t('rec.pause') : t('rec.resume')}</Button>
                <Button variant="danger" onClick={() => remove(editing)}>{t('common.delete')}</Button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
