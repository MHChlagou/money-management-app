import { X } from 'lucide-react'
import { dismissToast, useToast } from '../lib/toast'

export function ToastHost() {
  const toast = useToast()
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 sm:bottom-6" role="status">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink-950 py-2.5 pl-4 pr-2 text-sm text-white shadow-lg shadow-ink-950/30 dark:bg-white dark:text-ink-950">
        <span>{toast.message}</span>
        {toast.action && (
          <button onClick={() => { toast.action?.run(); dismissToast() }} className="rounded-full bg-mint-400 px-3 py-1 text-xs font-semibold text-ink-950">{toast.action.label}</button>
        )}
        <button onClick={dismissToast} aria-label="Dismiss" className="rounded-full p-1 opacity-60 hover:opacity-100"><X size={14} /></button>
      </div>
    </div>
  )
}
