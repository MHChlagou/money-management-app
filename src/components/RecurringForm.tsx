import { useState } from 'react'
import { AmountInput, Button, Field, Input, Select } from './ui'
import { CategoryPicker } from './CategoryPicker'
import { INTERVAL_LABELS, KIND_LABELS, type RecurringItem, type RecurringKind } from '../lib/types'
import { currentMonthKey } from '../lib/months'
import { parseAmount } from '../lib/format'
import { newId } from '../lib/id'

interface Props {
  initial?: RecurringItem
  onSave: (item: RecurringItem) => void
  onCancel: () => void
}

export function RecurringForm({ initial, onSave, onCancel }: Props) {
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
      id: initial?.id ?? newId(),
      name: name.trim(),
      amount: parseAmount(amount),
      kind,
      categoryId,
      intervalMonths: interval,
      dayOfMonth: dayNum,
      startMonth,
      endMonth: hasEnd ? endMonth : undefined,
      active: initial?.active ?? true,
      note: note.trim() || undefined,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Netflix, Rent, Car loan…" autoFocus required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount">
          <AmountInput value={amount} onChange={setAmount} required />
        </Field>
        <Field label="Billed">
          <Select value={interval} onChange={(e) => setInterval(Number(e.target.value))}>
            {Object.entries(INTERVAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <Select value={kind} onChange={(e) => setKind(e.target.value as RecurringKind)}>
            {(Object.keys(KIND_LABELS) as RecurringKind[]).map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
          </Select>
        </Field>
        <Field label="Day of month" hint="When it leaves your account">
          <Input type="number" inputMode="numeric" min={1} max={31} value={day} onChange={(e) => setDay(e.target.value)} placeholder="e.g. 5" />
        </Field>
      </div>
      <Field label="Category">
        <CategoryPicker value={categoryId} onChange={setCategoryId} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={interval > 1 ? 'First charge' : 'From month'}>
          <Input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} required />
        </Field>
        <Field label="Until month" hint={hasEnd ? 'Inclusive' : 'Off = open-ended'}>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={hasEnd} onChange={(e) => { setHasEnd(e.target.checked); if (e.target.checked && !endMonth) setEndMonth(startMonth) }} className="size-5 accent-ink-600" aria-label="Has end month" />
            <Input type="month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} disabled={!hasEnd} min={startMonth} />
          </div>
        </Field>
      </div>
      <Field label="Note (optional)">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contract ends, cancel before…" />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!valid}>{initial ? 'Save changes' : 'Add'}</Button>
      </div>
    </form>
  )
}
