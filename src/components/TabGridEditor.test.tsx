import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmptyGrid, type TabGrid } from '../lib/tab'
import { TabGridEditor } from './TabGridEditor'

function Harness({ initial = createEmptyGrid(1) }: { initial?: TabGrid }) {
  const [grid, setGrid] = useState<TabGrid>(initial)
  return <TabGridEditor grid={grid} onChange={setGrid} />
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TabGridEditor', () => {
  it('builds two-digit frets from the keyboard and moves with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'e string, beat 1' }))
    await user.keyboard('12{ArrowDown}3{ArrowRight}h')

    expect(screen.getByRole('button', { name: 'e string, beat 1, 12' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'B string, beat 1, 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'B string, beat 2, h' })).toBeInTheDocument()
  })

  it('offers keypad frets all the way to 24 and types them', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const keypad = screen.getByRole('group', { name: 'Fret numbers' })

    expect(within(keypad).getAllByRole('button')).toHaveLength(25)
    await user.click(screen.getByRole('button', { name: 'G string, beat 1' }))
    await user.click(within(keypad).getByRole('button', { name: '24' }))
    await user.click(screen.getByRole('button', { name: 'G string, beat 2' }))
    await user.keyboard('22')

    expect(screen.getByRole('button', { name: 'G string, beat 1, 24' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'G string, beat 2, 22' })).toBeInTheDocument()
  })

  it('erases with Backspace and the Erase key', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'D string, beat 3' }))
    await user.keyboard('7{Backspace}')
    expect(screen.getByRole('button', { name: 'D string, beat 3' })).toBeInTheDocument()

    await user.keyboard('9')
    await user.click(screen.getByRole('button', { name: 'Erase' }))
    expect(screen.getByRole('button', { name: 'D string, beat 3' })).toBeInTheDocument()
  })

  it('adds a bar and only removes a bar with notes after you confirm', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<Harness />)
    expect(screen.getByRole('button', { name: /remove last bar/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /add bar/i }))
    await user.click(screen.getByRole('button', { name: 'A string, beat 12' }))
    await user.click(screen.getByRole('button', { name: '3' }))

    await user.click(screen.getByRole('button', { name: /remove last bar/i }))
    expect(screen.getByRole('button', { name: 'A string, beat 12, 3' })).toBeInTheDocument()

    confirm.mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: /remove last bar/i }))
    expect(screen.queryByRole('button', { name: /A string, beat 12/ })).not.toBeInTheDocument()
  })
})
