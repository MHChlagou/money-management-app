export const formatMoney = (amount: number, currency: string, opts: { compact?: boolean } = {}) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: opts.compact ? 0 : 2,
      minimumFractionDigits: opts.compact ? 0 : 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export const formatPct = (ratio: number) => `${Math.round(ratio * 100)}%`

/**
 * Parse user input leniently: "1234.50", "1 234,50", "1,234.56", "1.234,56" and "3,000" all work.
 * Rule: the last separator is the decimal point, unless it is the only one and exactly three digits
 * follow it, in which case it is a thousands separator (nobody types three decimals for money).
 */
export const parseAmount = (raw: string) => {
  let t = raw.replace(/[^\d.,-]/g, '')
  const lastDot = t.lastIndexOf('.')
  const lastComma = t.lastIndexOf(',')
  const separators = (t.match(/[.,]/g) ?? []).length
  if (separators === 1) {
    const idx = Math.max(lastDot, lastComma)
    const after = t.length - idx - 1
    t = after === 3 ? t.replace(/[.,]/, '') : t.replace(/[.,]/, '.')
  } else if (separators > 1) {
    const decimalIdx = Math.max(lastDot, lastComma)
    const intPart = t.slice(0, decimalIdx).replace(/[.,]/g, '')
    t = `${intPart}.${t.slice(decimalIdx + 1)}`
  }
  const n = Number.parseFloat(t)
  return Number.isFinite(n) ? n : 0
}
