import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatLongDate, formatShortDate, isIsoDate, todayIso } from './dates'

afterEach(() => {
  vi.useRealTimers()
})

describe('isIsoDate', () => {
  it('accepts real YYYY-MM-DD dates', () => {
    expect(isIsoDate('2026-10-31')).toBe(true)
  })

  it.each(['2026-02-30', '2026-13-01', '31-10-2026', '', 'soon'])('rejects "%s"', (value) => {
    expect(isIsoDate(value)).toBe(false)
  })
})

describe('formatting', () => {
  it('formats short and long dates without shifting the day', () => {
    expect(formatShortDate('2026-09-02')).toBe('Sep 2')
    expect(formatLongDate('2026-10-21')).toBe('Wed, Oct 21')
  })

  it('returns the input unchanged when it is not a date', () => {
    expect(formatShortDate('later')).toBe('later')
  })
})

describe('todayIso', () => {
  it('uses the local calendar date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 5, 23, 30))

    expect(todayIso()).toBe('2026-01-05')
  })
})
