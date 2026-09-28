import { useEffect, useState } from 'react'
import { CalendarDays, ChartPie, Repeat, Settings, Wallet } from 'lucide-react'
import { MonthPage } from './pages/MonthPage'
import { CalendarPage } from './pages/CalendarPage'
import { RecurringPage } from './pages/RecurringPage'
import { InsightsPage } from './pages/InsightsPage'
import { SettingsPage } from './pages/SettingsPage'
import { currentMonthKey, shiftMonth } from './lib/months'
import { getState, requestPersistentStorage, useAppState } from './lib/store'
import { applyTheme, watchSystemTheme } from './lib/theme'
import { useSwipe } from './lib/useSwipe'
import { InstallBanner } from './components/InstallBanner'
import { ToastHost } from './components/Toast'
import { cx } from './components/ui'
import { WelcomeSheet } from './components/WelcomeSheet'
import { useT, type Key } from './lib/i18n'

type Tab = 'month' | 'calendar' | 'recurring' | 'insights' | 'settings'

const TABS: { id: Tab; label: Key; Icon: typeof Wallet }[] = [
  { id: 'month', label: 'nav.month', Icon: Wallet },
  { id: 'calendar', label: 'nav.calendar', Icon: CalendarDays },
  { id: 'recurring', label: 'nav.recurring', Icon: Repeat },
  { id: 'insights', label: 'nav.insights', Icon: ChartPie },
  { id: 'settings', label: 'nav.settings', Icon: Settings },
]

const MONTH_TABS: Tab[] = ['month', 'calendar', 'insights']

export default function App() {
  const { theme } = useAppState()
  const t = useT()
  const [tab, setTab] = useState<Tab>('month')
  const [monthKey, setMonthKey] = useState(currentMonthKey)
  const swipe = useSwipe(
    () => MONTH_TABS.includes(tab) && setMonthKey((k) => shiftMonth(k, 1)),
    () => MONTH_TABS.includes(tab) && setMonthKey((k) => shiftMonth(k, -1)),
  )

  useEffect(() => { requestPersistentStorage() }, [])
  useEffect(() => { applyTheme(theme) }, [theme])
  useEffect(() => watchSystemTheme(() => getState().theme), [])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [tab])

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="sticky top-0 z-10 hidden items-center justify-between px-4 py-3 sm:flex">
        <div className="flex items-center gap-2 font-display font-semibold">
          <img src="favicon.svg" alt="" className="size-7 rounded-lg" /> {t('app.name')}
        </div>
        <nav className="flex gap-1 rounded-full border border-line bg-card p-1 dark:border-line-dark dark:bg-card-dark">
          {TABS.map((t_) => (
            <button key={t_.id} onClick={() => setTab(t_.id)} className={cx('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium', tab === t_.id ? 'bg-ink-600 text-white' : 'text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10')}>
              <t_.Icon size={16} /> {t(t_.label)}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 px-4 pb-32 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:pb-10" {...swipe}>
        <InstallBanner />
        {tab === 'month' && <MonthPage monthKey={monthKey} onMonthChange={setMonthKey} goTo={setTab} />}
        {tab === 'calendar' && <CalendarPage monthKey={monthKey} onMonthChange={setMonthKey} />}
        {tab === 'recurring' && <RecurringPage />}
        {tab === 'insights' && <InsightsPage monthKey={monthKey} onMonthChange={setMonthKey} />}
        {tab === 'settings' && <SettingsPage />}
      </main>

      <ToastHost />
      <WelcomeSheet />

      <nav className="fixed inset-x-0 bottom-0 z-10 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:hidden" aria-label="Main">
        <div className="mx-auto flex max-w-md items-center rounded-full border border-line bg-card/95 p-1.5 shadow-xl shadow-ink-950/10 backdrop-blur dark:border-line-dark dark:bg-card-dark/95">
          {TABS.map((t_) => {
            const active = tab === t_.id
            return (
              <button key={t_.id} onClick={() => setTab(t_.id)} aria-current={active ? 'page' : undefined} aria-label={t(t_.label)}
                className={cx('flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-medium transition', active ? 'bg-ink-600 text-white' : 'text-slate-500 dark:text-slate-400')}>
                <t_.Icon size={20} strokeWidth={active ? 2.4 : 2} />
                {t(t_.label)}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
