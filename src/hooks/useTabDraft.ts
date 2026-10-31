import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import type { SavedTab, TabKind } from '../db/types'
import { clearDraft, loadDraft, saveDraft } from '../lib/drafts'
import { createEmptyGrid, normalizeGrid, type TabGrid } from '../lib/tab'

export interface TabDraft {
  title: string
  description: string
  kind: TabKind
  grid: TabGrid
  text: string
}

export interface TabDraftState {
  draft: TabDraft
  update: (patch: Partial<TabDraft>) => void
  /** True when the draft differs from what's saved. */
  isDirty: boolean
  /** True when unsaved changes from an earlier visit were brought back. */
  wasRestored: boolean
  /** Throws away unsaved changes and goes back to the saved tab. */
  discard: () => void
  /** Drops the stored draft, e.g. once the tab has been saved for real. */
  forget: () => void
}

const tabDraftSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  kind: z.enum(['grid', 'text']),
  grid: z.array(z.array(z.string())),
  text: z.string(),
})

function tabToDraft(tab: SavedTab | null): TabDraft {
  return {
    title: tab?.title ?? '',
    description: tab?.description ?? '',
    kind: tab?.kind ?? 'grid',
    grid: tab?.kind === 'grid' ? normalizeGrid(tab.grid) : createEmptyGrid(),
    text: tab?.text ?? '',
  }
}

function isSameDraft(a: TabDraft, b: TabDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** Editor state for one tab, mirrored to a local draft while it has unsaved changes. */
export function useTabDraft(classId: string, tab: SavedTab | null): TabDraftState {
  const key = `tab:${classId}:${tab?.id ?? 'new'}`
  const savedDraft = useMemo(() => tabToDraft(tab), [tab])
  const [restored] = useState(() => loadDraft(key, tabDraftSchema))
  const [draft, setDraft] = useState<TabDraft>(() =>
    restored ? { ...restored, grid: normalizeGrid(restored.grid) } : savedDraft,
  )
  const [wasRestored, setWasRestored] = useState(restored !== null && !isSameDraft(restored, savedDraft))
  const isDirty = !isSameDraft(draft, savedDraft)

  useEffect(() => {
    if (isDirty) saveDraft(key, draft)
    else clearDraft(key)
  }, [key, draft, isDirty])

  const update = useCallback((patch: Partial<TabDraft>) => setDraft((current) => ({ ...current, ...patch })), [])

  const discard = useCallback(() => {
    clearDraft(key)
    setDraft(savedDraft)
    setWasRestored(false)
  }, [key, savedDraft])

  const forget = useCallback(() => clearDraft(key), [key])

  return { draft, update, isDirty, wasRestored, discard, forget }
}
