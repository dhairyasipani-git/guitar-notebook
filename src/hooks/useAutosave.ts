import { useCallback, useEffect, useRef, useState } from 'react'
import type { z } from 'zod'
import { clearDraft, loadDraft, saveDraft } from '../lib/drafts'
import { useAsyncAction } from './useAsyncAction'

const SAVE_DELAY_MS = 700

export type SaveStatus = 'idle' | 'saving' | 'saved'

interface AutosaveOptions<T> {
  draftKey: string
  initial: T
  draftSchema: z.ZodType<T>
  persist: (value: T) => Promise<unknown>
}

export interface Autosave<T> {
  value: T
  setValue: (next: T) => void
  status: SaveStatus
  error: string | null
  /** Stops any pending save and drops the draft, e.g. right before deleting. */
  discard: () => void
}

function isSame(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Edits that save themselves a moment after you stop typing. Every change is
 * also kept as a local draft until it's saved, so closing the app, switching
 * away or an update reload can't lose the last few words.
 */
export function useAutosave<T>({ draftKey, initial, draftSchema, persist }: AutosaveOptions<T>): Autosave<T> {
  const [value, setValueState] = useState<T>(() => loadDraft(draftKey, draftSchema) ?? initial)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const saved = useRef<T>(initial)
  const latest = useRef<T>(value)
  const persistRef = useRef(persist)
  const { run, error } = useAsyncAction()

  useEffect(() => {
    persistRef.current = persist
  })

  const save = useCallback(
    async (next: T) => {
      if (isSame(next, saved.current)) {
        if (isSame(next, latest.current)) clearDraft(draftKey)
        return
      }
      setStatus('saving')
      const ok = await run(async () => {
        await persistRef.current(next)
        return true
      })
      if (ok) {
        saved.current = next
        if (isSame(next, latest.current)) clearDraft(draftKey)
      }
      setStatus(ok ? 'saved' : 'idle')
    },
    [draftKey, run],
  )

  useEffect(() => {
    latest.current = value
    if (isSame(value, saved.current)) return
    const timer = setTimeout(() => void save(value), SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [value, save])

  // Save straight away when the app goes to the background.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') void save(latest.current)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [save])

  // Leaving the page mid-sentence still saves; if that fails, the draft stays for next time.
  useEffect(
    () => () => {
      if (isSame(latest.current, saved.current)) return
      persistRef.current(latest.current)
        .then(() => clearDraft(draftKey))
        .catch((caught: unknown) => console.error('Could not save when leaving; kept as a draft', caught))
    },
    [draftKey],
  )

  const setValue = useCallback(
    (next: T) => {
      setValueState(next)
      saveDraft(draftKey, next)
    },
    [draftKey],
  )

  const discard = useCallback(() => {
    clearDraft(draftKey)
    saved.current = latest.current
  }, [draftKey])

  return { value, setValue, status, error, discard }
}
