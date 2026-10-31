/** The parts of a key press that decide which shortcut it is. */
export interface KeyPress {
  key: string
  metaKey: boolean
  ctrlKey: boolean
  altKey: boolean
}

const KEY_NAMES: Record<string, string> = { ' ': 'space', Escape: 'escape', Enter: 'enter' }

/**
 * Names a key press the way shortcut maps are written: "n", "/", "space",
 * "escape", or "mod+s" where mod is Cmd on a Mac and Ctrl elsewhere.
 * Alt combinations are left to the system and return null.
 */
export function hotkeyName(press: KeyPress): string | null {
  if (press.altKey) return null
  const key = KEY_NAMES[press.key] ?? press.key.toLowerCase()
  return press.metaKey || press.ctrlKey ? `mod+${key}` : key
}

/** Plain letters typed into a text box are text, not shortcuts. Cmd/Ctrl combos and Escape still count. */
export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true
  return target instanceof HTMLInputElement && !['button', 'checkbox', 'radio', 'range', 'file'].includes(target.type)
}

export function worksWhileTyping(name: string): boolean {
  return name.startsWith('mod+') || name === 'escape'
}

export function isMac(): boolean {
  return /Mac|iPhone|iPad/.test(navigator.userAgent)
}
