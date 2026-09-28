import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useT } from '../lib/i18n'

export const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ')

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark', className)}>
      {children}
    </section>
  )
}

/** Sentence-case section heading with an optional action on the right. */
export function SectionTitle({ children, action, sub }: { children: ReactNode; action?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-2">
      <div>
        <h2 className="font-display text-[15px] font-semibold">{children}</h2>
        {sub && <div className="text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'mint'
const variants: Record<Variant, string> = {
  primary: 'bg-ink-600 text-white hover:bg-ink-700 active:bg-ink-700',
  mint: 'bg-mint-400 text-ink-950 hover:bg-mint-300',
  secondary: 'bg-ink-50 text-ink-900 hover:bg-ink-100 dark:bg-white/10 dark:text-white dark:hover:bg-white/15',
  ghost: 'text-ink-600 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-white/10',
  danger: 'text-coral-600 hover:bg-coral-100 dark:text-coral-400 dark:hover:bg-coral-600/20',
}

export function Button({ variant = 'primary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={cx('inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50', variants[variant], className)}
    />
  )
}

export function IconButton({ label, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button {...props} aria-label={label} title={label} className={cx('inline-flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-900/5 dark:text-slate-400 dark:hover:bg-white/10', className)} />
}

const fieldBase = 'w-full min-h-11 rounded-xl border border-line bg-white px-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-ink-500 focus:ring-2 focus:ring-ink-500/20 disabled:opacity-50 dark:border-line-dark dark:bg-paper-dark dark:text-slate-100'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(fieldBase, className)} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(fieldBase, className)} />
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

/** Amount input: decimal keyboard on phones, tolerant of commas. */
export function AmountInput({ value, onChange, className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & { value: string; onChange: (v: string) => void }) {
  return <Input {...props} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0.00" className={cx('font-display tnum', className)} />
}

/** Bottom sheet on phones, centred dialog on larger screens. */
export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])
  const t = useT()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-card px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:max-w-md sm:rounded-3xl sm:pt-5 dark:bg-card-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden dark:bg-slate-600" aria-hidden />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <IconButton label={t('common.close')} onClick={onClose}><X size={18} /></IconButton>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-slate-500 dark:border-line-dark">
      <div>{children}</div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'brand' | 'bad' }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
    good: 'bg-mint-100 text-mint-700 dark:bg-mint-600/20 dark:text-mint-300',
    warn: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
    bad: 'bg-coral-100 text-coral-600 dark:bg-coral-600/20 dark:text-coral-400',
    brand: 'bg-ink-50 text-ink-700 dark:bg-ink-500/20 dark:text-ink-200',
  }
  return <span className={cx('inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', tones[tone])}>{children}</span>
}

/** Coloured category badge: icon in a tinted circle. */
export function CategoryDot({ icon, color, size = 'md' }: { icon: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'size-7 text-sm', md: 'size-10 text-lg', lg: 'size-14 text-2xl' }[size]
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full', s)} style={{ background: `${color}1f` }} aria-hidden>
      {icon}
    </span>
  )
}

/** Segmented control for a few mutually exclusive options. */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-full bg-slate-900/5 p-1 dark:bg-white/10" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cx('rounded-full px-3 py-1 text-sm font-medium transition', value === o.value ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-500 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Simple list row: icon, title/subtitle, trailing content. */
export function Row({ icon, title, subtitle, trailing, onClick, muted, children }: { icon?: ReactNode; title: ReactNode; subtitle?: ReactNode; trailing?: ReactNode; onClick?: () => void; muted?: boolean; children?: ReactNode }) {
  const body = (
    <>
      {icon}
      <div className="min-w-0 flex-1">
        <div className={cx('flex flex-wrap items-center gap-1.5 font-medium leading-tight', muted && 'line-through')}>{title}</div>
        {subtitle && <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>}
      </div>
      {trailing}
    </>
  )
  return (
    <li className={cx('flex items-center gap-3 py-2.5', muted && 'opacity-50')}>
      {children}
      {onClick ? <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={onClick}>{body}</button> : body}
    </li>
  )
}

export const Money = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cx('font-display tnum font-semibold', className)}>{children}</span>
)
