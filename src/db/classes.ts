import { todayIso } from '../lib/dates'
import { db, newId, RecordNotFoundError, now } from './db'
import { classSchema, validate } from './schemas'
import type { GuitarClass } from './types'

export interface NewClassInput {
  date?: string
  title?: string
}

export type ClassPatch = Partial<Pick<GuitarClass, 'number' | 'date' | 'title' | 'topics'>>

export async function listClasses(): Promise<GuitarClass[]> {
  return db.classes.orderBy('number').reverse().toArray()
}

export async function getClass(id: string): Promise<GuitarClass | undefined> {
  return db.classes.get(id)
}

export async function requireClass(id: string): Promise<GuitarClass> {
  const found = await db.classes.get(id)
  if (!found) throw new RecordNotFoundError('Class', id)
  return found
}

export async function createClass(input: NewClassInput = {}): Promise<GuitarClass> {
  return db.transaction('rw', db.classes, async () => {
    const latest = await db.classes.orderBy('number').last()
    const timestamp = now()
    const record = validate(classSchema, {
      id: newId(),
      number: (latest?.number ?? 0) + 1,
      date: input.date ?? todayIso(),
      title: input.title ?? '',
      topics: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    await db.classes.add(record)
    return record
  })
}

export async function updateClass(id: string, patch: ClassPatch): Promise<GuitarClass> {
  return db.transaction('rw', db.classes, async () => {
    const existing = await requireClass(id)
    const record = validate(classSchema, { ...existing, ...patch, id, updatedAt: now() })
    await db.classes.put(record)
    return record
  })
}

/**
 * Changes a class's topics based on what's saved right now, inside one transaction,
 * so quick taps (add, add, remove) can never overwrite each other.
 */
export async function changeTopics(id: string, change: (topics: readonly string[]) => string[]): Promise<GuitarClass> {
  return db.transaction('rw', db.classes, async () => {
    const existing = await requireClass(id)
    const record = validate(classSchema, { ...existing, topics: change(existing.topics), updatedAt: now() })
    await db.classes.put(record)
    return record
  })
}

/** Deletes a class along with its photos, tabs and notes. */
export async function deleteClass(id: string): Promise<void> {
  await db.transaction('rw', [db.classes, db.photos, db.videos, db.tabs, db.notes], async () => {
    await Promise.all([
      db.photos.where('classId').equals(id).delete(),
      db.videos.where('classId').equals(id).delete(),
      db.tabs.where('classId').equals(id).delete(),
      db.notes.where('classId').equals(id).delete(),
      db.classes.delete(id),
    ])
  })
}
