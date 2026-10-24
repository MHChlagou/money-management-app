import { useSyncExternalStore } from 'react'

/** Live result of a CSS media query, for layout decisions that CSS alone cannot make (sheet vs dialog). */
export const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
