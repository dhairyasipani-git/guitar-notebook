import { useState } from 'react'
import type { Photo } from '../db/types'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { PhotoViewer } from './PhotoViewer'

interface PhotoGridProps {
  photos: Photo[]
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const viewerPhoto = viewerIndex === null ? undefined : photos[viewerIndex]

  return (
    <>
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <PhotoThumb key={photo.id} photo={photo} onOpen={() => setViewerIndex(index)} />
        ))}
      </div>
      {viewerIndex !== null && viewerPhoto && (
        <PhotoViewer photos={photos} index={viewerIndex} onIndexChange={setViewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </>
  )
}

interface PhotoThumbProps {
  photo: Photo
  onOpen: () => void
}

function PhotoThumb({ photo, onOpen }: PhotoThumbProps) {
  const url = useObjectUrl(photo.blob, photo.id)
  return (
    <button type="button" className="photo-thumb" onClick={onOpen} aria-label={photo.caption ? `Open ${photo.caption}` : 'Open photo'}>
      {url && <img src={url} alt="" />}
      {photo.caption && <span className="photo-caption">{photo.caption}</span>}
    </button>
  )
}
