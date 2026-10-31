import type { GuitarClass } from '../db/types'

/** Tidies a typed tag: "#Hammer-on " becomes "Hammer-on". */
export function cleanTopic(topic: string): string {
  return topic.trim().replace(/^#+/, '').trim()
}

export function topicKey(topic: string): string {
  return cleanTopic(topic).toLowerCase()
}

export function hasTopic(topics: readonly string[], topic: string): boolean {
  return topics.some((existing) => topicKey(existing) === topicKey(topic))
}

export function addTopic(topics: readonly string[], topic: string): string[] {
  const clean = cleanTopic(topic)
  if (clean === '' || hasTopic(topics, clean)) return [...topics]
  return [...topics, clean]
}

export function removeTopic(topics: readonly string[], topic: string): string[] {
  return topics.filter((existing) => topicKey(existing) !== topicKey(topic))
}

/** Every topic used across classes, once each, most recently used first. */
export function collectTopics(classes: ReadonlyArray<Pick<GuitarClass, 'number' | 'topics'>>): string[] {
  return [...classes]
    .sort((a, b) => b.number - a.number)
    .flatMap((guitarClass) => guitarClass.topics)
    .reduce<string[]>((topics, topic) => addTopic(topics, topic), [])
}

/** True when the search text appears in a class's title or any of its tags. An empty search matches everything. */
export function classMatches(guitarClass: Pick<GuitarClass, 'title' | 'topics'>, search: string): boolean {
  const query = topicKey(search)
  if (query === '') return true
  return topicKey(guitarClass.title).includes(query) || guitarClass.topics.some((topic) => topicKey(topic).includes(query))
}
