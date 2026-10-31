import { useLiveQuery } from 'dexie-react-hooks'
import { getClass, listClasses } from './classes'
import { listDoubts } from './doubts'
import { listNotes } from './notes'
import { listPhotos } from './photos'
import { getClassCounts, type ClassCounts } from './stats'
import { getTab, listTabs } from './tabs'
import type { Doubt, GuitarClass, Note, Photo, SavedTab, Video } from './types'
import { listVideos } from './videos'

// Each hook re-renders automatically whenever the underlying table changes.
// `undefined` means "still loading"; `null` means "looked it up and it isn't there".

export function useClasses(): GuitarClass[] | undefined {
  return useLiveQuery(listClasses, [])
}

export function useClass(id: string | undefined): GuitarClass | null | undefined {
  return useLiveQuery(async () => (id ? ((await getClass(id)) ?? null) : null), [id])
}

export function useClassCounts(): ReadonlyMap<string, ClassCounts> | undefined {
  return useLiveQuery(getClassCounts, [])
}

export function usePhotos(classId: string): Photo[] | undefined {
  return useLiveQuery(() => listPhotos(classId), [classId])
}

export function useVideos(classId: string): Video[] | undefined {
  return useLiveQuery(() => listVideos(classId), [classId])
}

export function useTabs(classId: string): SavedTab[] | undefined {
  return useLiveQuery(() => listTabs(classId), [classId])
}

export function useTab(id: string | undefined): SavedTab | null | undefined {
  return useLiveQuery(async () => (id ? ((await getTab(id)) ?? null) : null), [id])
}

export function useNotes(classId: string): Note[] | undefined {
  return useLiveQuery(() => listNotes(classId), [classId])
}

export function useDoubts(): Doubt[] | undefined {
  return useLiveQuery(listDoubts, [])
}
