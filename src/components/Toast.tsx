import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { dismissToast, useToast } from '../lib/toast'
import { useT } from '../lib/i18n'

/** Bottom-left on phones (clear of the add button), bottom-right on desktop. Enters and leaves through the bottom. */
export function ToastHost() {
  const toast = useToast()
  const t = useT()
  return (
    <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-[5.5rem] z-40 flex md:bottom-6 md:left-auto md:right-6 md:justify-end" role="status">
      <AnimatePresence mode="popLayout">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, transform: 'translateY(100%)' }}
            animate={{ opacity: 1, transform: 'translateY(0%)' }}
            exit={{ opacity: 0, transform: 'translateY(100%)' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="pointer-events-auto flex min-w-0 max-w-md items-center gap-3 rounded-2xl bg-ink py-2.5 pl-4 pr-2 text-sm text-canvas shadow-[0_12px_32px_-12px_rgb(5_10_18/0.55)]"
          >
            <span className="min-w-0 flex-1">{toast.message}</span>
            {toast.action && (
              <button onClick={() => { toast.action?.run(); dismissToast() }} className="shrink-0 rounded-full bg-tide-300 px-3 py-1 text-xs font-semibold text-night transition-transform duration-150 ease-ui active:scale-[0.96]">{toast.action.label}</button>
            )}
            <button onClick={dismissToast} aria-label={t('common.dismiss')} className="relative shrink-0 rounded-full p-1 opacity-60 after:absolute after:-inset-[11px] after:content-[''] hover:opacity-100"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
