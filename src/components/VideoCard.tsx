import { IconTrash, IconVideo } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { LIMITS } from '../db/schemas'
import type { Video } from '../db/types'
import { deleteVideo, updateVideoCaption } from '../db/videos'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { useConfirm } from './ConfirmDialog'
import { SwipeRow } from './SwipeRow'

// Slow the tutor down to catch the fingering.
const SPEEDS = [0.5, 0.75, 1] as const

interface VideoCardProps {
  video: Video
}

/** A video from class, with a caption and a slow-down control for practising along. */
export function VideoCard({ video }: VideoCardProps) {
  const url = useObjectUrl(video.blob, video.id)
  const playerRef = useRef<HTMLVideoElement>(null)
  const [speed, setSpeed] = useState<number>(1)
  const { run, error } = useAsyncAction()
  const confirm = useConfirm()
  const name = video.caption || 'Video'

  const changeSpeed = (next: number) => {
    setSpeed(next)
    if (playerRef.current) playerRef.current.playbackRate = next
  }

  const saveCaption = (value: string) => {
    if (value.trim() !== video.caption) void run(() => updateVideoCaption(video.id, value))
  }

  const remove = async () => {
    if (await confirm({ message: `Delete "${name}"? This can't be undone.` })) void run(() => deleteVideo(video.id))
  }

  return (
    <SwipeRow actionLabel="Delete" onSwipe={() => void remove()}>
      <article className="entry">
        <div className="entry-head">
          <span className="entry-icon" aria-hidden="true">
            <IconVideo size={16} />
          </span>
          <input
            key={video.caption}
            className="entry-title-input"
            aria-label="Video caption"
            placeholder="What's in this video?"
            maxLength={LIMITS.caption}
            defaultValue={video.caption}
            onBlur={(event) => saveCaption(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
          <button type="button" className="icon-btn" aria-label={`Delete ${name}`} onClick={remove}>
            <IconTrash size={17} aria-hidden="true" />
          </button>
        </div>
        {url && <video ref={playerRef} className="entry-video" src={url} controls playsInline preload="metadata" aria-label={name} />}
        <div className="segmented speed-picker" role="group" aria-label="Playback speed">
          {SPEEDS.map((option) => (
            <button key={option} type="button" aria-pressed={speed === option} onClick={() => changeSpeed(option)}>
              {option}×
            </button>
          ))}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </article>
    </SwipeRow>
  )
}
