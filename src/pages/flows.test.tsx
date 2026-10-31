import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClass, getClass, listClasses, updateClass } from '../db/classes'
import { db } from '../db/db'
import { addDoubt, listDoubts } from '../db/doubts'
import { createNote, listNotes } from '../db/notes'
import { downloadFile } from '../lib/download'
import { DRAFT_PREFIX } from '../lib/drafts'
import { renderApp } from '../test/renderApp'

vi.mock('../lib/download', () => ({ downloadFile: vi.fn() }))

const SLOW_SAVE = { timeout: 3000 }

beforeEach(async () => {
  await db.delete()
  await db.open()
  localStorage.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('home', () => {
  it('starts a new class and saves its title without stealing focus back', async () => {
    const user = userEvent.setup()
    renderApp('/')

    await user.click(await screen.findByRole('button', { name: /new class/i }))
    await user.type(await screen.findByRole('textbox', { name: /class title/i }), 'Barre chords')
    await user.click(screen.getByRole('textbox', { name: 'Add a topic' }))

    await waitFor(async () => expect((await listClasses())[0]?.title).toBe('Barre chords'))
    await waitFor(() => expect(screen.getByRole('textbox', { name: /class title/i })).toHaveValue('Barre chords'))
    expect(screen.getByRole('textbox', { name: 'Add a topic' })).toHaveFocus()
  })

  it('lists classes with just the class count and finds them by tag or title', async () => {
    const user = userEvent.setup()
    const chords = await createClass({ title: 'Open chords' })
    const theory = await createClass({ title: 'Theory' })
    await updateClass(chords.id, { topics: ['Strumming'] })
    await updateClass(theory.id, { topics: ['Major scale'] })
    renderApp('/')

    expect(await screen.findByText('Open chords')).toBeInTheDocument()
    expect(screen.getByText('2 classes')).toBeInTheDocument()
    const search = screen.getByRole('searchbox', { name: 'Search classes by tag or title' })

    await user.type(search, 'major')
    expect(screen.queryByText('Open chords')).not.toBeInTheDocument()
    expect(screen.getByText('Theory')).toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'open')
    expect(screen.getByText('Open chords')).toBeInTheDocument()
    expect(screen.queryByText('Theory')).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'banjo')
    expect(screen.getByText('No classes match “banjo”.')).toBeInTheDocument()
  })

  it('shows a friendly page for a class that does not exist', async () => {
    renderApp('/class/missing')

    expect(await screen.findByText(/this class doesn't exist/i)).toBeInTheDocument()
  })
})

describe('topics', () => {
  it('works like hashtags: create one, then pick it from your tags in another class', async () => {
    const user = userEvent.setup()
    const first = await createClass()
    const second = await createClass()
    renderApp(`/class/${first.id}`)
    const input = await screen.findByRole('textbox', { name: 'Add a topic' })

    await user.type(input, '#Legato')
    await user.click(screen.getByRole('button', { name: 'Create “Legato”' }))
    await waitFor(async () => expect((await getClass(first.id))?.topics).toEqual(['Legato']))

    cleanup()
    renderApp(`/class/${second.id}`)
    const secondInput = await screen.findByRole('textbox', { name: 'Add a topic' })
    await user.type(secondInput, 'leg')
    expect(screen.getByRole('button', { name: 'Create “leg”' })).toBeInTheDocument()
    await user.click(within(screen.getByRole('group', { name: /used before/i })).getByRole('button', { name: 'Legato' }))

    await waitFor(async () => expect((await getClass(second.id))?.topics).toEqual(['Legato']))
    expect(secondInput).toHaveValue('')
  })

  it('typing an existing tag in another case reuses it', async () => {
    const user = userEvent.setup()
    const earlier = await createClass()
    await updateClass(earlier.id, { topics: ['Hammer-on'] })
    const today = await createClass()
    renderApp(`/class/${today.id}`)

    await user.type(await screen.findByRole('textbox', { name: 'Add a topic' }), 'hammer-ON{Enter}')

    await waitFor(async () => expect((await getClass(today.id))?.topics).toEqual(['Hammer-on']))
  })

  it('adds topics by typing, by tapping ones used before, and removes them', async () => {
    const user = userEvent.setup()
    const earlier = await createClass()
    await updateClass(earlier.id, { topics: ['Hammer-on', 'Pull-off'] })
    const today = await createClass()
    renderApp(`/class/${today.id}`)
    const input = await screen.findByRole('textbox', { name: 'Add a topic' })

    await user.type(input, 'Major scale{Enter}Circle of fifths{Enter}')
    const usedBefore = screen.getByRole('group', { name: /used before/i })
    expect(input.closest('.topic-box')).toContainElement(usedBefore)
    await user.click(within(usedBefore).getByRole('button', { name: 'Hammer-on' }))
    await user.click(within(usedBefore).getByRole('button', { name: 'Pull-off' }))
    await waitFor(async () => expect((await getClass(today.id))?.topics).toHaveLength(4))
    expect((await getClass(today.id))?.topics).toEqual(['Major scale', 'Circle of fifths', 'Hammer-on', 'Pull-off'])

    await user.click(screen.getByRole('button', { name: 'Remove Circle of fifths' }))

    await waitFor(async () => expect((await getClass(today.id))?.topics).toEqual(['Major scale', 'Hammer-on', 'Pull-off']))
  })
})

describe('theme', () => {
  it('is picked in settings, not the header, and remembered', async () => {
    const user = userEvent.setup()
    renderApp('/backup')
    const picker = await screen.findByRole('group', { name: 'Theme' })

    expect(screen.queryByRole('button', { name: /^Theme:/ })).not.toBeInTheDocument()
    expect(within(picker).getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(within(picker).getByRole('button', { name: 'Dark' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('guitar-notebook:theme')).toBe('dark')

    await user.click(within(picker).getByRole('button', { name: 'Light' }))
    expect(document.documentElement.dataset.theme).toBe('light')

    await user.click(within(picker).getByRole('button', { name: 'System' }))
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})

describe('navigation and shortcuts', () => {
  it('has a back button everywhere except the class list', async () => {
    const user = userEvent.setup()
    const guitarClass = await createClass()
    renderApp(`/class/${guitarClass.id}`)

    await user.click(await screen.findByRole('button', { name: 'Back' }))

    expect(await screen.findByRole('heading', { name: 'Your classes' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  it('goes back with Esc, but first just leaves a text box', async () => {
    const user = userEvent.setup()
    const guitarClass = await createClass()
    renderApp(`/class/${guitarClass.id}`)
    const topicInput = await screen.findByRole('textbox', { name: 'Add a topic' })

    await user.click(topicInput)
    await user.keyboard('{Escape}')
    expect(topicInput).not.toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'Add a topic' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(await screen.findByRole('heading', { name: 'Your classes' })).toBeInTheDocument()
  })

  it('starts a class with N, searches with / and writes a doubt with D on the class list', async () => {
    const user = userEvent.setup()
    await createClass({ title: 'Theory' })
    renderApp('/')
    await screen.findByText('Theory')

    await user.keyboard('/')
    expect(screen.getByRole('searchbox', { name: 'Search classes by tag or title' })).toHaveFocus()
    await user.keyboard('{Escape}d')
    expect(screen.getByRole('textbox', { name: 'New doubt' })).toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'New doubt' })).toHaveValue('')

    await user.keyboard('{Escape}n')
    expect(await screen.findByRole('textbox', { name: 'Class title' })).toBeInTheDocument()
    expect((await listClasses()).length).toBe(2)
  })

  it('opens a new tab with T and a new note with N inside a class', async () => {
    const user = userEvent.setup()
    const guitarClass = await createClass()
    renderApp(`/class/${guitarClass.id}`)
    await screen.findByRole('group', { name: 'Metronome' })

    await user.keyboard('n')
    expect(await screen.findByRole('textbox', { name: 'Note' })).toBeInTheDocument()

    await user.keyboard('{Escape}t')
    expect(await screen.findByRole('heading', { name: 'New tab' })).toBeInTheDocument()
  })

  it('saves a tab with Cmd or Ctrl + S', async () => {
    const user = userEvent.setup()
    const guitarClass = await createClass()
    renderApp(`/class/${guitarClass.id}/tab/new`)

    await user.type(await screen.findByLabelText('Title'), 'Quick riff')
    await user.keyboard('{Meta>}s{/Meta}')

    expect(await screen.findByRole('heading', { name: 'Quick riff' })).toBeInTheDocument()
  })

  it('lists the shortcuts in settings', async () => {
    renderApp('/backup')

    expect(await screen.findByRole('heading', { name: 'Shortcuts' })).toBeInTheDocument()
    expect(screen.getByText('Start or stop the metronome')).toBeInTheDocument()
    expect(screen.getByText('Delete a class, tab, note or video')).toBeInTheDocument()
  })
})

describe('videos', () => {
  it('adds a video from class, captions it, slows it down and deletes it', async () => {
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:video'), revokeObjectURL: vi.fn() })
    const user = userEvent.setup()
    const guitarClass = await createClass()
    renderApp(`/class/${guitarClass.id}`)

    const file = new File([new Uint8Array([1, 2, 3])], 'tutor.mp4', { type: 'video/mp4' })
    await user.upload(await screen.findByLabelText('Add videos'), file)

    const caption = await screen.findByRole('textbox', { name: 'Video caption' })
    await user.type(caption, 'Tutor demo{Enter}')
    expect(await screen.findByRole('button', { name: 'Delete Tutor demo' })).toBeInTheDocument()

    const speeds = screen.getByRole('group', { name: 'Playback speed' })
    await user.click(within(speeds).getByRole('button', { name: '0.5×' }))
    expect(within(speeds).getByRole('button', { name: '0.5×' })).toHaveAttribute('aria-pressed', 'true')
    expect((document.querySelector('video') as HTMLVideoElement).playbackRate).toBe(0.5)

    await user.click(screen.getByRole('button', { name: 'Delete Tutor demo' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Video caption' })).not.toBeInTheDocument())
  })
})

describe('notes', () => {
  it('adds a note ready to type in and saves it as you write', async () => {
    const user = userEvent.setup()
    const guitarClass = await createClass()
    renderApp(`/class/${guitarClass.id}`)

    await user.click(await screen.findByRole('button', { name: 'Note' }))
    const body = await screen.findByRole('textbox', { name: 'Note' })
    await waitFor(() => expect(body).toHaveFocus())
    await user.type(body, 'Each step clockwise adds a sharp')
    await user.type(screen.getByRole('textbox', { name: 'Note heading' }), 'Circle of fifths')

    expect(await screen.findByText('Saved', {}, SLOW_SAVE)).toBeInTheDocument()
    await waitFor(async () =>
      expect(await listNotes(guitarClass.id)).toMatchObject([{ title: 'Circle of fifths', body: 'Each step clockwise adds a sharp' }]),
    )
  })

  it('brings back a note that was still a draft when the app closed', async () => {
    const guitarClass = await createClass()
    const note = await createNote(guitarClass.id)
    localStorage.setItem(`${DRAFT_PREFIX}note:${note.id}`, JSON.stringify({ title: '', body: 'Typed just before closing' }))

    renderApp(`/class/${guitarClass.id}`)

    expect(await screen.findByRole('textbox', { name: 'Note' })).toHaveValue('Typed just before closing')
    await waitFor(async () => expect((await listNotes(guitarClass.id))[0]?.body).toBe('Typed just before closing'), SLOW_SAVE)
    await waitFor(() => expect(localStorage.length).toBe(0))
  })

  it('deletes an empty note straight away and asks in the app first when it has text', async () => {
    const user = userEvent.setup()
    const guitarClass = await createClass()
    renderApp(`/class/${guitarClass.id}`)

    await user.click(await screen.findByRole('button', { name: 'Note' }))
    await user.click(await screen.findByRole('button', { name: 'Delete note' }))
    await waitFor(async () => expect(await listNotes(guitarClass.id)).toEqual([]))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Note' }))
    await user.type(await screen.findByRole('textbox', { name: 'Note' }), 'Keep me')
    await user.click(screen.getByRole('button', { name: 'Delete note' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('Keep me')

    await user.click(screen.getByRole('button', { name: 'Delete note' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
    await waitFor(async () => expect(await listNotes(guitarClass.id)).toEqual([]))
  })
})

describe('tab editor', () => {
  it('writes a tab with the keypad and shows it on the class page', async () => {
    const user = userEvent.setup()
    const guitarClass = await createClass()
    renderApp(`/class/${guitarClass.id}/tab/new`)

    await user.type(await screen.findByLabelText('Title'), 'Hammer-on drill')
    await user.type(screen.getByLabelText('Description'), 'Slow, then speed up')
    await user.click(screen.getByRole('button', { name: 'G string, beat 1' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: 'Hammer-on' }))
    await user.click(screen.getByRole('button', { name: '7' }))
    expect(screen.getByText(/G\|-5h7-/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /save tab/i }))

    expect(await screen.findByRole('heading', { name: 'Hammer-on drill' })).toBeInTheDocument()
    expect(screen.getByText('Slow, then speed up')).toBeInTheDocument()
    expect(screen.getByText(/G\|-5h7-/)).toBeInTheDocument()
  })

  it('brings back unsaved changes after you leave without saving', async () => {
    const user = userEvent.setup()
    const guitarClass = await createClass()
    renderApp(`/class/${guitarClass.id}/tab/new`)

    await user.type(await screen.findByLabelText('Title'), 'Riff')
    await user.click(screen.getByRole('button', { name: 'e string, beat 1' }))
    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await user.click(await screen.findByRole('link', { name: 'Tab' }))

    expect(await screen.findByText(/unsaved changes from last time/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('Riff')
    expect(screen.getByRole('button', { name: 'e string, beat 1, 3' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /start over/i }))
    expect(screen.getByLabelText('Title')).toHaveValue('')
  })

  it('asks before Cancel throws changes away', async () => {
    const user = userEvent.setup()
    const guitarClass = await createClass()
    renderApp(`/class/${guitarClass.id}/tab/new`)

    await user.type(await screen.findByLabelText('Title'), 'Riff')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByLabelText('Title')).toHaveValue('Riff')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Throw away' }))
    expect(await screen.findByRole('link', { name: 'Tab' })).toBeInTheDocument()
    expect(localStorage.length).toBe(0)
  })

  it('keeps the text tab when you peek at the grid and come back', async () => {
    const user = userEvent.setup()
    const guitarClass = await createClass()
    renderApp(`/class/${guitarClass.id}/tab/new`)

    await user.click(await screen.findByRole('button', { name: 'Paste text' }))
    await user.type(screen.getByLabelText('Tab text'), 'e|--0--|')
    await user.click(screen.getByRole('button', { name: 'Grid' }))
    await user.click(screen.getByRole('button', { name: 'Paste text' }))
    expect(screen.getByLabelText('Tab text')).toHaveValue('e|--0--|')

    await user.click(screen.getByRole('button', { name: /save tab/i }))
    // Wait until we're back on the class page, so the text found is the saved tab, not the editor.
    expect(await screen.findByRole('heading', { name: 'Untitled tab' })).toBeInTheDocument()
    expect(screen.getByText('e|--0--|')).toBeInTheDocument()
  })

  it('ignores Ctrl and Cmd shortcuts in the grid', async () => {
    const user = userEvent.setup()
    const guitarClass = await createClass()
    renderApp(`/class/${guitarClass.id}/tab/new`)

    await user.click(await screen.findByRole('button', { name: 'e string, beat 1' }))
    await user.keyboard('{Control>}x{/Control}{Meta>}p{/Meta}')

    expect(screen.getByRole('button', { name: 'e string, beat 1' })).toBeInTheDocument()
  })
})

describe('doubts', () => {
  it('checks for text, adds doubts, and clears the box straight away', async () => {
    const user = userEvent.setup()
    renderApp('/')
    const addButton = await screen.findByRole('button', { name: 'Add' })

    await user.click(addButton)
    expect(await screen.findByText('Write your doubt first')).toBeInTheDocument()

    await user.type(screen.getByLabelText('New doubt'), 'Thumb behind the neck?{Enter}Wrist on missed strums?{Enter}')

    expect(await screen.findByText('Wrist on missed strums?')).toBeInTheDocument()
    expect(screen.getByText('Thumb behind the neck?')).toBeInTheDocument()
    expect(screen.getByLabelText('New doubt')).toHaveValue('')
  })

  it('ticks a doubt off and can undo it', async () => {
    const user = userEvent.setup()
    await addDoubt('Thumb behind the neck?')
    renderApp('/')

    await user.click(await screen.findByRole('button', { name: 'Cleared: Thumb behind the neck?' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Cleared “Thumb behind the neck?”')
    await waitFor(async () => expect(await listDoubts()).toEqual([]))

    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(await screen.findByText('Thumb behind the neck?')).toBeInTheDocument()
    expect(await listDoubts()).toHaveLength(1)
  })

  it('shows the doubts box on the home page with how many are waiting', async () => {
    await addDoubt('One')
    await addDoubt('Two')

    renderApp('/')

    const box = await screen.findByRole('region', { name: 'Doubts for next class' })
    expect(await within(box).findByLabelText('2 to ask')).toHaveTextContent('2')
    expect(within(box).getByText('One')).toBeInTheDocument()
  })

  it('keeps the doubts box on the home page before any class exists', async () => {
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Start your first class' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Doubts for next class' })).toBeInTheDocument()
  })

  it('keeps the doubts strip above the class list and shows the newest three until asked', async () => {
    for (const text of ['One', 'Two', 'Three', 'Four', 'Five']) await addDoubt(text)
    await createClass()
    const user = userEvent.setup()
    renderApp('/')

    const classCard = await screen.findByRole('link', { name: /untitled class/i })
    const strip = screen.getByRole('region', { name: 'Doubts for next class' })
    expect(strip.compareDocumentPosition(classCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(await within(strip).findAllByRole('listitem')).toHaveLength(3)

    await user.click(within(strip).getByRole('button', { name: 'Show 2 more' }))
    expect(within(strip).getAllByRole('listitem')).toHaveLength(5)
    await user.click(within(strip).getByRole('button', { name: 'Show less' }))
    expect(within(strip).getAllByRole('listitem')).toHaveLength(3)
  })

  it('opens the metronome on a class page', async () => {
    const guitarClass = await createClass()

    renderApp(`/class/${guitarClass.id}`)

    expect(await screen.findByRole('group', { name: 'Metronome' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start metronome' })).toBeInTheDocument()
  })
})

describe('class page', () => {
  it('deletes a class after you confirm', async () => {
    const user = userEvent.setup()
    const guitarClass = await createClass({ title: 'Delete me' })
    renderApp(`/class/${guitarClass.id}`)

    await user.click(await screen.findByRole('button', { name: /delete class/i }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText(/start your first class/i)).toBeInTheDocument()
    expect(await listClasses()).toEqual([])
  })
})

describe('backup page', () => {
  it('exports everything as a dated backup file', async () => {
    const user = userEvent.setup()
    await createClass({ title: 'One' })
    renderApp('/backup')

    await user.click(await screen.findByRole('button', { name: /export backup/i }))

    expect(await screen.findByText('Backup saved with 1 class, 0 photos and 0 videos.')).toBeInTheDocument()
    const [filename, file] = vi.mocked(downloadFile).mock.calls[0]
    expect(filename).toMatch(/^guitar-notebook-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(JSON.parse(await file.text())).toMatchObject({ app: 'guitar-notebook', version: 3, classes: [{ title: 'One' }], photos: [], videos: [] })
  })
})
