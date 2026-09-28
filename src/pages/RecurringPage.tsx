import { useState } from 'react'
import { Pause, Play, Plus, Search } from 'lucide-react'
import { Button, Card, CategoryDot, cx, Empty, Input, Modal, Money, Pill, SectionTitle } from '../components/ui'
import { RecurringForm } from '../components/RecurringForm'
import { setState, useAppState } from '../lib/store'
import { type RecurringItem, type RecurringKind } from '../lib/types'
import { formatMoney, formatMoneyFit } from '../lib/format'
import { currentMonthKey, formatMonth } from '../lib/months'
import { appliesToMonth, categoryById, creditProgress, monthlyEquivalent, nextCharge } from '../lib/calc'
import { showToast } from '../lib/toast'
import { intervalLabel, kindLabel, useT } from '../lib/i18n'

const KIND_ORDER: RecurringKind[] = ['credit', 'bill', 'subscription', 'other']

export function RecurringPage() {
  const state = useAppState()
  const t = useT()
  const [editing, setEditing] = useState<RecurringItem | 'new' | null>(null)
  const [query, setQuery] = useState('')
  const money = (n: number, compact = false) => formatMoney(n, state.currency, { compact })
  const fit = (n: number) => formatMoneyFit(n, state.currency)
  const now = currentMonthKey()

  const save = (item: RecurringItem) => {
    setState((s) => {
      const exists = s.recurring.some((r) => r.id === item.id)
      return { ...s, recurring: exists ? s.recurring.map((r) => (r.id === item.id ? item : r)) : [...s.recurring, item] }
    })
    setEditing(null)
    showToast(state.recurring.some((r) => r.id === item.id) ? t('toast.saved', { name: item.name }) : t('toast.added', { name: item.name }))
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

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h1 className="font-display text-2xl font-bold">{t('rec.heading')}</h1>
          <p className="text-sm text-slate-500">{t('rec.summary', { n: live.length, month: money(monthlyEq, true), year: money(monthlyEq * 12, true) })}</p>
        </div>
        <Button onClick={() => setEditing('new')}><Plus size={16} /> {t('common.new')}</Button>
      </div>

      {state.recurring.length > 5 && (
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('rec.search')} type="search" className="pl-9" />
        </div>
      )}

      {state.recurring.length === 0 && (
        <Empty action={<Button onClick={() => setEditing('new')}><Plus size={16} /> {t('rec.addFirst')}</Button>}>{t('rec.empty')}</Empty>
      )}

      {KIND_ORDER.map((kind) => {
        const items = visible.filter((r) => r.kind === kind).sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a))
        if (items.length === 0) return null
        return (
          <Card key={kind}>
            <SectionTitle sub={t('common.aboutPerMonth', { amount: money(items.filter(isLive).reduce((a, r) => a + monthlyEquivalent(r), 0), true) })}>{kindLabel(kind, true)}</SectionTitle>
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
                          <span className="line-clamp-2 break-words">{r.name}</span>
                          {!r.active && <Pill>{t('pill.paused')}</Pill>}
                          {r.active && !isLive(r) && <Pill tone="warn">{r.endMonth && r.endMonth < now ? t('pill.ended') : t('pill.starts', { month: formatMonth(r.startMonth, 'short') })}</Pill>}
                          {r.endMonth && isLive(r) && !credit && <Pill tone="brand">{t('pill.until', { month: formatMonth(r.endMonth, 'short') })}</Pill>}
                          {r.intervalMonths > 1 && <Pill tone={chargedNow ? 'warn' : 'neutral'}>{intervalLabel(r.intervalMonths)}</Pill>}
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                          {c.name}{r.dayOfMonth ? `, ${t('recurring.day', { n: r.dayOfMonth })}` : ''}{next && next !== now ? `, ${t('recurring.next', { month: formatMonth(next, 'short') })}` : chargedNow && r.intervalMonths > 1 ? `, ${t('recurring.chargedNow')}` : ''}{r.note ? `. ${r.note}` : ''}
                        </div>
                      </button>
                      <div className="shrink-0 text-right">
                        <Money>{fit(r.amount)}</Money>
                        {r.intervalMonths > 1 && <div className="whitespace-nowrap text-[11px] text-slate-500">{t('common.perMonth', { amount: money(monthlyEquivalent(r), true) })}</div>}
                      </div>
                      <button onClick={() => toggle(r)} className="inline-flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-900/5 max-[359px]:hidden dark:hover:bg-white/10" aria-label={r.active ? t('rec.pauseA', { name: r.name }) : t('rec.resumeA', { name: r.name })} title={r.active ? t('rec.pause') : t('rec.resume')}>
                        {r.active ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                    </div>
                    {credit && (
                      <div className="ml-13 mt-2">
                        <div className="flex flex-wrap justify-between gap-x-3 text-[11px] text-slate-500">
                          <span>{t('rec.payments', { done: credit.done, total: credit.total })}{chargedNow && credit.done > 0 ? t('rec.inclThisMonth') : ''}</span>
                          <span>{credit.left === 0 ? (chargedNow ? t('rec.lastPayment') : t('rec.paidOff')) : t('rec.toGo', { amount: money(credit.remaining, true), month: formatMonth(r.endMonth!, 'short') })}</span>
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

      <Modal open={editing !== null} title={editing === 'new' ? t('rec.newTitle') : t('rec.editTitle')} onClose={() => setEditing(null)}>
        {editing && (
          <>
            <RecurringForm initial={editing === 'new' ? undefined : editing} onSave={save} onCancel={() => setEditing(null)} />
            {editing !== 'new' && (
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 dark:border-line-dark">
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
