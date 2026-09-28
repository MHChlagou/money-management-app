import { useEffect, useState } from 'react'
import { MonthPage } from './pages/MonthPage'
import { CalendarPage } from './pages/CalendarPage'
import { RecurringPage } from './pages/RecurringPage'
import { InsightsPage } from './pages/InsightsPage'
import { SettingsPage } from './pages/SettingsPage'
import { currentMonthKey } from './lib/months'
import { getState, requestPersistentStorage, useAppState } from './lib/store'
import { applyTheme, watchSystemTheme } from './lib/theme'
import { InstallBanner } from './components/InstallBanner'
import { ToastHost } from './components/Toast'
import { cx } from './components/ui'

type Tab = 'month' | 'calendar' | 'recurring' | 'insights' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'month', label: 'Month', icon: '💶' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'recurring', label: 'Recurring', icon: '🔁' },
  { id: 'insights', label: 'Insights', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function App() {
  const { theme } = useAppState()
  const [tab, setTab] = useState<Tab>('month')
  const [monthKey, setMonthKey] = useState(currentMonthKey)

  useEffect(() => { requestPersistentStorage() }, [])
  useEffect(() => { applyTheme(theme) }, [theme])
  useEffect(() => watchSystemTheme(() => getState().theme), [])

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="sticky top-0 z-10 hidden items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:flex dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-2 font-semibold">
          <img src="favicon.svg" alt="" className="size-6" /> Monthly Money
        </div>
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cx('rounded-lg px-3 py-1.5 text-sm', tab === t.id ? 'bg-brand-100 text-brand-800 dark:bg-brand-800/40 dark:text-brand-100' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 px-4 pb-28 pt-[calc(1rem+env(safe-area-inset-top))] sm:pb-8">
        <InstallBanner />
        {tab === 'month' && <MonthPage monthKey={monthKey} onMonthChange={setMonthKey} goTo={setTab} />}
        {tab === 'calendar' && <CalendarPage monthKey={monthKey} onMonthChange={setMonthKey} />}
        {tab === 'recurring' && <RecurringPage />}
        {tab === 'insights' && <InsightsPage monthKey={monthKey} onMonthChange={setMonthKey} />}
        {tab === 'settings' && <SettingsPage />}
      </main>

      <ToastHost />

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden dark:border-slate-800 dark:bg-slate-950/95" aria-label="Main">
        <div className="mx-auto flex max-w-2xl">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined} className={cx('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]', tab === t.id ? 'text-brand-700 dark:text-brand-500' : 'text-slate-500')}>
              <span className="text-xl leading-none" aria-hidden>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
