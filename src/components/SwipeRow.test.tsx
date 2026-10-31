import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { isSwipeCommitted, swipeAxis, swipeOffset } from '../lib/swipe'
import { SwipeRow } from './SwipeRow'

function swipe(element: HTMLElement, path: Array<[number, number]>) {
  const [first, ...rest] = path
  fireEvent.touchStart(element, { touches: [{ clientX: first[0], clientY: first[1] }] })
  rest.forEach(([clientX, clientY]) => fireEvent.touchMove(element, { touches: [{ clientX, clientY }] }))
  fireEvent.touchEnd(element, { touches: [] })
}

describe('swipe maths', () => {
  it('only decides a direction after a real movement', () => {
    expect(swipeAxis(3, 2)).toBe('undecided')
    expect(swipeAxis(-40, 5)).toBe('horizontal')
    expect(swipeAxis(4, 30)).toBe('vertical')
  })

  it('slides left only, up to a limit, and commits past the threshold', () => {
    expect(swipeOffset(30)).toBe(0)
    expect(swipeOffset(-500)).toBe(-140)
    expect(isSwipeCommitted(-120)).toBe(true)
    expect(isSwipeCommitted(-40)).toBe(false)
  })
})

describe('SwipeRow', () => {
  it('runs the action after a long swipe left', () => {
    const onSwipe = vi.fn()
    render(
      <SwipeRow actionLabel="Delete" onSwipe={onSwipe}>
        <span>Class 1</span>
      </SwipeRow>,
    )

    swipe(screen.getByText('Class 1'), [
      [300, 100],
      [260, 102],
      [150, 104],
    ])

    expect(onSwipe).toHaveBeenCalledOnce()
  })

  it('ignores short swipes and vertical scrolling', () => {
    const onSwipe = vi.fn()
    render(
      <SwipeRow actionLabel="Delete" onSwipe={onSwipe}>
        <span>Class 1</span>
      </SwipeRow>,
    )
    const row = screen.getByText('Class 1')

    swipe(row, [
      [300, 100],
      [260, 100],
    ])
    swipe(row, [
      [300, 100],
      [290, 200],
      [150, 300],
    ])

    expect(onSwipe).not.toHaveBeenCalled()
  })

  it('leaves sideways scrolling of tab text alone', () => {
    const onSwipe = vi.fn()
    render(
      <SwipeRow actionLabel="Delete" onSwipe={onSwipe}>
        <pre>e|--0--3--5--|</pre>
      </SwipeRow>,
    )

    swipe(screen.getByText('e|--0--3--5--|'), [
      [300, 100],
      [150, 100],
    ])

    expect(onSwipe).not.toHaveBeenCalled()
  })

  it('does not open the row when the swipe ends', () => {
    const onClick = vi.fn()
    render(
      <SwipeRow actionLabel="Delete" onSwipe={vi.fn()}>
        <button type="button" onClick={onClick}>
          Class 1
        </button>
      </SwipeRow>,
    )
    const row = screen.getByRole('button', { name: 'Class 1' })

    swipe(row, [
      [300, 100],
      [200, 100],
    ])
    fireEvent.click(row)

    expect(onClick).not.toHaveBeenCalled()
  })
})
