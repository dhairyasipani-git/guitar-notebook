import { useCallback, useState } from 'react'
import { getErrorMessage, isExpectedError } from '../lib/errors'

export interface AsyncAction {
  /** Runs the action, returning its result, or undefined if it failed (the message lands in `error`). */
  run: <T>(action: () => Promise<T>) => Promise<T | undefined>
  error: string | null
  clearError: () => void
  isRunning: boolean
}

export function useAsyncAction(): AsyncAction {
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const run = useCallback(async <T>(action: () => Promise<T>): Promise<T | undefined> => {
    setError(null)
    setIsRunning(true)
    try {
      return await action()
    } catch (caught: unknown) {
      if (!isExpectedError(caught)) {
        console.error('Action failed', caught)
      }
      setError(getErrorMessage(caught))
      return undefined
    } finally {
      setIsRunning(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { run, error, clearError, isRunning }
}
