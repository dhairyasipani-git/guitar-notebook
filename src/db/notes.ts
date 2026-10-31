import { requireClass } from './classes'
import { db, newId, now, RecordNotFoundError } from './db'
import { noteSchema, validate } from './schemas'
import type { Note } from './types'

export type NotePatch = Partial<Pick<Note, 'title' | 'body'>>

export async function listNotes(classId: string): Promise<Note[]> {
  return db.notes.where('classId').equals(classId).sortBy('createdAt')
}

export async function createNote(classId: string): Promise<Note> {
  return db.transaction('rw', [db.classes, db.notes], async () => {
    await requireClass(classId)
    const timestamp = now()
    const record = validate(noteSchema, { id: newId(), classId, title: '', body: '', createdAt: timestamp, updatedAt: timestamp })
    await db.notes.add(record)
    return record
  })
}

export async function updateNote(id: string, patch: NotePatch): Promise<Note> {
  return db.transaction('rw', db.notes, async () => {
    const existing = await db.notes.get(id)
    if (!existing) throw new RecordNotFoundError('Note', id)
    const record = validate(noteSchema, { ...existing, ...patch, id, updatedAt: now() })
    await db.notes.put(record)
    return record
  })
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id)
}
