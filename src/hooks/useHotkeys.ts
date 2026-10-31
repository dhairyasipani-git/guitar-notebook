import { useEffect, useRef } from 'react'
import { hotkeyName, isTyping, worksWhileTyping } from '../lib/hotkeys'

/** Shortcut name (see hotkeyName) to what it does. */
export type HotkeyMap = Record<string, () => void>

const OPEN_DIALOG = '[role="dialog"], [role="alertdialog"]'

/**
 * Keyboard shortcuts for as long as the component is on screen.
 * Ignored while a dialog is open, and plain keys are ignored while typing in a box.
 */
export function useHotkeys(hotkeys: HotkeyMap): void {
  // Always call the latest handlers without re-adding the listener each render.
  const hotkeysRef = useRef(hotkeys)
  useEffect(() => {
    hotkeysRef.current = hotkeys
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector(OPEN_DIALOG)) return
      const name = hotkeyName(event)
      const action = name ? hotkeysRef.current[name] : undefined
      if (!name || !action) return
      if (isTyping(event.target) && !worksWhileTyping(name)) return
      event.preventDefault()
      action()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
