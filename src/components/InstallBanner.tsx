import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from './ui'
import { useT } from '../lib/i18n'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Shown on Android/Chrome/Edge when the browser offers a native install prompt. iOS never fires this. */
export function InstallBanner() {
  const t = useT()
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(() => sessionStorage.getItem('install-dismissed') === '1')

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setEvt(e as BeforeInstallPromptEvent) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!evt || hidden) return null
  return (
    <div className="mb-3 flex items-center gap-3 rounded-2xl bg-surface p-3 text-sm ring-1 ring-hairline">
      <Download size={18} className="shrink-0 text-tide-700 dark:text-tide-300" />
      <div className="flex-1">{t('install.text')}</div>
      <Button className="min-h-8 px-3" onClick={async () => { await evt.prompt(); setEvt(null) }}>{t('install.button')}</Button>
      <button aria-label={t('common.dismiss')} className="relative p-1 text-muted after:absolute after:-inset-2.5 after:content-[''] dark:text-mist-400" onClick={() => { sessionStorage.setItem('install-dismissed', '1'); setHidden(true) }}><X size={16} /></button>
    </div>
  )
}
