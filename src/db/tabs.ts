import { normalizeGrid, type TabGrid } from '../lib/tab'
import { requireClass } from './classes'
import { db, newId, RecordNotFoundError, now } from './db'
import { tabSchema, validate } from './schemas'
import type { SavedTab, TabKind } from './types'

export interface TabInput {
  /** Leave out to create a new tab. */
  id?: string
  classId: string
  title: string
  description?: string
  kind: TabKind
  grid: TabGrid
  text: string
}

export async function listTabs(classId: string): Promise<SavedTab[]> {
  return db.tabs.where('classId').equals(classId).sortBy('createdAt')
}

export async function getTab(id: string): Promise<SavedTab | undefined> {
  return db.tabs.get(id)
}

export async function saveTab(input: TabInput): Promise<SavedTab> {
  return db.transaction('rw', [db.classes, db.tabs], async () => {
    await requireClass(input.classId)
    const existing = input.id ? await db.tabs.get(input.id) : undefined
    if (input.id && !existing) throw new RecordNotFoundError('Tab', input.id)

    const timestamp = now()
    const isGrid = input.kind === 'grid'
    const record = validate(tabSchema, {
      id: existing?.id ?? newId(),
      classId: input.classId,
      title: input.title,
      description: input.description ?? '',
      kind: input.kind,
      grid: isGrid ? normalizeGrid(input.grid).map((row) => [...row]) : [],
      text: isGrid ? '' : input.text,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })
    await db.tabs.put(record)
    return record
  })
}

export async function deleteTab(id: string): Promise<void> {
  await db.tabs.delete(id)
}
