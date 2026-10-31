import { describe, expect, it } from 'vitest'
import { addTopic, classMatches, collectTopics, removeTopic } from './topics'

describe('addTopic', () => {
  it('adds a trimmed topic without changing the original list', () => {
    const topics = ['Am']

    const next = addTopic(topics, '  Hammer-on ')

    expect(next).toEqual(['Am', 'Hammer-on'])
    expect(topics).toEqual(['Am'])
  })

  it('drops a leading # so tags can be typed like hashtags', () => {
    expect(addTopic([], '#Legato')).toEqual(['Legato'])
    expect(addTopic(['Legato'], '##legato')).toEqual(['Legato'])
    expect(addTopic(['Legato'], '#')).toEqual(['Legato'])
  })

  it('ignores blanks and topics already there in any case', () => {
    expect(addTopic(['Hammer-on'], 'hammer-ON')).toEqual(['Hammer-on'])
    expect(addTopic(['Hammer-on'], '   ')).toEqual(['Hammer-on'])
  })
})

describe('removeTopic', () => {
  it('removes a topic whatever its case', () => {
    expect(removeTopic(['Am', 'Major scale'], 'major SCALE')).toEqual(['Am'])
  })
})

describe('collectTopics', () => {
  it('lists every topic once, most recently used first', () => {
    const classes = [
      { number: 1, topics: ['Strumming', 'Am'] },
      { number: 2, topics: ['Hammer-on', 'am'] },
    ]

    expect(collectTopics(classes)).toEqual(['Hammer-on', 'am', 'Strumming'])
  })
})

describe('classMatches', () => {
  const guitarClass = { title: 'Open chords', topics: ['Strumming', 'Major scale'] }

  it('finds a class by part of a tag or the title, in any case', () => {
    expect(classMatches(guitarClass, 'STRUM')).toBe(true)
    expect(classMatches(guitarClass, 'scale')).toBe(true)
    expect(classMatches(guitarClass, 'open')).toBe(true)
    expect(classMatches(guitarClass, '#major')).toBe(true)
  })

  it('matches everything for an empty search and nothing for an unknown word', () => {
    expect(classMatches(guitarClass, '  ')).toBe(true)
    expect(classMatches(guitarClass, 'banjo')).toBe(false)
  })
})
