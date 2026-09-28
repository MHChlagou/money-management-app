import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { currentMonthKey, formatMonth, monthName, pad2, shiftMonth, splitKey } from '../lib/months'
import { hasData } from '../lib/calc'
import { useAppState } from '../lib/store'
import { cx } from './ui'

/** Month header with arrows plus a tap-to-open month/year picker. Dots mark months that hold data. */
export function MonthNav({ value, onChange, tone = 'light' }: { value: string; onChange: (key: string) => void; tone?: 'light' | 'onDark' }) {
  const state = useAppState()
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(() => splitKey(value).year)
  const ref = useRef<HTMLDivElement>(null)
  const today = currentMonthKey()
  const onDark = tone === 'onDark'
  const btn = cx('inline-flex size-9 items-center justify-center rounded-full', onDark ? 'text-white/80 hover:bg-white/15' : 'text-slate-500 hover:bg-slate-900/5 dark:text-slate-400 dark:hover:bg-white/10')

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center justify-between">
        <button className={btn} aria-label="Previous month" onClick={() => onChange(shiftMonth(value, -1))}><ChevronLeft size={20} /></button>
        <button onClick={() => { setYear(splitKey(value).year); setOpen((o) => !o) }} className={cx('flex items-center gap-1 rounded-full px-3 py-1 font-display text-lg font-semibold capitalize', onDark ? 'text-white hover:bg-white/15' : 'hover:bg-slate-900/5 dark:hover:bg-white/10')} aria-haspopup="dialog" aria-expanded={open}>
          {formatMonth(value)} <ChevronDown size={16} className="opacity-60" />
        </button>
        <button className={btn} aria-label="Next month" onClick={() => onChange(shiftMonth(value, 1))}><ChevronRight size={20} /></button>
      </div>

      {open && (
        <div className="absolute left-1/2 top-full z-30 mt-1 w-72 -translate-x-1/2 rounded-2xl border border-line bg-card p-3 text-slate-900 shadow-xl dark:border-line-dark dark:bg-card-dark dark:text-slate-100" role="dialog" aria-label="Pick a month">
          <div className="mb-2 flex items-center justify-between">
            <button className="inline-flex size-9 items-center justify-center rounded-full hover:bg-slate-900/5 dark:hover:bg-white/10" aria-label="Previous year" onClick={() => setYear((y) => y - 1)}><ChevronLeft size={18} /></button>
            <span className="font-display font-semibold">{year}</span>
            <button className="inline-flex size-9 items-center justify-center rounded-full hover:bg-slate-900/5 dark:hover:bg-white/10" aria-label="Next year" onClick={() => setYear((y) => y + 1)}><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {Array.from({ length: 12 }, (_, i) => {
              const key = `${year}-${pad2(i + 1)}`
              const selected = key === value
              return (
                <button key={key} onClick={() => { onChange(key); setOpen(false) }}
                  className={cx('relative rounded-xl py-2 text-sm capitalize', selected ? 'bg-ink-600 text-white' : key === today ? 'bg-ink-50 text-ink-700 dark:bg-ink-500/20 dark:text-ink-200' : 'hover:bg-slate-900/5 dark:hover:bg-white/10')}>
                  {monthName(i + 1)}
                  {hasData(state, key) && <span className={cx('absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full', selected ? 'bg-white' : 'bg-mint-600')} />}
                </button>
              )
            })}
          </div>
          <button onClick={() => { onChange(today); setOpen(false) }} className="mt-2 w-full rounded-xl py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-white/10">Go to this month</button>
        </div>
      )}
    </div>
  )
}
