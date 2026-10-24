import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { useT } from '../lib/i18n'
import { useMediaQuery } from '../lib/useMediaQuery'
import { EASE_DRAWER, EASE_UI, SPRING_SOFT } from '../lib/motion'
import { lockScroll } from '../lib/scrollLock'

export const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ')

/** A raised panel. Reserved for grouped content that needs its own surface; plain sections sit on the canvas. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-2xl bg-surface p-4 ring-1 ring-hairline sm:p-5', className)}>
      {children}
    </section>
  )
}

/** Page title row: the h1 on the left, page-level controls (month picker, new) on the right. */
export function PageHeader({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 sm:items-center md:mb-7">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.02em] md:text-[34px]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink/80">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

/** Sentence-case section heading with an optional action on the right. */
export function SectionTitle({ children, action, sub }: { children: ReactNode; action?: ReactNode; sub?: ReactNode }) {
  return (
    // The title keeps at least 8rem; when the action does not fit beside it, the action wraps below.
    <div className={cx('mb-3 flex flex-wrap justify-between gap-x-3 gap-y-1', sub ? 'items-start' : 'items-center')}>
      <div className="min-w-0 flex-[1_1_8rem]">
        <h2 className="font-display text-[17px] font-semibold tracking-[-0.01em]">{children}</h2>
        {sub && <div className="mt-0.5 text-[13px] text-muted">{sub}</div>}
      </div>
      {action && <div className="-mr-2 shrink-0">{action}</div>}
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tide'
const variants: Record<Variant, string> = {
  primary: 'bg-deep-900 text-white hover:bg-deep-800 dark:bg-tide-300 dark:text-night dark:hover:bg-tide-200',
  tide: 'bg-tide-700 text-white hover:bg-tide-800 dark:bg-tide-300 dark:text-night dark:hover:bg-tide-200',
  secondary: 'bg-sunk text-ink hover:bg-mist-200 dark:hover:bg-white/10',
  ghost: 'text-deep-700 hover:bg-sunk dark:text-tide-300 dark:hover:bg-white/8',
  danger: 'text-ebb-600 hover:bg-ebb-50 dark:text-ebb-300 dark:hover:bg-ebb-400/10',
}

export function Button({ variant = 'primary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={cx('inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-[transform,background-color,color] duration-150 ease-ui active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45', variants[variant], className)}
    />
  )
}

export function IconButton({ label, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button {...props} aria-label={label} title={label} className={cx('relative inline-flex size-9 items-center justify-center rounded-full text-muted transition-[transform,background-color,color] duration-150 ease-ui after:absolute after:-inset-1 after:content-[""] hover:bg-sunk hover:text-ink active:scale-[0.94]', className)} />
}

const fieldBase = 'w-full min-w-0 min-h-11 rounded-xl border border-hairline bg-surface px-3 text-base text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted focus:border-tide-500 focus:ring-3 focus:ring-tide-400/25 disabled:opacity-50 dark:bg-night'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(fieldBase, className)} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(fieldBase, className)} />
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[13px] font-medium text-ink/80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

/** Amount input: decimal keyboard on phones, tolerant of commas. */
export function AmountInput({ value, onChange, className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & { value: string; onChange: (v: string) => void }) {
  return <Input {...props} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0.00" className={cx('font-display tnum', className)} />
}


const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Bottom sheet on phones (drag the handle down to dismiss), centred dialog from 640px.
 * Keeps focus inside while open and hands it back on close.
 */
export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)
  // Callers pass a new onClose every render; a ref keeps the effect below from re-running (and re-focusing) on each one.
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })
  // Captured during render, before an autoFocus child moves focus away from the element that opened the sheet.
  const [wasOpen, setWasOpen] = useState(open)
  const [opener, setOpener] = useState<HTMLElement | null>(null)
  // Callers usually clear their state on close; keep the last content so the exit animation is not blank.
  const [shown, setShown] = useState({ title, children })
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setOpener(document.activeElement instanceof HTMLElement ? document.activeElement : null)
  }
  if (open && (shown.title !== title || shown.children !== children)) setShown({ title, children })

  const isSheet = !useMediaQuery('(min-width: 640px)')
  const reduce = useReducedMotion()
  const drag = useDragControls()
  const t = useT()

  useEffect(() => {
    if (!open) return
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      const root = panel.current
      // Only the sheet holding focus reacts, so Escape closes the top sheet when two are stacked.
      if (!root || !root.contains(document.activeElement)) return
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key !== 'Tab') return
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)]
      const first = items[0], last = items[items.length - 1]
      if (!first || !last) { e.preventDefault(); return }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === root)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    const unlock = lockScroll()
    return () => { window.removeEventListener('keydown', onKey); unlock() }
  }, [open])
  // Separate from the effect above so StrictMode's dev re-run does not pull focus out of an autoFocus field.
  useEffect(() => { if (!open) opener?.focus() }, [open, opener])

  const hidden = reduce ? { opacity: 0 } : isSheet ? { y: '100%' } : { opacity: 0, transform: 'scale(0.96)' }
  const visible = reduce ? { opacity: 1 } : isSheet ? { y: 0 } : { opacity: 1, transform: 'scale(1)' }
  const content = open ? { title, children } : shown

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 flex items-end justify-center bg-night/55 sm:items-center sm:p-4"
          onClick={onClose}
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: EASE_UI }}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={content.title}
            tabIndex={-1}
            className="max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[28px] bg-surface px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_48px_-16px_rgb(5_10_18/0.4)] outline-none sm:max-w-md sm:rounded-3xl sm:pt-5 sm:shadow-[0_24px_64px_-24px_rgb(5_10_18/0.45)]"
            onClick={(e) => e.stopPropagation()}
            initial={hidden}
            animate={visible}
            exit={hidden}
            transition={isSheet && !reduce ? { duration: 0.45, ease: EASE_DRAWER } : { duration: 0.22, ease: EASE_UI }}
            drag={isSheet && !reduce ? 'y' : false}
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.8 }}
            dragTransition={{ bounceStiffness: 520, bounceDamping: 42 }}
            onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 550) onCloseRef.current() }}
          >
            {/* The handle and title row start the drag, so the content can still scroll. */}
            <div className="touch-none select-none" onPointerDown={(e) => { if (isSheet) drag.start(e) }}>
              <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-mist-300 sm:hidden dark:bg-night-line" aria-hidden />
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="line-clamp-2 min-w-0 break-words font-display text-xl font-semibold tracking-[-0.01em]">{content.title}</h3>
                <IconButton label={t('common.close')} onClick={onClose} onPointerDown={(e) => e.stopPropagation()}><X size={18} /></IconButton>
              </div>
            </div>
            {content.children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline px-4 py-5 text-center text-sm text-muted">
      <div className="mx-auto max-w-sm">{children}</div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

type Tone = 'neutral' | 'good' | 'warn' | 'brand' | 'bad'
const tones: Record<Tone, string> = {
  neutral: 'bg-sunk text-muted',
  good: 'bg-tide-100 text-tide-700 dark:bg-tide-400/15 dark:text-tide-300',
  warn: 'bg-sand-100 text-sand-700 dark:bg-sand-400/15 dark:text-sand-300',
  bad: 'bg-ebb-100 text-ebb-700 dark:bg-ebb-400/15 dark:text-ebb-300',
  brand: 'bg-deep-900/[0.07] text-deep-800 dark:bg-white/10 dark:text-mist-100',
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span className={cx('inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', tones[tone])}>{children}</span>
}

/** Coloured category badge: icon on a tinted tile. */
export function CategoryDot({ icon, color, size = 'md' }: { icon: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'size-8 rounded-[10px] text-[15px]', md: 'size-10 rounded-xl text-lg', lg: 'size-14 rounded-2xl text-2xl' }[size]
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center', s)} style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }} aria-hidden>
      {icon}
    </span>
  )
}

/** Segmented control for a few mutually exclusive options; the selection slides between them. */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const id = useId()
  return (
    <div className="inline-flex rounded-full bg-sunk p-1" role="radiogroup">
      {options.map((o) => {
        const selected = value === o.value
        return (
          <button key={o.value} type="button" role="radio" aria-checked={selected} onClick={() => onChange(o.value)}
            className={cx('relative rounded-full px-3 py-1 text-sm font-medium transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-2 after:content-[""]', selected ? 'text-ink' : 'text-muted hover:text-ink')}>
            {selected && <motion.span layoutId={`seg-${id}`} transition={SPRING_SOFT} className="absolute inset-0 rounded-full bg-surface shadow-[0_1px_3px_rgb(5_10_18/0.12)] dark:bg-white/12" aria-hidden />}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Simple list row: icon, title/subtitle, trailing content. */
export function Row({ icon, title, badges, subtitle, trailing, onClick, muted, children }: { icon?: ReactNode; title: ReactNode; badges?: ReactNode; subtitle?: ReactNode; trailing?: ReactNode; onClick?: () => void; muted?: boolean; children?: ReactNode }) {
  const body = (
    <>
      {icon}
      <div className="min-w-0 flex-1">
        <div className={cx('flex flex-wrap items-center gap-1.5 font-medium leading-tight', muted && 'line-through')}><span className="line-clamp-2 break-words">{title}</span>{badges}</div>
        {subtitle && <div className="mt-0.5 text-[13px] text-muted">{subtitle}</div>}
      </div>
    </>
  )
  // Trailing content sits beside the row button, never inside it: it may hold its own buttons.
  return (
    <li className={cx('flex items-center gap-3 py-3', muted && 'opacity-50')}>
      {children}
      {onClick ? <button className="-mx-2 flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1 text-left transition-colors duration-150 hover:bg-sunk/60" onClick={onClick}>{body}</button> : body}
      {trailing && <div className="flex shrink-0 items-center gap-1">{trailing}</div>}
    </li>
  )
}

export const Money = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cx('font-display tnum whitespace-nowrap font-semibold', className)}>{children}</span>
)
