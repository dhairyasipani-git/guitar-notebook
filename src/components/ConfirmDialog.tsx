import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export interface ConfirmOptions {
  message: string
  /** Label for the button that goes ahead, e.g. "Delete". */
  confirmLabel?: string
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

const ConfirmContext = createContext<ConfirmFn | null>(null)

/**
 * The app's own "are you sure?" dialog. Browser confirm popups are blocked or
 * silently cancelled in some places (embedded previews, some installed apps),
 * which made delete buttons do nothing.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback<ConfirmFn>(
    (options) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  )

  const answer = useCallback(
    (confirmed: boolean) => {
      pending?.resolve(confirmed)
      setPending(null)
    },
    [pending],
  )

  useEffect(() => {
    if (!pending) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') answer(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [pending, answer])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="dialog-backdrop" onClick={() => answer(false)}>
          <div
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-message"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="confirm-message">{pending.message}</p>
            <div className="dialog-actions">
              <button type="button" className="btn" onClick={() => answer(false)} autoFocus>
                Cancel
              </button>
              <button type="button" className="btn btn-danger-solid" onClick={() => answer(true)}>
                {pending.confirmLabel ?? 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

/** Asks before something destructive. Outside the provider (e.g. in small unit tests) it falls back to the browser popup. */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext)
  return confirm ?? ((options) => Promise.resolve(window.confirm(options.message)))
}
