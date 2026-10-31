import { useEffect, useLayoutEffect, useRef, type FocusEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { updateClass, type ClassPatch } from '../db/classes'
import type { GuitarClass } from '../db/types'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { Pick } from './Decor'

interface ClassHeaderProps {
  guitarClass: GuitarClass
}

/** Grows the title box to fit its text, so long titles wrap instead of being cut off. */
function fitToText(box: HTMLTextAreaElement): void {
  box.style.height = 'auto'
  box.style.height = `${box.scrollHeight}px`
}

/** A title is one line of text; pasted line breaks become spaces. */
function oneLine(text: string): string {
  return text.replace(/\s*\n\s*/g, ' ').trim()
}

function isNewClassState(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'isNew' in state && state.isNew === true
}

export function ClassHeader({ guitarClass }: ClassHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const { run, error } = useAsyncAction()
  const { id, number, date, title } = guitarClass
  const shouldFocusTitle = isNewClassState(location.state)

  // Focus the title once for a brand-new class, then drop the flag so saving
  // the title (which remounts the input) or coming back later won't grab focus.
  useEffect(() => {
    if (!shouldFocusTitle) return
    titleRef.current?.focus()
    navigate(location.pathname, { replace: true, state: null })
  }, [shouldFocusTitle, navigate, location.pathname])

  useLayoutEffect(() => {
    if (titleRef.current) fitToText(titleRef.current)
  }, [title])

  const save = (patch: ClassPatch) => run(() => updateClass(id, patch))

  // Saves a field when you leave it; if the value is rejected, the box shows the saved value again.
  const saveOnBlur = async (event: FocusEvent<HTMLInputElement>, saved: string, toPatch: (value: string) => ClassPatch) => {
    const input = event.currentTarget
    if (input.value === saved) return
    const result = await save(toPatch(input.value))
    if (!result) input.value = saved
  }

  return (
    <div className="stack">
      <div className="class-header">
        <Pick label={String(number)} size={54} />
        <textarea
          key={`title-${title}`}
          ref={titleRef}
          className="title-input"
          rows={1}
          aria-label="Class title"
          placeholder="What was this class about?"
          defaultValue={title}
          onInput={(event) => fitToText(event.currentTarget)}
          onBlur={(event) => {
            if (oneLine(event.target.value) !== title) void save({ title: oneLine(event.target.value) })
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            event.currentTarget.blur()
          }}
        />
        <div className="class-meta">
          <label className="row">
            Class
            <input
              key={`number-${number}`}
              className="meta-input meta-number"
              type="number"
              inputMode="numeric"
              min={1}
              aria-label="Class number"
              defaultValue={number}
              onBlur={(event) => void saveOnBlur(event, String(number), (value) => ({ number: Number(value) }))}
            />
          </label>
          <label className="row">
            Date
            <input
              key={`date-${date}`}
              className="meta-input"
              type="date"
              aria-label="Date"
              defaultValue={date}
              onBlur={(event) => void saveOnBlur(event, date, (value) => ({ date: value }))}
            />
          </label>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
