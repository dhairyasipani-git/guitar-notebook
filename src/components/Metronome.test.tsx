import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_BPM, MAX_BPM } from '../lib/metronome'
import { Metronome } from './Metronome'

const clicks: number[] = []

class FakeAudioContext {
  currentTime = 0
  destination = {}
  resume = vi.fn(async () => undefined)
  close = vi.fn(async () => undefined)
  createOscillator() {
    return { frequency: { value: 0 }, connect: vi.fn(), start: (time: number) => clicks.push(time), stop: vi.fn() }
  }
  createGain() {
    return { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() }
  }
}

describe('Metronome', () => {
  beforeEach(() => {
    localStorage.clear()
    clicks.length = 0
    vi.stubGlobal('AudioContext', FakeAudioContext)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts at the default tempo and changes it with the buttons', async () => {
    const user = userEvent.setup()
    render(<Metronome />)

    expect(screen.getByRole('spinbutton', { name: 'Tempo in BPM' })).toHaveValue(DEFAULT_BPM)
    await user.click(screen.getByRole('button', { name: 'Faster' }))
    await user.click(screen.getByRole('button', { name: 'Faster' }))
    await user.click(screen.getByRole('button', { name: 'Slower' }))

    expect(screen.getByRole('spinbutton', { name: 'Tempo in BPM' })).toHaveValue(DEFAULT_BPM + 1)
  })

  it('takes a typed tempo and keeps it in range', async () => {
    const user = userEvent.setup()
    render(<Metronome />)
    const tempo = screen.getByRole('spinbutton', { name: 'Tempo in BPM' })

    await user.clear(tempo)
    await user.type(tempo, '120{Enter}')
    expect(screen.getByRole('spinbutton', { name: 'Tempo in BPM' })).toHaveValue(120)

    await user.clear(screen.getByRole('spinbutton', { name: 'Tempo in BPM' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Tempo in BPM' }), '999{Enter}')
    expect(screen.getByRole('spinbutton', { name: 'Tempo in BPM' })).toHaveValue(MAX_BPM)
  })

  it('plays clicks when started and stops again', async () => {
    const user = userEvent.setup()
    render(<Metronome />)

    await user.click(screen.getByRole('button', { name: 'Start metronome' }))
    expect(clicks.length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Stop metronome' }))
    expect(screen.getByRole('button', { name: 'Start metronome' })).toBeInTheDocument()
  })

  it('starts and stops with the space bar and changes tempo with + and -', async () => {
    const user = userEvent.setup()
    render(<Metronome />)

    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Stop metronome' })).toBeInTheDocument()
    await user.keyboard('++-+')
    expect(screen.getByRole('spinbutton', { name: 'Tempo in BPM' })).toHaveValue(DEFAULT_BPM + 2)

    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Start metronome' })).toBeInTheDocument()
  })

  it('remembers the tempo and time signature next time', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Metronome />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Beats per bar' }), '3')
    await user.click(screen.getByRole('button', { name: 'Faster' }))
    unmount()

    render(<Metronome />)

    expect(screen.getByRole('combobox', { name: 'Beats per bar' })).toHaveValue('3')
    expect(screen.getByRole('spinbutton', { name: 'Tempo in BPM' })).toHaveValue(DEFAULT_BPM + 1)
  })

  it('explains when the browser has no sound support', async () => {
    vi.stubGlobal('AudioContext', undefined)
    const user = userEvent.setup()
    render(<Metronome />)

    await user.click(screen.getByRole('button', { name: 'Start metronome' }))

    expect(screen.getByRole('alert')).toHaveTextContent("can't play the metronome sound")
  })
})
