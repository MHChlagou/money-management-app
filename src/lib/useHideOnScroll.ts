import { useEffect, useState } from 'react'

/**
 * True while the user scrolls down past the top of the page, so a floating button can step aside and stop
 * covering what is being read. Scrolling up, or reaching the end of the page, brings it back.
 */
export const useHideOnScroll = () => {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - last) < 8) return
      const atEnd = y + window.innerHeight >= document.documentElement.scrollHeight - 40
      setHidden(y > last && y > 120 && !atEnd)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return hidden
}
