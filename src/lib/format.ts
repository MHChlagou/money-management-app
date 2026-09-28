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

/** Parse user input leniently: accepts "1 234,50" as well as "1234.50". */
export const parseAmount = (raw: string) => {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.')
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}
