import { useNotes, usePhotos, useTabs, useVideos } from '../db/hooks'
import type { Note, SavedTab, Video } from '../db/types'
import { NoteCard } from './NoteCard'
import { PhotoGrid } from './PhotoGrid'
import { TabCard } from './TabCard'
import { VideoCard } from './VideoCard'

interface ClassContentProps {
  classId: string
  /** A note that was just added and should get the cursor. */
  focusNoteId: string | null
}

type Entry = { kind: 'tab'; item: SavedTab } | { kind: 'note'; item: Note } | { kind: 'video'; item: Video }

/** Everything from a class: photos of the sheets, then tabs, notes and videos in the order they were added. */
export function ClassContent({ classId, focusNoteId }: ClassContentProps) {
  const photos = usePhotos(classId)
  const tabs = useTabs(classId)
  const notes = useNotes(classId)
  const videos = useVideos(classId)

  if (!photos || !tabs || !notes || !videos) return null

  const entries: Entry[] = [
    ...tabs.map((item): Entry => ({ kind: 'tab', item })),
    ...notes.map((item): Entry => ({ kind: 'note', item })),
    ...videos.map((item): Entry => ({ kind: 'video', item })),
  ].sort((a, b) => a.item.createdAt - b.item.createdAt)

  if (entries.length === 0 && photos.length === 0) {
    return <p className="empty-hint">Nothing here yet. Add a tab, a note, a photo of today's sheet, or a video from class.</p>
  }

  return (
    <div className="stack-lg">
      {photos.length > 0 && <PhotoGrid photos={photos} />}
      {entries.map((entry) => {
        if (entry.kind === 'tab') return <TabCard key={entry.item.id} tab={entry.item} />
        if (entry.kind === 'video') return <VideoCard key={entry.item.id} video={entry.item} />
        return <NoteCard key={entry.item.id} note={entry.item} autoFocus={entry.item.id === focusNoteId} />
      })}
    </div>
  )
}
