import { useRef, useState } from 'react'
import { ChevronRight, Download, FileSpreadsheet, Plus, Trash2, Upload } from 'lucide-react'
import { AmountInput, Button, Card, CategoryDot, cx, Field, IconButton, Input, Modal, SectionTitle, Segmented, Select } from '../components/ui'
import { getState, migrate, replaceState, setState, useAppState } from '../lib/store'
import { allTransactions } from '../lib/calc'
import { CATEGORY_COLORS, emptyState, type Category, type Language, type Theme } from '../lib/types'
import { parseAmount } from '../lib/format'
import { sampleState } from '../lib/sample'
import { showToast } from '../lib/toast'
import { newId } from '../lib/id'
import { categoryName, useT } from '../lib/i18n'
import { CURRENCIES } from '../components/WelcomeSheet'

const ICONS = ['🏠', '💡', '🛒', '🚗', '🛡️', '🏦', '🎬', '❤️', '🍽️', '🛍️', '✈️', '📦', '📱', '🎓', '👶', '🐶', '💇', '🎁', '☕', '🎮', '📚', '💪', '🧾', '🏷️']

export function SettingsPage() {
  const state = useAppState()
  const t = useT()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [editingCat, setEditingCat] = useState<Category | 'new' | null>(null)
  const [salaryDraft, setSalaryDraft] = useState(state.defaultSalary ? String(state.defaultSalary) : '')
  const [nameDraft, setNameDraft] = useState(state.userName ?? '')

  const download = (content: string, type: string, ext: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }))
    Object.assign(document.createElement('a'), { href: url, download: `monthly-money-${new Date().toISOString().slice(0, 10)}.${ext}` }).click()
    URL.revokeObjectURL(url)
  }
  const exportJson = () => download(JSON.stringify(getState(), null, 2), 'application/json', 'json')
  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const rows = allTransactions(getState())
    download(['month,date,name,category,type,amount', ...rows.map((r) => [r.month, r.date, r.name, r.category, r.type, r.amount.toFixed(2)].map(esc).join(','))].join('\n'), 'text/csv', 'csv')
  }

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text())
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.recurring) || typeof parsed.months !== 'object') throw new Error(t('set.notBackup'))
      if (!confirm(t('set.replaceConfirm'))) return
      replaceState({ ...migrate(parsed), onboarded: true })
      setMsg(t('set.restored'))
    } catch (e) {
      setMsg(t('set.importFailed', { error: (e as Error).message }))
    }
  }

  const reset = () => {
    if (!confirm(t('set.deleteConfirm'))) return
    replaceState({ ...emptyState(), language: state.language, onboarded: true })
    setMsg(t('set.cleared'))
  }

  const usage = (id: string) =>
    state.recurring.filter((r) => r.categoryId === id).length + Object.values(state.months).reduce((a, m) => a + m.oneOffs.filter((e) => e.categoryId === id).length, 0)

  const saveCategory = (c: Category) => {
    setState((s) => ({ ...s, categories: s.categories.some((x) => x.id === c.id) ? s.categories.map((x) => (x.id === c.id ? c : x)) : [...s.categories, c] }))
    setEditingCat(null)
  }
  const deleteCategory = (c: Category) => {
    const n = usage(c.id)
    if (n > 0 && !confirm(t('cat.deleteConfirm', { n, name: categoryName(c.id, c.name) }))) return
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
  const labelCls = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300'

  return (
    <div className="space-y-3">
      <h1 className="px-1 font-display text-2xl font-bold">{t('set.heading')}</h1>

      <Card>
        <SectionTitle>{t('set.prefs')}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className={labelCls} id="language-label">{t('set.language')}</span>
            <div className="pt-1" aria-labelledby="language-label">
              <Segmented<Language> value={state.language} onChange={(language) => setState((s) => ({ ...s, language }))} options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }]} />
            </div>
          </div>
          <Field label={t('set.name')} hint={t('set.nameHint')}>
            <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} onBlur={() => setState((s) => ({ ...s, userName: nameDraft.trim() || undefined }))} autoComplete="given-name" />
          </Field>
          <Field label={t('set.currency')}>
            <Select value={state.currency} onChange={(e) => setState((s) => ({ ...s, currency: e.target.value }))}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label={t('set.goal')}>
            <Input type="number" min={0} max={100} inputMode="numeric" value={state.savingsGoalPct} onChange={(e) => setState((s) => ({ ...s, savingsGoalPct: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))} />
          </Field>
          <Field label={t('set.defaultSalary')} hint={t('set.defaultSalaryHint')}>
            <AmountInput value={salaryDraft} onChange={setSalaryDraft} onBlur={() => setState((s) => ({ ...s, defaultSalary: parseAmount(salaryDraft) }))} />
          </Field>
          <div>
            <span className={labelCls} id="appearance-label">{t('set.appearance')}</span>
            <div className="pt-1" aria-labelledby="appearance-label">
              <Segmented<Theme> value={state.theme} onChange={(theme) => setState((s) => ({ ...s, theme }))} options={[{ value: 'system', label: t('set.auto') }, { value: 'light', label: t('set.light') }, { value: 'dark', label: t('set.dark') }]} />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle sub={t('set.categoriesSub')} action={<Button variant="ghost" className="min-h-8 px-2" onClick={() => setEditingCat('new')}><Plus size={14} /> {t('common.new')}</Button>}>{t('set.categories')}</SectionTitle>
        <ul className="divide-y divide-line dark:divide-line-dark">
          {state.categories.map((c) => (
            <li key={c.id}>
              <button className="flex w-full items-center gap-3 py-2 text-left" onClick={() => setEditingCat(c)}>
                <CategoryDot icon={c.icon} color={c.color} size="sm" />
                <span className="flex-1 font-medium">{categoryName(c.id, c.name)}</span>
                <span className="text-xs text-slate-500">{c.budget ? t('set.budget', { amount: c.budget }) : t('set.noBudget')}</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle>{t('set.backup')}</SectionTitle>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{t('set.backupText')}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportJson}><Download size={16} /> {t('set.export')}</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload size={16} /> {t('set.import')}</Button>
          <Button variant="secondary" onClick={exportCsv}><FileSpreadsheet size={16} /> {t('set.csv')}</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} />
        </div>
        {msg && <p className="mt-3 text-sm text-ink-600 dark:text-ink-200">{msg}</p>}
      </Card>

      <Card>
        <SectionTitle>{t('set.install')}</SectionTitle>
        {standalone ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">{t('set.installed')}</p>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
            {isIos ? <><li>{t('set.ios1')}</li><li>{t('set.ios2')}</li><li>{t('set.ios3')}</li></> : <><li>{t('set.android')}</li><li>{t('set.windows')}</li></>}
          </ol>
        )}
      </Card>

      <Card>
        <SectionTitle>{t('set.exampleReset')}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => { if (confirm(t('set.exampleConfirm'))) { replaceState({ ...sampleState(), language: state.language, userName: state.userName, onboarded: true }); showToast(t('toast.exampleLoaded')) } }}>{t('set.loadExample')}</Button>
          <Button variant="danger" onClick={reset}><Trash2 size={16} /> {t('set.deleteAll')}</Button>
        </div>
      </Card>

      <p className="text-center text-xs text-slate-400">{t('set.footer')}</p>

      <Modal open={editingCat !== null} title={editingCat === 'new' ? t('cat.new') : t('cat.edit')} onClose={() => setEditingCat(null)}>
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
  const t = useT()
  // A default category shows its translated name; editing it stores the user's own name from then on.
  const [name, setName] = useState(initial ? categoryName(initial.id, initial.name) : '')
  const [icon, setIcon] = useState(initial?.icon ?? '🏷️')
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[8])
  const [budget, setBudget] = useState(initial?.budget ? String(initial.budget) : '')
  const valid = name.trim().length > 0
  const finalName = () => (initial && name.trim() === categoryName(initial.id, initial.name) ? initial.name : name.trim())
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ id: initial?.id ?? newId(), name: finalName(), icon, color, budget: parseAmount(budget) > 0 ? parseAmount(budget) : undefined }) }} className="space-y-4">
      <div className="flex items-center gap-3">
        <CategoryDot icon={icon} color={color} size="lg" />
        <Field label={t('cat.name')}><Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder={t('cat.namePlaceholder')} /></Field>
      </div>
      <Field label={t('cat.icon')}>
        <div className="grid grid-cols-8 gap-1">
          {ICONS.map((i) => <button key={i} type="button" onClick={() => setIcon(i)} className={cx('rounded-lg py-1.5 text-xl', i === icon ? 'bg-ink-50 ring-2 ring-ink-500 dark:bg-ink-500/20' : 'hover:bg-slate-900/5 dark:hover:bg-white/10')} aria-label={t('cat.iconA', { icon: i })} aria-pressed={i === icon}>{i}</button>)}
        </div>
      </Field>
      <Field label={t('cat.colour')}>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => <button key={c} type="button" onClick={() => setColor(c)} className={cx('size-8 rounded-full', c === color && 'ring-2 ring-ink-600 ring-offset-2 dark:ring-white dark:ring-offset-card-dark')} style={{ background: c }} aria-label={t('cat.colourA', { colour: c })} aria-pressed={c === color} />)}
        </div>
      </Field>
      <Field label={t('cat.budget')} hint={t('cat.budgetHint')}><AmountInput value={budget} onChange={setBudget} /></Field>
      <div className="flex items-center justify-between gap-2 pt-2">
        {onDelete ? <IconButton label={t('cat.delete')} className="text-coral-600" onClick={onDelete}><Trash2 size={18} /></IconButton> : <span />}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={!valid}>{initial ? t('common.save') : t('common.add')}</Button>
        </div>
      </div>
    </form>
  )
}
