import { afterEach, describe, expect, it, vi } from 'vitest'
import { RecordNotFoundError } from '../db/db'
import { ValidationError } from '../db/schemas'
import { getErrorMessage, isExpectedError } from './errors'
import { compressImage } from './image'
import { formatBytes, requestPersistentStorage } from './storage'
import { countLabel } from './text'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('countLabel', () => {
  it('uses the singular only for one', () => {
    expect(countLabel(1, 'photo')).toBe('1 photo')
    expect(countLabel(0, 'photo')).toBe('0 photos')
    expect(countLabel(2, 'class', 'classes')).toBe('2 classes')
  })
})

describe('formatBytes', () => {
  it.each([
    [0, '0 KB'],
    [500, '1 KB'],
    [2048, '2 KB'],
    [5 * 1024 * 1024, '5.0 MB'],
    [2 * 1024 * 1024 * 1024, '2.0 GB'],
  ])('formats %d bytes as %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected)
  })
})

describe('getErrorMessage', () => {
  it('passes validation messages straight through', () => {
    expect(getErrorMessage(new ValidationError('Write your doubt first'))).toBe('Write your doubt first')
    expect(isExpectedError(new ValidationError('x'))).toBe(true)
  })

  it('explains missing items and full storage in plain words', () => {
    const quota = Object.assign(new Error('full'), { name: 'QuotaExceededError' })

    expect(getErrorMessage(new RecordNotFoundError('Class', 'x'))).toMatch(/no longer exists/)
    expect(getErrorMessage(quota)).toMatch(/out of space/)
  })

  it('never shows raw error text for unexpected failures', () => {
    expect(getErrorMessage(new TypeError('undefined is not a function'))).toBe('Something went wrong. Try again.')
    expect(isExpectedError(new TypeError('x'))).toBe(false)
  })
})

describe('compressImage', () => {
  it('keeps the original file when the browser cannot decode images', async () => {
    const file = new Blob(['not really an image'], { type: 'image/jpeg' })

    expect(await compressImage(file)).toBe(file)
  })

  it('keeps the original file when decoding fails', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('cannot decode')))
    const file = new Blob(['heic'], { type: 'image/heic' })

    expect(await compressImage(file)).toBe(file)
  })
})

describe('requestPersistentStorage', () => {
  it('reports false when the browser has no storage API', async () => {
    vi.stubGlobal('navigator', {})

    expect(await requestPersistentStorage()).toBe(false)
  })

  it('returns what the browser grants', async () => {
    vi.stubGlobal('navigator', { storage: { persist: vi.fn().mockResolvedValue(true) } })

    expect(await requestPersistentStorage()).toBe(true)
  })
})
