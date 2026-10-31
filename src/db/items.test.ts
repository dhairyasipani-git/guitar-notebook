// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { BAR_LENGTH, createEmptyGrid, setCell } from '../lib/tab'
import { createClass } from './classes'
import { db, RecordNotFoundError } from './db'
import { addDoubt, clearDoubt, listDoubts, restoreDoubt } from './doubts'
import { createNote, deleteNote, listNotes, updateNote } from './notes'
import { addPhoto, deletePhoto, listPhotos, updatePhotoCaption } from './photos'
import { ValidationError } from './schemas'
import { deleteTab, getTab, listTabs, saveTab } from './tabs'
import { addVideo, deleteVideo, listVideos, MAX_VIDEO_BYTES, updateVideoCaption } from './videos'

let classId = ''

beforeEach(async () => {
  await db.delete()
  await db.open()
  classId = (await createClass()).id
})

const jpeg = (byte: number): Blob => new Blob([new Uint8Array([byte])], { type: 'image/jpeg' })

describe('photos', () => {
  it('stores photos per class, oldest first', async () => {
    const other = await createClass()
    await addPhoto(classId, jpeg(1), 'Exercise 1')
    await addPhoto(classId, jpeg(2))
    await addPhoto(other.id, jpeg(3))

    const photos = await listPhotos(classId)

    expect(photos.map((p) => p.caption)).toEqual(['Exercise 1', ''])
    expect(Array.from(new Uint8Array(await photos[0].blob.arrayBuffer()))).toEqual([1])
  })

  it('renames and deletes a photo', async () => {
    const photo = await addPhoto(classId, jpeg(1))

    await updatePhotoCaption(photo.id, '  Pull-off drill ')
    expect((await listPhotos(classId))[0].caption).toBe('Pull-off drill')

    await deletePhoto(photo.id)
    expect(await listPhotos(classId)).toEqual([])
  })

  it('refuses photos for a class that does not exist or files that are not images', async () => {
    await expect(addPhoto('missing', jpeg(1))).rejects.toThrow(RecordNotFoundError)
    await expect(addPhoto(classId, new Blob(['x'], { type: 'text/plain' }))).rejects.toThrow(ValidationError)
  })
})

describe('videos', () => {
  const mp4 = (byte: number): Blob => new Blob([new Uint8Array([byte])], { type: 'video/mp4' })

  it('stores videos per class, oldest first, with a caption you can change', async () => {
    const first = await addVideo(classId, mp4(1), 'Tutor demo')
    await addVideo(classId, mp4(2))

    await updateVideoCaption(first.id, '  Slow version ')

    expect((await listVideos(classId)).map((video) => video.caption)).toEqual(['Slow version', ''])
  })

  it('deletes a video', async () => {
    const video = await addVideo(classId, mp4(1))

    await deleteVideo(video.id)

    expect(await listVideos(classId)).toEqual([])
  })

  it('refuses empty files, non-videos, huge videos and missing classes', async () => {
    const huge = { size: MAX_VIDEO_BYTES + 1, type: 'video/mp4' }
    await expect(addVideo(classId, new Blob([], { type: 'video/mp4' }))).rejects.toThrow(ValidationError)
    await expect(addVideo(classId, jpeg(1))).rejects.toThrow('Only video files')
    await expect(addVideo(classId, Object.setPrototypeOf(huge, Blob.prototype) as Blob)).rejects.toThrow('over 300 MB')
    await expect(addVideo('missing', mp4(1))).rejects.toThrow(RecordNotFoundError)
  })
})

describe('tabs', () => {
  it('keeps a trimmed description, empty when left out', async () => {
    const described = await saveTab({ classId, title: 'Riff', description: ' Play it with alternate picking ', kind: 'text', grid: [], text: 'x' })
    const plain = await saveTab({ classId, title: 'Riff 2', kind: 'text', grid: [], text: 'x' })

    expect(described.description).toBe('Play it with alternate picking')
    expect(plain.description).toBe('')
  })

  it('creates a grid tab with a cleaned-up grid', async () => {
    const grid = setCell(createEmptyGrid(1), 2, 0, '5')

    const tab = await saveTab({ classId, title: ' Hammer-on drill ', kind: 'grid', grid, text: 'ignored' })

    expect(tab).toMatchObject({ title: 'Hammer-on drill', kind: 'grid', text: '' })
    expect(tab.grid[2][0]).toBe('5')
    expect(tab.grid[0]).toHaveLength(BAR_LENGTH)
  })

  it('updates an existing tab and keeps its creation time', async () => {
    const created = await saveTab({ classId, title: 'Riff', kind: 'text', grid: [], text: 'e|--0--|' })

    const updated = await saveTab({ id: created.id, classId, title: 'Riff v2', kind: 'text', grid: [], text: 'e|--3--|' })

    expect(updated.createdAt).toBe(created.createdAt)
    expect(await getTab(created.id)).toMatchObject({ title: 'Riff v2', text: 'e|--3--|', grid: [] })
    expect(await listTabs(classId)).toHaveLength(1)
  })

  it('deletes a tab', async () => {
    const tab = await saveTab({ classId, title: '', kind: 'text', grid: [], text: 'x' })

    await deleteTab(tab.id)

    expect(await getTab(tab.id)).toBeUndefined()
  })
})

describe('notes', () => {
  it('creates empty notes in order and saves what you write', async () => {
    const theory = await createNote(classId)
    await createNote(classId)

    await updateNote(theory.id, { title: ' Circle of fifths ', body: 'Each step clockwise adds a sharp.' })

    expect(await listNotes(classId)).toMatchObject([
      { title: 'Circle of fifths', body: 'Each step clockwise adds a sharp.' },
      { title: '', body: '' },
    ])
  })

  it('deletes a note and fails clearly for one that is gone', async () => {
    const note = await createNote(classId)

    await deleteNote(note.id)

    expect(await listNotes(classId)).toEqual([])
    await expect(updateNote(note.id, { body: 'x' })).rejects.toThrow(RecordNotFoundError)
  })

  it('refuses notes for a class that does not exist', async () => {
    await expect(createNote('missing')).rejects.toThrow(RecordNotFoundError)
  })
})

describe('doubts', () => {
  it('needs some text', async () => {
    await expect(addDoubt('  ')).rejects.toThrow('Write your doubt first')
  })

  it('lists the newest doubt first', async () => {
    await addDoubt('First')
    await addDoubt(' Second ')

    expect((await listDoubts()).map((d) => d.text)).toEqual(['Second', 'First'])
  })

  it('clears a doubt and can put it back', async () => {
    const doubt = await addDoubt('Thumb behind the neck?')

    const cleared = await clearDoubt(doubt.id)
    expect(await listDoubts()).toEqual([])

    await restoreDoubt(cleared)
    expect(await listDoubts()).toEqual([doubt])
  })

  it('fails clearly when clearing a doubt that is already gone', async () => {
    await expect(clearDoubt('missing')).rejects.toThrow(RecordNotFoundError)
  })
})
