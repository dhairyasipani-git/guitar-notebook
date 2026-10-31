import { IconAlignLeft, IconTrash } from '@tabler/icons-react'
import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'
import { z } from 'zod'
import { deleteNote, updateNote } from '../db/notes'
import { LIMITS } from '../db/schemas'
import type { Note } from '../db/types'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { useAutosave } from '../hooks/useAutosave'
import { useConfirm } from './ConfirmDialog'
import { SwipeRow } from './SwipeRow'

const noteDraftSchema = z.object({ title: z.string(), body: z.string() })

interface NoteCardProps {
  note: Note
  autoFocus?: boolean
}

/** A written entry (theory, a description, anything) that saves as you type. */
export function NoteCard({ note, autoFocus = false }: NoteCardProps) {
  const { value, setValue, status, error, discard } = useAutosave({
    draftKey: `note:${note.id}`,
    initial: { title: note.title, body: note.body },
    draftSchema: noteDraftSchema,
    persist: (next) => updateNote(note.id, next),
  })
  const deleteAction = useAsyncAction()
  const confirm = useConfirm()

  const remove = async () => {
    const hasContent = value.title.trim() !== '' || value.body.trim() !== ''
    if (hasContent && !(await confirm({ message: "Delete this note? This can't be undone." }))) return
    discard()
    await deleteAction.run(() => deleteNote(note.id))
  }

  const message = error ?? deleteAction.error

  return (
    <SwipeRow actionLabel="Delete" onSwipe={() => void remove()}>
      <article className="entry">
        <div className="entry-head">
          <span className="entry-icon" aria-hidden="true">
            <IconAlignLeft size={16} />
          </span>
          <input
            className="entry-title-input"
            aria-label="Note heading"
            placeholder="Heading (optional)"
            maxLength={LIMITS.title}
            value={value.title}
            onChange={(event) => setValue({ ...value, title: event.target.value })}
          />
          <span className="save-status" aria-live="polite">
            {status === 'saving' && 'Saving…'}
            {status === 'saved' && 'Saved'}
          </span>
          <button type="button" className="icon-btn" aria-label="Delete note" onClick={remove}>
            <IconTrash size={17} aria-hidden="true" />
          </button>
        </div>
        <AutoGrowTextarea
          className="entry-body"
          aria-label="Note"
          placeholder="Write it in your own words: theory, a technique, what to remember…"
          maxLength={LIMITS.noteBody}
          autoFocus={autoFocus}
          value={value.body}
          onValueChange={(body) => setValue({ ...value, body })}
        />
        {message && (
          <p className="error" role="alert">
            {message}
          </p>
        )}
      </article>
    </SwipeRow>
  )
}

interface AutoGrowTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  value: string
  onValueChange: (value: string) => void
}

/** A textarea that grows with its text instead of scrolling. */
function AutoGrowTextarea({ value, onValueChange, ...rest }: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }, [value])

  return <textarea ref={ref} rows={3} value={value} onChange={(event) => onValueChange(event.target.value)} {...rest} />
}
