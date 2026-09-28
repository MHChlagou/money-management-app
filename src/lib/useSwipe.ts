import { useRef } from 'react'

/** Horizontal swipe detection for touch screens; ignores mostly-vertical scrolls. */
export const useSwipe = (onLeft: () => void, onRight: () => void) => {
  const start = useRef<{ x: number; y: number } | null>(null)
  return {
    onTouchStart: (e: React.TouchEvent) => { start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!start.current) return
      const dx = e.changedTouches[0].clientX - start.current.x
      const dy = e.changedTouches[0].clientY - start.current.y
      start.current = null
      if (Math.abs(dx) > 70 && Math.abs(dy) < 50) (dx < 0 ? onLeft : onRight)()
    },
  }
}
