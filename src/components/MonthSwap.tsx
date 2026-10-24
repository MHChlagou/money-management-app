import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE_UI } from '../lib/motion'

/**
 * Content that belongs to one month. Re-key it with the month and it slides in from the side the user moved
 * towards, so a swipe or an arrow press shows where the new month came from. No exit: the old month is simply gone.
 */
export function MonthSwap({ dir, animateIn, children, className }: { dir: 1 | -1; animateIn: boolean; children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={animateIn ? { opacity: 0, transform: `translateX(${dir * 18}px)` } : false}
      animate={{ opacity: 1, transform: 'translateX(0px)' }}
      transition={{ duration: 0.26, ease: EASE_UI }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
