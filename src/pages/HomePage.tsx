import { IconAlignLeft, IconMusic, IconPhoto, IconPlus, IconSearch, IconVideo } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useConfirm } from '../components/ConfirmDialog'
import { Fretboard, Pick } from '../components/Decor'
import { DoubtsBox } from '../components/DoubtsBox'
import { SwipeRow } from '../components/SwipeRow'
import { createClass, deleteClass } from '../db/classes'
import { useClassCounts, useClasses } from '../db/hooks'
import { countsFor, type ClassCounts } from '../db/stats'
import type { GuitarClass } from '../db/types'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { useHotkeys } from '../hooks/useHotkeys'
import { formatLongDate } from '../lib/dates'
import { requestPersistentStorage } from '../lib/storage'
import { countLabel, deleteClassMessage } from '../lib/text'
import { classMatches, topicKey } from '../lib/topics'

const MAX_CARD_TOPICS = 4

export function HomePage() {
  const classes = useClasses()
  const counts = useClassCounts()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const { run, error, isRunning } = useAsyncAction()

  const startClass = async () => {
    const created = await run(createClass)
    if (!created) return
    void requestPersistentStorage()
    navigate(`/class/${created.id}`, { state: { isNew: true } })
  }

  useHotkeys({ n: () => void startClass(), '/': () => searchRef.current?.focus() })

  if (!classes) return <p className="muted">Tuning up…</p>

  const newClassButton = (
    <button type="button" className="btn btn-primary" onClick={startClass} disabled={isRunning}>
      <IconPlus size={18} aria-hidden="true" />
      New class
    </button>
  )
  const errorMessage = error && (
    <p className="error" role="alert">
      {error}
    </p>
  )

  if (classes.length === 0) {
    return (
      <div className="page">
        <DoubtsBox />
        <div className="empty">
          <Pick label="1" size={64} />
          <h1>Start your first class</h1>
          <p className="muted">Each class gets a page for the topics you covered, the tabs you learnt and anything you want to write down.</p>
          {newClassButton}
          {errorMessage}
        </div>
      </div>
    )
  }

  const visible = classes.filter((guitarClass) => classMatches(guitarClass, search))

  return (
    <div className="page">
      <div className="stack">
        <div className="page-head">
          <div>
            <h1>Your classes</h1>
            <p className="muted">{countLabel(classes.length, 'class', 'classes')}</p>
          </div>
          {newClassButton}
        </div>
        <Fretboard />
      </div>
      {errorMessage}

      <DoubtsBox />

      <label className="search-box">
        <IconSearch size={18} aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          aria-label="Search classes by tag or title"
          placeholder="Search tags, like legato"
          enterKeyHint="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      {visible.length === 0 ? (
        <p className="empty-hint">No classes match “{search.trim()}”.</p>
      ) : (
        <div className="class-list">
          {visible.map((guitarClass) => (
            <ClassCard key={guitarClass.id} guitarClass={guitarClass} counts={countsFor(counts, guitarClass.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ClassCardProps {
  guitarClass: GuitarClass
  counts: ClassCounts
}

function ClassCard({ guitarClass, counts }: ClassCardProps) {
  const confirm = useConfirm()
  const { run, error } = useAsyncAction()
  const extraTopics = guitarClass.topics.length - MAX_CARD_TOPICS

  const remove = async () => {
    if (!(await confirm({ message: deleteClassMessage(guitarClass.number) }))) return
    await run(() => deleteClass(guitarClass.id))
  }

  return (
    <div>
      <SwipeRow actionLabel="Delete" onSwipe={() => void remove()}>
        <Link to={`/class/${guitarClass.id}`} className="class-card">
          <Pick label={String(guitarClass.number)} size={42} />
          <div className="grow">
            <div className="class-card-head">
              <h2 className={`class-card-title${guitarClass.title ? '' : ' untitled'}`}>{guitarClass.title || 'Untitled class'}</h2>
              <span className="faint">{formatLongDate(guitarClass.date)}</span>
            </div>
            {guitarClass.topics.length > 0 && (
              <div className="class-card-topics">
                {guitarClass.topics.slice(0, MAX_CARD_TOPICS).map((topic) => (
                  <span key={topicKey(topic)} className="topic mini">
                    {topic}
                  </span>
                ))}
                {extraTopics > 0 && <span className="topic mini">+{extraTopics}</span>}
              </div>
            )}
            <ClassCardMeta counts={counts} />
          </div>
        </Link>
      </SwipeRow>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function ClassCardMeta({ counts }: { counts: ClassCounts }) {
  const { tabs, notes, photos, videos } = counts
  if (tabs + notes + photos + videos === 0) return null
  return (
    <div className="class-card-meta">
      {tabs > 0 && (
        <span>
          <IconMusic size={14} aria-hidden="true" />
          {countLabel(tabs, 'tab')}
        </span>
      )}
      {notes > 0 && (
        <span>
          <IconAlignLeft size={14} aria-hidden="true" />
          {countLabel(notes, 'note')}
        </span>
      )}
      {photos > 0 && (
        <span>
          <IconPhoto size={14} aria-hidden="true" />
          {countLabel(photos, 'photo')}
        </span>
      )}
      {videos > 0 && (
        <span>
          <IconVideo size={14} aria-hidden="true" />
          {countLabel(videos, 'video')}
        </span>
      )}
    </div>
  )
}
