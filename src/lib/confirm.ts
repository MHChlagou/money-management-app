import { useSyncExternalStore } from 'react'

/** A single pending confirmation; the answer resolves the promise returned by askConfirm(). */
export interface ConfirmRequest { message: string; confirmLabel: string; danger: boolean; resolve: (ok: boolean) => void }

let current: ConfirmRequest | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** In-app replacement for window.confirm(). A newer request cancels the one still open. */
export const askConfirm = (message: string, opts: { confirmLabel: string; danger?: boolean }) =>
  new Promise<boolean>((resolve) => {
    current?.resolve(false)
    current = { message, confirmLabel: opts.confirmLabel, danger: opts.danger ?? false, resolve }
    emit()
  })

export const answerConfirm = (ok: boolean) => {
  const request = current
  current = null
  emit()
  request?.resolve(ok)
}

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l) }
export const useConfirm = () => useSyncExternalStore(subscribe, () => current, () => current)
