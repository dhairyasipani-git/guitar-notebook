import { db, newId, now, RecordNotFoundError } from './db'
import { doubtSchema, validate } from './schemas'
import type { Doubt } from './types'

export async function listDoubts(): Promise<Doubt[]> {
  return db.doubts.orderBy('createdAt').reverse().toArray()
}

export async function addDoubt(text: string): Promise<Doubt> {
  const record = validate(doubtSchema, { id: newId(), text, createdAt: now() })
  await db.doubts.add(record)
  return record
}

/** Ticks a doubt off: it's removed, and returned so it can be put back with undo. */
export async function clearDoubt(id: string): Promise<Doubt> {
  return db.transaction('rw', db.doubts, async () => {
    const existing = await db.doubts.get(id)
    if (!existing) throw new RecordNotFoundError('Doubt', id)
    await db.doubts.delete(id)
    return existing
  })
}

export async function restoreDoubt(doubt: Doubt): Promise<void> {
  await db.doubts.put(validate(doubtSchema, doubt))
}
