import { useState } from 'react'
import { Button, Field, Input, Modal, Segmented, Select } from './ui'
import { setState, useAppState } from '../lib/store'
import { useT } from '../lib/i18n'
import type { Language } from '../lib/types'

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'TND', 'MAD', 'DZD', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'PLN', 'JPY', 'AED', 'SAR']

/** First-launch sheet: name, language and currency in one go. Skippable; everything is editable later in Settings. */
export function WelcomeSheet() {
  const state = useAppState()
  const t = useT()
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState(state.currency)
  if (state.onboarded) return null

  const finish = (withName: boolean) =>
    setState((s) => ({ ...s, onboarded: true, currency, userName: withName && name.trim() ? name.trim() : s.userName }))

  return (
    <Modal open title={t('welcome.title')} onClose={() => finish(false)}>
      <form onSubmit={(e) => { e.preventDefault(); finish(true) }} className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('welcome.intro')}</p>
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" id="welcome-language">{t('welcome.language')}</span>
          <div className="pt-1" aria-labelledby="welcome-language">
            <Segmented<Language> value={state.language} onChange={(language) => setState((s) => ({ ...s, language }))} options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }]} />
          </div>
        </div>
        <Field label={t('welcome.name')} hint={t('welcome.nameHint')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus autoComplete="given-name" />
        </Field>
        <Field label={t('welcome.currency')}>
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => finish(false)}>{t('welcome.skip')}</Button>
          <Button type="submit" variant="mint">{t('welcome.start')}</Button>
        </div>
      </form>
    </Modal>
  )
}
