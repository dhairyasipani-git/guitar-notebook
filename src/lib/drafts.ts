import type { z } from 'zod'

/**
 * Unsaved work (notes being typed, a tab being written) is mirrored into
 * localStorage on every change, so a back swipe, app switch, crash or app
 * update can't wipe it. Drafts are a safety net only: if the browser blocks
 * storage, the app still saves normally, it just loses the net.
 */
export const DRAFT_PREFIX = 'guitar-notebook:draft:'

export function loadDraft<S extends z.ZodType>(key: string, schema: S): z.output<S> | null {
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + key)
    if (raw === null) return null
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function saveDraft(key: string, value: unknown): void {
  try {
    localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage full or blocked (e.g. private browsing): carry on without the safety net.
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(DRAFT_PREFIX + key)
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
