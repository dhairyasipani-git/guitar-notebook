import type { Transaction } from 'dexie'
import { addTopic } from '../lib/topics'

/** Shapes as they were stored by version 1 of the app. */
interface LegacyClass {
  id: string
  number: number
  date: string
  title: string
  notes?: unknown
  tags?: unknown
  createdAt: number
  updatedAt: number
}

interface LegacyDoubt {
  id: string
  text: string
  answeredAt?: number | null
  createdAt: number
}

function legacyTopics(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .map((tag: unknown) => (typeof tag === 'string' ? tag : (tag as { label?: unknown } | null)?.label))
    .filter((label): label is string => typeof label === 'string')
    .reduce<string[]>((topics, label) => addTopic(topics, label), [])
}

/**
 * Version 2: free-form topics replace categorised tags, a class's notes field
 * becomes its first note entry, doubts no longer belong to a class (answered
 * ones were cleared), and practice items are gone.
 */
export async function upgradeToVersionTwo(tx: Transaction, newId: () => string): Promise<void> {
  const classes = tx.table<LegacyClass>('classes')
  const notes = tx.table('notes')
  const doubts = tx.table<LegacyDoubt>('doubts')

  for (const legacy of await classes.toArray()) {
    const { notes: oldNotes, tags, ...rest } = legacy
    await classes.put({ ...rest, topics: legacyTopics(tags) } as LegacyClass)
    if (typeof oldNotes === 'string' && oldNotes.trim() !== '') {
      await notes.add({ id: newId(), classId: legacy.id, title: '', body: oldNotes, createdAt: legacy.createdAt, updatedAt: legacy.updatedAt })
    }
  }

  for (const doubt of await doubts.toArray()) {
    const isCleared = doubt.answeredAt !== null && doubt.answeredAt !== undefined
    if (isCleared) await doubts.delete(doubt.id)
    else await doubts.put({ id: doubt.id, text: doubt.text, createdAt: doubt.createdAt })
  }
}

/** Version 3 adds a description to tabs; older tabs start with an empty one. */
export async function upgradeToVersionThree(tx: Transaction): Promise<void> {
  await tx
    .table('tabs')
    .toCollection()
    .modify((tab: { description?: string }) => {
      if (typeof tab.description !== 'string') tab.description = ''
    })
}
