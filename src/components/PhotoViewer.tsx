import { IconChevronLeft, IconChevronRight, IconTrash, IconX, IconZoomIn, IconZoomOut } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { deletePhoto, updatePhotoCaption } from '../db/photos'
import type { Photo } from '../db/types'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { useConfirm } from './ConfirmDialog'

interface PhotoViewerProps {
  photos: Photo[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export function PhotoViewer({ photos, index, onIndexChange, onClose }: PhotoViewerProps) {
  const photo = photos[index]
  const url = useObjectUrl(photo.blob, photo.id)
  const [isZoomed, setIsZoomed] = useState(false)
  const { run, error } = useAsyncAction()
  const confirm = useConfirm()
  const hasPrevious = index > 0
  const hasNext = index < photos.length - 1

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Leaving the caption box first saves what was typed in it.
        if (document.activeElement instanceof HTMLInputElement) document.activeElement.blur()
        onClose()
        return
      }
      if (event.target instanceof HTMLInputElement) return
      if (event.key === 'ArrowLeft' && hasPrevious) onIndexChange(index - 1)
      if (event.key === 'ArrowRight' && hasNext) onIndexChange(index + 1)
    }
    window.addEventListener('keydown', handleKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [index, hasPrevious, hasNext, onClose, onIndexChange])

  const saveCaption = (value: string) => {
    if (value.trim() !== photo.caption) void run(() => updatePhotoCaption(photo.id, value))
  }

  const remove = async () => {
    if (!(await confirm({ message: "Delete this photo? This can't be undone." }))) return
    const deleted = await run(async () => {
      await deletePhoto(photo.id)
      return true
    })
    if (!deleted) return
    if (photos.length <= 1) onClose()
    else onIndexChange(Math.min(index, photos.length - 2))
  }

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <div className="viewer-bar">
        <input
          key={photo.id}
          className="input grow"
          aria-label="Caption"
          placeholder="Add a caption"
          defaultValue={photo.caption}
          onBlur={(event) => saveCaption(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
        />
        <button type="button" className="icon-btn" aria-label={isZoomed ? 'Fit to screen' : 'Zoom in'} onClick={() => setIsZoomed((zoomed) => !zoomed)}>
          {isZoomed ? <IconZoomOut aria-hidden="true" /> : <IconZoomIn aria-hidden="true" />}
        </button>
        <button type="button" className="icon-btn" aria-label="Delete photo" onClick={remove}>
          <IconTrash aria-hidden="true" />
        </button>
        <button type="button" className="icon-btn" aria-label="Close" onClick={onClose} autoFocus>
          <IconX aria-hidden="true" />
        </button>
      </div>
      {error && (
        <p className="error viewer-error" role="alert">
          {error}
        </p>
      )}
      <div className={`viewer-body${isZoomed ? ' zoomed' : ''}`} onDoubleClick={() => setIsZoomed((zoomed) => !zoomed)}>
        {url && <img src={url} alt={photo.caption || `Photo ${index + 1}`} />}
      </div>
      {photos.length > 1 && (
        <div className="viewer-nav">
          <button type="button" className="icon-btn" aria-label="Previous photo" disabled={!hasPrevious} onClick={() => onIndexChange(index - 1)}>
            <IconChevronLeft aria-hidden="true" />
          </button>
          <span>
            {index + 1} of {photos.length}
          </span>
          <button type="button" className="icon-btn" aria-label="Next photo" disabled={!hasNext} onClick={() => onIndexChange(index + 1)}>
            <IconChevronRight aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
