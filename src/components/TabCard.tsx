import { IconMusic, IconPencil, IconTrash } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { deleteTab } from '../db/tabs'
import type { SavedTab } from '../db/types'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { gridToAscii, normalizeGrid } from '../lib/tab'
import { useConfirm } from './ConfirmDialog'
import { SwipeRow } from './SwipeRow'

interface TabCardProps {
  tab: SavedTab
}

function tabToText(tab: SavedTab): string {
  return tab.kind === 'grid' ? gridToAscii(normalizeGrid(tab.grid)) : tab.text
}

export function TabCard({ tab }: TabCardProps) {
  const { run, error } = useAsyncAction()
  const confirm = useConfirm()
  const title = tab.title || 'Untitled tab'

  const remove = async () => {
    if (await confirm({ message: `Delete "${title}"? This can't be undone.` })) void run(() => deleteTab(tab.id))
  }

  return (
    <SwipeRow actionLabel="Delete" onSwipe={() => void remove()}>
      <article className="entry">
        <div className="entry-head">
          <span className="entry-icon" aria-hidden="true">
            <IconMusic size={16} />
          </span>
          <h3 className="entry-title">{title}</h3>
          <Link className="icon-btn" to={`/class/${tab.classId}/tab/${tab.id}`} aria-label={`Edit ${title}`}>
            <IconPencil size={17} aria-hidden="true" />
          </Link>
          <button type="button" className="icon-btn" aria-label={`Delete ${title}`} onClick={remove}>
            <IconTrash size={17} aria-hidden="true" />
          </button>
        </div>
        {tab.description && <p className="entry-description">{tab.description}</p>}
        <pre className="tab-pre">{tabToText(tab)}</pre>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </article>
    </SwipeRow>
  )
}
