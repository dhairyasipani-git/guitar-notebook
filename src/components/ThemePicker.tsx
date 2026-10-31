import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react'
import { useState } from 'react'
import { applyTheme, loadTheme, saveTheme, THEME_OPTIONS, type ThemePreference } from '../lib/theme'

const THEME_LABELS: Record<ThemePreference, string> = { system: 'System', light: 'Light', dark: 'Dark' }
const THEME_ICONS = { system: IconDeviceDesktop, light: IconSun, dark: IconMoon } as const

/** System / Light / Dark, for the settings page. */
export function ThemePicker() {
  const [theme, setTheme] = useState<ThemePreference>(loadTheme)

  const choose = (next: ThemePreference) => {
    saveTheme(next)
    applyTheme(next)
    setTheme(next)
  }

  return (
    <div className="segmented" role="group" aria-label="Theme">
      {THEME_OPTIONS.map((option) => {
        const Icon = THEME_ICONS[option]
        return (
          <button key={option} type="button" aria-pressed={theme === option} onClick={() => choose(option)}>
            <Icon size={16} aria-hidden="true" />
            {THEME_LABELS[option]}
          </button>
        )
      })}
    </div>
  )
}
