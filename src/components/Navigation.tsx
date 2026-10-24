import { Moon, Plus, Search, Sun } from 'lucide-react'
import { motion } from 'motion/react'
import { useT } from '../lib/i18n'
import { setState, useAppState } from '../lib/store'
import { useMediaQuery } from '../lib/useMediaQuery'
import { SPRING_SOFT } from '../lib/motion'
import { Logo } from './Logo'
import { cx } from './ui'
import { searchShortcut, TABS, type Tab } from './tabs'

/** One tap between Glacier (light) and Lume (dark). "Auto" stays available in Settings. */
function ThemeToggle({ className }: { className?: string }) {
  const { theme } = useAppState()
  const t = useT()
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const dark = theme === 'dark' || (theme === 'system' && systemDark)
  const label = dark ? t('theme.toLight') : t('theme.toDark')
  return (
    <button onClick={() => setState((s) => ({ ...s, theme: dark ? 'light' : 'dark' }))} aria-label={label} title={label}
      className={cx('relative inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink ring-1 ring-hairline transition-[transform,background-color] duration-150 ease-ui after:absolute after:-inset-0.5 after:content-[""] hover:bg-sunk active:scale-[0.92]', className)}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

const Kbd = ({ children, onAccent = false }: { children: string; onAccent?: boolean }) => (
  <kbd className={cx('rounded-md border px-1.5 py-0.5 font-sans text-[11px] font-medium', onAccent ? 'border-on-accent/30 text-on-accent/75' : 'border-hairline text-muted')}>{children}</kbd>
)

/** Left rail from 768px: icons only up to 1024px, then labels, quick add and search. */
export function Sidebar({ tab, onTab, onAdd, onSearch }: { tab: Tab; onTab: (t: Tab) => void; onAdd: () => void; onSearch: () => void }) {
  const t = useT()
  return (
    <aside className="sticky top-0 hidden h-dvh w-20 shrink-0 flex-col border-r border-hairline px-3 py-5 md:flex xl:w-64 xl:px-4">
      <div className="mb-7 flex items-center gap-2.5 px-2">
        <Logo className="size-8 shrink-0" />
        <span className="hidden font-display text-[17px] font-semibold tracking-[-0.01em] xl:inline">{t('app.name')}</span>
      </div>

      <button onClick={onAdd} className="mb-2 flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent px-3 text-sm font-semibold text-on-accent transition-[transform,opacity] duration-150 ease-ui hover:opacity-90 active:scale-[0.97] xl:justify-start" aria-label={t('nav.add')} title={t('nav.add')}>
        <Plus size={18} strokeWidth={2.5} /><span className="hidden flex-1 text-left xl:inline">{t('nav.add')}</span><span className="hidden xl:inline"><Kbd onAccent>N</Kbd></span>
      </button>
      <button onClick={onSearch} className="mb-6 flex h-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm text-muted ring-1 ring-hairline transition-colors duration-150 hover:bg-sunk hover:text-ink xl:justify-start" aria-label={t('nav.search')} title={`${t('nav.search')} (${searchShortcut})`}>
        <Search size={17} /><span className="hidden flex-1 text-left xl:inline">{t('nav.search')}</span><span className="hidden xl:inline"><Kbd>{searchShortcut}</Kbd></span>
      </button>

      <nav aria-label={t('nav.menu')} className="flex flex-col gap-1">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button key={id} onClick={() => onTab(id)} aria-current={active ? 'page' : undefined} title={t(label)}
              className={cx('relative flex h-11 items-center justify-center gap-3 rounded-2xl px-3 text-[15px] font-medium transition-colors duration-150 xl:justify-start', active ? 'text-ink' : 'text-muted hover:text-ink')}>
              {active && <motion.span layoutId="rail-active" transition={SPRING_SOFT} className="absolute inset-0 rounded-2xl bg-surface ring-1 ring-hairline" aria-hidden />}
              <Icon size={19} strokeWidth={active ? 2.3 : 1.9} className="relative shrink-0" />
              <span className="relative hidden xl:inline">{t(label)}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-3 xl:flex-row xl:items-end xl:justify-between xl:px-2">
        <p className="hidden max-w-36 text-xs leading-relaxed text-muted xl:block">{t('set.footer')}</p>
        <ThemeToggle />
      </div>
    </aside>
  )
}

/** Phone tab bar. The active pill slides between tabs. */
export function BottomBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const t = useT()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/90 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden" aria-label={t('nav.menu')}>
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button key={id} onClick={() => onTab(id)} aria-current={active ? 'page' : undefined}
              className={cx('relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl pb-1 pt-1.5 text-[10.5px] font-semibold transition-colors duration-150', active ? 'text-ink' : 'text-muted')}>
              {active && <motion.span layoutId="dock-active" transition={SPRING_SOFT} className="absolute inset-x-1.5 top-0 h-[34px] rounded-full bg-surface ring-1 ring-hairline dark:bg-tide-300/12 dark:ring-0" aria-hidden />}
              <Icon size={21} strokeWidth={active ? 2.3 : 1.9} className="relative" />
              <span className="relative w-full truncate text-center">{t(label)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/** Phone header: the mark and a search button. Desktop has both in the sidebar. */
export function TopBar({ onSearch }: { onSearch: () => void }) {
  const t = useT()
  return (
    <div className="mb-3 flex items-center justify-between md:hidden">
      <div className="flex items-center gap-2">
        <Logo className="size-7" />
        <span className="font-display text-base font-semibold tracking-[-0.01em]">{t('app.name')}</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button onClick={onSearch} aria-label={t('nav.search')} className="relative inline-flex size-11 items-center justify-center rounded-full text-ink ring-1 ring-hairline transition-[transform,background-color] duration-150 ease-ui after:absolute after:-inset-0.5 after:content-[''] hover:bg-sunk active:scale-[0.94]">
          <Search size={18} />
        </button>
      </div>
    </div>
  )
}
