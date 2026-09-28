import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import type { CategoryTotal, TrendPoint } from '../lib/calc'
import { formatMoney } from '../lib/format'
import { formatMonth, monthName, splitKey } from '../lib/months'

/* Series colours: validated categorical slots 1 & 2. Text and grid use CSS currentColor so dark mode just works. */
const INCOME = { light: '#2a78d6', dark: '#3987e5' }
const EXPENSES = { light: '#eb6834', dark: '#d95926' }
const KEPT = { light: '#1baf7a', dark: '#199e70' }

const isDark = () => document.documentElement.dataset.theme === 'dark'
const pick = (c: { light: string; dark: string }) => (isDark() ? c.dark : c.light)

function TooltipBox({ active, payload, label, currency }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string; currency: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      <div className="mb-1 font-semibold">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="size-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}</span>
          <span className="ml-auto tabular-nums font-medium">{formatMoney(p.value, currency)}</span>
        </div>
      ))}
    </div>
  )
}

const axisStyle = { fontSize: 11, fill: 'currentColor' }
/** Short axis ticks: 2.4k instead of a full currency string that would not fit. */
const shortNum = (v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(Math.abs(v) % 1000 ? 1 : 0)}k` : String(Math.round(v)))

/** Grouped bars: income vs expenses per month, with a hover/tap tooltip. */
export function TrendChart({ points, currency, highlight }: { points: TrendPoint[]; currency: string; highlight: string }) {
  const data = points.map((p) => ({ key: p.key, label: formatMonth(p.key, 'short'), Income: p.summary.income, Expenses: p.summary.expenses }))
  return (
    <div className="h-52 text-slate-500 dark:text-slate-400">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="25%">
          <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.15} />
          <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={36} tickFormatter={shortNum} />
          <Tooltip content={<TooltipBox currency={currency} />} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Income" fill={pick(INCOME)} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.key} fillOpacity={d.key === highlight ? 1 : 0.6} />)}
          </Bar>
          <Bar dataKey="Expenses" fill={pick(EXPENSES)} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.key} fillOpacity={d.key === highlight ? 1 : 0.6} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Money kept per month across a full year; negative months show in the expenses colour. */
export function YearChart({ points, currency, highlight }: { points: TrendPoint[]; currency: string; highlight: string }) {
  const data = points.map((p) => ({ key: p.key, label: monthName(splitKey(p.key).month), Kept: p.summary.income > 0 ? p.summary.kept : 0 }))
  return (
    <div className="h-44 text-slate-500 dark:text-slate-400">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.15} />
          <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval={0} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={36} tickFormatter={shortNum} />
          <Tooltip content={<TooltipBox currency={currency} />} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
          <Bar dataKey="Kept" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.key} fill={d.Kept < 0 ? pick(EXPENSES) : pick(KEPT)} fillOpacity={d.key === highlight ? 1 : 0.65} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Donut of spending by category. Beyond six slices the rest folds into "Other" so colours stay distinguishable. */
export function CategoryDonut({ totals, currency }: { totals: CategoryTotal[]; currency: string }) {
  const top = totals.slice(0, 6)
  const rest = totals.slice(6)
  const data = [
    ...top.map((t) => ({ name: `${t.category.icon} ${t.category.name}`, value: t.amount, color: t.category.color })),
    ...(rest.length ? [{ name: '📦 Other', value: rest.reduce((a, t) => a + t.amount, 0), color: '#94a3b8' }] : []),
  ]
  const total = data.reduce((a, d) => a + d.value, 0)
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} strokeWidth={0} isAnimationActive={false}>
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip content={<TooltipBox currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Total</span>
          <span className="text-sm font-semibold tabular-nums">{formatMoney(total, currency, { compact: true })}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1 text-xs">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
            <span className="truncate">{d.name}</span>
            <span className="ml-auto shrink-0 tabular-nums text-slate-500">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
