// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { createClass } from './classes'
import { db } from './db'
import { createNote } from './notes'
import { addPhoto } from './photos'
import { countsFor, getClassCounts } from './stats'
import { addVideo } from './videos'
import { saveTab } from './tabs'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('getClassCounts', () => {
  it('counts photos, videos, tabs and notes for each class', async () => {
    const busy = await createClass()
    const quiet = await createClass()
    const jpeg = new Blob([new Uint8Array([1])], { type: 'image/jpeg' })
    await addPhoto(busy.id, jpeg)
    await addPhoto(busy.id, jpeg)
    await saveTab({ classId: busy.id, title: '', kind: 'text', grid: [], text: 'e|-0-|' })
    await createNote(busy.id)
    await addVideo(busy.id, new Blob([new Uint8Array([1])], { type: 'video/mp4' }))

    const counts = await getClassCounts()

    expect(countsFor(counts, busy.id)).toEqual({ photos: 2, videos: 1, tabs: 1, notes: 1 })
    expect(countsFor(counts, quiet.id)).toEqual({ photos: 0, videos: 0, tabs: 0, notes: 0 })
  })
})
