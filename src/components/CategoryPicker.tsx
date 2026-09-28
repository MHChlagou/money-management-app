import { useAppState } from '../lib/store'
import { CategoryDot, cx } from './ui'
import { categoryName, useT } from '../lib/i18n'

/** Tap-to-pick grid of category chips, much faster than typing on a phone. */
export function CategoryPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { categories } = useAppState()
  const t = useT()
  return (
    <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={t('form.category')}>
      {categories.map((c) => {
        const selected = c.id === value
        return (
          <button key={c.id} type="button" role="radio" aria-checked={selected} onClick={() => onChange(c.id)}
            className={cx('flex flex-col items-center gap-1 rounded-xl border p-1.5 text-[11px] leading-tight transition', selected ? 'border-ink-500 bg-ink-50 font-semibold text-ink-700 dark:bg-ink-500/20 dark:text-ink-100' : 'border-transparent hover:bg-slate-900/5 dark:hover:bg-white/10')}>
            <CategoryDot icon={c.icon} color={c.color} size="sm" />
            <span className="w-full truncate text-center">{categoryName(c.id, c.name)}</span>
          </button>
        )
      })}
    </div>
  )
}
