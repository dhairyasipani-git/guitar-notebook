import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { clearDraft, DRAFT_PREFIX, loadDraft, saveDraft } from './drafts'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('drafts', () => {
  it('saves, loads and clears a draft', () => {
    saveDraft('notes:c1', 'Pull down, not up')

    expect(loadDraft('notes:c1', z.string())).toBe('Pull down, not up')

    clearDraft('notes:c1')
    expect(loadDraft('notes:c1', z.string())).toBeNull()
  })

  it('ignores drafts that are damaged or the wrong shape', () => {
    localStorage.setItem(`${DRAFT_PREFIX}broken`, '{not json')
    localStorage.setItem(`${DRAFT_PREFIX}number`, '42')

    expect(loadDraft('broken', z.string())).toBeNull()
    expect(loadDraft('number', z.string())).toBeNull()
  })

  it('keeps working when the browser blocks storage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => saveDraft('notes:c1', 'text')).not.toThrow()
  })
})
