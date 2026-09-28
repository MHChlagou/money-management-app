import { useSyncExternalStore } from 'react'

/** A single-slot toast with an optional action; the newest message replaces the previous one. */
export interface Toast { id: number; message: string; action?: { label: string; run: () => void } }

let current: Toast | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const showToast = (message: string, undo?: () => void, ms = 6000) =>
  showToastWithAction(message, undo ? { label: 'Undo', run: undo } : undefined, ms)

export const showToastWithAction = (message: string, action?: Toast['action'], ms = 6000) => {
  clearTimeout(timer)
  current = { id: Date.now(), message, action }
  emit()
  if (ms > 0) timer = setTimeout(dismissToast, ms)
}

export const dismissToast = () => { clearTimeout(timer); current = null; emit() }

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l) }
export const useToast = () => useSyncExternalStore(subscribe, () => current, () => current)
