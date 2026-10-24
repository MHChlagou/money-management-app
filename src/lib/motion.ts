/** Motion curves shared by every animated component; same values as the --ease-* tokens in index.css. */
export const EASE_UI = [0.23, 1, 0.32, 1] as const
export const EASE_MOVE = [0.77, 0, 0.175, 1] as const
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const

/** Apple-style spring for indicators and anything a gesture can interrupt. */
export const SPRING_SOFT = { type: 'spring', duration: 0.4, bounce: 0.15 } as const
