import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource-variable/jetbrains-mono'
import { App } from './App'
import { applyTheme, loadTheme, onSystemThemeChange } from './lib/theme'
import './styles.css'

// Set the theme before the first paint so dark mode never flashes white.
applyTheme(loadTheme())
// In System mode, keep the browser bar colour in step when the device flips light/dark.
onSystemThemeChange(() => applyTheme(loadTheme()))

registerSW({
  immediate: true,
  // A new version is ready. Reload only once the app is in the background,
  // never while someone is typing.
  onNeedReload: () => {
    const reloadWhenHidden = () => {
      if (document.visibilityState === 'hidden') window.location.reload()
    }
    document.addEventListener('visibilitychange', reloadWhenHidden)
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('The #root element is missing from index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
