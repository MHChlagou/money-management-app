import type { Theme } from './types'

const media = () => window.matchMedia('(prefers-color-scheme: dark)')

/** Resolves "system" to the OS setting and stamps the result on <html> so Tailwind's dark variant follows it. */
export const applyTheme = (theme: Theme) => {
  const dark = theme === 'dark' || (theme === 'system' && media().matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f172a' : '#0f766e')
}

export const watchSystemTheme = (getTheme: () => Theme) => {
  const handler = () => { if (getTheme() === 'system') applyTheme('system') }
  media().addEventListener('change', handler)
  return () => media().removeEventListener('change', handler)
}
