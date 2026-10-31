import { describe, expect, it } from 'vitest'
import { BEAT_OPTIONS, clampBpm, DEFAULT_BPM, MAX_BPM, MIN_BPM, nextBeat, secondsPerBeat } from './metronome'

describe('clampBpm', () => {
  it('keeps a tempo inside the range and rounds it', () => {
    expect(clampBpm(92.4)).toBe(92)
    expect(clampBpm(5)).toBe(MIN_BPM)
    expect(clampBpm(999)).toBe(MAX_BPM)
  })

  it('falls back to the default for something that is not a number', () => {
    expect(clampBpm(Number.NaN)).toBe(DEFAULT_BPM)
  })
})

describe('secondsPerBeat', () => {
  it('turns a tempo into the gap between clicks', () => {
    expect(secondsPerBeat(60)).toBe(1)
    expect(secondsPerBeat(120)).toBe(0.5)
  })
})

describe('nextBeat', () => {
  it('counts through the bar and wraps back to beat one', () => {
    expect(nextBeat(0, 4)).toBe(1)
    expect(nextBeat(3, 4)).toBe(0)
    expect(nextBeat(5, 3)).toBe(0)
  })

  it('offers common time signatures', () => {
    expect(BEAT_OPTIONS).toContain(4)
    expect(BEAT_OPTIONS).toContain(3)
  })
})
