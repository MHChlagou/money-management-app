import { useAppState } from '../lib/store'
import { CategoryDot, cx } from './ui'
import { categoryName, useT } from '../lib/i18n'

/** Tap-to-pick grid of category chips, much faster than typing on a phone. */
export function CategoryPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { categories } = useAppState()
  const t = useT()
  return (
    <div className="grid grid-cols-3 gap-1.5 min-[400px]:grid-cols-4" role="radiogroup" aria-label={t('form.category')}>
      {categories.map((c) => {
        const selected = c.id === value
        return (
          <button key={c.id} type="button" role="radio" aria-checked={selected} onClick={() => onChange(c.id)}
            className={cx('flex flex-col items-center gap-1 rounded-xl border p-1.5 text-[11px] leading-tight transition', selected ? 'border-deep-900 bg-surface font-semibold text-ink shadow-[0_2px_8px_-4px_rgb(5_10_18/0.25)] dark:border-tide-300 dark:bg-tide-300/10' : 'border-transparent hover:bg-sunk')}>
            <CategoryDot icon={c.icon} color={c.color} size="sm" />
            <span className="line-clamp-2 w-full break-words text-center">{categoryName(c.id, c.name)}</span>
          </button>
        )
      })}
    </div>
  )
}
