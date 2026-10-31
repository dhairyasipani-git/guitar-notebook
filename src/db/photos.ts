import { requireClass } from './classes'
import { db, newId, RecordNotFoundError, now } from './db'
import { mediaMetaSchema, validate, ValidationError } from './schemas'
import type { Photo } from './types'

export async function listPhotos(classId: string): Promise<Photo[]> {
  return db.photos.where('classId').equals(classId).sortBy('createdAt')
}

export async function addPhoto(classId: string, blob: Blob, caption = ''): Promise<Photo> {
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new ValidationError('That file is empty. Pick another photo.')
  }
  if (blob.type !== '' && !blob.type.startsWith('image/')) {
    throw new ValidationError('Only image files can be added as sheets')
  }

  return db.transaction('rw', [db.classes, db.photos], async () => {
    await requireClass(classId)
    const meta = validate(mediaMetaSchema, { id: newId(), classId, caption, createdAt: now() })
    const record: Photo = { ...meta, blob }
    await db.photos.add(record)
    return record
  })
}

export async function updatePhotoCaption(id: string, caption: string): Promise<void> {
  const { caption: clean } = validate(mediaMetaSchema.pick({ caption: true }), { caption })
  const updated = await db.photos.update(id, { caption: clean })
  if (updated === 0) throw new RecordNotFoundError('Photo', id)
}

export async function deletePhoto(id: string): Promise<void> {
  await db.photos.delete(id)
}
