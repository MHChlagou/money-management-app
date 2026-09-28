import { useRef, useState } from 'react'
import { ChevronRight, Download, FileSpreadsheet, Plus, Trash2, Upload } from 'lucide-react'
import { AmountInput, Button, Card, CategoryDot, cx, Field, IconButton, Input, Modal, SectionTitle, Segmented, Select } from '../components/ui'
import { getState, migrate, replaceState, setState, useAppState } from '../lib/store'
import { allTransactions } from '../lib/calc'
import { CATEGORY_COLORS, emptyState, type Category, type Theme } from '../lib/types'
import { parseAmount } from '../lib/format'
import { sampleState } from '../lib/sample'
import { showToast } from '../lib/toast'
import { newId } from '../lib/id'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'TND', 'MAD', 'DZD', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'PLN', 'JPY', 'AED', 'SAR']
const ICONS = ['🏠', '💡', '🛒', '🚗', '🛡️', '🏦', '🎬', '❤️', '🍽️', '🛍️', '✈️', '📦', '📱', '🎓', '👶', '🐶', '💇', '🎁', '☕', '🎮', '📚', '💪', '🧾', '🏷️']

export function SettingsPage() {
  const state = useAppState()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [editingCat, setEditingCat] = useState<Category | 'new' | null>(null)
  const [salaryDraft, setSalaryDraft] = useState(state.defaultSalary ? String(state.defaultSalary) : '')

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: `monthly-money-${new Date().toISOString().slice(0, 10)}.json` })
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const rows = allTransactions(getState())
    const csv = ['month,date,name,category,type,amount', ...rows.map((r) => [r.month, r.date, r.name, r.category, r.type, r.amount.toFixed(2)].map(esc).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    Object.assign(document.createElement('a'), { href: url, download: `monthly-money-${new Date().toISOString().slice(0, 10)}.csv` }).click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text())
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.recurring) || typeof parsed.months !== 'object') throw new Error('Not a Monthly Money backup')
      if (!confirm('Replace all current data with this backup?')) return
      replaceState(migrate(parsed))
      setMsg('Backup restored.')
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`)
    }
  }

  const reset = () => {
    if (!confirm('Delete ALL data on this device? Export a backup first if you want to keep it.')) return
    replaceState(emptyState())
    setMsg('All data cleared.')
  }

  const usage = (id: string) =>
    state.recurring.filter((r) => r.categoryId === id).length + Object.values(state.months).reduce((a, m) => a + m.oneOffs.filter((e) => e.categoryId === id).length, 0)

  const saveCategory = (c: Category) => {
    setState((s) => ({ ...s, categories: s.categories.some((x) => x.id === c.id) ? s.categories.map((x) => (x.id === c.id ? c : x)) : [...s.categories, c] }))
    setEditingCat(null)
  }
  const deleteCategory = (c: Category) => {
    const n = usage(c.id)
    if (n > 0 && !confirm(`${n} expense(s) use "${c.name}". They will be moved to "Other". Continue?`)) return
    setState((s) => ({
      ...s,
      categories: s.categories.filter((x) => x.id !== c.id),
      recurring: s.recurring.map((r) => (r.categoryId === c.id ? { ...r, categoryId: 'other' } : r)),
      months: Object.fromEntries(Object.entries(s.months).map(([k, m]) => [k, { ...m, oneOffs: m.oneOffs.map((e) => (e.categoryId === c.id ? { ...e, categoryId: 'other' } : e)) }])),
    }))
    setEditingCat(null)
  }

  const isIos = /iP(hone|ad|od)/.test(navigator.userAgent)
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

  return (
    <div className="space-y-4">
      <h1 className="px-1 font-display text-2xl font-bold">Settings</h1>

      <Card>
        <SectionTitle>Preferences</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Currency">
            <Select value={state.currency} onChange={(e) => setState((s) => ({ ...s, currency: e.target.value }))}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Savings goal (% of income)">
            <Input type="number" min={0} max={100} inputMode="numeric" value={state.savingsGoalPct} onChange={(e) => setState((s) => ({ ...s, savingsGoalPct: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))} />
          </Field>
          <Field label="Default salary" hint="Pre-filled in every month you haven't edited">
            <AmountInput value={salaryDraft} onChange={setSalaryDraft} onBlur={() => setState((s) => ({ ...s, defaultSalary: parseAmount(salaryDraft) }))} />
          </Field>
          <Field label="Appearance">
            <div className="pt-1"><Segmented<Theme> value={state.theme} onChange={(theme) => setState((s) => ({ ...s, theme }))} options={[{ value: 'system', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} /></div>
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle sub="Tap one to change its icon, colour or budget" action={<Button variant="ghost" className="min-h-8 px-2" onClick={() => setEditingCat('new')}><Plus size={14} /> New</Button>}>Categories and budgets</SectionTitle>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {state.categories.map((c) => (
            <li key={c.id}>
              <button className="flex w-full items-center gap-3 py-2 text-left" onClick={() => setEditingCat(c)}>
                <CategoryDot icon={c.icon} color={c.color} size="sm" />
                <span className="flex-1 font-medium">{c.name}</span>
                <span className="text-xs text-slate-500">{c.budget ? `budget ${c.budget}` : 'no budget'}</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle>Backup</SectionTitle>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
          Your data lives only on this device. Export a backup to move it to your phone or keep a safe copy. The spreadsheet export lists every expense for Excel or Google Sheets.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportJson}><Download size={16} /> Export backup</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload size={16} /> Import backup</Button>
          <Button variant="secondary" onClick={exportCsv}><FileSpreadsheet size={16} /> Spreadsheet (CSV)</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} />
        </div>
        {msg && <p className="mt-3 text-sm text-ink-600 dark:text-ink-200">{msg}</p>}
      </Card>

      <Card>
        <SectionTitle>Install as an app</SectionTitle>
        {standalone ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">You are using the installed app.</p>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
            {isIos ? (
              <>
                <li>Open this page in <b>Safari</b>.</li>
                <li>Tap the <b>Share</b> button (square with an arrow).</li>
                <li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li>
              </>
            ) : (
              <>
                <li><b>Android (Chrome):</b> tap the ⋮ menu, then <b>Add to Home screen</b> / <b>Install app</b>.</li>
                <li><b>Windows (Edge or Chrome):</b> click the install icon at the right of the address bar, or menu → <b>Apps → Install this site as an app</b>.</li>
              </>
            )}
          </ol>
        )}
      </Card>

      <Card>
        <SectionTitle>Example data & reset</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => { if (confirm('Replace current data with example data?')) { replaceState(sampleState()); showToast('Example data loaded') } }}>Load example data</Button>
          <Button variant="danger" onClick={reset}><Trash2 size={16} /> Delete all data</Button>
        </div>
      </Card>

      <p className="text-center text-xs text-slate-400">Monthly Money. Works offline, no account, no cloud.</p>

      <Modal open={editingCat !== null} title={editingCat === 'new' ? 'New category' : 'Edit category'} onClose={() => setEditingCat(null)}>
        {editingCat && (
          <CategoryForm
            initial={editingCat === 'new' ? undefined : editingCat}
            onSave={saveCategory}
            onDelete={editingCat !== 'new' && editingCat.id !== 'other' ? () => deleteCategory(editingCat) : undefined}
            onCancel={() => setEditingCat(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function CategoryForm({ initial, onSave, onDelete, onCancel }: { initial?: Category; onSave: (c: Category) => void; onDelete?: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '🏷️')
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[8])
  const [budget, setBudget] = useState(initial?.budget ? String(initial.budget) : '')
  const valid = name.trim().length > 0
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ id: initial?.id ?? newId(), name: name.trim(), icon, color, budget: parseAmount(budget) > 0 ? parseAmount(budget) : undefined }) }} className="space-y-4">
      <div className="flex items-center gap-3">
        <CategoryDot icon={icon} color={color} size="lg" />
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Kids, Pets, Coffee…" /></Field>
      </div>
      <Field label="Icon">
        <div className="grid grid-cols-8 gap-1">
          {ICONS.map((i) => <button key={i} type="button" onClick={() => setIcon(i)} className={cx('rounded-lg py-1.5 text-xl', i === icon ? 'bg-ink-50 ring-2 ring-ink-500 dark:bg-ink-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800')} aria-label={`Icon ${i}`} aria-pressed={i === icon}>{i}</button>)}
        </div>
      </Field>
      <Field label="Colour">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => <button key={c} type="button" onClick={() => setColor(c)} className={cx('size-8 rounded-full', c === color && 'ring-2 ring-offset-2 ring-ink-600 dark:ring-white dark:ring-offset-card-dark')} style={{ background: c }} aria-label={`Colour ${c}`} aria-pressed={c === color} />)}
        </div>
      </Field>
      <Field label="Monthly budget (optional)" hint="You'll be warned on the Month and Insights screens when you pass it">
        <AmountInput value={budget} onChange={setBudget} />
      </Field>
      <div className="flex items-center justify-between gap-2 pt-2">
        {onDelete ? <IconButton label="Delete category" className="text-coral-600" onClick={onDelete}><Trash2 size={18} /></IconButton> : <span />}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={!valid}>{initial ? 'Save' : 'Add'}</Button>
        </div>
      </div>
    </form>
  )
}
