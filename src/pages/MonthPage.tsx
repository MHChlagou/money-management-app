import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import { AmountInput, Button, Card, CategoryDot, cx, Empty, Field, IconButton, Modal, Money, Pill, Row, SectionTitle } from '../components/ui'
import { MonthNav } from '../components/MonthNav'
import { SavingsCard } from '../components/SavingsCard'
import { TideChart } from '../components/TideChart'
import { MonthDial } from '../components/MonthDial'
import { AnimatedMoney } from '../components/AnimatedMoney'
import { MonthSwap } from '../components/MonthSwap'
import { ForecastList } from '../components/Forecast'
import { PaceNeedle, PotRings, ReserveGauge, SplitBar, StatCard } from '../components/StatCard'
import { deleteOneOff, saveOneOff, setState, updateMonth, useAppState } from '../lib/store'
import { budgetStatus, categoryById, dailyBalance, forecast, getMonth, potBalance, resolveLines, spendingPace, summarize, totalSaved, upcomingPayments, type ResolvedLine } from '../lib/calc'
import { formatMoney, formatMoneyFit, formatPct, parseAmount } from '../lib/format'
import { currentMonthKey, daysInMonth, formatDay, formatMonth, pad2 } from '../lib/months'
import { showToast } from '../lib/toast'
import { sampleState } from '../lib/sample'
import { openExpenseSheet } from '../lib/ui'
import { useMonthDirection } from '../lib/useMonthDirection'
import { greeting, intervalLabel, kindLabel, useT } from '../lib/i18n'
import type { OneOffExpense } from '../lib/types'

/** Home: the month at a glance. A dial and four instrument cards up top, then the detail as cards. */
export function MonthPage({ monthKey, onMonthChange, goTo }: { monthKey: string; onMonthChange: (k: string) => void; goTo: (tab: 'recurring' | 'insights' | 'calendar') => void }) {
  const state = useAppState()
  const t = useT()
  const month = getMonth(state, monthKey)
  const lines = resolveLines(state, monthKey)
  const sum = summarize(state, monthKey)
  const pace = spendingPace(state, monthKey)
  const points = dailyBalance(state, monthKey)
  const money = (n: number, compact = false) => formatMoney(n, state.currency, { compact })
  const fit = (n: number) => formatMoneyFit(n, state.currency)
  const [editingLine, setEditingLine] = useState<ResolvedLine | null>(null)
  const [scrubDay, setScrubDay] = useState<number | null>(null)
  const [today] = useState(() => new Date().getDate())
  const { dir, moved } = useMonthDirection(monthKey)
  const isEmptyApp = state.recurring.length === 0 && Object.keys(state.months).length === 0 && state.defaultSalary === 0

  const nowKey = currentMonthKey()
  const days = daysInMonth(monthKey)
  const isCurrent = monthKey === nowKey
  // Days already behind us: everything in a past month, nothing in a future one.
  const paidThrough = isCurrent ? today : monthKey < nowKey ? days : 0
  const restDay = isCurrent ? today : monthKey < nowKey ? days : 1
  const goalMet = sum.income > 0 && sum.savingsRate >= state.savingsGoalPct / 100
  const budgets = budgetStatus(state, monthKey)
  const overBudget = budgets.filter((b) => b.share > 1)
  const upcoming = isCurrent ? upcomingPayments(state, 7) : []
  // The slot beside the curve shows what is due next; with nothing due, the coming months take it instead.
  const showUpcoming = isCurrent && upcoming.length > 0
  // From 1280px: savings, budgets and the coming months share a row of three. Income, then the note, fill whatever
  // slots that row leaves free, so the grid has no holes; a full row sends both to the next one, side by side.
  const freeSlots = 2 - (budgets.length > 0 ? 1 : 0) - (showUpcoming && state.defaultSalary > 0 ? 1 : 0)
  const incomeSpan = freeSlots > 0 ? 'xl:col-span-4' : 'xl:col-span-6'
  const noteSpan = freeSlots === 2 ? 'xl:col-span-4' : freeSlots === 1 ? 'xl:col-span-12' : 'xl:col-span-6'
  // From 768px the same group pairs up two by two: savings, budgets, coming months, income. The note closes the last pair or takes a full row.
  const mdCards = 2 + (budgets.length > 0 ? 1 : 0) + (showUpcoming && state.defaultSalary > 0 ? 1 : 0)
  const mdNoteSpan = mdCards % 2 === 1 ? 'md:col-span-3' : 'md:col-span-6'
  const coming = forecast(state, monthKey, 3)
  const saved = totalSaved(state)
  const dayLabel = (d: number) => formatDay(`${monthKey}-${pad2(d)}`)
  const leftLabel = sum.kept < 0 ? t('hero.over') : sum.remaining < 0 ? t('hero.overAside') : t('hero.left')
  const unit = pace.daysLeft === 1 ? t('common.day') : t('common.days')
  const aheadAbs = pace.ahead === null ? 0 : Math.abs(pace.ahead)

  const deleteExpense = (e: OneOffExpense) => {
    deleteOneOff(e)
    showToast(t('toast.deleted', { name: e.name }), () => saveOneOff(e))
  }
  const swap = (name: string, children: ReactNode) => <MonthSwap key={`${name}-${monthKey}`} dir={dir} animateIn={moved}>{children}</MonthSwap>
  const axisDays = [1, 8, 15, 22, days].filter((d) => !(isCurrent && today < days && Math.abs(d - today) < 3))

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 sm:items-center md:mb-7">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.02em] md:text-[34px]">{state.userName ? greeting(state.userName) : t('home.title')}</h1>
          {isCurrent && <p className="mt-1 text-sm capitalize text-muted">{formatDay(`${monthKey}-${pad2(today)}`)}</p>}
        </div>
        <MonthNav value={monthKey} onChange={onMonthChange} />
      </div>

      {isEmptyApp && (
        <Card className="mb-4">
          <h2 className="font-display text-lg font-semibold">{t('welcome.title')}</h2>
          <p className="mb-4 mt-1 max-w-prose text-sm text-muted">{t('welcome.cardText')}</p>
          <div className="flex flex-wrap gap-2">
            <Button className="w-full sm:w-auto" onClick={() => goTo('recurring')}>{t('welcome.addRecurring')}</Button>
            <Button className="w-full sm:w-auto" variant="secondary" onClick={() => setState((s) => ({ ...sampleState(), language: s.language, userName: s.userName, onboarded: true }))}>{t('welcome.loadExample')}</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-flow-dense md:grid-cols-6 xl:grid-cols-12 xl:gap-5">
        {/* The dial */}
        <section className="col-span-2 flex flex-col rounded-[28px] bg-surface p-4 ring-1 ring-hairline sm:p-6 md:col-span-3 md:row-span-2 xl:col-span-5">
          <MonthDial
            points={points}
            restDay={restDay}
            scrubDay={scrubDay}
            onScrub={setScrubDay}
            income={sum.income}
            paidThrough={paidThrough}
            categoryColor={(id) => categoryById(state, id).color}
            money={(n) => money(n, true)}
            text={{ label: t('dial.label'), dayLabel, resting: isCurrent ? t('dial.leftToday') : t('dial.left'), after: (d) => t('dial.after', { day: d }), endsAt: t('dial.endsAt', { amount: money(sum.remaining, true) }) }}
          />
          {sum.income > 0 && (
            <div className="mt-auto flex flex-wrap justify-center gap-2 pt-5 text-xs">
              <span className={cx('rounded-full px-2.5 py-1 font-medium', goalMet ? 'bg-tide-100 text-tide-700 dark:bg-tide-300/12 dark:text-tide-300' : 'bg-sunk text-muted')}>
                {goalMet ? t('hero.goalMet') : t('hero.goal')}: {t('hero.keep', { pct: state.savingsGoalPct })} <span className="opacity-75">{t('hero.now', { pct: formatPct(sum.savingsRate) })}</span>
              </span>
              {overBudget.length > 0 && (
                <button onClick={() => goTo('insights')} className="rounded-full bg-ebb-100 px-2.5 py-1 font-medium text-ebb-700 transition-colors duration-150 hover:bg-ebb-100/70 dark:bg-ebb-400/15 dark:text-ebb-300">
                  {overBudget.length === 1 ? t('hero.overBudgetOne', { name: overBudget[0].category.name }) : t('hero.overBudgetMany', { n: overBudget.length })}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Four instruments */}
        <StatCard size="lg" className="col-span-2 md:col-span-3 xl:col-span-4" label={leftLabel} tone={sum.remaining < 0 ? 'bad' : 'good'}
          value={<AnimatedMoney value={Math.abs(sum.remaining)} format={(n) => money(n, true)} />}
          sub={sum.income > 0 ? (sum.remaining < 0 ? t('home.overBy', { amount: money(-sum.remaining, true) }) : t('home.reserveOf', { pct: formatPct(sum.remaining / sum.income) })) : t('hero.addSalary')}
          instrument={<ReserveGauge fraction={sum.income > 0 ? sum.remaining / sum.income : 0} negative={sum.remaining < 0} />} />

        <StatCard size="lg" className="col-span-1 md:col-span-3 xl:col-span-3" label={t('pace.safe')}
          value={pace.daysLeft > 0 && sum.remaining > 0 ? <AnimatedMoney value={pace.perDay} format={(n) => money(n, true)} /> : '–'}
          sub={!pace.isCurrent
            ? (pace.daysLeft > 0 ? t('pace.forDays', { n: pace.daysLeft, unit }) : t('pace.past', { amount: money(sum.remaining, true) }))
            : sum.remaining <= 0 ? t('pace.over')
            : pace.ahead === null || aheadAbs < 1 ? t('pace.forDays', { n: pace.daysLeft, unit })
            : pace.ahead > 0 ? t('pace.ahead', { amount: money(aheadAbs, true) }) : t('pace.behind', { amount: money(aheadAbs, true) })}
          instrument={<PaceNeedle k={pace.ahead === null ? null : pace.ahead / Math.max(1, sum.income * 0.1)} />} />

        <StatCard size="lg" className="col-span-1 md:col-span-3 xl:col-span-4" label={t('home.spent')}
          value={<AnimatedMoney value={sum.expenses} format={(n) => money(n, true)} />}
          sub={sum.income > 0 ? t('home.ofIncome', { income: money(sum.income, true) }) : undefined}
          footer={sum.income > 0 && <SplitBar parts={[
            { key: 'spent', value: sum.expenses, className: 'bg-ebb-500 dark:bg-ebb-400', label: `${t('home.legendSpent')} ${money(sum.expenses, true)}` },
            { key: 'aside', value: sum.setAside, className: 'bg-sand-400', label: `${t('home.legendAside')} ${money(sum.setAside, true)}` },
            { key: 'left', value: Math.max(0, sum.remaining), className: 'bg-tide-500 dark:bg-tide-300', label: `${t('home.legendLeft')} ${money(Math.max(0, sum.remaining), true)}` },
          ]} />} />

        <StatCard size="lg" className="col-span-2 md:col-span-3 xl:col-span-3" label={t('home.saved')}
          value={<AnimatedMoney value={saved} format={(n) => money(n, true)} />}
          sub={state.pots.length ? t('savings.total', { n: state.pots.length, unit: state.pots.length === 1 ? t('savings.pot1') : t('savings.potN') }) : t('home.noPots')}
          instrument={state.pots.length > 0 && <PotRings pots={state.pots.map((p) => ({ id: p.id, color: p.color, fraction: p.target ? potBalance(p) / p.target : 1 }))} />} />

        {/* The month day by day */}
        <section className="col-span-2 overflow-hidden rounded-2xl bg-surface ring-1 ring-hairline md:col-span-6 xl:col-span-8">
          <div className="px-4 pt-4 sm:px-5 sm:pt-5"><SectionTitle sub={t('home.tideSub')}>{t('home.tide')}</SectionTitle></div>
          <TideChart className="h-[160px] sm:h-[210px]" points={points} todayDay={paidThrough} scrubDay={scrubDay} onScrub={setScrubDay}
            label={t('tide.aria', { month: formatMonth(monthKey), start: money(points[0].balance, true), end: money(points[points.length - 1].balance, true) })}
            valueText={(d) => `${dayLabel(d)}: ${t('tide.dayLeft', { amount: money(points[d].balance, true) })}`} />
          <div className="relative h-8 text-[11px] text-muted" aria-hidden>
            {axisDays.map((d) => <span key={d} className="tnum absolute top-2 -translate-x-1/2" style={{ left: `clamp(14px, ${(d / days) * 100}%, calc(100% - 14px))` }}>{d}</span>)}
            {isCurrent && today < days && <span className="absolute top-2 -translate-x-1/2 font-semibold text-ink" style={{ left: `${(today / days) * 100}%` }}>{t('tide.today')}</span>}
          </div>
        </section>

        {showUpcoming ? (
          <Card className="col-span-2 md:col-span-6 xl:col-span-4">
            <SectionTitle action={<Button variant="ghost" className="min-h-9 px-3" onClick={() => goTo('calendar')}>{t('nav.calendar')} <ChevronRight size={15} /></Button>}>{t('upcoming.title')}</SectionTitle>
            {upcoming.length === 0 ? <p className="text-sm text-muted">{t('upcoming.none')}</p> : (
              <ul className="-my-1 divide-y divide-hairline">
                {upcoming.slice(0, 5).map((e) => {
                  const c = categoryById(state, e.categoryId)
                  return <Row key={`${e.monthKey}-${e.id}`} icon={<CategoryDot icon={c.icon} color={c.color} size="sm" />} title={e.name} subtitle={formatDay(`${e.monthKey}-${pad2(e.day)}`)} trailing={<Money>{fit(e.amount)}</Money>} />
                })}
              </ul>
            )}
          </Card>
        ) : state.defaultSalary > 0 && (
          <Card className="col-span-2 md:col-span-6 xl:col-span-4">
            <SectionTitle action={<Button variant="ghost" className="min-h-9 px-3" onClick={() => goTo('insights')}>{t('fc.more')} <ChevronRight size={15} /></Button>}>{t('fc.coming')}</SectionTitle>
            <ForecastList months={coming} currency={state.currency} layout="list" />
          </Card>
        )}

        {/* The detail */}
        <Card className="col-span-2 md:col-span-6 xl:col-span-6">
          <SectionTitle sub={t('common.thisMonth', { amount: money(sum.variable) })} action={<Button variant="ghost" className="min-h-9 px-3" onClick={() => openExpenseSheet({ monthKey })}><Plus size={15} /> {t('common.add')}</Button>}>{t('oneoff.title')}</SectionTitle>
          {swap('oneoffs', month.oneOffs.length === 0 ? <Empty>{t('oneoff.empty')}</Empty> : (
            <ul className="-my-1 divide-y divide-hairline">
              {[...month.oneOffs].sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
                const c = categoryById(state, e.categoryId)
                return (
                  <Row key={e.id} onClick={() => openExpenseSheet({ monthKey, initial: e })} icon={<CategoryDot icon={c.icon} color={c.color} size="sm" />} title={e.name} subtitle={`${formatDay(e.date)}, ${c.name}`}
                    trailing={<><Money>{fit(e.amount)}</Money><IconButton label={t('oneoff.deleteA', { name: e.name })} className="-mr-2 hover:text-ebb-600 dark:hover:text-ebb-400" onClick={() => deleteExpense(e)}><Trash2 size={16} /></IconButton></>} />
                )
              })}
            </ul>
          ))}
        </Card>

        <Card className="col-span-2 md:col-span-6 xl:col-span-6">
          <SectionTitle sub={t('common.thisMonth', { amount: money(sum.fixed) })} action={<Button variant="ghost" className="min-h-9 px-3" onClick={() => goTo('recurring')}>{t('common.manage')} <ChevronRight size={15} /></Button>}>{t('recurring.title')}</SectionTitle>
          {swap('recurring', lines.length === 0 ? (
            <Empty action={<Button variant="secondary" onClick={() => goTo('recurring')}>{t('recurring.addOne')}</Button>}>{t('recurring.empty')}</Empty>
          ) : (
            <ul className="-my-1 divide-y divide-hairline">
              {lines.map((l) => {
                const c = categoryById(state, l.categoryId)
                return (
                  <Row key={l.id} muted={l.skipped} onClick={() => setEditingLine(l)}
                    icon={<CategoryDot icon={c.icon} color={c.color} size="sm" />}
                    title={l.name} badges={<>{l.isLastMonth && <Pill tone="good">{t('pill.lastOne')}</Pill>}{l.amount !== l.defaultAmount && <Pill tone="warn">{t('pill.edited')}</Pill>}{l.intervalMonths > 1 && <Pill tone="brand">{intervalLabel(l.intervalMonths)}</Pill>}</>}
                    subtitle={<>{kindLabel(l.kind)}, {c.name}{l.dayOfMonth ? <>, <span className="whitespace-nowrap">{t('recurring.day', { n: l.dayOfMonth })}</span></> : null}</>}
                    trailing={<Money>{fit(l.amount)}</Money>}>
                    {/* The padded label gives a 44px tap area; negative margins keep the 20px box in the layout. */}
                    <label className="-m-3 flex shrink-0 p-3">
                      <input type="checkbox" checked={!l.skipped}
                        onChange={(e) => updateMonth(monthKey, (m) => ({ ...m, overrides: { ...m.overrides, [l.id]: { ...m.overrides[l.id], skipped: !e.target.checked } } }))}
                        className="size-5" aria-label={t('recurring.include', { name: l.name })} />
                    </label>
                  </Row>
                )
              })}
            </ul>
          ))}
        </Card>

        <div className="col-span-2 md:col-span-3 xl:col-span-4 [&>section]:h-full">
          <SavingsCard monthKey={monthKey} />
        </div>

        {budgets.length > 0 && (
          <Card className="col-span-2 md:col-span-3 xl:col-span-4">
            <SectionTitle sub={t('ins.budgetsSub')} action={<Button variant="ghost" className="min-h-9 px-3" onClick={() => goTo('insights')}>{t('nav.insights')} <ChevronRight size={15} /></Button>}>{t('ins.budgets')}</SectionTitle>
            <ul className="space-y-3.5">
              {budgets.map((b) => {
                const over = b.share > 1
                return (
                  <li key={b.category.id}>
                    <div className="flex items-center gap-2 text-sm">
                      <span aria-hidden>{b.category.icon}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{b.category.name}</span>
                      <span className={cx('tnum shrink-0', over && 'text-ebb-600 dark:text-ebb-400')}>{money(b.amount, true)} <span className="text-muted">/ {money(b.budget!, true)}</span></span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunk">
                      <div className={cx('h-full origin-left rounded-full transition-transform duration-500 ease-ui', over ? 'bg-ebb-500' : b.share > 0.8 ? 'bg-sand-400' : 'bg-tide-500 dark:bg-tide-300')} style={{ transform: `scaleX(${Math.min(1, b.share)})` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}

        {showUpcoming && state.defaultSalary > 0 && (
          <Card className="col-span-2 md:col-span-3 xl:col-span-4">
            <SectionTitle action={<Button variant="ghost" className="min-h-9 px-3" onClick={() => goTo('insights')}>{t('fc.more')} <ChevronRight size={15} /></Button>}>{t('fc.coming')}</SectionTitle>
            <ForecastList months={coming} currency={state.currency} layout="list" />
          </Card>
        )}

        <Card className={cx('col-span-2 md:col-span-3', incomeSpan)}>
          <SectionTitle>{t('income.title')}</SectionTitle>
          {swap('income', <>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('income.salary')} hint={sum.usesDefaultSalary && state.defaultSalary > 0 ? t('income.default') : undefined}>
                <MoneyField value={sum.salary} onCommit={(v) => updateMonth(monthKey, (m) => ({ ...m, salary: v }))} />
              </Field>
              <Field label={t('income.extra')} hint={t('income.extraHint')}>
                <MoneyField value={month.extraIncome} onCommit={(v) => updateMonth(monthKey, (m) => ({ ...m, extraIncome: v }))} />
              </Field>
            </div>
            {!sum.usesDefaultSalary && sum.salary !== state.defaultSalary && sum.salary > 0 && (
              <button className="mt-3 text-[13px] font-medium text-deep-700 underline-offset-4 hover:underline dark:text-tide-300" onClick={() => { setState((s) => ({ ...s, defaultSalary: sum.salary })); showToast(t('toast.defaultSalary')) }}>
                {t('income.useDefault', { amount: money(sum.salary) })}
              </button>
            )}
          </>)}
        </Card>

        <Card className={cx('col-span-2', mdNoteSpan, noteSpan)}>
          <SectionTitle>{t('note.title')}</SectionTitle>
          {swap('note',
            <textarea
              className="min-h-24 w-full rounded-xl border border-hairline bg-canvas/60 p-3 text-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted focus:border-deep-700 focus:ring-3 focus:ring-deep-700/15 dark:focus:border-tide-300 dark:focus:ring-tide-300/20"
              rows={3}
              placeholder={t('note.placeholder')}
              defaultValue={month.note ?? ''}
              onBlur={(e) => { if ((e.target.value || undefined) !== month.note) updateMonth(monthKey, (m) => ({ ...m, note: e.target.value || undefined })) }}
            />)}
        </Card>
      </div>

      <Modal open={Boolean(editingLine)} title={editingLine ? t('override.title', { name: editingLine.name }) : ''} onClose={() => setEditingLine(null)}>
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
  const t = useT()
  const [amount, setAmount] = useState(String(line.amount))
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(parseAmount(amount)) }} className="space-y-4">
      <p className="text-sm text-muted">{t('override.usually', { amount: formatMoney(line.defaultAmount, currency) })}</p>
      <Field label={t('override.amount')}><AmountInput value={amount} onChange={setAmount} autoFocus /></Field>
      <div className="flex justify-end gap-2">
        {line.amount !== line.defaultAmount && <Button type="button" variant="secondary" onClick={() => onSave(null)}>{t('override.reset')}</Button>}
        <Button type="submit">{t('common.save')}</Button>
      </div>
    </form>
  )
}
