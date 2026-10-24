import { useState } from 'react'

/** Direction of the last month change, and whether one has happened yet (the first render does not animate). */
export const useMonthDirection = (monthKey: string) => {
  const [prev, setPrev] = useState(monthKey)
  const [state, setState] = useState<{ dir: 1 | -1; moved: boolean }>({ dir: 1, moved: false })
  if (prev !== monthKey) {
    setPrev(monthKey)
    setState({ dir: monthKey > prev ? 1 : -1, moved: true })
  }
  return state
}
