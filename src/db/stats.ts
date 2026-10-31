import { db } from './db'

export interface ClassCounts {
  photos: number
  videos: number
  tabs: number
  notes: number
}

const EMPTY_COUNTS: ClassCounts = { photos: 0, videos: 0, tabs: 0, notes: 0 }

function tally(classIds: readonly string[]): ReadonlyMap<string, number> {
  return classIds.reduce((counts, id) => new Map(counts).set(id, (counts.get(id) ?? 0) + 1), new Map<string, number>())
}

export function countsFor(counts: ReadonlyMap<string, ClassCounts> | undefined, classId: string): ClassCounts {
  return counts?.get(classId) ?? EMPTY_COUNTS
}

/** Photo, video, tab and note counts per class, read from indexes so photo data is never loaded. */
export async function getClassCounts(): Promise<ReadonlyMap<string, ClassCounts>> {
  const [photoIds, videoIds, tabIds, noteIds] = await Promise.all([
    db.photos.orderBy('classId').keys(),
    db.videos.orderBy('classId').keys(),
    db.tabs.orderBy('classId').keys(),
    db.notes.orderBy('classId').keys(),
  ])
  const photos = tally(photoIds.map(String))
  const videos = tally(videoIds.map(String))
  const tabs = tally(tabIds.map(String))
  const notes = tally(noteIds.map(String))
  const classIds = new Set([...photos.keys(), ...videos.keys(), ...tabs.keys(), ...notes.keys()])

  return new Map(
    [...classIds].map((id) => [
      id,
      { photos: photos.get(id) ?? 0, videos: videos.get(id) ?? 0, tabs: tabs.get(id) ?? 0, notes: notes.get(id) ?? 0 },
    ]),
  )
}
