import { IconTrash } from '@tabler/icons-react'
import { useRef, useState, type MouseEvent, type ReactNode, type TouchEvent } from 'react'
import { isSwipeCommitted, swipeAxis, swipeOffset, type SwipeAxis } from '../lib/swipe'

interface SwipeRowProps {
  /** Shown behind the row as it slides, e.g. "Delete" or "Clear". */
  actionLabel: string
  onSwipe: () => void
  children: ReactNode
  className?: string
}

// Swipes that start on sideways-scrolling tab text, a video's scrubber or a text box keep their usual meaning.
const NO_SWIPE = 'pre, video, input, textarea, select'

interface Gesture {
  startX: number
  startY: number
  dx: number
  axis: SwipeAxis
}

/** Swipe left on a phone to delete. Buttons still do the same thing, so this is only a shortcut. */
export function SwipeRow({ actionLabel, onSwipe, children, className = '' }: SwipeRowProps) {
  const [offset, setOffset] = useState(0)
  const gesture = useRef<Gesture | null>(null)
  // A swipe shouldn't also count as a tap that opens the row.
  const didSwipe = useRef(false)

  const handleTouchStart = (event: TouchEvent) => {
    didSwipe.current = false
    if (event.target instanceof Element && event.target.closest(NO_SWIPE)) {
      gesture.current = null
      return
    }
    const touch = event.touches[0]
    gesture.current = { startX: touch.clientX, startY: touch.clientY, dx: 0, axis: 'undecided' }
  }

  const handleTouchMove = (event: TouchEvent) => {
    const current = gesture.current
    if (!current) return
    const touch = event.touches[0]
    const dx = touch.clientX - current.startX
    const axis = current.axis === 'undecided' ? swipeAxis(dx, touch.clientY - current.startY) : current.axis
    gesture.current = { ...current, dx, axis }
    if (axis !== 'horizontal') return
    didSwipe.current = true
    setOffset(swipeOffset(dx))
  }

  const handleTouchEnd = () => {
    const finished = gesture.current
    gesture.current = null
    setOffset(0)
    if (finished?.axis === 'horizontal' && isSwipeCommitted(finished.dx)) onSwipe()
  }

  const blockTapAfterSwipe = (event: MouseEvent) => {
    if (!didSwipe.current) return
    didSwipe.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div className={`swipe-row ${className}`}>
      {offset < 0 && (
        <div className={`swipe-action${isSwipeCommitted(offset) ? ' ready' : ''}`} aria-hidden="true">
          <IconTrash size={18} />
          {actionLabel}
        </div>
      )}
      <div
        className={`swipe-content${offset === 0 ? ' settled' : ''}`}
        style={offset < 0 ? { transform: `translateX(${offset}px)` } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClickCapture={blockTapAfterSwipe}
      >
        {children}
      </div>
    </div>
  )
}
