import { useState } from 'react'
import { ChevronRight, PiggyBank, Plus, Trash2 } from 'lucide-react'
import { AmountInput, Button, Card, CategoryDot, cx, Empty, Field, IconButton, Input, Modal, Money, SectionTitle } from './ui'
import { setState, useAppState } from '../lib/store'
import { potBalance, potMonthTotal } from '../lib/calc'
import { CATEGORY_COLORS, type Contribution, type SavingsPot } from '../lib/types'
import { formatMoney, parseAmount } from '../lib/format'
import { daysInMonth, formatDay, pad2, todayIso } from '../lib/months'
import { newId } from '../lib/id'
import { showToast } from '../lib/toast'
import { useT } from '../lib/i18n'

const POT_ICONS = ['🛟', '🏖️', '🏠', '🚗', '💻', '🎓', '💍', '👶', '🎁', '✈️', '🐷', '🎯']

const updatePot = (id: string, fn: (p: SavingsPot) => SavingsPot) =>
  setState((s) => ({ ...s, pots: s.pots.map((p) => (p.id === id ? fn(p) : p)) }))

/** Savings pots for the Month screen: balances, this month's contributions, and the forms to move money. */
export function SavingsCard({ monthKey }: { monthKey: string }) {
  const state = useAppState()
  const t = useT()
  const money = (n: number, compact = false) => formatMoney(n, state.currency, { compact })
  const [potForm, setPotForm] = useState<SavingsPot | 'new' | null>(null)
  const [contrib, setContrib] = useState<{ potId?: string; withdraw?: boolean } | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const setAside = state.pots.reduce((a, p) => a + potMonthTotal(p, monthKey), 0)
  const detailPot = state.pots.find((p) => p.id === detail)

  const savePot = (pot: SavingsPot) => {
    setState((s) => ({ ...s, pots: s.pots.some((p) => p.id === pot.id) ? s.pots.map((p) => (p.id === pot.id ? pot : p)) : [...s.pots, pot] }))
    setPotForm(null)
  }
  const deletePot = (pot: SavingsPot) => {
    if (pot.contributions.length && !confirm(t('savings.deleteConfirm', { name: pot.name, n: pot.contributions.length }))) return
    setState((s) => ({ ...s, pots: s.pots.filter((p) => p.id !== pot.id) }))
    setPotForm(null); setDetail(null)
    showToast(t('toast.deleted', { name: pot.name }), () => setState((s) => ({ ...s, pots: [...s.pots, pot] })))
  }
  const addContribution = (potId: string, c: Contribution) => {
    updatePot(potId, (p) => ({ ...p, contributions: [...p.contributions, c] }))
    setContrib(null)
    const pot = state.pots.find((p) => p.id === potId)
    showToast(c.amount >= 0 ? t('toast.setAside', { amount: money(c.amount), pot: pot?.name ?? '' }) : t('toast.tookOut', { amount: money(-c.amount), pot: pot?.name ?? '' }))
  }
  const removeContribution = (potId: string, c: Contribution) => {
    updatePot(potId, (p) => ({ ...p, contributions: p.contributions.filter((x) => x.id !== c.id) }))
    showToast(t('toast.entryRemoved'), () => updatePot(potId, (p) => ({ ...p, contributions: [...p.contributions, c] })))
  }

  return (
    <Card>
      <SectionTitle sub={state.pots.length ? t('savings.setAsideMonth', { amount: money(setAside) }) : undefined}
        action={state.pots.length > 0 && <Button variant="ghost" className="min-h-8 whitespace-nowrap px-2" onClick={() => setContrib({})}><Plus size={14} /> {t('savings.setAside')}</Button>}>
        {t('savings.title')}
      </SectionTitle>

      {state.pots.length === 0 ? (
        <Empty action={<Button variant="secondary" onClick={() => setPotForm('new')}><PiggyBank size={16} /> {t('savings.createPot')}</Button>}>
          {t('savings.empty')}
        </Empty>
      ) : (
        <>
          <ul className="divide-y divide-line dark:divide-line-dark">
            {state.pots.map((p) => {
              const balance = potBalance(p)
              const thisMonth = potMonthTotal(p, monthKey)
              const ratio = p.target ? Math.min(1, balance / p.target) : null
              return (
                <li key={p.id}>
                  <button className="flex w-full items-center gap-3 py-2.5 text-left" onClick={() => setDetail(p.id)}>
                    <CategoryDot icon={p.icon} color={p.color} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-medium">{p.name}</span>
                        <Money className="shrink-0">{money(balance, true)}</Money>
                      </div>
                      {ratio !== null && (
                        <div className="mt-1.5 h-1.5 rounded-full bg-slate-900/5 dark:bg-white/10"><div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: p.color }} /></div>
                      )}
                      <div className="mt-1 text-xs text-slate-500">
                        {ratio === 1 ? t('savings.targetReached') : thisMonth !== 0 ? t('savings.thisMonth', { amount: `${thisMonth > 0 ? '+' : ''}${money(thisMonth, true)}` }) : t('savings.nothingMonth')}
                        {ratio !== null && ratio < 1 && `, ${t('savings.toGo', { amount: money(p.target! - balance, true), target: money(p.target!, true) })}`}
                      </div>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-slate-400" />
                  </button>
                </li>
              )
            })}
          </ul>
          <button onClick={() => setPotForm('new')} className="mt-2 text-xs font-medium text-ink-600 hover:underline dark:text-ink-200">{t('savings.newPot')}</button>
        </>
      )}

      <Modal open={potForm !== null} title={potForm === 'new' ? t('savings.newPot') : t('savings.editPot')} onClose={() => setPotForm(null)}>
        {potForm && <PotForm initial={potForm === 'new' ? undefined : potForm} onSave={savePot} onDelete={potForm !== 'new' ? () => deletePot(potForm) : undefined} onCancel={() => setPotForm(null)} />}
      </Modal>

      <Modal open={contrib !== null} title={contrib?.withdraw ? t('savings.takeMoneyOut') : t('savings.setMoneyAside')} onClose={() => setContrib(null)}>
        {contrib && <ContributionForm monthKey={monthKey} pots={state.pots} potId={contrib.potId} withdraw={contrib.withdraw} onSave={addContribution} onCancel={() => setContrib(null)} />}
      </Modal>

      <Modal open={Boolean(detailPot)} title={detailPot ? `${detailPot.icon} ${detailPot.name}` : ''} onClose={() => setDetail(null)}>
        {detailPot && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4 text-center" style={{ background: `${detailPot.color}1f` }}>
              <div className="text-xs text-slate-500">{t('savings.savedSoFar')}</div>
              <Money className="text-3xl">{money(potBalance(detailPot))}</Money>
              {detailPot.target && <div className="text-xs text-slate-500">{t('savings.pctOf', { pct: Math.round((potBalance(detailPot) / detailPot.target) * 100), target: money(detailPot.target) })}</div>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="mint" onClick={() => setContrib({ potId: detailPot.id })}><Plus size={16} /> {t('savings.setAside')}</Button>
              <Button variant="secondary" onClick={() => setContrib({ potId: detailPot.id, withdraw: true })}>{t('savings.takeOut')}</Button>
            </div>
            {detailPot.contributions.length === 0 ? <p className="text-center text-sm text-slate-500">{t('savings.noEntries')}</p> : (
              <ul className="max-h-64 divide-y divide-line overflow-y-auto overflow-x-hidden dark:divide-line-dark">
                {[...detailPot.contributions].sort((a, b) => b.date.localeCompare(a.date)).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <div>{formatDay(c.date)}</div>
                      {c.note && <div className="truncate text-xs text-slate-500">{c.note}</div>}
                    </div>
                    <Money className={c.amount < 0 ? 'text-coral-600 dark:text-coral-400' : 'text-mint-600 dark:text-mint-300'}>{c.amount > 0 ? '+' : ''}{money(c.amount)}</Money>
                    <IconButton label={t('savings.removeEntry')} onClick={() => removeContribution(detailPot.id, c)}><Trash2 size={15} /></IconButton>
                  </li>
                ))}
              </ul>
            )}
            <div className="text-right"><Button variant="ghost" onClick={() => { setPotForm(detailPot); setDetail(null) }}>{t('savings.editPot')}</Button></div>
          </div>
        )}
      </Modal>
    </Card>
  )
}

function PotForm({ initial, onSave, onDelete, onCancel }: { initial?: SavingsPot; onSave: (p: SavingsPot) => void; onDelete?: () => void; onCancel: () => void }) {
  const t = useT()
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '🐷')
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[2])
  const [target, setTarget] = useState(initial?.target ? String(initial.target) : '')
  const valid = name.trim().length > 0
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ id: initial?.id ?? newId(), name: name.trim(), icon, color, target: parseAmount(target) > 0 ? parseAmount(target) : undefined, contributions: initial?.contributions ?? [] }) }} className="space-y-4">
      <div className="flex items-center gap-3">
        <CategoryDot icon={icon} color={color} size="lg" />
        <Field label={t('cat.name')}><Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder={t('savings.potName')} /></Field>
      </div>
      <Field label={t('cat.icon')}>
        <div className="grid grid-cols-6 gap-1">
          {POT_ICONS.map((i) => <button key={i} type="button" onClick={() => setIcon(i)} className={cx('rounded-lg py-1.5 text-xl', i === icon ? 'bg-ink-50 ring-2 ring-ink-500 dark:bg-ink-500/20' : 'hover:bg-slate-900/5 dark:hover:bg-white/10')} aria-label={t('cat.iconA', { icon: i })} aria-pressed={i === icon}>{i}</button>)}
        </div>
      </Field>
      <Field label={t('cat.colour')}>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => <button key={c} type="button" onClick={() => setColor(c)} className={cx('size-8 rounded-full', c === color && 'ring-2 ring-ink-600 ring-offset-2 dark:ring-white dark:ring-offset-card-dark')} style={{ background: c }} aria-label={t('cat.colourA', { colour: c })} aria-pressed={c === color} />)}
        </div>
      </Field>
      <Field label={t('savings.target')} hint={t('savings.targetHint')}><AmountInput value={target} onChange={setTarget} /></Field>
      <div className="flex items-center justify-between gap-2 pt-2">
        {onDelete ? <IconButton label={t('savings.deletePot')} className="text-coral-600" onClick={onDelete}><Trash2 size={18} /></IconButton> : <span />}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={!valid}>{initial ? t('common.save') : t('common.create')}</Button>
        </div>
      </div>
    </form>
  )
}

function ContributionForm({ monthKey, pots, potId, withdraw, onSave, onCancel }: { monthKey: string; pots: SavingsPot[]; potId?: string; withdraw?: boolean; onSave: (potId: string, c: Contribution) => void; onCancel: () => void }) {
  const t = useT()
  const today = todayIso()
  const [pot, setPot] = useState(potId ?? pots[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today.startsWith(monthKey) ? today : `${monthKey}-01`)
  const [note, setNote] = useState('')
  const valid = pot && parseAmount(amount) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date)
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onSave(pot, { id: newId(), date, amount: withdraw ? -parseAmount(amount) : parseAmount(amount), note: note.trim() || undefined }) }} className="space-y-4">
      {!potId && (
        <Field label={t('savings.pot')}>
          <div className="flex flex-wrap gap-1.5" role="radiogroup">
            {pots.map((p) => <button key={p.id} type="button" role="radio" aria-checked={p.id === pot} onClick={() => setPot(p.id)} className={cx('flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm', p.id === pot ? 'border-ink-500 bg-ink-50 font-semibold text-ink-700 dark:bg-ink-500/20 dark:text-ink-100' : 'border-line dark:border-line-dark')}>{p.icon} {p.name}</button>)}
          </div>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('form.amount')}><AmountInput value={amount} onChange={setAmount} autoFocus required /></Field>
        <Field label={t('oneoff.date')}><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={`${monthKey}-01`} max={`${monthKey}-${pad2(daysInMonth(monthKey))}`} /></Field>
      </div>
      <Field label={t('common.note')}><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={withdraw ? t('savings.noteOut') : t('savings.noteIn')} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" variant={withdraw ? 'primary' : 'mint'} disabled={!valid}>{withdraw ? t('savings.takeOut') : t('savings.setAside')}</Button>
      </div>
    </form>
  )
}
