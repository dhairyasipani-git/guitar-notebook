import { IconCheck, IconMessageQuestion, IconPlus } from '@tabler/icons-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { addDoubt, clearDoubt, restoreDoubt } from '../db/doubts'
import { useDoubts } from '../db/hooks'
import type { Doubt } from '../db/types'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { useHotkeys } from '../hooks/useHotkeys'
import { SwipeRow } from './SwipeRow'

const UNDO_WINDOW_MS = 5000
// Only the newest few show until you ask for the rest, so the strip stays small.
const PREVIEW_COUNT = 3

/** A slim doubts strip on the home page: type a doubt and press Enter, tick it once it's cleared. */
export function DoubtsBox() {
  const doubts = useDoubts() ?? []
  const [text, setText] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [justCleared, setJustCleared] = useState<Doubt | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { run, error, clearError } = useAsyncAction()

  useHotkeys({ d: () => inputRef.current?.focus() })

  useEffect(() => {
    if (!justCleared) return
    const timer = setTimeout(() => setJustCleared(null), UNDO_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [justCleared])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    // Clear straight away so you can type the next one; put the text back if saving fails.
    const submitted = text
    setText('')
    const added = await run(() => addDoubt(submitted))
    if (!added) setText(submitted)
  }

  const tick = async (doubt: Doubt) => {
    const cleared = await run(() => clearDoubt(doubt.id))
    if (cleared) setJustCleared(cleared)
  }

  const undo = async () => {
    if (!justCleared) return
    const doubt = justCleared
    setJustCleared(null)
    await run(() => restoreDoubt(doubt))
  }

  const count = doubts.length
  const shown = isExpanded ? doubts : doubts.slice(0, PREVIEW_COUNT)
  const hiddenCount = count - shown.length

  return (
    <section className="doubts-strip" aria-label="Doubts for next class">
      <form className="doubts-strip-row" onSubmit={submit}>
        <span className="doubts-icon" aria-hidden="true">
          <IconMessageQuestion size={16} />
        </span>
        <input
          ref={inputRef}
          className="doubts-input"
          aria-label="New doubt"
          placeholder={count > 0 ? 'Add another doubt…' : 'Any doubts for next class?'}
          enterKeyHint="done"
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            clearError()
          }}
        />
        {count > 0 && (
          <span className="doubt-count" aria-label={`${count} to ask`}>
            {count}
          </span>
        )}
        <button type="submit" className="icon-btn" aria-label="Add">
          <IconPlus size={18} aria-hidden="true" />
        </button>
      </form>

      {count > 0 && (
        <ul className="doubt-list">
          {shown.map((doubt) => (
            <li key={doubt.id}>
              <SwipeRow actionLabel="Clear" onSwipe={() => void tick(doubt)}>
                <div className="doubt-row">
                  <button type="button" className="tick" aria-label={`Cleared: ${doubt.text}`} onClick={() => void tick(doubt)}>
                    <IconCheck size={12} stroke={3} aria-hidden="true" />
                  </button>
                  <span className="doubt-text">{doubt.text}</span>
                </div>
              </SwipeRow>
            </li>
          ))}
        </ul>
      )}
      {count > PREVIEW_COUNT && (
        <button type="button" className="link-btn" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Show less' : `Show ${hiddenCount} more`}
        </button>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {justCleared && (
        <div className="toast" role="status">
          <span>Cleared “{justCleared.text}”</span>
          <button type="button" onClick={() => void undo()}>
            Undo
          </button>
        </div>
      )}
    </section>
  )
}
