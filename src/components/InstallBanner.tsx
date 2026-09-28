import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from './ui'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Shown on Android/Chrome/Edge when the browser offers a native install prompt. iOS never fires this. */
export function InstallBanner() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(() => sessionStorage.getItem('install-dismissed') === '1')

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setEvt(e as BeforeInstallPromptEvent) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!evt || hidden) return null
  return (
    <div className="mb-3 flex items-center gap-3 rounded-2xl border border-line bg-card p-3 text-sm dark:border-line-dark dark:bg-card-dark">
      <Download size={18} className="shrink-0 text-ink-600 dark:text-ink-200" />
      <div className="flex-1">Install for quick access and offline use.</div>
      <Button className="min-h-8 px-3" onClick={async () => { await evt.prompt(); setEvt(null) }}>Install</Button>
      <button aria-label="Dismiss" className="p-1 text-slate-400" onClick={() => { sessionStorage.setItem('install-dismissed', '1'); setHidden(true) }}><X size={16} /></button>
    </div>
  )
}
