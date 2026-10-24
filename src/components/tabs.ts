import { CalendarDays, ChartSpline, Repeat, Settings2, Waves } from 'lucide-react'
import type { Key } from '../lib/i18n'

export type Tab = 'month' | 'calendar' | 'recurring' | 'insights' | 'settings'

/** The five pages, in navigation order. Keys 1 to 5 follow this order. */
export const TABS: { id: Tab; label: Key; Icon: typeof Waves }[] = [
  { id: 'month', label: 'nav.month', Icon: Waves },
  { id: 'calendar', label: 'nav.calendar', Icon: CalendarDays },
  { id: 'recurring', label: 'nav.recurring', Icon: Repeat },
  { id: 'insights', label: 'nav.insights', Icon: ChartSpline },
  { id: 'settings', label: 'nav.settings', Icon: Settings2 },
]

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
export const searchShortcut = isMac ? '⌘K' : 'Ctrl K'
