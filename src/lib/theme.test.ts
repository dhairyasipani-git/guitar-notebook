import { afterEach, describe, expect, it } from 'vitest'
import { applyTheme, loadTheme, saveTheme } from './theme'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('theme preference', () => {
  it('follows the system until you pick something else', () => {
    expect(loadTheme()).toBe('system')
  })

  it('remembers what you picked and ignores junk', () => {
    saveTheme('dark')
    expect(loadTheme()).toBe('dark')

    localStorage.setItem('guitar-notebook:theme', 'purple')
    expect(loadTheme()).toBe('system')
  })

  it('marks the page for a fixed theme and clears the mark for system', () => {
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')

    applyTheme('system')
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})
