import { useState } from 'react'
import { AmountInput, Button, Card, CategoryDot, Empty, Fab, Field, IconButton, Modal, Pill, SectionTitle } from '../components/ui'
import { MonthNav } from '../components/MonthNav'
import { OneOffForm } from '../components/OneOffForm'
import { setState, useAppState } from '../lib/store'
import { budgetStatus, categoryById, entriesByDay, getMonth, resolveLines, summarize, type DayEntry, type ResolvedLine } from '../lib/calc'
import { formatMoney, formatPct, parseAmount } from '../lib/format'
import { INTERVAL_LABELS, KIND_LABELS, emptyMonth, type MonthRecord, type OneOffExpense } from '../lib/types'
import { currentMonthKey, formatDay, pad2 } from '../lib/months'
import { showToast } from '../lib/toast'
import { sampleState } from '../lib/sample'

export const updateMonth = (key: string, fn: (m: MonthRecord) => MonthRecord) =>
  setState((s) => ({ ...s, months: { ...s.months, [key]: fn(s.months[key] ?? emptyMonth()) } }))

export function MonthPage({ monthKey, onMonthChange, goTo }: { monthKey: string; onMonthChange: (k: string) => void; goTo: (tab: 'recurring' | 'insights' | 'calendar') => void }) {
  const state = useAppState()
  const month = getMonth(state, monthKey)
  const lines = resolveLines(state, monthKey)
  const sum = summarize(state, monthKey)
  const money = (n: number) => formatMoney(n, state.currency)
  const [editingLine, setEditingLine] = useState<ResolvedLine | null>(null)
  const [oneOffModal, setOneOffModal] = useState<'new' | OneOffExpense | null>(null)
  const isEmptyApp = state.recurring.length === 0 && Object.keys(state.months).length === 0 && state.defaultSalary === 0

  const spentRatio = sum.income > 0 ? Math.min(sum.expenses / sum.income, 1) : 0
  const tone = sum.remaining < 0 ? 'bg-red-500' : sum.savingsRate < state.savingsGoalPct / 100 ? 'bg-amber-500' : 'bg-brand-600'
  const overBudget = budgetStatus(state, monthKey).filter((b) => b.share > 1)

  // "Coming up": payments in the next 7 days, only meaningful for the current month.
  const today = new Date().getDate()
  const upcoming: DayEntry[] = monthKey === currentMonthKey()
    ? [...entriesByDay(state, monthKey).entries()].filter(([d]) => d >= today && d <= today + 7).flatMap(([, es]) => es).filter((e) => e.source === 'recurring').sort((a, b) => a.day - b.day)
    : []

  const deleteOneOff = (e: OneOffExpense) => {
    updateMonth(monthKey, (m) => ({ ...m, oneOffs: m.oneOffs.filter((x) => x.id !== e.id) }))
    showToast(`Deleted "${e.name}"`, () => updateMonth(monthKey, (m) => ({ ...m, oneOffs: [...m.oneOffs, e] })))
  }

  return (
    <div className="space-y-4">
      <MonthNav value={monthKey} onChange={onMonthChange} />

      {isEmptyApp && (
        <Card className="border-brand-200 bg-brand-50 ring-brand-200 dark:bg-brand-800/20 dark:ring-brand-800">
          <h2 className="mb-1 text-base font-semibold">Welcome 👋</h2>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Start by entering your salary below and adding what you pay every month. Or load example data to see how everything works, then clear it in Settings.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => goTo('recurring')}>Add recurring expenses</Button>
            <Button variant="secondary" onClick={() => setState(() => sampleState())}>Load example data</Button>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Income</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Salary" hint={sum.usesDefaultSalary && state.defaultSalary > 0 ? 'Using your default salary' : undefined}>
            <MoneyField value={sum.salary} onCommit={(v) => updateMonth(monthKey, (m) => ({ ...m, salary: v }))} />
          </Field>
          <Field label="Extra income" hint="Bonus, refund, side job…">
            <MoneyField value={month.extraIncome} onCommit={(v) => updateMonth(monthKey, (m) => ({ ...m, extraIncome: v }))} />
          </Field>
        </div>
        {!sum.usesDefaultSalary && sum.salary !== state.defaultSalary && sum.salary > 0 && (
          <button className="mt-2 text-xs text-brand-700 hover:underline dark:text-brand-500" onClick={() => { setState((s) => ({ ...s, defaultSalary: sum.salary })); showToast('Default salary updated') }}>
            Use {money(sum.salary)} as my default salary for every month
          </button>
        )}
      </Card>

      <Card>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Income" value={money(sum.income)} />
          <Stat label="Expenses" value={money(sum.expenses)} />
          <Stat label="Left" value={money(sum.remaining)} highlight={sum.remaining < 0 ? 'bad' : 'good'} />
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={Math.round(spentRatio * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Share of income spent">
          <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${spentRatio * 100}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-1 text-xs text-slate-500">
          <span>{sum.income > 0 ? `${formatPct(sum.expenses / sum.income)} spent · goal: keep ${state.savingsGoalPct}%` : 'Enter a salary to see your rate'}</span>
          <span>Fixed {money(sum.fixed)} · One-off {money(sum.variable)}</span>
        </div>
        {overBudget.length > 0 && (
          <button onClick={() => goTo('insights')} className="mt-3 flex w-full items-center gap-2 rounded-xl bg-amber-50 p-2 text-left text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <span>⚠️</span><span>{overBudget.length === 1 ? `${overBudget[0].category.name} is over budget` : `${overBudget.length} categories over budget`} · see Insights</span>
          </button>
        )}
      </Card>

      {upcoming.length > 0 && (
        <Card>
          <SectionTitle action={<Button variant="ghost" className="min-h-8 px-2" onClick={() => goTo('calendar')}>Calendar</Button>}>Coming up (7 days)</SectionTitle>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcoming.map((e) => {
              const c = categoryById(state, e.categoryId)
              return (
                <li key={e.id} className="flex items-center gap-3 py-2">
                  <CategoryDot icon={c.icon} color={c.color} size="sm" />
                  <span className="flex-1 truncate">{e.name}</span>
                  <span className="text-xs text-slate-500">{formatDay(`${monthKey}-${pad2(e.day)}`)}</span>
                  <span className="tabular-nums font-medium">{money(e.amount)}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <Card>
        <SectionTitle action={<Button variant="ghost" className="min-h-8 px-2" onClick={() => goTo('recurring')}>Manage</Button>}>
          Recurring · {money(sum.fixed)}
        </SectionTitle>
        {lines.length === 0 ? (
          <Empty>No recurring expenses apply to this month. Add subscriptions, bills and credits under <b>Recurring</b>.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {lines.map((l) => {
              const c = categoryById(state, l.categoryId)
              return (
                <li key={l.id} className={`flex items-center gap-3 py-2.5 ${l.skipped ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={!l.skipped}
                    onChange={(e) => updateMonth(monthKey, (m) => ({ ...m, overrides: { ...m.overrides, [l.id]: { ...m.overrides[l.id], skipped: !e.target.checked } } }))}
                    className="size-5 shrink-0 accent-brand-700"
                    aria-label={`Include ${l.name} this month`}
                  />
                  <CategoryDot icon={c.icon} color={c.color} size="sm" />
                  <button className="min-w-0 flex-1 text-left" onClick={() => setEditingLine(l)}>
                    <div className="flex items-center gap-2">
                      <span className={`truncate font-medium ${l.skipped ? 'line-through' : ''}`}>{l.name}</span>
                      {l.isLastMonth && <Pill tone="good">last one</Pill>}
                      {l.amount !== l.defaultAmount && <Pill tone="warn">edited</Pill>}
                      {l.intervalMonths > 1 && <Pill tone="brand">{INTERVAL_LABELS[l.intervalMonths] ?? `every ${l.intervalMonths} mo`}</Pill>}
                    </div>
                    <div className="text-xs text-slate-500">{KIND_LABELS[l.kind]} · {c.name}{l.dayOfMonth ? ` · day ${l.dayOfMonth}` : ''}</div>
                  </button>
                  <span className="tabular-nums font-medium">{money(l.amount)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle action={<Button variant="ghost" className="min-h-8 px-2" onClick={() => setOneOffModal('new')}>+ Add</Button>}>
          One-off expenses · {money(sum.variable)}
        </SectionTitle>
        {month.oneOffs.length === 0 ? (
          <Empty>Nothing yet. Log purchases that are not recurring: groceries, a repair, a gift. Tap <b>+</b> to add one.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...month.oneOffs].sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
              const c = categoryById(state, e.categoryId)
              return (
                <li key={e.id} className="flex items-center gap-3 py-2.5">
                  <CategoryDot icon={c.icon} color={c.color} size="sm" />
                  <button className="min-w-0 flex-1 text-left" onClick={() => setOneOffModal(e)}>
                    <div className="truncate font-medium">{e.name}</div>
                    <div className="text-xs text-slate-500">{formatDay(e.date)} · {c.name}</div>
                  </button>
                  <span className="tabular-nums font-medium">{money(e.amount)}</span>
                  <IconButton label={`Delete ${e.name}`} className="hover:text-red-600" onClick={() => deleteOneOff(e)}>✕</IconButton>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle>Note for this month</SectionTitle>
        <textarea
          className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-slate-950"
          rows={2}
          placeholder="Anything to remember: bonus expected, big purchase planned…"
          defaultValue={month.note ?? ''}
          onBlur={(e) => { if ((e.target.value || undefined) !== month.note) updateMonth(monthKey, (m) => ({ ...m, note: e.target.value || undefined })) }}
        />
      </Card>

      <Fab label="Add expense" onClick={() => setOneOffModal('new')} />

      <Modal open={Boolean(editingLine)} title={editingLine ? `${editingLine.name} this month` : ''} onClose={() => setEditingLine(null)}>
        {editingLine && (
          <LineOverrideForm
            line={editingLine}
            currency={state.currency}
            onSave={(amount) => {
              updateMonth(monthKey, (m) => {
                const ov = { ...m.overrides[editingLine.id] }
                if (amount === null) delete ov.amount; else ov.amount = amount
                return { ...m, overrides: { ...m.overrides, [editingLine.id]: ov } }
              })
              setEditingLine(null)
            }}
          />
        )}
      </Modal>

      <Modal open={oneOffModal !== null} title={oneOffModal === 'new' ? 'Add expense' : 'Edit expense'} onClose={() => setOneOffModal(null)}>
        {oneOffModal && (
          <OneOffForm
            monthKey={monthKey}
            initial={oneOffModal === 'new' ? undefined : oneOffModal}
            onSave={(e) => {
              updateMonth(monthKey, (m) => ({ ...m, oneOffs: m.oneOffs.some((x) => x.id === e.id) ? m.oneOffs.map((x) => (x.id === e.id ? e : x)) : [...m.oneOffs, e] }))
              setOneOffModal(null)
            }}
            onCancel={() => setOneOffModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: 'good' | 'bad' }) {
  const color = highlight === 'bad' ? 'text-red-600 dark:text-red-400' : highlight === 'good' ? 'text-brand-700 dark:text-brand-500' : ''
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`truncate text-lg font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  )
}

/** Commits on blur/Enter so every keystroke doesn't rewrite storage and re-render the page. */
function MoneyField({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)
  const shown = focused ? draft : value ? String(value) : ''
  return (
    <AmountInput
      value={shown}
      onChange={setDraft}
      onFocus={() => { setDraft(value ? String(value) : ''); setFocused(true) }}
      onBlur={() => { setFocused(false); const v = parseAmount(draft); if (v !== value) onCommit(v) }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
    />
  )
}

function LineOverrideForm({ line, currency, onSave }: { line: ResolvedLine; currency: string; onSave: (amount: number | null) => void }) {
  const [amount, setAmount] = useState(String(line.amount))
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(parseAmount(amount)) }} className="space-y-4">
      <p className="text-sm text-slate-500">Usual amount: {formatMoney(line.defaultAmount, currency)}. Change it for this month only, e.g. a promo or an annual bump. To change it permanently, edit it under Recurring.</p>
      <Field label="Amount this month">
        <AmountInput value={amount} onChange={setAmount} autoFocus />
      </Field>
      <div className="flex justify-end gap-2">
        {line.amount !== line.defaultAmount && <Button type="button" variant="secondary" onClick={() => onSave(null)}>Reset to usual</Button>}
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}
