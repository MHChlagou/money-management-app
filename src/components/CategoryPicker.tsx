import { useAppState } from '../lib/store'
import { CategoryDot, cx } from './ui'

/** Tap-to-pick grid of category chips, much faster than typing on a phone. */
export function CategoryPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { categories } = useAppState()
  return (
    <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Category">
      {categories.map((c) => {
        const selected = c.id === value
        return (
          <button key={c.id} type="button" role="radio" aria-checked={selected} onClick={() => onChange(c.id)}
            className={cx('flex flex-col items-center gap-1 rounded-xl border p-1.5 text-[11px] leading-tight transition', selected ? 'border-brand-600 bg-brand-50 font-medium text-brand-800 dark:bg-brand-800/30 dark:text-brand-100' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800')}>
            <CategoryDot icon={c.icon} color={c.color} size="sm" />
            <span className="w-full truncate text-center">{c.name}</span>
          </button>
        )
      })}
    </div>
  )
}
