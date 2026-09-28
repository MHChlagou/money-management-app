import { useEffect, useState } from 'react'
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
    <div className="mb-4 flex items-center gap-3 rounded-2xl bg-brand-700 p-3 text-white">
      <div className="flex-1 text-sm">Install Monthly Money for quick access and offline use.</div>
      <Button variant="secondary" className="min-h-8 px-3" onClick={async () => { await evt.prompt(); setEvt(null) }}>Install</Button>
      <button aria-label="Dismiss" className="p-1 opacity-80" onClick={() => { sessionStorage.setItem('install-dismissed', '1'); setHidden(true) }}>✕</button>
    </div>
  )
}
