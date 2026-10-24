import { useId } from 'react'

/** Edge ridges of the coin: 48 short marks between radius 19.4 and 21.5. */
const RIDGES = Array.from({ length: 48 }, (_, i) => {
  const a = (i * 7.5 * Math.PI) / 180
  return { x1: 32 + 19.4 * Math.sin(a), y1: 32 - 19.4 * Math.cos(a), x2: 32 + 21.5 * Math.sin(a), y2: 32 - 21.5 * Math.cos(a) }
})

/**
 * App mark: a coin minted in lume green with a milled edge and an engraved R, on a midnight tile.
 * Same drawing as public/favicon.svg and scripts/make-icons.mjs.
 */
export function Logo({ className }: { className?: string }) {
  const shine = `coin-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <radialGradient id={shine} cx=".38" cy=".32" r=".8">
          <stop offset="0" stopColor="#effcc9" />
          <stop offset=".55" stopColor="#c3f57a" />
          <stop offset="1" stopColor="#7fb52a" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="#0c1624" />
      <circle cx="32" cy="33.5" r="21.5" fill="#000000" opacity=".5" />
      <circle cx="32" cy="32" r="21.5" fill={`url(#${shine})`} />
      {RIDGES.map((r, i) => <line key={i} {...r} stroke="#5d8f1c" strokeWidth="1.1" />)}
      <circle cx="32" cy="32" r="16" fill="none" stroke="#5d8f1c" strokeWidth="1.2" />
      <path d="M26.5 41.5V22.5h6.2a5.4 5.4 0 0 1 0 10.8h-6.2" fill="none" stroke="#0c1624" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32.4 33.3l5.4 8.2" stroke="#0c1624" strokeWidth="3.8" strokeLinecap="round" />
    </svg>
  )
}
