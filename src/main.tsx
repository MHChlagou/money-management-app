import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { applyTheme } from './lib/theme'
import { getState } from './lib/store'
import { showToastWithAction } from './lib/toast'

// Apply the theme before first paint to avoid a light flash in dark mode.
applyTheme(getState().theme)

const updateSW = registerSW({
  onNeedRefresh() {
    showToastWithAction('A new version is ready', { label: 'Update', run: () => updateSW(true) }, 0)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
