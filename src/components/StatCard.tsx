import type { ReactNode } from 'react'
import { cx } from './ui'

type Tone = 'neutral' | 'good' | 'bad'
const valueTone: Record<Tone, string> = {
  neutral: 'text-ink',
  good: 'text-tide-700 dark:text-tide-300',
  bad: 'text-ebb-600 dark:text-ebb-400',
}

/**
 * A summary card: what it measures, the figure, one line of context, and a small instrument that shows the
 * same fact at a glance (a gauge, a needle, rings). `footer` spans the card's width, for bars.
 */
export function StatCard({ label, value, sub, instrument, footer, tone = 'neutral', size = 'md', onClick, className }: {
  label: string; value: ReactNode; sub?: ReactNode; instrument?: ReactNode; footer?: ReactNode; tone?: Tone
  /** 'lg' grows the figure and instrument on wide screens, for the home page's tall cards. */
  size?: 'md' | 'lg'; onClick?: () => void; className?: string
}) {
  const body = (
    <>
      <div className={cx('flex min-h-12 items-start justify-between gap-2', size === 'lg' && 'xl:min-h-[72px]')}>
        <span className="pt-0.5 text-[13px] font-medium text-muted">{label}</span>
        {instrument && <span className={cx('shrink-0 [&>svg]:size-12', size === 'lg' && 'xl:[&>svg]:size-[72px]')} aria-hidden>{instrument}</span>}
      </div>
      {/* Values line up across a row of cards; context lines line up along the bottom, whatever each card holds. */}
      <div className={cx('font-display-narrow pt-2 text-[28px] font-bold leading-none tracking-[-0.02em] sm:text-[34px]', size === 'lg' && 'xl:text-[42px]', valueTone[tone])}>{value}</div>
      {(sub || footer) && (
        <div className="mt-auto pt-3">
          {sub && <div className="text-[12.5px] leading-snug text-muted">{sub}</div>}
          {footer && <div className="mt-2.5">{footer}</div>}
        </div>
      )}
    </>
  )
  const base = 'flex min-w-0 flex-col rounded-2xl bg-surface p-4 text-left ring-1 ring-hairline'
  return onClick
    ? <button onClick={onClick} className={cx(base, 'transition-[transform,box-shadow] duration-150 ease-ui hover:shadow-[0_10px_30px_-18px_rgb(5_10_18/0.45)] active:scale-[0.985]', className)}>{body}</button>
    : <div className={cx(base, className)}>{body}</div>
}

const polar = (r: number, deg: number) => ({ x: 28 + r * Math.sin((deg * Math.PI) / 180), y: 28 - r * Math.cos((deg * Math.PI) / 180) })
const arcD = (r: number, a0: number, a1: number) => {
  const p0 = polar(r, a0), p1 = polar(r, a1)
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1.x} ${p1.y}`
}

/** Power reserve: a 240 degree gauge filled to `fraction`. */
export function ReserveGauge({ fraction, negative = false }: { fraction: number; negative?: boolean }) {
  const f = Math.max(0, Math.min(1, fraction))
  return (
    <svg viewBox="0 0 56 56" className="size-14">
      <path d={arcD(21, -120, 120)} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={6} strokeLinecap="round" className={negative ? 'text-ebb-500' : 'text-ink'} />
      <path d={arcD(21, -120, 120)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - f} fill="none" stroke="currentColor" strokeWidth={6} strokeLinecap="round"
        className={cx('transition-[stroke-dashoffset] duration-500 ease-ui', negative ? 'text-ebb-500' : 'text-tide-600 dark:text-tide-300')} />
    </svg>
  )
}

/** Pace needle: swings right when spending is under an even pace, left when over. `k` runs from -1 to 1. */
export function PaceNeedle({ k }: { k: number | null }) {
  const a = (k === null ? 0 : Math.max(-1, Math.min(1, k))) * 70
  const tip = polar(19, a)
  return (
    <svg viewBox="0 0 56 56" className="size-14">
      <path d={arcD(21, -75, -5)} fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" className="text-ebb-500/70" />
      <path d={arcD(21, 5, 75)} fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" className="text-tide-600/80 dark:text-tide-300/80" />
      <line x1={28} y1={28} x2={tip.x} y2={tip.y} stroke="currentColor" strokeWidth={3} strokeLinecap="round" className="text-ink transition-all duration-500 ease-ui" />
      <circle cx={28} cy={28} r={3.5} className="fill-ink" />
    </svg>
  )
}

/** Savings pots as concentric progress rings, outermost first. */
export function PotRings({ pots }: { pots: { id: string; fraction: number; color: string }[] }) {
  return (
    <svg viewBox="0 0 56 56" className="size-14 -rotate-90">
      {pots.slice(0, 3).map((p, i) => {
        const r = 22 - i * 7
        const c = 2 * Math.PI * r
        return (
          <g key={p.id}>
            <circle cx={28} cy={28} r={r} fill="none" stroke={p.color} strokeOpacity={0.18} strokeWidth={4.5} />
            <circle cx={28} cy={28} r={r} fill="none" stroke={p.color} strokeWidth={4.5} strokeLinecap="round" strokeDasharray={`${c * Math.max(0.02, Math.min(1, p.fraction))} ${c}`} />
          </g>
        )
      })}
    </svg>
  )
}

/** One bar split into parts, for "spent, set aside, left" of income. */
export function SplitBar({ parts }: { parts: { key: string; value: number; className: string; label: string }[] }) {
  const total = parts.reduce((a, p) => a + Math.max(0, p.value), 0) || 1
  return (
    <div className="flex h-2.5 w-full gap-[3px] overflow-hidden rounded-full" role="img" aria-label={parts.map((p) => p.label).join(', ')}>
      {parts.filter((p) => p.value > 0).map((p) => <span key={p.key} className={cx('h-full rounded-full', p.className)} style={{ flexGrow: p.value / total }} />)}
    </div>
  )
}
