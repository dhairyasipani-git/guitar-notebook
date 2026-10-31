export type ThemePreference = 'system' | 'light' | 'dark'

const THEME_KEY = 'guitar-notebook:theme'
export const THEME_OPTIONS: readonly ThemePreference[] = ['system', 'light', 'dark']
const DARK_QUERY = '(prefers-color-scheme: dark)'
// Browser bar colours, matching --bg in styles.css.
const BAR_COLORS = { light: '#f4f8ff', dark: '#0b1220' } as const

function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_OPTIONS.includes(value as ThemePreference)
}

export function loadTheme(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return isThemePreference(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

export function saveTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Storage blocked: the choice lasts until the app is closed.
  }
}

export function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
}

/** Watches the phone or computer switching between light and dark. Returns a stop function. */
export function onSystemThemeChange(listener: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

/** Points the stylesheet at the chosen theme; "system" leaves it to the device setting. */
export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark())
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? BAR_COLORS.dark : BAR_COLORS.light)
}
