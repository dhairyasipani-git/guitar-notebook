import Dexie, { type EntityTable } from 'dexie'
import { upgradeToVersionThree, upgradeToVersionTwo } from './migrations'
import type { Doubt, GuitarClass, Note, Photo, SavedTab, Video } from './types'

export const DB_NAME = 'guitar-notebook'

export function newId(): string {
  return crypto.randomUUID()
}

export class NotebookDB extends Dexie {
  classes!: EntityTable<GuitarClass, 'id'>
  photos!: EntityTable<Photo, 'id'>
  tabs!: EntityTable<SavedTab, 'id'>
  notes!: EntityTable<Note, 'id'>
  doubts!: EntityTable<Doubt, 'id'>
  videos!: EntityTable<Video, 'id'>

  constructor(name: string = DB_NAME) {
    super(name)
    this.version(1).stores({
      classes: 'id, number',
      photos: 'id, classId',
      tabs: 'id, classId',
      practice: 'id, classId',
      doubts: 'id, classId, createdAt',
    })
    this.version(2)
      .stores({
        classes: 'id, number',
        photos: 'id, classId',
        tabs: 'id, classId',
        notes: 'id, classId',
        doubts: 'id, createdAt',
        practice: null,
      })
      .upgrade((tx) => upgradeToVersionTwo(tx, newId))
    this.version(3).stores({}).upgrade(upgradeToVersionThree)
    this.version(4).stores({ videos: 'id, classId' })
  }
}

export const db = new NotebookDB()

export class RecordNotFoundError extends Error {
  constructor(kind: string, id: string) {
    super(`${kind} not found: ${id}`)
    this.name = 'RecordNotFoundError'
  }
}

let lastTimestamp = 0

/** Like Date.now(), but never repeats, so "oldest first" ordering stays stable. */
export function now(): number {
  const current = Date.now()
  lastTimestamp = current > lastTimestamp ? current : lastTimestamp + 1
  return lastTimestamp
}
