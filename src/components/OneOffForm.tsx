import { useState } from 'react'
import { AmountInput, Button, Field, Input } from './ui'
import { CategoryPicker } from './CategoryPicker'
import type { OneOffExpense } from '../lib/types'
import { daysInMonth, pad2, todayIso } from '../lib/months'
import { parseAmount } from '../lib/format'
import { newId } from '../lib/id'
import { useT } from '../lib/i18n'

interface Props {
  monthKey: string
  initial?: OneOffExpense
  /** Pre-selected day when opened from the calendar. */
  day?: number
  onSave: (e: OneOffExpense) => void
  onCancel: () => void
}

export function OneOffForm({ monthKey, initial, day, onSave, onCancel }: Props) {
  const t = useT()
  const today = todayIso()
  const defaultDate = day ? `${monthKey}-${pad2(day)}` : today.startsWith(monthKey) ? today : `${monthKey}-01`
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? 'groceries')
  const [date, setDate] = useState(initial?.date ?? defaultDate)
  const valid = name.trim() && parseAmount(amount) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date) && date.startsWith(monthKey)

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ id: initial?.id ?? newId(), name: name.trim(), amount: parseAmount(amount), categoryId, date }) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('oneoff.amount')}><AmountInput value={amount} onChange={setAmount} required autoFocus={!initial} /></Field>
        <Field label={t('oneoff.date')}><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={`${monthKey}-01`} max={`${monthKey}-${pad2(daysInMonth(monthKey))}`} /></Field>
      </div>
      <Field label={t('oneoff.what')}><Input value={name} onChange={(e) => setName(e.target.value)} required placeholder={t('oneoff.placeholder')} /></Field>
      <Field label={t('oneoff.category')}><CategoryPicker value={categoryId} onChange={setCategoryId} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={!valid}>{initial ? t('common.save') : t('common.add')}</Button>
      </div>
    </form>
  )
}
