import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { currentMonthKey, formatMonth, monthName, pad2, shiftMonth, splitKey } from '../lib/months'
import { hasData } from '../lib/calc'
import { useAppState } from '../lib/store'
import { EASE_UI } from '../lib/motion'
import { cx } from './ui'
import { useT } from '../lib/i18n'

/** Month header with arrows plus a tap-to-open month/year picker. Dots mark months that hold data. */
export function MonthNav({ value, onChange, tone = 'light', align = 'between' }: { value: string; onChange: (key: string) => void; tone?: 'light' | 'onDark'; align?: 'between' | 'start' }) {
  const state = useAppState()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(() => splitKey(value).year)
  const ref = useRef<HTMLDivElement>(null)
  const today = currentMonthKey()
  const onDark = tone === 'onDark'
  const btn = cx('relative inline-flex size-9 items-center justify-center rounded-full transition-[transform,background-color] duration-150 ease-ui after:absolute after:-inset-1 after:content-[""] active:scale-[0.92]', onDark ? 'text-white/80 hover:bg-white/10' : 'text-muted ring-1 ring-hairline hover:bg-sunk hover:text-ink')

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <div className={cx('flex items-center gap-1', align === 'between' ? 'justify-between' : 'justify-start')}>
        <button className={btn} aria-label={t('nav.prevMonth')} onClick={() => onChange(shiftMonth(value, -1))}><ChevronLeft size={19} /></button>
        <button onClick={() => { setYear(splitKey(value).year); setOpen((o) => !o) }} aria-haspopup="dialog" aria-expanded={open}
          className={cx('flex min-w-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 font-display text-[17px] font-semibold capitalize tracking-[-0.01em] transition-colors duration-150', onDark ? 'text-white hover:bg-white/10' : 'hover:bg-sunk')}>
          {formatMonth(value)} <ChevronDown size={15} className={cx('opacity-60 transition-transform duration-200 ease-ui', open && 'rotate-180')} />
        </button>
        <button className={btn} aria-label={t('nav.nextMonth')} onClick={() => onChange(shiftMonth(value, 1))}><ChevronRight size={19} /></button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, transform: 'translateY(-4px) scale(0.97)' }}
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            exit={{ opacity: 0, transform: 'translateY(-4px) scale(0.97)' }}
            transition={{ duration: 0.18, ease: EASE_UI }}
            className={cx('absolute top-full z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-3xl bg-surface p-3 text-ink shadow-[0_18px_48px_-16px_rgb(5_10_18/0.45)] ring-1 ring-hairline', // Phones: page headers wrap the picker to the left edge, so the popover opens rightwards from there.
              align === 'between' ? 'left-0 origin-top-left sm:left-auto sm:right-0 sm:origin-top-right' : 'left-0 origin-top-left')}
            role="dialog" aria-label={t('nav.pickMonth')}
          >
            <div className="mb-2 flex items-center justify-between">
              <button className="relative inline-flex size-9 items-center justify-center rounded-full after:absolute after:-inset-1 after:content-[''] hover:bg-sunk" aria-label={t('nav.prevYear')} onClick={() => setYear((y) => y - 1)}><ChevronLeft size={18} /></button>
              <span className="font-display font-semibold tnum">{year}</span>
              <button className="relative inline-flex size-9 items-center justify-center rounded-full after:absolute after:-inset-1 after:content-[''] hover:bg-sunk" aria-label={t('nav.nextYear')} onClick={() => setYear((y) => y + 1)}><ChevronRight size={18} /></button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 12 }, (_, i) => {
                const key = `${year}-${pad2(i + 1)}`
                const selected = key === value
                return (
                  <button key={key} onClick={() => { onChange(key); setOpen(false) }}
                    className={cx('relative rounded-xl py-3 text-sm capitalize transition-colors duration-150', selected ? 'bg-accent font-semibold text-on-accent' : key === today ? 'bg-tide-50 font-medium text-tide-700 dark:bg-tide-400/10 dark:text-tide-300' : 'hover:bg-sunk')}>
                    {monthName(i + 1)}
                    {hasData(state, key) && <span className={cx('absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full', selected ? 'bg-current' : 'bg-tide-500')} />}
                  </button>
                )
              })}
            </div>
            <button onClick={() => { onChange(today); setOpen(false) }} className="mt-2 w-full rounded-xl py-2 text-sm font-medium text-tide-700 hover:bg-tide-50 dark:text-tide-300 dark:hover:bg-white/5">{t('nav.goToday')}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
