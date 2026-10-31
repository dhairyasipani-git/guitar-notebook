// @vitest-environment node
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { NotebookDB } from './db'

const DB_NAME = 'migration-test'
const CLASS_ID = '6f1c5d3e-1d2b-4c3a-9e8f-0a1b2c3d4e5f'
const OPEN_DOUBT_ID = '7a2b3c4d-5e6f-4a1b-8c9d-0e1f2a3b4c5d'
const CLEARED_DOUBT_ID = '8b3c4d5e-6f7a-4b2c-9d0e-1f2a3b4c5d6e'

beforeEach(async () => {
  await Dexie.delete(DB_NAME)
})

async function seedVersionOne(): Promise<void> {
  const legacy = new Dexie(DB_NAME)
  legacy.version(1).stores({
    classes: 'id, number',
    photos: 'id, classId',
    tabs: 'id, classId',
    practice: 'id, classId',
    doubts: 'id, classId, createdAt',
  })
  await legacy.open()
  await legacy.table('classes').add({
    id: CLASS_ID,
    number: 1,
    date: '2026-10-21',
    title: 'Hammer-ons',
    notes: 'Hit hard behind the fret',
    tags: [
      { label: 'Hammer-on', category: 'technique', learning: false },
      { label: 'hammer-on', category: 'other', learning: true },
      { label: 'Am', category: 'chord', learning: false },
    ],
    createdAt: 1,
    updatedAt: 2,
  })
  await legacy.table('practice').add({ id: 'p1', classId: CLASS_ID, name: 'Spider', currentBpm: null, goalBpm: null, done: false, createdAt: 3 })
  await legacy.table('doubts').bulkAdd([
    { id: OPEN_DOUBT_ID, classId: CLASS_ID, text: 'Thumb position?', answer: null, answeredAt: null, createdAt: 4 },
    { id: CLEARED_DOUBT_ID, classId: CLASS_ID, text: 'Pick or fingers?', answer: 'Pick', answeredAt: 6, createdAt: 5 },
  ])
  legacy.close()
}

describe('upgrading from version 1', () => {
  it('turns tags into topics, class notes into a note, and drops cleared doubts and practice', async () => {
    await seedVersionOne()

    const upgraded = new NotebookDB(DB_NAME)
    await upgraded.open()

    expect(await upgraded.classes.toArray()).toEqual([
      { id: CLASS_ID, number: 1, date: '2026-10-21', title: 'Hammer-ons', topics: ['Hammer-on', 'Am'], createdAt: 1, updatedAt: 2 },
    ])
    expect(await upgraded.notes.toArray()).toMatchObject([{ classId: CLASS_ID, title: '', body: 'Hit hard behind the fret', createdAt: 1 }])
    expect(await upgraded.doubts.toArray()).toEqual([{ id: OPEN_DOUBT_ID, text: 'Thumb position?', createdAt: 4 }])
    expect(upgraded.tables.map((table) => table.name)).not.toContain('practice')
    upgraded.close()
  })
})

describe('upgrading from version 2', () => {
  it('gives existing tabs an empty description', async () => {
    const previous = new Dexie(DB_NAME)
    previous.version(2).stores({ classes: 'id, number', photos: 'id, classId', tabs: 'id, classId', notes: 'id, classId', doubts: 'id, createdAt' })
    await previous.open()
    await previous.table('tabs').add({ id: 't1', classId: CLASS_ID, title: 'Riff', kind: 'text', grid: [], text: 'e|-0-|', createdAt: 1, updatedAt: 1 })
    previous.close()

    const upgraded = new NotebookDB(DB_NAME)
    await upgraded.open()

    expect(await upgraded.tabs.get('t1')).toMatchObject({ title: 'Riff', description: '' })
    upgraded.close()
  })
})
