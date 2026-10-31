import { RecordNotFoundError } from '../db/db'
import { ValidationError } from '../db/schemas'

/** Errors the user caused and can fix themselves; anything else is unexpected. */
export function isExpectedError(error: unknown): boolean {
  return error instanceof ValidationError || error instanceof RecordNotFoundError
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) return error.message
  if (error instanceof RecordNotFoundError) return 'That item no longer exists. It may have been deleted.'
  if (error instanceof Error && error.name === 'QuotaExceededError') {
    return 'Your device is out of space for this app. Export a backup, then delete some photos.'
  }
  return 'Something went wrong. Try again.'
}
