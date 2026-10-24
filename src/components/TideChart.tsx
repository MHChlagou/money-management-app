import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import type { BalancePoint } from '../lib/calc'
import { EASE_MOVE } from '../lib/motion'
import { cx } from './ui'

const W = 1000
const H = 240
const PAD_TOP = 18
const PAD_BOTTOM = 10
/** Every month is drawn with the same number of points, so one month's curve can morph into the next. */
const SAMPLES = 32

/** Set once the first rise has played; later mounts (tab switches) draw the curve in place. */
let hasRisen = false

interface Scale { min: number; max: number }

const yOf = (balance: number, s: Scale) => PAD_TOP + (1 - (balance - s.min) / (s.max - s.min)) * (H - PAD_TOP - PAD_BOTTOM)

/** Balance at a fractional day, read linearly between the daily points. */
const balanceAt = (points: BalancePoint[], day: number) => {
  const i = Math.min(points.length - 2, Math.floor(day))
  const f = day - i
  return points[i].balance + (points[i + 1].balance - points[i].balance) * f
}

/** Monotone cubic (Fritsch-Carlson) through the samples: smooth, but never overshoots a level it did not reach. */
const linePath = (ys: number[]) => {
  const n = ys.length
  const dx = W / (n - 1)
  const m = ys.slice(1).map((y, i) => (y - ys[i]) / dx)
  const tan = ys.map((_, i) => (i === 0 ? m[0] : i === n - 1 ? m[n - 2] : m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2))
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { tan[i] = 0; tan[i + 1] = 0; continue }
    const a = tan[i] / m[i], b = tan[i + 1] / m[i], s = a * a + b * b
    if (s > 9) { const k = 3 / Math.sqrt(s); tan[i] = k * a * m[i]; tan[i + 1] = k * b * m[i] }
  }
  let d = `M0,${ys[0].toFixed(2)}`
  for (let i = 0; i < n - 1; i++) {
    const x0 = i * dx, x1 = (i + 1) * dx
    d += `C${(x0 + dx / 3).toFixed(2)},${(ys[i] + (tan[i] * dx) / 3).toFixed(2)} ${(x1 - dx / 3).toFixed(2)},${(ys[i + 1] - (tan[i + 1] * dx) / 3).toFixed(2)} ${x1.toFixed(2)},${ys[i + 1].toFixed(2)}`
  }
  return d
}

const areaPath = (ys: number[]) => `${linePath(ys)}L${W},${H}L0,${H}Z`

export interface TideChartProps {
  points: BalancePoint[]
  /** Day of the month that is today, 0 when the whole month is still ahead, or the last day when it is over. */
  todayDay: number
  /** Day being inspected, or null. */
  scrubDay: number | null
  onScrub: (day: number | null) => void
  label: string
  valueText: (day: number) => string
  className?: string
}

/**
 * The month as a draining tide: the water level is money left, falling as payments land.
 * Past days are solid; days after today are the projection.
 */
export function TideChart({ points, todayDay, scrubDay, onScrub, label, valueText, className }: TideChartProps) {
  const days = points.length - 1
  const reduce = useReducedMotion()
  const id = useId().replace(/:/g, '')
  const box = useRef<HTMLDivElement>(null)
  const areaRef = useRef<SVGPathElement>(null)
  const lineRef = useRef<SVGPathElement>(null)
  const futureRef = useRef<SVGPathElement>(null)
  const [touching, setTouching] = useState(false)

  const scale = useMemo<Scale>(() => {
    const values = points.map((p) => p.balance)
    const min = Math.min(0, ...values)
    const max = Math.max(...values, 0)
    return max - min < 1 ? { min, max: min + 1 } : { min, max }
  }, [points])

  const target = useMemo(
    () => Array.from({ length: SAMPLES }, (_, k) => yOf(balanceAt(points, (k * days) / (SAMPLES - 1)), scale)),
    [points, days, scale],
  )
  const current = useRef<number[]>(hasRisen ? target : target.map(() => H))

  useEffect(() => {
    const draw = (ys: number[]) => {
      current.current = ys
      areaRef.current?.setAttribute('d', areaPath(ys))
      lineRef.current?.setAttribute('d', linePath(ys))
      futureRef.current?.setAttribute('d', linePath(ys))
    }
    const from = current.current
    hasRisen = true
    if (reduce || from.every((y, i) => Math.abs(y - target[i]) < 0.01)) { draw(target); return }
    const controls = animate(0, 1, {
      duration: 0.7,
      ease: EASE_MOVE,
      onUpdate: (p) => draw(from.map((y, i) => y + (target[i] - y) * p)),
    })
    return () => controls.stop()
  }, [target, reduce])

  const xPct = (day: number) => (day / days) * 100
  const yPct = (balance: number) => (yOf(balance, scale) / H) * 100
  const zeroPct = yPct(0)
  const todayPct = xPct(todayDay)
  const maxOut = Math.max(1, ...points.map((p) => p.entries.reduce((a, e) => a + e.amount, 0)))
  const focusDay = scrubDay ?? todayDay

  const dayFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return null
    return Math.max(1, Math.min(days, Math.round(((e.clientX - r.left) / r.width) * days)))
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, Home: -days, End: days }[e.key]
    if (step === undefined) { if (e.key === 'Escape') onScrub(null); return }
    e.preventDefault()
    onScrub(Math.max(1, Math.min(days, (scrubDay ?? Math.max(1, todayDay)) + step)))
  }

  return (
    <div className={cx('relative select-none', className)}>
      <div
        ref={box}
        data-no-swipe
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={days}
        aria-valuenow={Math.max(1, focusDay)}
        aria-valuetext={valueText(Math.max(1, focusDay))}
        className="relative h-full w-full cursor-crosshair touch-pan-y rounded-b-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        onPointerMove={(e) => { if (e.pointerType === 'mouse' || touching) onScrub(dayFromPointer(e)) }}
        onPointerDown={(e) => { if (e.pointerType !== 'mouse') { setTouching(true); onScrub(dayFromPointer(e)) } }}
        onPointerUp={() => { if (touching) { setTouching(false); onScrub(null) } }}
        onPointerCancel={() => { setTouching(false); onScrub(null) }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') onScrub(null) }}
        onKeyDown={onKeyDown}
        onBlur={() => onScrub(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id={`water-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--water)" stopOpacity="0.45" />
              <stop offset="70%" stopColor="var(--water)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--water)" stopOpacity="0.03" />
            </linearGradient>
            <clipPath id={`past-${id}`}><rect x="0" y="-20" width={(todayPct / 100) * W} height={H + 40} /></clipPath>
            <clipPath id={`future-${id}`}><rect x={(todayPct / 100) * W} y="-20" width={W} height={H + 40} /></clipPath>
            <clipPath id={`below-${id}`}><rect x="0" y={(zeroPct / 100) * H} width={W} height={H} /></clipPath>
          </defs>
          <path ref={areaRef} fill={`url(#water-${id})`} />
          {scale.min < 0 && <rect x="0" y={(zeroPct / 100) * H} width={W} height={H} fill="var(--color-ebb-400)" opacity="0.14" clipPath={`url(#below-${id})`} />}
          <path ref={lineRef} fill="none" stroke="var(--water-line)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" clipPath={`url(#past-${id})`} />
          <path ref={futureRef} fill="none" stroke="var(--water-line)" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="5 6" vectorEffect="non-scaling-stroke" clipPath={`url(#future-${id})`} />
          {scale.min < 0 && <line x1="0" x2={W} y1={(zeroPct / 100) * H} y2={(zeroPct / 100) * H} stroke="var(--color-ebb-300)" strokeOpacity="0.6" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />}
        </svg>

        {/* Outflow ticks along the floor: one per payment day, taller for bigger days. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4" aria-hidden>
          {points.map((p) => {
            const out = p.entries.reduce((a, e) => a + e.amount, 0)
            if (p.day === 0 || out <= 0) return null
            return <span key={p.day} className={cx('absolute bottom-0 w-[3px] -translate-x-1/2 rounded-full', p.day <= todayDay ? 'bg-[var(--drop)]' : 'bg-[var(--drop)] opacity-45')} style={{ left: `${xPct(p.day)}%`, height: `${4 + 10 * (out / maxOut)}px` }} />
          })}
        </div>

        <Pin xPct={xPct(focusDay)} yPct={yPct(points[Math.max(0, focusDay)]?.balance ?? 0)} active={scrubDay !== null} moving={scrubDay === null} />
      </div>
    </div>
  )
}

/**
 * The marker on the curve. Two full-size layers carry the x and y offsets as transforms
 * (a percentage translate on a full-size layer is a percentage of the chart), so it moves without layout.
 */
function Pin({ xPct, yPct, active, moving }: { xPct: number; yPct: number; active: boolean; moving: boolean }) {
  const ease = moving ? 'transition-transform duration-700 ease-move' : ''
  return (
    <div className={cx('pointer-events-none absolute inset-0', ease)} style={{ transform: `translateX(${xPct}%)` }} aria-hidden>
      <span className={cx('absolute inset-y-0 left-0 w-px -translate-x-1/2', active ? 'bg-ink/45' : 'bg-ink/20')} />
      <div className={cx('absolute inset-0', ease)} style={{ transform: `translateY(${yPct}%)` }}>
        <span className="absolute left-0 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--water-line)] ring-4 ring-[var(--water)]/25" />
      </div>
    </div>
  )
}
