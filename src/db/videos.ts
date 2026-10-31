import { requireClass } from './classes'
import { db, newId, RecordNotFoundError, now } from './db'
import { mediaMetaSchema, validate, ValidationError } from './schemas'
import type { Video } from './types'

/** Videos are stored whole on the device, so very long ones are turned away. */
export const MAX_VIDEO_BYTES = 300 * 1024 * 1024

export async function listVideos(classId: string): Promise<Video[]> {
  return db.videos.where('classId').equals(classId).sortBy('createdAt')
}

export async function addVideo(classId: string, blob: Blob, caption = ''): Promise<Video> {
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new ValidationError('That file is empty. Pick another video.')
  }
  if (blob.type !== '' && !blob.type.startsWith('video/')) {
    throw new ValidationError('Only video files can be added as videos')
  }
  if (blob.size > MAX_VIDEO_BYTES) {
    throw new ValidationError('That video is over 300 MB. Trim it on your phone first, then add it.')
  }

  return db.transaction('rw', [db.classes, db.videos], async () => {
    await requireClass(classId)
    const meta = validate(mediaMetaSchema, { id: newId(), classId, caption, createdAt: now() })
    const record: Video = { ...meta, blob }
    await db.videos.add(record)
    return record
  })
}

export async function updateVideoCaption(id: string, caption: string): Promise<void> {
  const { caption: clean } = validate(mediaMetaSchema.pick({ caption: true }), { caption })
  const updated = await db.videos.update(id, { caption: clean })
  if (updated === 0) throw new RecordNotFoundError('Video', id)
}

export async function deleteVideo(id: string): Promise<void> {
  await db.videos.delete(id)
}
