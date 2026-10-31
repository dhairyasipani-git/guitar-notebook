import { IconAlignLeft, IconCamera, IconMusic, IconVideo, type Icon } from '@tabler/icons-react'
import { forwardRef, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createNote } from '../db/notes'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { useHotkeys } from '../hooks/useHotkeys'
import { usePhotoUpload, useVideoUpload } from '../hooks/useMediaUpload'

interface AddEntryBarProps {
  classId: string
  onNoteCreated: (noteId: string) => void
}

export function AddEntryBar({ classId, onNoteCreated }: AddEntryBarProps) {
  const photoUpload = usePhotoUpload(classId)
  const videoUpload = useVideoUpload(classId)
  const noteAction = useAsyncAction()
  const navigate = useNavigate()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const newTabPath = `/class/${classId}/tab/new`

  const addNote = async () => {
    const note = await noteAction.run(() => createNote(classId))
    if (note) onNoteCreated(note.id)
  }

  useHotkeys({
    t: () => navigate(newTabPath),
    n: () => void addNote(),
    p: () => photoInputRef.current?.click(),
    v: () => videoInputRef.current?.click(),
  })

  const status = photoUpload.status ?? videoUpload.status
  const message = photoUpload.error ?? videoUpload.error ?? noteAction.error

  return (
    <div className="stack">
      <div className="add-bar" role="group" aria-label="Add to this class">
        <Link to={newTabPath} className="add-chip">
          <IconMusic size={18} aria-hidden="true" />
          Tab
        </Link>
        <button type="button" className="add-chip" onClick={addNote}>
          <IconAlignLeft size={18} aria-hidden="true" />
          Note
        </button>
        <FileChip ref={photoInputRef} icon={IconCamera} label="Photo" inputLabel="Add photos" accept="image/*" onFiles={photoUpload.addFiles} />
        <FileChip ref={videoInputRef} icon={IconVideo} label="Video" inputLabel="Add videos" accept="video/*" onFiles={videoUpload.addFiles} />
      </div>
      {status && (
        <p className="faint" role="status">
          {status}
        </p>
      )}
      {message && (
        <p className="error" role="alert">
          {message}
        </p>
      )}
    </div>
  )
}

interface FileChipProps {
  icon: Icon
  label: string
  inputLabel: string
  accept: string
  onFiles: (files: File[]) => Promise<void>
}

const FileChip = forwardRef<HTMLInputElement, FileChipProps>(function FileChip({ icon: ChipIcon, label, inputLabel, accept, onFiles }, ref) {
  return (
    <label className="add-chip">
      <ChipIcon size={18} aria-hidden="true" />
      {label}
      <input
        ref={ref}
        className="sr-only"
        type="file"
        accept={accept}
        multiple
        aria-label={inputLabel}
        onChange={(event) => {
          void onFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
    </label>
  )
})
