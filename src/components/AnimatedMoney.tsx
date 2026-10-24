import { useEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { EASE_UI } from '../lib/motion'

/**
 * An amount that rolls to its new value instead of jumping. Frames write the text node directly,
 * so React renders once per change, not once per frame. `instant` skips the roll (used while scrubbing).
 */
export function AnimatedMoney({ value, format, instant = false, className }: { value: number; format: (n: number) => string; instant?: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const shown = useRef(value)
  const formatRef = useRef(format)
  useEffect(() => { formatRef.current = format })
  const reduce = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (instant || reduce || shown.current === value) {
      shown.current = value
      el.textContent = formatRef.current(value)
      return
    }
    const controls = animate(shown.current, value, {
      duration: 0.5,
      ease: EASE_UI,
      onUpdate: (v) => { shown.current = v; el.textContent = formatRef.current(v) },
    })
    return () => controls.stop()
  }, [value, instant, reduce])

  return <span ref={ref} className={className}>{format(value)}</span>
}
