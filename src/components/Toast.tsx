import { dismissToast, useToast } from '../lib/toast'

export function ToastHost() {
  const toast = useToast()
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 sm:bottom-6" role="status">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
        <span>{toast.message}</span>
        {toast.undo && (
          <button onClick={() => { toast.undo?.(); dismissToast() }} className="font-semibold text-brand-500 dark:text-brand-700">Undo</button>
        )}
        <button onClick={dismissToast} aria-label="Dismiss" className="opacity-60">✕</button>
      </div>
    </div>
  )
}
