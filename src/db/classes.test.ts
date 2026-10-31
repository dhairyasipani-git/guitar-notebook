// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyGrid } from '../lib/tab'
import { createClass, deleteClass, getClass, listClasses, updateClass } from './classes'
import { db, RecordNotFoundError } from './db'
import { addDoubt } from './doubts'
import { createNote } from './notes'
import { addPhoto } from './photos'
import { ValidationError } from './schemas'
import { saveTab } from './tabs'
import { addVideo } from './videos'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createClass', () => {
  it("numbers classes in order and starts with today's date", async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 31, 10))

    const first = await createClass()
    const second = await createClass({ title: 'Open chords' })

    expect(first).toMatchObject({ number: 1, date: '2026-10-31', title: '', topics: [] })
    expect(second).toMatchObject({ number: 2, title: 'Open chords' })
  })

  it('continues numbering after the highest class', async () => {
    await createClass()
    const second = await createClass()
    await updateClass(second.id, { number: 5 })

    expect((await createClass()).number).toBe(6)
  })

  it('rejects a date that does not exist', async () => {
    await expect(createClass({ date: '2026-02-30' })).rejects.toThrow(ValidationError)
  })
})

describe('updateClass', () => {
  it('saves the title and topics and bumps the updated time', async () => {
    const created = await createClass()

    const updated = await updateClass(created.id, { title: 'Hammer-ons', topics: ['Hammer-on', ' Major scale '] })

    expect(updated).toMatchObject({ title: 'Hammer-ons', topics: ['Hammer-on', 'Major scale'] })
    expect(updated.updatedAt).toBeGreaterThanOrEqual(created.updatedAt)
    expect(await getClass(created.id)).toEqual(updated)
  })

  it('explains limits in plain words', async () => {
    const created = await createClass()

    await expect(updateClass(created.id, { number: 0 })).rejects.toThrow('Class number must be 1 or more')
    await expect(updateClass(created.id, { number: 2.5 })).rejects.toThrow('Class number must be a whole number')
    await expect(updateClass(created.id, { title: 'x'.repeat(201) })).rejects.toThrow('Keep the title under 200 characters')
    await expect(updateClass(created.id, { topics: ['x'.repeat(41)] })).rejects.toThrow('Keep a topic under 40 characters')
  })

  it('fails clearly for a class that does not exist', async () => {
    await expect(updateClass('missing', { title: 'x' })).rejects.toThrow(RecordNotFoundError)
  })
})

describe('listClasses', () => {
  it('lists the newest class first', async () => {
    await createClass({ title: 'One' })
    await createClass({ title: 'Two' })

    expect((await listClasses()).map((c) => c.title)).toEqual(['Two', 'One'])
  })
})

describe('deleteClass', () => {
  it("removes the class and everything in it, but not your doubts", async () => {
    const keep = await createClass()
    const remove = await createClass()
    await addPhoto(remove.id, new Blob([new Uint8Array([1])], { type: 'image/jpeg' }))
    await saveTab({ classId: remove.id, title: 'Riff', kind: 'grid', grid: createEmptyGrid(1), text: '' })
    await createNote(remove.id)
    await addVideo(remove.id, new Blob([new Uint8Array([1])], { type: 'video/mp4' }))
    await createNote(keep.id)
    await addDoubt('Still want to ask this')

    await deleteClass(remove.id)

    expect(await getClass(remove.id)).toBeUndefined()
    expect(await db.photos.count()).toBe(0)
    expect(await db.videos.count()).toBe(0)
    expect(await db.tabs.count()).toBe(0)
    expect((await db.notes.toArray()).map((n) => n.classId)).toEqual([keep.id])
    expect(await db.doubts.count()).toBe(1)
  })
})
