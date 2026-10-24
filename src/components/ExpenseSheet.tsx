import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { AmountInput, Button, CategoryDot, cx, Field, IconButton, Input, Modal } from './ui'
import { CategoryPicker } from './CategoryPicker'
import { deleteOneOff, saveOneOff, useAppState } from '../lib/store'
import { categoryById, recentExpenses } from '../lib/calc'
import { formatMoneyFit, parseAmount } from '../lib/format'
import { pad2, todayIso } from '../lib/months'
import { newId } from '../lib/id'
import { showToast } from '../lib/toast'
import { closeExpenseSheet, useUi, type ExpenseSheetRequest } from '../lib/ui'
import { useT } from '../lib/i18n'
import { useMediaQuery } from '../lib/useMediaQuery'

/** The one place one-off expenses are added and edited, whichever screen asked for it. */
export function ExpenseSheetHost() {
  const { expenseSheet } = useUi()
  const t = useT()
  return (
    <Modal open={expenseSheet !== null} title={expenseSheet?.initial ? t('oneoff.edit') : t('oneoff.add')} onClose={closeExpenseSheet}>
      {expenseSheet && <ExpenseForm key={expenseSheet.initial?.id ?? `${expenseSheet.monthKey}-${expenseSheet.day ?? ''}`} request={expenseSheet} />}
    </Modal>
  )
}

const yesterdayIso = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function ExpenseForm({ request }: { request: ExpenseSheetRequest }) {
  const state = useAppState()
  const t = useT()
  // On touch screens an autofocused field opens the keyboard over the sheet before anything is visible.
  const coarse = useMediaQuery('(pointer: coarse)')
  const { initial, monthKey, day } = request
  const today = todayIso()
  const defaultDate = day ? `${monthKey}-${pad2(day)}` : today.startsWith(monthKey) ? today : `${monthKey}-01`
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [name, setName] = useState(initial?.name ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? 'groceries')
  const [categoryTouched, setCategoryTouched] = useState(Boolean(initial))
  const [date, setDate] = useState(initial?.date ?? defaultDate)
  const recents = initial ? [] : recentExpenses(state, 6)
  const valid = name.trim().length > 0 && parseAmount(amount) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date)
  const yesterday = yesterdayIso()

  const onName = (value: string) => {
    setName(value)
    // Until a category is picked by hand, follow the last expense with the same name.
    if (categoryTouched) return
    const known = recentExpenses(state, 200).find((r) => r.name.trim().toLowerCase() === value.trim().toLowerCase())
    if (known) setCategoryId(known.categoryId)
  }

  const save = () => {
    if (!valid) return
    const expense = { id: initial?.id ?? newId(), name: name.trim(), amount: parseAmount(amount), categoryId, date }
    saveOneOff(expense, initial?.date.slice(0, 7))
    closeExpenseSheet()
    if (initial) showToast(t('quick.updated', { name: expense.name }))
    else showToast(t('quick.saved', { name: expense.name }), () => deleteOneOff(expense))
  }

  const remove = () => {
    if (!initial) return
    deleteOneOff(initial)
    closeExpenseSheet()
    showToast(t('toast.deleted', { name: initial.name }), () => saveOneOff(initial))
  }

  const dateChip = (value: string, label: string) => (
    <button type="button" onClick={() => setDate(value)} aria-pressed={date === value}
      className={cx('min-h-11 rounded-full px-4 text-sm font-medium transition-colors duration-150', date === value ? 'bg-accent text-on-accent' : 'bg-sunk text-ink hover:bg-mist-200 dark:hover:bg-white/10')}>
      {label}
    </button>
  )

  return (
    <form onSubmit={(e) => { e.preventDefault(); save() }} className="space-y-5">
      <Field label={t('oneoff.amount')}>
        <AmountInput value={amount} onChange={setAmount} required autoFocus={!initial && !coarse} className="h-16 text-center text-[34px] font-semibold tracking-[-0.02em]" />
      </Field>

      {recents.length > 0 && (
        <div>
          <div className="mb-1.5 text-[13px] font-medium text-ink/80">{t('quick.recent')}</div>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {recents.map((r) => {
              const c = categoryById(state, r.categoryId)
              return (
                <button key={r.name} type="button" onClick={() => { setName(r.name); setAmount(String(r.amount)); setCategoryId(r.categoryId); setCategoryTouched(true) }}
                  className="flex shrink-0 items-center gap-2 rounded-2xl bg-sunk py-1.5 pl-1.5 pr-3 text-left text-sm transition-[transform,background-color] duration-150 ease-ui hover:bg-mist-200 active:scale-[0.97] dark:hover:bg-white/10">
                  <CategoryDot icon={c.icon} color={c.color} size="sm" />
                  <span className="max-w-32 truncate font-medium">{r.name}</span>
                  <span className="tnum text-muted">{formatMoneyFit(r.amount, state.currency)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <Field label={t('oneoff.what')}>
        <Input value={name} onChange={(e) => onName(e.target.value)} required placeholder={t('oneoff.placeholder')} autoComplete="off" />
      </Field>

      <div>
        <div className="mb-1.5 text-[13px] font-medium text-ink/80">{t('oneoff.date')}</div>
        <div className="flex flex-wrap items-center gap-2">
          {dateChip(today, t('quick.today'))}
          {dateChip(yesterday, t('quick.yesterday'))}
          <label className="min-w-36 flex-1">
            <span className="sr-only">{t('quick.pickDay')}</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-full text-sm" />
          </label>
        </div>
      </div>

      <Field label={t('oneoff.category')}>
        <CategoryPicker value={categoryId} onChange={(id) => { setCategoryId(id); setCategoryTouched(true) }} />
      </Field>

      {/* Sticks to the bottom of the sheet so Add stays reachable on short screens. */}
      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-between gap-2 border-t border-hairline bg-surface/95 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:-mb-5 sm:pb-5">
        {initial ? <IconButton type="button" label={t('oneoff.deleteA', { name: initial.name })} className="text-ebb-600 dark:text-ebb-300" onClick={remove}><Trash2 size={18} /></IconButton> : <span />}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={closeExpenseSheet}>{t('common.cancel')}</Button>
          <Button type="submit" variant="tide" disabled={!valid}>{initial ? t('common.save') : t('common.add')}</Button>
        </div>
      </div>
    </form>
  )
}
