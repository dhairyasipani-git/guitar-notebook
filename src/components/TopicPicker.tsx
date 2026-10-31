import { IconPlus, IconX } from '@tabler/icons-react'
import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { cleanTopic, hasTopic, topicKey } from '../lib/topics'

const MAX_SUGGESTIONS = 24

interface TopicPickerProps {
  topics: string[]
  /** Tags made in any class, offered as one-tap chips. */
  suggestions: string[]
  onAdd: (topic: string) => void
  onRemove: (topic: string) => void
}

// Tapping a chip shouldn't blur the input first, or the half-typed text would be saved as its own tag.
const keepInputFocus = (event: MouseEvent) => event.preventDefault()

/** Tags that work like hashtags (without the #): type to filter the tags you've made before, or create a new one. */
export function TopicPicker({ topics, suggestions, onAdd, onRemove }: TopicPickerProps) {
  const [draft, setDraft] = useState('')
  const query = topicKey(draft)
  const available = suggestions.filter((topic) => !hasTopic(topics, topic) && topicKey(topic).includes(query)).slice(0, MAX_SUGGESTIONS)
  const newTag = cleanTopic(draft)
  const canCreate = newTag !== '' && !hasTopic(topics, newTag) && !hasTopic(suggestions, newTag)

  const add = (topic: string) => {
    onAdd(topic)
    setDraft('')
  }

  // Typing an existing tag in any case picks that tag rather than making a near-copy.
  const commit = () => {
    if (newTag === '') {
      setDraft('')
      return
    }
    add(suggestions.find((topic) => topicKey(topic) === query) ?? newTag)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Backspace' && draft === '' && topics.length > 0) {
      onRemove(topics[topics.length - 1])
    }
  }

  return (
    <div className="topic-box">
      <div className="topic-row">
        {topics.map((topic) => (
          <span key={topicKey(topic)} className="topic selected">
            {topic}
            <button type="button" aria-label={`Remove ${topic}`} onClick={() => onRemove(topic)}>
              <IconX size={13} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
            className="topic-input"
            aria-label="Add a topic"
            placeholder={topics.length > 0 ? 'Add another tag' : 'Type a tag, like legato'}
            enterKeyHint="done"
            autoCapitalize="none"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commit}
          />
      </div>
      {(available.length > 0 || canCreate) && (
        <div className="topic-library">
          <span className="topic-library-label">{draft.trim() ? 'Matching tags' : 'Your tags'}</span>
          <div className="topic-suggestions" role="group" aria-label="Topics you've used before">
            {available.map((topic) => (
              <button key={topicKey(topic)} type="button" className="topic suggestion" onMouseDown={keepInputFocus} onClick={() => add(topic)}>
                {topic}
              </button>
            ))}
            {canCreate && (
              <button type="button" className="topic create" onMouseDown={keepInputFocus} onClick={() => add(newTag)}>
                <IconPlus size={13} aria-hidden="true" />
                Create “{newTag}”
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
