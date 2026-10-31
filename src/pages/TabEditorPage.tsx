import { IconCheck } from '@tabler/icons-react'
import { useRef, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useConfirm } from '../components/ConfirmDialog'
import { TabGridEditor } from '../components/TabGridEditor'
import { useClass, useTab } from '../db/hooks'
import { LIMITS } from '../db/schemas'
import { saveTab } from '../db/tabs'
import type { SavedTab, TabKind } from '../db/types'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { useHotkeys } from '../hooks/useHotkeys'
import { useTabDraft } from '../hooks/useTabDraft'
import { gridToAscii, isGridEmpty } from '../lib/tab'
import { NotFoundPage } from './NotFoundPage'

const NEW_TAB_ID = 'new'

export function TabEditorPage() {
  const { classId = '', tabId = NEW_TAB_ID } = useParams()
  const isNew = tabId === NEW_TAB_ID
  const guitarClass = useClass(classId)
  const tab = useTab(isNew ? undefined : tabId)

  if (guitarClass === undefined || (!isNew && tab === undefined)) return <p className="muted">Tuning up…</p>
  if (guitarClass === null) return <NotFoundPage message="This class doesn't exist. It may have been deleted." />
  if (!isNew && !tab) return <NotFoundPage message="This tab doesn't exist. It may have been deleted." />

  return <TabForm key={tab?.id ?? NEW_TAB_ID} classId={classId} classNumber={guitarClass.number} tab={tab ?? null} />
}

interface TabFormProps {
  classId: string
  classNumber: number
  tab: SavedTab | null
}

function TabForm({ classId, classNumber, tab }: TabFormProps) {
  const navigate = useNavigate()
  const { draft, update, isDirty, wasRestored, discard, forget } = useTabDraft(classId, tab)
  const { run, error, isRunning } = useAsyncAction()
  const confirm = useConfirm()
  const backTo = `/class/${classId}`
  const formRef = useRef<HTMLFormElement>(null)
  const saveWithKeyboard = () => formRef.current?.requestSubmit()
  useHotkeys({ 'mod+s': saveWithKeyboard, 'mod+enter': saveWithKeyboard })

  // Both buffers are kept, so switching back and forth never loses anything;
  // only the shown kind is saved.
  const switchKind = (next: TabKind) => {
    if (next === draft.kind) return
    const shouldFillText = next === 'text' && draft.text.trim() === '' && !isGridEmpty(draft.grid)
    update(shouldFillText ? { kind: next, text: gridToAscii(draft.grid) } : { kind: next })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const saved = await run(() => saveTab({ id: tab?.id, classId, title: draft.title, description: draft.description, kind: draft.kind, grid: draft.grid, text: draft.text }))
    if (!saved) return
    forget()
    navigate(backTo)
  }

  const cancel = async () => {
    if (isDirty && !(await confirm({ message: 'Throw away your changes to this tab?', confirmLabel: 'Throw away' }))) return
    forget()
    navigate(backTo)
  }

  return (
    <form ref={formRef} className="page" onSubmit={submit}>
      <div>
        <p className="faint">Class {classNumber}</p>
        <h1>{tab ? 'Edit tab' : 'New tab'}</h1>
      </div>

      {wasRestored && isDirty && (
        <div className="card row wrap" role="status">
          <span className="grow muted">Your unsaved changes from last time are back.</span>
          <button type="button" className="btn btn-small" onClick={discard}>
            Start over
          </button>
        </div>
      )}

      <label className="label">
        Title
        <input className="input" value={draft.title} placeholder="Hammer-on drill" onChange={(event) => update({ title: event.target.value })} />
      </label>
      <label className="label">
        Description
        <textarea
          className="textarea tab-description-input"
          rows={2}
          maxLength={LIMITS.tabDescription}
          value={draft.description}
          placeholder="Anything about it: where it's from, how to play it, what to watch for…"
          onChange={(event) => update({ description: event.target.value })}
        />
      </label>

      <div className="segmented" role="group" aria-label="How to write the tab">
        <button type="button" aria-pressed={draft.kind === 'grid'} onClick={() => switchKind('grid')}>
          Grid
        </button>
        <button type="button" aria-pressed={draft.kind === 'text'} onClick={() => switchKind('text')}>
          Paste text
        </button>
      </div>

      {draft.kind === 'grid' ? (
        <>
          <div className="card">
            <TabGridEditor grid={draft.grid} onChange={(grid) => update({ grid })} />
          </div>
          <section className="section">
            <h2 className="section-title">Saves as</h2>
            <pre className="tab-pre">{gridToAscii(draft.grid)}</pre>
          </section>
        </>
      ) : (
        <textarea
          className="textarea tab-textarea"
          aria-label="Tab text"
          spellCheck={false}
          placeholder={'e|-----0-----|\nB|---1---1---|\nG|-2-------2-|'}
          value={draft.text}
          onChange={(event) => update({ text: event.target.value })}
        />
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={isRunning}>
          <IconCheck size={18} aria-hidden="true" />
          Save tab
        </button>
        <button type="button" className="btn" onClick={cancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
