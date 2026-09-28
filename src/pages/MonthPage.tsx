import { useState } from 'react'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import { AmountInput, Button, Card, CategoryDot, cx, Empty, Field, IconButton, Modal, Money, Pill, Row, SectionTitle } from '../components/ui'
import { MonthNav } from '../components/MonthNav'
import { OneOffForm } from '../components/OneOffForm'
import { setState, useAppState } from '../lib/store'
import { budgetStatus, categoryById, entriesByDay, getMonth, resolveLines, runway, summarize, type DayEntry, type ResolvedLine } from '../lib/calc'
import { formatMoney, formatPct, parseAmount } from '../lib/format'
import { INTERVAL_LABELS, KIND_LABELS, emptyMonth, type MonthRecord, type OneOffExpense } from '../lib/types'
import { formatDay, pad2 } from '../lib/months'
import { showToast } from '../lib/toast'
import { sampleState } from '../lib/sample'

export const updateMonth = (key: string, fn: (m: MonthRecord) => MonthRecord) =>
  setState((s) => ({ ...s, months: { ...s.months, [key]: fn(s.months[key] ?? emptyMonth()) } }))

export function MonthPage({ monthKey, onMonthChange, goTo }: { monthKey: string; onMonthChange: (k: string) => void; goTo: (tab: 'recurring' | 'insights' | 'calendar') => void }) {
  const state = useAppState()
  const month = getMonth(state, monthKey)
  const lines = resolveLines(state, monthKey)
  const sum = summarize(state, monthKey)
  const run = runway(state, monthKey)
  const money = (n: number, compact = false) => formatMoney(n, state.currency, { compact })
  const [editingLine, setEditingLine] = useState<ResolvedLine | null>(null)
  const [oneOffModal, setOneOffModal] = useState<'new' | OneOffExpense | null>(null)
  const isEmptyApp = state.recurring.length === 0 && Object.keys(state.months).length === 0 && state.defaultSalary === 0

  const spentRatio = sum.income > 0 ? Math.min(sum.expenses / sum.income, 1) : 0
  const goalMet = sum.income > 0 && sum.savingsRate >= state.savingsGoalPct / 100
  const overBudget = budgetStatus(state, monthKey).filter((b) => b.share > 1)

  const today = new Date().getDate()
  const upcoming: DayEntry[] = run.isCurrent
    ? [...entriesByDay(state, monthKey).entries()].filter(([d]) => d >= today && d <= today + 7).flatMap(([, es]) => es).filter((e) => e.source === 'recurring').sort((a, b) => a.day - b.day)
    : []

  const deleteOneOff = (e: OneOffExpense) => {
    updateMonth(monthKey, (m) => ({ ...m, oneOffs: m.oneOffs.filter((x) => x.id !== e.id) }))
    showToast(`Deleted ${e.name}`, () => updateMonth(monthKey, (m) => ({ ...m, oneOffs: [...m.oneOffs, e] })))
  }

  return (
    <div className="space-y-3">
      {/* The runway: one bold element, everything else stays quiet. */}
      <section className="rounded-3xl bg-ink-900 p-4 text-white dark:bg-ink-950 dark:ring-1 dark:ring-white/10">
        <MonthNav value={monthKey} onChange={onMonthChange} tone="onDark" />
        <div className="mt-4 px-1">
          <div className="text-sm text-white/70">{sum.remaining < 0 ? 'Over budget by' : 'Left to spend'}</div>
          <div className={cx('font-display text-[44px] font-bold leading-none tracking-tight', sum.remaining < 0 ? 'text-coral-400' : 'text-mint-300')}>
            {money(Math.abs(sum.remaining), true)}
          </div>
          <div className="mt-1.5 text-sm text-white/70">
            {sum.income > 0 ? <>{money(sum.expenses, true)} spent of {money(sum.income, true)}</> : 'Add your salary below to start'}
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={Math.round(spentRatio * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Share of income spent">
          <div className={cx('h-full rounded-full transition-all', sum.remaining < 0 ? 'bg-coral-400' : 'bg-mint-400')} style={{ width: `${spentRatio * 100}%` }} />
        </div>
        {sum.income > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {run.daysLeft > 0 && sum.remaining > 0 && (
              <span className="rounded-full bg-white/10 px-2.5 py-1"><Money>{money(run.perDay, true)}</Money> a day for {run.daysLeft} {run.daysLeft === 1 ? 'day' : 'days'}</span>
            )}
            <span className={cx('rounded-full px-2.5 py-1', goalMet ? 'bg-mint-400/20 text-mint-300' : 'bg-white/10')}>
              {goalMet ? 'Goal met' : 'Goal'}: keep {state.savingsGoalPct}% <span className="opacity-70">({formatPct(sum.savingsRate)} now)</span>
            </span>
            {overBudget.length > 0 && (
              <button onClick={() => goTo('insights')} className="rounded-full bg-coral-500/25 px-2.5 py-1 text-coral-100">{overBudget.length === 1 ? `${overBudget[0].category.name} over budget` : `${overBudget.length} budgets exceeded`}</button>
            )}
          </div>
        )}
      </section>

      {isEmptyApp && (
        <Card>
          <h2 className="font-display text-base font-semibold">Welcome</h2>
          <p className="mb-3 mt-1 text-sm text-slate-600 dark:text-slate-300">Enter your salary, then add what you pay every month under Recurring. Prefer to look around first? Load example data and clear it later in Settings.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => goTo('recurring')}>Add recurring expenses</Button>
            <Button variant="secondary" onClick={() => setState(() => sampleState())}>Load example data</Button>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Income</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Salary" hint={sum.usesDefaultSalary && state.defaultSalary > 0 ? 'Your default salary' : undefined}>
            <MoneyField value={sum.salary} onCommit={(v) => updateMonth(monthKey, (m) => ({ ...m, salary: v }))} />
          </Field>
          <Field label="Extra income" hint="Bonus, refund, side job">
            <MoneyField value={month.extraIncome} onCommit={(v) => updateMonth(monthKey, (m) => ({ ...m, extraIncome: v }))} />
          </Field>
        </div>
        {!sum.usesDefaultSalary && sum.salary !== state.defaultSalary && sum.salary > 0 && (
          <button className="mt-2 text-xs font-medium text-ink-600 hover:underline dark:text-ink-200" onClick={() => { setState((s) => ({ ...s, defaultSalary: sum.salary })); showToast('Default salary updated') }}>
            Use {money(sum.salary)} as my default salary
          </button>
        )}
      </Card>

      {upcoming.length > 0 && (
        <Card>
          <SectionTitle action={<Button variant="ghost" className="min-h-8 px-2" onClick={() => goTo('calendar')}>Calendar <ChevronRight size={14} /></Button>}>Next 7 days</SectionTitle>
          <ul className="divide-y divide-line dark:divide-line-dark">
            {upcoming.map((e) => {
              const c = categoryById(state, e.categoryId)
              return <Row key={e.id} icon={<CategoryDot icon={c.icon} color={c.color} size="sm" />} title={e.name} subtitle={formatDay(`${monthKey}-${pad2(e.day)}`)} trailing={<Money>{money(e.amount)}</Money>} />
            })}
          </ul>
        </Card>
      )}

      <Card>
        <SectionTitle sub={`${money(sum.fixed)} this month`} action={<Button variant="ghost" className="min-h-8 px-2" onClick={() => goTo('recurring')}>Manage <ChevronRight size={14} /></Button>}>Recurring</SectionTitle>
        {lines.length === 0 ? (
          <Empty action={<Button variant="secondary" onClick={() => goTo('recurring')}>Add a recurring expense</Button>}>Nothing recurring applies to this month yet.</Empty>
        ) : (
          <ul className="divide-y divide-line dark:divide-line-dark">
            {lines.map((l) => {
              const c = categoryById(state, l.categoryId)
              return (
                <Row key={l.id} muted={l.skipped} onClick={() => setEditingLine(l)}
                  icon={<CategoryDot icon={c.icon} color={c.color} size="sm" />}
                  title={<>{l.name}{l.isLastMonth && <Pill tone="good">last one</Pill>}{l.amount !== l.defaultAmount && <Pill tone="warn">edited</Pill>}{l.intervalMonths > 1 && <Pill tone="brand">{INTERVAL_LABELS[l.intervalMonths] ?? `every ${l.intervalMonths} months`}</Pill>}</>}
                  subtitle={`${KIND_LABELS[l.kind]}, ${c.name}${l.dayOfMonth ? `, day ${l.dayOfMonth}` : ''}`}
                  trailing={<Money>{money(l.amount)}</Money>}>
                  <input type="checkbox" checked={!l.skipped}
                    onChange={(e) => updateMonth(monthKey, (m) => ({ ...m, overrides: { ...m.overrides, [l.id]: { ...m.overrides[l.id], skipped: !e.target.checked } } }))}
                    className="size-5 shrink-0 accent-ink-600" aria-label={`Include ${l.name} this month`} />
                </Row>
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle sub={`${money(sum.variable)} this month`} action={<Button variant="ghost" className="min-h-8 px-2" onClick={() => setOneOffModal('new')}><Plus size={14} /> Add</Button>}>One-off expenses</SectionTitle>
        {month.oneOffs.length === 0 ? (
          <Empty>Log purchases that are not recurring: groceries, a repair, a gift.</Empty>
        ) : (
          <ul className="divide-y divide-line dark:divide-line-dark">
            {[...month.oneOffs].sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
              const c = categoryById(state, e.categoryId)
              return (
                <Row key={e.id} onClick={() => setOneOffModal(e)} icon={<CategoryDot icon={c.icon} color={c.color} size="sm" />} title={e.name} subtitle={`${formatDay(e.date)}, ${c.name}`}
                  trailing={<><Money>{money(e.amount)}</Money><IconButton label={`Delete ${e.name}`} className="-mr-2 hover:text-coral-600" onClick={() => deleteOneOff(e)}><Trash2 size={16} /></IconButton></>} />
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle>Note</SectionTitle>
        <textarea
          className="w-full rounded-xl border border-line bg-white p-3 text-sm outline-none placeholder:text-slate-400 focus:border-ink-500 dark:border-line-dark dark:bg-paper-dark"
          rows={2}
          placeholder="Anything to remember for this month"
          defaultValue={month.note ?? ''}
          onBlur={(e) => { if ((e.target.value || undefined) !== month.note) updateMonth(monthKey, (m) => ({ ...m, note: e.target.value || undefined })) }}
        />
      </Card>

      <button onClick={() => setOneOffModal('new')} aria-label="Add expense" title="Add expense"
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-20 flex size-14 items-center justify-center rounded-full bg-mint-400 text-ink-950 shadow-lg shadow-mint-600/30 transition hover:bg-mint-300 active:scale-95 sm:bottom-6">
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <Modal open={Boolean(editingLine)} title={editingLine ? `${editingLine.name} this month` : ''} onClose={() => setEditingLine(null)}>
        {editingLine && (
          <LineOverrideForm line={editingLine} currency={state.currency}
            onSave={(amount) => {
              updateMonth(monthKey, (m) => {
                const ov = { ...m.overrides[editingLine.id] }
                if (amount === null) delete ov.amount; else ov.amount = amount
                return { ...m, overrides: { ...m.overrides, [editingLine.id]: ov } }
              })
              setEditingLine(null)
            }} />
        )}
      </Modal>

      <Modal open={oneOffModal !== null} title={oneOffModal === 'new' ? 'Add expense' : 'Edit expense'} onClose={() => setOneOffModal(null)}>
        {oneOffModal && (
          <OneOffForm monthKey={monthKey} initial={oneOffModal === 'new' ? undefined : oneOffModal}
            onSave={(e) => {
              updateMonth(monthKey, (m) => ({ ...m, oneOffs: m.oneOffs.some((x) => x.id === e.id) ? m.oneOffs.map((x) => (x.id === e.id ? e : x)) : [...m.oneOffs, e] }))
              setOneOffModal(null)
            }}
            onCancel={() => setOneOffModal(null)} />
        )}
      </Modal>
    </div>
  )
}

/** Commits on blur/Enter so every keystroke doesn't rewrite storage and re-render the page. */
function MoneyField({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)
  const shown = focused ? draft : value ? String(value) : ''
  return (
    <AmountInput value={shown} onChange={setDraft}
      onFocus={() => { setDraft(value ? String(value) : ''); setFocused(true) }}
      onBlur={() => { setFocused(false); const v = parseAmount(draft); if (v !== value) onCommit(v) }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
  )
}

function LineOverrideForm({ line, currency, onSave }: { line: ResolvedLine; currency: string; onSave: (amount: number | null) => void }) {
  const [amount, setAmount] = useState(String(line.amount))
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(parseAmount(amount)) }} className="space-y-4">
      <p className="text-sm text-slate-500">Usually {formatMoney(line.defaultAmount, currency)}. Change it for this month only, for a promo or a one-time increase. To change it for good, edit it under Recurring.</p>
      <Field label="Amount this month"><AmountInput value={amount} onChange={setAmount} autoFocus /></Field>
      <div className="flex justify-end gap-2">
        {line.amount !== line.defaultAmount && <Button type="button" variant="secondary" onClick={() => onSave(null)}>Reset to usual</Button>}
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}
