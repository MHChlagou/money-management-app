import { useEffect, useRef, useState } from 'react'
import { currentMonthKey, formatMonth, monthName, pad2, shiftMonth, splitKey } from '../lib/months'
import { hasData } from '../lib/calc'
import { useAppState } from '../lib/store'
import { cx, IconButton } from './ui'

/** Month header with arrows plus a tap-to-open month/year picker. Dots mark months that hold data. */
export function MonthNav({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const state = useAppState()
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(() => splitKey(value).year)
  const ref = useRef<HTMLDivElement>(null)
  const today = currentMonthKey()

  useEffect(() => { if (open) setYear(splitKey(value).year) }, [open, value])
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center justify-between">
        <IconButton label="Previous month" className="text-xl" onClick={() => onChange(shiftMonth(value, -1))}>‹</IconButton>
        <button onClick={() => setOpen((o) => !o)} className="rounded-xl px-3 py-1 text-center hover:bg-slate-100 dark:hover:bg-slate-800" aria-haspopup="dialog" aria-expanded={open}>
          <div className="text-lg font-semibold capitalize">{formatMonth(value)} <span className="text-xs text-slate-400">▾</span></div>
          {value !== today && <div className="text-xs text-brand-700 dark:text-brand-500">tap to jump</div>}
        </button>
        <IconButton label="Next month" className="text-xl" onClick={() => onChange(shiftMonth(value, 1))}>›</IconButton>
      </div>

      {open && (
        <div className="absolute left-1/2 top-full z-30 mt-1 w-72 -translate-x-1/2 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700" role="dialog" aria-label="Pick a month">
          <div className="mb-2 flex items-center justify-between">
            <IconButton label="Previous year" onClick={() => setYear((y) => y - 1)}>‹</IconButton>
            <span className="font-semibold">{year}</span>
            <IconButton label="Next year" onClick={() => setYear((y) => y + 1)}>›</IconButton>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {Array.from({ length: 12 }, (_, i) => {
              const key = `${year}-${pad2(i + 1)}`
              const selected = key === value
              return (
                <button key={key} onClick={() => { onChange(key); setOpen(false) }}
                  className={cx('relative rounded-lg py-2 text-sm capitalize', selected ? 'bg-brand-700 text-white' : key === today ? 'bg-brand-50 text-brand-800 dark:bg-brand-800/30 dark:text-brand-100' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
                  {monthName(i + 1)}
                  {hasData(state, key) && <span className={cx('absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full', selected ? 'bg-white' : 'bg-brand-600')} />}
                </button>
              )
            })}
          </div>
          <button onClick={() => { onChange(today); setOpen(false) }} className="mt-2 w-full rounded-lg py-1.5 text-sm text-brand-700 hover:bg-brand-50 dark:text-brand-500 dark:hover:bg-slate-800">Today</button>
        </div>
      )}
    </div>
  )
}
