import { describe, expect, it } from 'vitest'
import { hotkeyName, isTyping, worksWhileTyping } from './hotkeys'

const press = (key: string, mods: Partial<{ metaKey: boolean; ctrlKey: boolean; altKey: boolean }> = {}) => ({
  key,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  ...mods,
})

describe('hotkeyName', () => {
  it('names plain keys, space, escape and enter', () => {
    expect(hotkeyName(press('N'))).toBe('n')
    expect(hotkeyName(press('/'))).toBe('/')
    expect(hotkeyName(press(' '))).toBe('space')
    expect(hotkeyName(press('Escape'))).toBe('escape')
    expect(hotkeyName(press('Enter'))).toBe('enter')
  })

  it('treats Cmd on a Mac and Ctrl elsewhere as the same "mod" key', () => {
    expect(hotkeyName(press('s', { metaKey: true }))).toBe('mod+s')
    expect(hotkeyName(press('s', { ctrlKey: true }))).toBe('mod+s')
    expect(hotkeyName(press('Enter', { metaKey: true }))).toBe('mod+enter')
  })

  it('leaves Alt combinations alone', () => {
    expect(hotkeyName(press('n', { altKey: true }))).toBeNull()
  })
})

describe('isTyping', () => {
  it('counts text boxes but not buttons', () => {
    expect(isTyping(document.createElement('input'))).toBe(true)
    expect(isTyping(document.createElement('textarea'))).toBe(true)
    expect(isTyping(document.createElement('button'))).toBe(false)
    expect(isTyping(document.body)).toBe(false)
    expect(isTyping(null)).toBe(false)
  })

  it('lets Cmd/Ctrl shortcuts and Escape through while typing', () => {
    expect(worksWhileTyping('mod+s')).toBe(true)
    expect(worksWhileTyping('escape')).toBe(true)
    expect(worksWhileTyping('n')).toBe(false)
  })
})
