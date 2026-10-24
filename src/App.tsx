import { lazy, Suspense, useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { Plus } from 'lucide-react'
import { MonthPage } from './pages/MonthPage'
import { CalendarPage } from './pages/CalendarPage'
import { RecurringPage } from './pages/RecurringPage'
import { SettingsPage } from './pages/SettingsPage'
import { currentMonthKey, shiftMonth } from './lib/months'
import { getState, requestPersistentStorage, useAppState } from './lib/store'
import { applyTheme, watchSystemTheme } from './lib/theme'
import { useSwipe } from './lib/useSwipe'
import { useHideOnScroll } from './lib/useHideOnScroll'
import { cx } from './components/ui'
import { openExpenseSheet, setPaletteOpen, useUi } from './lib/ui'
import { InstallBanner } from './components/InstallBanner'
import { ToastHost } from './components/Toast'
import { ConfirmHost } from './components/ConfirmSheet'
import { WelcomeSheet } from './components/WelcomeSheet'
import { ExpenseSheetHost } from './components/ExpenseSheet'
import { CommandPalette } from './components/CommandPalette'
import { BottomBar, Sidebar, TopBar } from './components/Navigation'
import { TABS, type Tab } from './components/tabs'
import { useT } from './lib/i18n'

// Charts (recharts) are only needed on Insights; loading them on demand keeps the first load light.
const InsightsPage = lazy(() => import('./pages/InsightsPage').then((m) => ({ default: m.InsightsPage })))

const MONTH_TABS: Tab[] = ['month', 'calendar', 'insights']

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** Desktop shortcuts. Single keys only fire outside fields and when no sheet is open. */
function useShortcuts({ tab, monthKey, setTab, setMonthKey }: { tab: Tab; monthKey: string; setTab: (t: Tab) => void; setMonthKey: (k: string) => void }) {
  const { paletteOpen } = useUi()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(!paletteOpen); return }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || paletteOpen || document.querySelector('[aria-modal="true"]')) return
      if (e.key === '/') { e.preventDefault(); setPaletteOpen(true) }
      else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openExpenseSheet({ monthKey }) }
      else if (/^[1-5]$/.test(e.key)) setTab(TABS[Number(e.key) - 1].id)
      else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && MONTH_TABS.includes(tab) && !(e.target instanceof Element && e.target.closest('[role="slider"]'))) {
        setMonthKey(shiftMonth(monthKey, e.key === 'ArrowLeft' ? -1 : 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tab, monthKey, paletteOpen, setTab, setMonthKey])
}

export default function App() {
  const { theme } = useAppState()
  const t = useT()
  const [tab, setTab] = useState<Tab>('month')
  const [monthKey, setMonthKey] = useState(currentMonthKey)
  const swipe = useSwipe(
    () => MONTH_TABS.includes(tab) && setMonthKey((k) => shiftMonth(k, 1)),
    () => MONTH_TABS.includes(tab) && setMonthKey((k) => shiftMonth(k, -1)),
  )
  useShortcuts({ tab, monthKey, setTab, setMonthKey })
  const fabHidden = useHideOnScroll()

  useEffect(() => { requestPersistentStorage() }, [])
  useEffect(() => { applyTheme(theme) }, [theme])
  useEffect(() => watchSystemTheme(() => getState().theme), [])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [tab])

  const addExpense = () => openExpenseSheet({ monthKey })

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh md:flex">
        <Sidebar tab={tab} onTab={setTab} onAdd={addExpense} onSearch={() => setPaletteOpen(true)} />

        <main className="mx-auto w-full min-w-0 max-w-[1180px] flex-1 px-4 pb-36 pt-[calc(0.75rem+env(safe-area-inset-top))] md:px-8 md:pb-14 md:pt-8 xl:px-12" {...swipe}>
          <TopBar onSearch={() => setPaletteOpen(true)} />
          <InstallBanner />
          {/* Re-keyed per tab: a short fade marks the switch without moving anything. */}
          <div key={tab} className="animate-page-in">
            {tab === 'month' && <MonthPage monthKey={monthKey} onMonthChange={setMonthKey} goTo={setTab} />}
            {tab === 'calendar' && <CalendarPage monthKey={monthKey} onMonthChange={setMonthKey} />}
            {tab === 'recurring' && <RecurringPage />}
            {tab === 'insights' && <Suspense fallback={<div className="h-[70vh]" aria-busy="true" />}><InsightsPage monthKey={monthKey} onMonthChange={setMonthKey} /></Suspense>}
            {tab === 'settings' && <SettingsPage />}
          </div>
        </main>

        {tab !== 'settings' && (
          <button onClick={addExpense} aria-label={t('nav.add')} title={t('nav.add')}
            className={cx('fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-30 flex size-14 items-center justify-center rounded-[20px] bg-accent text-on-accent shadow-[0_12px_28px_-10px_rgb(5_10_18/0.45)] transition-[transform,opacity] duration-200 ease-ui hover:opacity-90 active:scale-[0.94] md:hidden', fabHidden && 'pointer-events-none translate-y-24 opacity-0')}>
            <Plus size={26} strokeWidth={2.5} />
          </button>
        )}

        <BottomBar tab={tab} onTab={setTab} />
        <ExpenseSheetHost />
        <CommandPalette onTab={setTab} onMonth={setMonthKey} monthKey={monthKey} />
        <ToastHost />
        <WelcomeSheet />
        <ConfirmHost />
      </div>
    </MotionConfig>
  )
}
