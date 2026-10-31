import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { addPhoto, deletePhoto, updatePhotoCaption } from '../db/photos'
import { ValidationError } from '../db/schemas'
import type { Photo } from '../db/types'
import { MemoryRouter } from 'react-router-dom'
import { AddEntryBar } from './AddEntryBar'
import { PhotoGrid } from './PhotoGrid'
import { PhotoViewer } from './PhotoViewer'

vi.mock('../db/photos', () => ({ addPhoto: vi.fn(), deletePhoto: vi.fn(), updatePhotoCaption: vi.fn() }))
vi.mock('../lib/image', () => ({ compressImage: vi.fn(async (file: Blob) => file) }))

function makePhoto(id: string, caption: string): Photo {
  return { id, classId: 'c1', caption, blob: new Blob([id], { type: 'image/jpeg' }), createdAt: 1 }
}

const first = makePhoto('p1', 'Exercise 1')
const second = makePhoto('p2', '')

beforeAll(() => {
  // jsdom has no object URLs; the components only need a string back.
  Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:photo'), revokeObjectURL: vi.fn() })
})

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderViewer(index: number, photos: Photo[] = [first, second]) {
  const onIndexChange = vi.fn()
  const onClose = vi.fn()
  render(<PhotoViewer photos={photos} index={index} onIndexChange={onIndexChange} onClose={onClose} />)
  return { onIndexChange, onClose }
}

describe('PhotoViewer', () => {
  it('moves between photos and closes with Escape', async () => {
    const user = userEvent.setup()
    const { onIndexChange, onClose } = renderViewer(0)

    expect(screen.getByText('1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous photo' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Next photo' }))
    expect(onIndexChange).toHaveBeenCalledWith(1)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('saves a changed caption but not an unchanged one', async () => {
    const user = userEvent.setup()
    renderViewer(0)
    const caption = screen.getByLabelText('Caption')

    await user.click(caption)
    await user.tab()
    expect(updatePhotoCaption).not.toHaveBeenCalled()

    await user.clear(caption)
    await user.type(caption, 'Pull-off drill{Enter}')
    expect(updatePhotoCaption).toHaveBeenCalledWith('p1', 'Pull-off drill')
  })

  it('deletes only after you confirm, then shows a neighbouring photo', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { onIndexChange, onClose } = renderViewer(1)

    await user.click(screen.getByRole('button', { name: 'Delete photo' }))
    expect(deletePhoto).not.toHaveBeenCalled()

    confirm.mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: 'Delete photo' }))

    expect(deletePhoto).toHaveBeenCalledWith('p2')
    await waitFor(() => expect(onIndexChange).toHaveBeenCalledWith(0))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes after the last photo is deleted', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { onClose } = renderViewer(0, [first])

    await user.click(screen.getByRole('button', { name: 'Delete photo' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('keeps a caption typed just before pressing Escape', async () => {
    const user = userEvent.setup()
    const { onClose } = renderViewer(0)

    await user.clear(screen.getByLabelText('Caption'))
    await user.type(screen.getByLabelText('Caption'), 'Spider exercise{Escape}')

    expect(updatePhotoCaption).toHaveBeenCalledWith('p1', 'Spider exercise')
    expect(onClose).toHaveBeenCalled()
  })

  it('zooms in and back out', async () => {
    const user = userEvent.setup()
    renderViewer(0)

    await user.click(screen.getByRole('button', { name: 'Zoom in' }))

    expect(screen.getByRole('button', { name: 'Fit to screen' })).toBeInTheDocument()
  })
})

describe('PhotoGrid', () => {
  it('opens a photo in the viewer', async () => {
    const user = userEvent.setup()
    render(<PhotoGrid photos={[first, second]} />)

    await user.click(screen.getByRole('button', { name: 'Open Exercise 1' }))

    expect(screen.getByRole('dialog', { name: 'Photo viewer' })).toBeInTheDocument()
  })
})

describe('adding photos', () => {
  function renderAddBar() {
    render(
      <MemoryRouter>
        <AddEntryBar classId="c1" onNoteCreated={vi.fn()} />
      </MemoryRouter>,
    )
  }

  it('adds picked photos in order', async () => {
    const user = userEvent.setup()
    renderAddBar()
    const files = [new File(['1'], 'one.jpg', { type: 'image/jpeg' }), new File(['2'], 'two.jpg', { type: 'image/jpeg' })]

    await user.upload(screen.getByLabelText(/add photos/i), files)

    await waitFor(() => expect(addPhoto).toHaveBeenCalledTimes(2))
    expect(vi.mocked(addPhoto).mock.calls.map(([, blob]) => (blob as File).name)).toEqual(['one.jpg', 'two.jpg'])
  })

  it('shows a clear message when a photo cannot be added', async () => {
    const user = userEvent.setup()
    vi.mocked(addPhoto).mockRejectedValue(new ValidationError('Only image files can be added as sheets'))
    renderAddBar()

    await user.upload(screen.getByLabelText(/add photos/i), new File(['x'], 'sheet.jpg', { type: 'image/jpeg' }))

    expect(await screen.findByText("sheet.jpg couldn't be added. Only image files can be added as sheets")).toBeInTheDocument()
  })

  it('keeps adding the other photos when one fails', async () => {
    const user = userEvent.setup()
    vi.mocked(addPhoto)
      .mockRejectedValueOnce(new ValidationError('That file is empty. Pick another photo.'))
      .mockResolvedValue(first)
    renderAddBar()
    const files = ['a.jpg', 'b.jpg', 'c.jpg'].map((name) => new File(['x'], name, { type: 'image/jpeg' }))

    await user.upload(screen.getByLabelText(/add photos/i), files)

    expect(await screen.findByText(/a\.jpg couldn't be added\. That file is empty\. Pick another photo\. 2 photos added\./)).toBeInTheDocument()
    expect(addPhoto).toHaveBeenCalledTimes(3)
  })
})
