// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyGrid } from '../lib/tab'
import { backupToBlob, exportBackup, importBackup } from './backup'
import { createClass, listClasses } from './classes'
import { db } from './db'
import { addDoubt } from './doubts'
import { createNote, updateNote } from './notes'
import { addPhoto, listPhotos } from './photos'
import { saveTab } from './tabs'
import { addVideo, listVideos } from './videos'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

async function seed(title: string): Promise<string> {
  const guitarClass = await createClass({ title })
  await addPhoto(guitarClass.id, new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }), 'Sheet')
  await saveTab({ classId: guitarClass.id, title: 'Riff', kind: 'grid', grid: createEmptyGrid(1), text: '' })
  const note = await createNote(guitarClass.id)
  await updateNote(note.id, { title: 'Theory', body: 'A paragraph' })
  await addVideo(guitarClass.id, new Blob([new Uint8Array([7, 8])], { type: 'video/mp4' }), 'Tutor demo')
  await addDoubt('Why?')
  return guitarClass.id
}

describe('backup', () => {
  it('round-trips everything, including the photo bytes', async () => {
    const classId = await seed('One')
    const json = JSON.stringify(await exportBackup())
    await db.delete()
    await db.open()

    const counts = await importBackup(json)

    expect(counts).toEqual({ classes: 1, photos: 1, videos: 1, tabs: 1, notes: 1, doubts: 1 })
    const [video] = await listVideos(classId)
    expect(video).toMatchObject({ caption: 'Tutor demo' })
    expect(video.blob.type).toBe('video/mp4')
    expect(Array.from(new Uint8Array(await video.blob.arrayBuffer()))).toEqual([7, 8])
    const [photo] = await listPhotos(classId)
    expect(photo.blob.type).toBe('image/jpeg')
    expect(Array.from(new Uint8Array(await photo.blob.arrayBuffer()))).toEqual([1, 2, 3])
  })

  it('still restores a backup made before videos existed', async () => {
    await seed('Old')
    const { videos: _videos, ...rest } = await exportBackup()
    const oldBackup = JSON.stringify({ ...rest, version: 2 })
    await db.delete()
    await db.open()

    const counts = await importBackup(oldBackup)

    expect(counts).toMatchObject({ classes: 1, videos: 0, tabs: 1 })
  })

  it('writes videos into the backup file too', async () => {
    await seed('One')
    const text = await backupToBlob(await exportBackup()).text()

    expect(JSON.parse(text).videos).toHaveLength(1)
  })

  it('replaces what was there before', async () => {
    await seed('From backup')
    const json = JSON.stringify(await exportBackup())
    await seed('Made later')

    await importBackup(json)

    expect((await listClasses()).map((c) => c.title)).toEqual(['From backup'])
  })

  it.each([['not json'], [JSON.stringify({ app: 'something-else' })], [JSON.stringify({ app: 'guitar-notebook', version: 1 })]])(
    'rejects a file that is not a valid backup: %s',
    async (text) => {
      await expect(importBackup(text)).rejects.toThrow(/not a guitar notebook backup/i)
    },
  )

  it('builds a backup file that reads back to the same backup', async () => {
    await seed('One')
    await seed('Two')
    const backup = await exportBackup()

    const text = await backupToBlob(backup).text()

    expect(JSON.parse(text)).toEqual(backup)
  })

  it('rejects backups with repeated ids or empty photos', async () => {
    await seed('One')
    const backup = await exportBackup()
    const repeated = { ...backup, doubts: [...backup.doubts, ...backup.doubts] }
    const emptyPhoto = { ...backup, photos: backup.photos.map((p) => ({ ...p, dataUrl: 'data:image/jpeg;base64,' })) }

    await expect(importBackup(JSON.stringify(repeated))).rejects.toThrow(/not a guitar notebook backup/i)
    await expect(importBackup(JSON.stringify(emptyPhoto))).rejects.toThrow(/not a guitar notebook backup/i)
  })

  it('leaves your notes alone when the backup is broken', async () => {
    await seed('Keep me')

    await expect(importBackup('{"app":"guitar-notebook"}')).rejects.toThrow()

    expect((await listClasses()).map((c) => c.title)).toEqual(['Keep me'])
  })
})
