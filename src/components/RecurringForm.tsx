import { useState } from 'react'
import { AmountInput, Button, Field, Input, Select } from './ui'
import { CategoryPicker } from './CategoryPicker'
import { type RecurringItem, type RecurringKind } from '../lib/types'
import { currentMonthKey } from '../lib/months'
import { parseAmount } from '../lib/format'
import { newId } from '../lib/id'
import { intervalLabel, kindLabel, useT } from '../lib/i18n'

interface Props {
  initial?: RecurringItem
  onSave: (item: RecurringItem) => void
  onCancel: () => void
}

const KINDS: RecurringKind[] = ['subscription', 'credit', 'bill', 'other']
const INTERVALS = [1, 2, 3, 6, 12]

export function RecurringForm({ initial, onSave, onCancel }: Props) {
  const t = useT()
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [kind, setKind] = useState<RecurringKind>(initial?.kind ?? 'subscription')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? 'other')
  const [interval, setInterval] = useState(initial?.intervalMonths ?? 1)
  const [day, setDay] = useState(initial?.dayOfMonth ? String(initial.dayOfMonth) : '')
  const [startMonth, setStartMonth] = useState(initial?.startMonth ?? currentMonthKey())
  const [hasEnd, setHasEnd] = useState(Boolean(initial?.endMonth))
  const [endMonth, setEndMonth] = useState(initial?.endMonth ?? '')
  const [note, setNote] = useState(initial?.note ?? '')

  const dayNum = day ? Number(day) : undefined
  const isMonthKey = (k: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(k)
  const valid = name.trim().length > 0 && parseAmount(amount) > 0 && isMonthKey(startMonth) && (!hasEnd || (isMonthKey(endMonth) && endMonth >= startMonth)) && (dayNum === undefined || (Number.isInteger(dayNum) && dayNum >= 1 && dayNum <= 31))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    onSave({
      id: initial?.id ?? newId(), name: name.trim(), amount: parseAmount(amount), kind, categoryId,
      intervalMonths: interval, dayOfMonth: dayNum, startMonth, endMonth: hasEnd ? endMonth : undefined,
      active: initial?.active ?? true, note: note.trim() || undefined,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t('form.name')}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('form.namePlaceholder')} autoFocus required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('form.amount')}><AmountInput value={amount} onChange={setAmount} required /></Field>
        <Field label={t('form.billed')}>
          <Select value={interval} onChange={(e) => setInterval(Number(e.target.value))}>
            {INTERVALS.map((v) => <option key={v} value={v}>{intervalLabel(v)}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('form.type')}>
          <Select value={kind} onChange={(e) => setKind(e.target.value as RecurringKind)}>
            {KINDS.map((k) => <option key={k} value={k}>{kindLabel(k)}</option>)}
          </Select>
        </Field>
        <Field label={t('form.dayOfMonth')} hint={t('form.dayHint')}>
          <Input type="number" inputMode="numeric" min={1} max={31} value={day} onChange={(e) => setDay(e.target.value)} placeholder={t('form.dayPlaceholder')} />
        </Field>
      </div>
      <Field label={t('form.category')}><CategoryPicker value={categoryId} onChange={setCategoryId} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={interval > 1 ? t('form.firstCharge') : t('form.fromMonth')}>
          <Input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} required />
        </Field>
        <Field label={t('form.untilMonth')} hint={hasEnd ? t('form.inclusive') : t('form.openEnded')}>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={hasEnd} onChange={(e) => { setHasEnd(e.target.checked); if (e.target.checked && !endMonth) setEndMonth(startMonth) }} className="size-5 accent-ink-600" aria-label={t('form.hasEnd')} />
            <Input type="month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} disabled={!hasEnd} min={startMonth} />
          </div>
        </Field>
      </div>
      <Field label={t('common.note')}><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('form.notePlaceholder')} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={!valid}>{initial ? t('common.saveChanges') : t('common.add')}</Button>
      </div>
    </form>
  )
}
