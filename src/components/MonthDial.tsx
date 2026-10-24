import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import type { BalancePoint } from '../lib/calc'
import { AnimatedMoney } from './AnimatedMoney'

// Geometry in SVG units: the face is a circle of radius 500.
const R_NUM = 334
const R_TICK = [360, 376] as const
const R_BAR = 386
const BAR_MAX = 92
const RESERVE = { cy: -150, r: 132, span: 62 }

const rad = (deg: number) => (deg * Math.PI) / 180
const polar = (r: number, deg: number) => ({ x: r * Math.sin(rad(deg)), y: -r * Math.cos(rad(deg)) })
/** Angle of the middle of day `d` in a month of `n` days, clockwise from 12 o'clock. */
const dayAngle = (d: number, n: number) => ((d - 0.5) / n) * 360
const arc = (cy: number, r: number, a0: number, a1: number) => {
  const p0 = polar(r, a0), p1 = polar(r, a1)
  return `M ${p0.x} ${cy + p0.y} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1.x} ${cy + p1.y}`
}

export interface MonthDialProps {
  points: BalancePoint[]
  /** Day the hand rests on: today, the last day of a past month, or the 1st of a future one. */
  restDay: number
  scrubDay: number | null
  onScrub: (day: number | null) => void
  income: number
  /** Days up to this one are drawn as paid; later bars are faded. */
  paidThrough: number
  categoryColor: (id: string) => string
  money: (n: number) => string
  text: { label: string; dayLabel: (day: number) => string; resting: string; after: (day: string) => string; endsAt: string }
}

/**
 * The month as a watch face. Days run round the ring, payments are bars at their day, the hand rests on
 * today and the power reserve arc shows the share of income still left after the day under the hand.
 * Turn it to look at another day; let go and the hand springs back. The face follows the theme
 * (Glacier by day, Lume by night) through the --dial-* variables.
 */
export function MonthDial({ points, restDay, scrubDay, onScrub, income, paidThrough, categoryColor, money, text }: MonthDialProps) {
  const n = points.length - 1
  const reduce = useReducedMotion()
  const day = scrubDay ?? restDay
  const balance = points[Math.max(0, Math.min(n, day))]?.balance ?? 0
  const reserve = Math.max(0, Math.min(1, balance / Math.max(1, income)))
  const maxOut = Math.max(1, ...points.map((p) => p.entries.reduce((a, e) => a + e.amount, 0)))
  const [turning, setTurning] = useState(false)

  // The hand: a spring follows the target angle and writes the transform directly, no re-render per frame.
  // Rotation keeps the shortest path, so springing back from day 30 to day 2 goes forward, not all the way round.
  const hand = useRef<SVGGElement>(null)
  const shown = useRef<number | null>(null)
  const target = dayAngle(Math.max(1, day), n)
  useEffect(() => {
    const apply = (v: number) => { shown.current = v; hand.current?.setAttribute('transform', `rotate(${v})`) }
    // First draw sweeps from 12 o'clock.
    const from = shown.current ?? 0
    let to = target
    while (to - from > 180) to -= 360
    while (to - from < -180) to += 360
    if (reduce) { apply(to); return }
    // Stiff while a finger turns it (a mechanical tick per day), loose when it springs back.
    const spring = turning ? { stiffness: 900, damping: 60 } : { stiffness: 140, damping: 18 }
    const controls = animate(from, to, { type: 'spring', ...spring, onUpdate: apply })
    return () => controls.stop()
  }, [target, turning, reduce])

  const face = useRef<HTMLDivElement>(null)
  const dayAt = (e: PointerEvent<HTMLDivElement>) => {
    const r = face.current!.getBoundingClientRect()
    const deg = (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI
    return Math.min(n, Math.max(1, Math.floor((((deg + 360) % 360) / 360) * n) + 1))
  }
  const lastDay = useRef<number | null>(null)
  const scrubTo = (d: number) => {
    if (d !== lastDay.current) navigator.vibrate?.(4)
    lastDay.current = d
    onScrub(d)
  }
  const release = () => { setTurning(false); lastDay.current = null; onScrub(null) }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]
    if (e.key === 'Escape' || e.key === 'Home') { onScrub(null); return }
    if (step === undefined) return
    e.preventDefault()
    onScrub(Math.min(n, Math.max(1, day + step)))
  }

  const entriesOf = (p: BalancePoint) => p.entries.reduce((a, e) => a + e.amount, 0)
  const glow = { filter: 'var(--dial-glow)' }

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px] select-none">
      <div className="absolute inset-0 rounded-full p-[2.6%] shadow-[0_28px_56px_-28px_rgb(5_10_18/0.55),inset_0_2px_0_rgb(255_255_255/0.4)]" style={{ background: 'var(--dial-bezel)' }}>
        <div
          ref={face}
          data-no-swipe
          role="slider"
          tabIndex={0}
          aria-label={text.label}
          aria-valuemin={1}
          aria-valuemax={n}
          aria-valuenow={Math.max(1, day)}
          aria-valuetext={`${text.dayLabel(Math.max(1, day))}: ${money(balance)}`}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setTurning(true); scrubTo(dayAt(e)) }}
          onPointerMove={(e) => { if (turning) scrubTo(dayAt(e)) }}
          onPointerUp={release}
          onPointerCancel={release}
          onKeyDown={onKeyDown}
          onBlur={() => onScrub(null)}
          className="relative size-full cursor-grab touch-none overflow-hidden rounded-full outline-none focus-visible:ring-4 focus-visible:ring-accent/40 active:cursor-grabbing"
          style={{
            background: 'repeating-conic-gradient(from 0deg, var(--dial-ray) 0deg 0.5deg, transparent 0.5deg 1.6deg), radial-gradient(circle at 50% 36%, var(--dial-face-1), var(--dial-face-2))',
            boxShadow: 'inset 0 10px 30px rgb(0 0 0 / 0.26), inset 0 -2px 6px rgb(255 255 255 / 0.2)',
          }}
        >
          <svg viewBox="-500 -500 1000 1000" className="absolute inset-0 size-full" aria-hidden>
            {/* Chapter ring: a tick per day, longer every fifth; numerals on 1, 5, 10 ... */}
            {Array.from({ length: n }, (_, i) => {
              const d = i + 1
              const major = d === 1 || d % 5 === 0
              const p1 = polar(major ? R_TICK[0] - 8 : R_TICK[0], dayAngle(d, n)), p2 = polar(R_TICK[1], dayAngle(d, n))
              return <line key={d} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--dial-ink)" strokeOpacity={major ? 0.9 : 0.4} strokeWidth={major ? 4 : 2} strokeLinecap="round" style={glow} />
            })}
            {Array.from({ length: n }, (_, i) => i + 1).filter((d) => d === 1 || d % 5 === 0).map((d) => {
              const p = polar(R_NUM, dayAngle(d, n))
              return <text key={d} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill="var(--dial-ink)" fontSize={36} fontWeight={650} style={{ fontFamily: 'var(--font-dial)', ...glow }}>{d}</text>
            })}

            {/* Payments: a bar per day outside the chapter ring, one segment per payment in its category colour. */}
            {points.slice(1).map((p) => {
              const total = entriesOf(p)
              if (total <= 0) return null
              const len = 12 + BAR_MAX * Math.sqrt(total / maxOut)
              let y = -R_BAR
              return (
                <g key={p.day} transform={`rotate(${dayAngle(p.day, n)})`} opacity={p.day <= paidThrough ? 1 : 0.42}>
                  {p.entries.map((e) => {
                    const h = (e.amount / total) * len
                    y -= h
                    return <rect key={e.id} x={-8} y={y} width={16} height={Math.max(2, h - 1.5)} rx={4} fill={`color-mix(in oklab, ${categoryColor(e.categoryId)} 68%, var(--dial-ink))`} />
                  })}
                </g>
              )
            })}

            {/* Power reserve: share of income still left after the day under the hand. */}
            <path d={arc(RESERVE.cy, RESERVE.r, -RESERVE.span, RESERVE.span)} fill="none" stroke={balance < 0 ? 'var(--color-ebb-500)' : 'var(--dial-ink)'} strokeOpacity={balance < 0 ? 0.4 : 0.14} strokeWidth={18} strokeLinecap="round" />
            <path d={arc(RESERVE.cy, RESERVE.r, -RESERVE.span, RESERVE.span)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - reserve}
              fill="none" stroke="var(--dial-ink)" strokeWidth={18} strokeLinecap="round" style={{ ...glow, transition: reduce ? undefined : 'stroke-dashoffset 450ms cubic-bezier(0.23, 1, 0.32, 1)' }} />
            {[0, 0.5, 1].map((k) => {
              const a = -RESERVE.span + 2 * RESERVE.span * k
              const p1 = polar(RESERVE.r + 16, a), p2 = polar(RESERVE.r + 26, a)
              return <line key={k} x1={p1.x} y1={RESERVE.cy + p1.y} x2={p2.x} y2={RESERVE.cy + p2.y} stroke="var(--dial-soft)" strokeWidth={2.5} />
            })}

            {/* Date window at 3 o'clock: the day under the hand. */}
            <rect x={196} y={-32} width={96} height={64} rx={12} fill="var(--dial-face-1)" stroke="var(--dial-ink)" strokeOpacity={0.35} strokeWidth={2} />
            <text x={244} y={1} textAnchor="middle" dominantBaseline="central" fill="var(--dial-ink)" fontSize={40} fontWeight={700} style={{ fontFamily: 'var(--font-dial)', ...glow }}>{Math.max(1, day)}</text>

            {/* The hand, with a lume tip and a counterweight. */}
            <g ref={hand} style={{ filter: 'drop-shadow(0 6px 6px rgb(0 0 0 / 0.25))' }}>
              <path d="M -10 72 L -5 -306 L 0 -326 L 5 -306 L 10 72 Z" fill="var(--dial-ink)" />
              <path d="M -4 -254 L 0 -318 L 4 -254 Z" fill="var(--dial-face-1)" opacity={0.9} />
            </g>
            <circle r={17} fill="var(--dial-ink)" />
            <circle r={6} fill="var(--dial-face-1)" />
          </svg>

          {/* Centre readout, printed above the hand so it stays legible as the hand passes. */}
          <div className="pointer-events-none absolute inset-x-[18%] top-[29%] text-center [text-shadow:0_0_6px_var(--dial-face-1),0_0_12px_var(--dial-face-1)]">
            <div className="text-[clamp(10px,2.6vw,13px)] text-dial-soft">{scrubDay === null ? text.resting : text.after(text.dayLabel(day))}</div>
            <div className={`mt-0.5 font-dial text-[clamp(30px,10vw,54px)] font-extrabold leading-none tracking-[0.01em] ${balance < 0 ? 'text-ebb-600 dark:text-ebb-400' : 'text-dial-ink'}`} style={glow}>
              <AnimatedMoney value={balance} instant={scrubDay !== null} format={money} />
            </div>
            <div className="mt-1 text-[clamp(10px,2.4vw,12px)] text-dial-soft">{text.endsAt}</div>
          </div>
          {/* Sapphire glare */}
          <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: 'linear-gradient(140deg, rgb(255 255 255 / 0.2) 0%, rgb(255 255 255 / 0.04) 32%, transparent 48%)' }} />
        </div>
      </div>
    </div>
  )
}
