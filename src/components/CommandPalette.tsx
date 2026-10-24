import { useEffect, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { CalendarCheck, Plus, Search } from 'lucide-react'
import { CategoryDot, cx } from './ui'
import { lockScroll } from '../lib/scrollLock'
import { useMediaQuery } from '../lib/useMediaQuery'
import { TABS, type Tab } from './tabs'
import { deleteOneOff, saveOneOff, useAppState } from '../lib/store'
import { categoryById, searchEntries } from '../lib/calc'
import { parseQuickAdd } from '../lib/quickAdd'
import { formatMoneyFit } from '../lib/format'
import { currentMonthKey, formatDay, todayIso } from '../lib/months'
import { newId } from '../lib/id'
import { showToast } from '../lib/toast'
import { openExpenseSheet, requestRecurringEdit, setPaletteOpen, useUi } from '../lib/ui'
import { intervalLabel, useT } from '../lib/i18n'

interface Item { id: string; group: string; label: string; detail?: string; icon: ReactNode; trailing?: string; keyHint?: boolean; run: () => void }

/**
 * Search everything, add an expense by typing "Coffee 4.50", or jump to a page.
 * Opens and closes instantly: it is a keyboard tool used many times a day, so it does not animate.
 */
export function CommandPalette({ onTab, onMonth, monthKey }: { onTab: (t: Tab) => void; onMonth: (k: string) => void; monthKey: string }) {
  const { paletteOpen } = useUi()
  if (!paletteOpen) return null
  return <PaletteDialog onTab={onTab} onMonth={onMonth} monthKey={monthKey} />
}

function PaletteDialog({ onTab, onMonth, monthKey }: { onTab: (t: Tab) => void; onMonth: (k: string) => void; monthKey: string }) {
  const state = useAppState()
  const t = useT()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  // Captured on the first render, before the input's autoFocus moves focus.
  const [opener] = useState(() => (document.activeElement instanceof HTMLElement ? document.activeElement : null))
  const close = () => setPaletteOpen(false)

  useEffect(() => {
    const unlock = lockScroll()
    // Escape closes from anywhere, not only from the input (a tap can leave focus elsewhere on phones).
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPaletteOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => { unlock(); window.removeEventListener('keydown', onKey); opener?.focus() }
  }, [opener])
  const narrow = useMediaQuery('(max-width: 639px)')

  const money = (n: number) => formatMoneyFit(n, state.currency)
  const q = query.trim().toLowerCase()
  const items: Item[] = []

  const draft = parseQuickAdd(state, query)
  if (draft) {
    const c = categoryById(state, draft.categoryId)
    items.push({
      id: 'quick-add', group: t('common.add'), label: t('palette.add', { name: draft.name, amount: money(draft.amount) }),
      detail: t('palette.addTo', { category: c.name }), icon: <CategoryDot icon={c.icon} color={c.color} size="sm" />,
      run: () => {
        const expense = { id: newId(), name: draft.name, amount: draft.amount, categoryId: draft.categoryId, date: todayIso() }
        saveOneOff(expense)
        close()
        showToast(t('quick.saved', { name: expense.name }), () => deleteOneOff(expense))
      },
    })
  }
  if (!q) items.push({ id: 'new', group: t('common.add'), label: t('palette.newExpense'), icon: <Plus size={18} />, trailing: 'N', keyHint: true, run: () => openExpenseSheet({ monthKey }) })

  TABS.filter((tab) => !q || t(tab.label).toLowerCase().includes(q)).forEach((tab) =>
    items.push({ id: `tab-${tab.id}`, group: t('palette.goTo'), label: t(tab.label), icon: <tab.Icon size={18} />, trailing: String(TABS.indexOf(tab) + 1), keyHint: true, run: () => { onTab(tab.id); close() } }))
  if (!q || t('palette.thisMonth').toLowerCase().includes(q)) {
    items.push({ id: 'this-month', group: t('palette.goTo'), label: t('palette.thisMonth'), icon: <CalendarCheck size={18} />, run: () => { onMonth(currentMonthKey()); onTab('month'); close() } })
  }

  searchEntries(state, query, 24).forEach((hit) => {
    if (hit.kind === 'oneoff') {
      const e = hit.expense
      items.push({
        id: `o-${e.id}`, group: t('palette.expenses'), label: e.name, detail: `${formatDay(e.date)}, ${hit.category.name}`, trailing: money(e.amount),
        icon: <CategoryDot icon={hit.category.icon} color={hit.category.color} size="sm" />,
        run: () => { onMonth(e.date.slice(0, 7)); onTab('month'); openExpenseSheet({ monthKey: e.date.slice(0, 7), initial: e }) },
      })
    } else {
      const r = hit.item
      items.push({
        id: `r-${r.id}`, group: t('palette.recurring'), label: r.name, detail: `${intervalLabel(r.intervalMonths || 1)}, ${hit.category.name}`, trailing: money(r.amount),
        icon: <CategoryDot icon={hit.category.icon} color={hit.category.color} size="sm" />,
        run: () => { onTab('recurring'); requestRecurringEdit(r.id); close() },
      })
    }
  })

  const current = Math.min(active, Math.max(0, items.length - 1))
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((current + 1) % Math.max(1, items.length)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((current - 1 + items.length) % Math.max(1, items.length)) }
    else if (e.key === 'Enter') { e.preventDefault(); items[current]?.run() }
    else if (e.key === 'Tab') e.preventDefault()
  }

  let lastGroup = ''
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-night/45 px-3 pt-[max(1rem,10vh)]" role="presentation" onMouseDown={close}>
      <div role="dialog" aria-modal="true" aria-label={t('palette.label')} onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[min(560px,80dvh)] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-surface shadow-[0_24px_64px_-20px_rgb(5_10_18/0.5)] ring-1 ring-hairline">
        <div className="flex items-center gap-3 border-b border-hairline px-4">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0) }}
            onKeyDown={onKeyDown}
            placeholder={narrow ? t('palette.placeholderShort') : t('palette.placeholder')}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={items[current] ? `${listId}-${items[current].id}` : undefined}
            aria-label={t('palette.label')}
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
          />
          <button type="button" onClick={close} className="-mr-2 min-h-11 shrink-0 rounded-full px-3 text-sm font-medium text-deep-700 hover:bg-sunk sm:hidden dark:text-tide-300">{t('common.close')}</button>
        </div>
        <ul id={listId} role="listbox" aria-label={t('palette.label')} className="flex-1 overflow-y-auto overscroll-contain p-2">
          {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">{t('palette.none', { q: query.trim() })}</li>}
          {items.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null
            lastGroup = item.group
            return (
              <li key={item.id} role="presentation">
                {header && <div className="px-3 pb-1 pt-3 text-xs font-medium text-muted first:pt-1">{header}</div>}
                <div id={`${listId}-${item.id}`} role="option" aria-selected={i === current} onMouseMove={() => setActive(i)} onClick={() => item.run()}
                  className={cx('flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2', i === current ? 'bg-sunk' : '')}>
                  <span className="flex size-8 shrink-0 items-center justify-center text-muted">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{item.label}</div>
                    {item.detail && <div className="truncate text-[13px] text-muted">{item.detail}</div>}
                  </div>
                  {item.trailing && <span className={cx('tnum shrink-0 text-sm text-muted', item.keyHint && 'pointer-coarse:hidden')}>{item.trailing}</span>}
                </div>
              </li>
            )
          })}
        </ul>
        <div className="hidden border-t border-hairline px-4 py-2.5 text-xs text-muted sm:block">{t('palette.keys')}. {t('palette.shortcuts')}.</div>
      </div>
    </div>
  )
}
