import type { ForecastMonth } from '../lib/calc'
import { formatMoney } from '../lib/format'
import { formatMonth, monthName, splitKey } from '../lib/months'
import { useT } from '../lib/i18n'
import { cx, Pill } from './ui'

/**
 * What the coming months look like: money left in each, plus the moments that change it
 * (a credit's last payment, a quarterly or yearly charge landing).
 */
export function ForecastList({ months, currency, layout }: { months: ForecastMonth[]; currency: string; layout: 'list' | 'columns' }) {
  const t = useT()
  const money = (n: number) => formatMoney(n, currency, { compact: true })
  // Columns scale to the fullest month, so differences between months are visible.
  const top = Math.max(1, ...months.map((m) => Math.abs(m.summary.remaining)))

  const events = (m: ForecastMonth) => [
    ...m.ending.map((r) => <Pill key={`e-${r.id}`} tone="good">{t('fc.ends', { name: r.name })}</Pill>),
    ...m.lumps.map((l) => <Pill key={`l-${l.id}`} tone="warn">{t('fc.lump', { name: l.name, amount: money(l.amount) })}</Pill>),
  ]

  if (layout === 'list') {
    return (
      <ul className="divide-y divide-hairline">
        {months.map((m) => {
          const left = m.summary.remaining
          const tags = events(m)
          return (
            <li key={m.key} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium capitalize">{formatMonth(m.key)}</span>
                {m.summary.income > 0
                  ? <span className={cx('font-display tnum font-semibold', left < 0 ? 'text-ebb-600 dark:text-ebb-300' : 'text-tide-700 dark:text-tide-300')}>{left < 0 ? t('fc.short', { amount: money(-left) }) : t('fc.left', { amount: money(left) })}</span>
                  : <span className="text-muted">–</span>}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">{tags.length ? tags.slice(0, 3) : <span className="text-[13px] text-muted">{t('fc.quiet')}</span>}</div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
      {months.map((m) => {
        const left = m.summary.remaining
        const height = m.summary.income > 0 ? Math.max(4, (Math.abs(left) / top) * 100) : 0
        return (
          <div key={m.key} className="min-w-0">
            <div className="text-[13px] font-medium capitalize text-muted">{monthName(splitKey(m.key).month, 'long')}</div>
            <div className={cx('font-display tnum text-xl font-semibold tracking-[-0.01em]', left < 0 ? 'text-ebb-600 dark:text-ebb-300' : '')}>{m.summary.income > 0 ? money(left) : '–'}</div>
            {/* The column of water: how much of the month's income is still there at the end. */}
            <div className="mt-2 flex h-16 items-end rounded-xl bg-sunk p-1" aria-hidden>
              <div className={cx('w-full rounded-lg', left < 0 ? 'bg-ebb-400/70' : 'bg-tide-400/80')} style={{ height: `${height}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">{events(m)}</div>
          </div>
        )
      })}
    </div>
  )
}
