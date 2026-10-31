/** How far a row must be dragged left before letting go deletes it. */
export const SWIPE_COMMIT_PX = 96
const MAX_SWIPE_PX = 140
// Small wobbles don't count; after this much movement the gesture picks a direction.
const DIRECTION_LOCK_PX = 8

export type SwipeAxis = 'undecided' | 'horizontal' | 'vertical'

/** Whether a drag is a sideways swipe or the page scrolling. */
export function swipeAxis(dx: number, dy: number): SwipeAxis {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < DIRECTION_LOCK_PX) return 'undecided'
  return Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
}

/** How far to slide the row: left only, and not past the delete area. */
export function swipeOffset(dx: number): number {
  return Math.min(0, Math.max(-MAX_SWIPE_PX, dx))
}

export function isSwipeCommitted(dx: number): boolean {
  return dx <= -SWIPE_COMMIT_PX
}
