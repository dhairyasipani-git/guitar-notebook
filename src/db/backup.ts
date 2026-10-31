import { z } from 'zod'
import { normalizeGrid } from '../lib/tab'
import { db } from './db'
import { classSchema, doubtSchema, noteSchema, photoBackupSchema, tabSchema, ValidationError, videoBackupSchema } from './schemas'
import type { Doubt, GuitarClass, Note, Photo, SavedTab, Video } from './types'

export const BACKUP_APP = 'guitar-notebook'
export const BACKUP_VERSION = 3
// Version 2 files are the same minus videos, so they still restore.
const READABLE_VERSIONS = [2, BACKUP_VERSION] as const

const NOT_A_BACKUP = 'This file is not a guitar notebook backup, or it is damaged.'
const BASE64_CHUNK = 0x8000

export type PhotoBackup = z.output<typeof photoBackupSchema>
export type VideoBackup = z.output<typeof videoBackupSchema>

export interface BackupFile {
  app: typeof BACKUP_APP
  version: typeof BACKUP_VERSION
  exportedAt: string
  classes: GuitarClass[]
  photos: PhotoBackup[]
  videos: VideoBackup[]
  tabs: SavedTab[]
  notes: Note[]
  doubts: Doubt[]
}

export interface BackupCounts {
  classes: number
  photos: number
  videos: number
  tabs: number
  notes: number
  doubts: number
}

const backupSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.union(READABLE_VERSIONS.map((version) => z.literal(version))),
  exportedAt: z.string(),
  classes: z.array(classSchema),
  photos: z.array(photoBackupSchema),
  videos: z.array(videoBackupSchema).default([]),
  tabs: z.array(tabSchema),
  notes: z.array(noteSchema),
  doubts: z.array(doubtSchema),
})

async function blobToDataUrl(blob: Blob, fallbackType: string): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const chunks = Array.from({ length: Math.ceil(bytes.length / BASE64_CHUNK) }, (_, i) =>
    String.fromCharCode(...bytes.subarray(i * BASE64_CHUNK, (i + 1) * BASE64_CHUNK)),
  )
  return `data:${blob.type || fallbackType};base64,${btoa(chunks.join(''))}`
}

function dataUrlToBlob(dataUrl: string): Blob {
  const commaIndex = dataUrl.indexOf(',')
  const type = dataUrl.slice('data:'.length, dataUrl.indexOf(';'))
  const bytes = Uint8Array.from(atob(dataUrl.slice(commaIndex + 1)), (char) => char.charCodeAt(0))
  return new Blob([bytes], { type })
}

/** Turns stored media into text one file at a time, which keeps peak memory low on phones. */
async function encodeMedia<T extends { blob: Blob }>(items: readonly T[], fallbackType: string): Promise<Array<Omit<T, 'blob'> & { dataUrl: string }>> {
  let encoded: Array<Omit<T, 'blob'> & { dataUrl: string }> = []
  for (const { blob, ...meta } of items) {
    encoded = [...encoded, { ...meta, dataUrl: await blobToDataUrl(blob, fallbackType) }]
  }
  return encoded
}

export async function exportBackup(): Promise<BackupFile> {
  const [classes, photos, videos, tabs, notes, doubts] = await db.transaction(
    'r',
    [db.classes, db.photos, db.videos, db.tabs, db.notes, db.doubts],
    () =>
      Promise.all([
        db.classes.toArray(),
        db.photos.toArray(),
        db.videos.toArray(),
        db.tabs.toArray(),
        db.notes.toArray(),
        db.doubts.toArray(),
      ]),
  )
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    classes,
    photos: await encodeMedia<Photo>(photos, 'image/jpeg'),
    videos: await encodeMedia<Video>(videos, 'video/mp4'),
    tabs,
    notes,
    doubts,
  }
}

function jsonArrayParts(items: readonly unknown[]): string[] {
  return items.flatMap((item, index) => (index === 0 ? [JSON.stringify(item)] : [',', JSON.stringify(item)]))
}

/** Builds the backup file in pieces, so photos and videos are never glued into one giant string. */
export function backupToBlob(backup: BackupFile): Blob {
  const { photos, videos, ...rest } = backup
  const head = JSON.stringify(rest).slice(0, -1)
  return new Blob([head, ',"photos":[', ...jsonArrayParts(photos), '],"videos":[', ...jsonArrayParts(videos), ']}'], {
    type: 'application/json',
  })
}

function hasDuplicateIds(rows: ReadonlyArray<{ id: string }>): boolean {
  return new Set(rows.map((row) => row.id)).size !== rows.length
}

function parseBackup(text: string): z.output<typeof backupSchema> {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new ValidationError(NOT_A_BACKUP)
  }
  const result = backupSchema.safeParse(raw)
  if (!result.success) throw new ValidationError(NOT_A_BACKUP)

  const { classes, photos, videos, tabs, notes, doubts } = result.data
  const classIds = new Set(classes.map((c) => c.id))
  const children = [...photos, ...videos, ...tabs, ...notes]
  const isBroken =
    children.some((child) => !classIds.has(child.classId)) || [classes, photos, videos, tabs, notes, doubts].some(hasDuplicateIds)
  if (isBroken) throw new ValidationError(NOT_A_BACKUP)
  return result.data
}

function decodeMedia<T extends { dataUrl: string }>(items: readonly T[]): Array<Omit<T, 'dataUrl'> & { blob: Blob }> {
  try {
    return items.map(({ dataUrl, ...meta }) => ({ ...meta, blob: dataUrlToBlob(dataUrl) }))
  } catch {
    throw new ValidationError(NOT_A_BACKUP)
  }
}

/** Replaces everything in the notebook with the backup's contents. Nothing changes if the file is invalid. */
export async function importBackup(text: string): Promise<BackupCounts> {
  const backup = parseBackup(text)
  const photos: Photo[] = decodeMedia(backup.photos)
  const videos: Video[] = decodeMedia(backup.videos)
  const tabs: SavedTab[] = backup.tabs.map((tab) =>
    tab.kind === 'grid' ? { ...tab, grid: normalizeGrid(tab.grid).map((row) => [...row]) } : tab,
  )

  await db.transaction('rw', [db.classes, db.photos, db.videos, db.tabs, db.notes, db.doubts], async () => {
    await Promise.all([db.classes.clear(), db.photos.clear(), db.videos.clear(), db.tabs.clear(), db.notes.clear(), db.doubts.clear()])
    await Promise.all([
      db.classes.bulkAdd(backup.classes),
      db.photos.bulkAdd(photos),
      db.videos.bulkAdd(videos),
      db.tabs.bulkAdd(tabs),
      db.notes.bulkAdd(backup.notes),
      db.doubts.bulkAdd(backup.doubts),
    ])
  })

  return {
    classes: backup.classes.length,
    photos: photos.length,
    videos: videos.length,
    tabs: tabs.length,
    notes: backup.notes.length,
    doubts: backup.doubts.length,
  }
}
