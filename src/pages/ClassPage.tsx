import { IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AddEntryBar } from '../components/AddEntryBar'
import { ClassContent } from '../components/ClassContent'
import { useConfirm } from '../components/ConfirmDialog'
import { ClassHeader } from '../components/ClassHeader'
import { Fretboard } from '../components/Decor'
import { Metronome } from '../components/Metronome'
import { TopicPicker } from '../components/TopicPicker'
import { changeTopics, deleteClass } from '../db/classes'
import { useClass, useClasses } from '../db/hooks'
import type { GuitarClass } from '../db/types'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { deleteClassMessage } from '../lib/text'
import { addTopic, collectTopics, removeTopic } from '../lib/topics'
import { NotFoundPage } from './NotFoundPage'

export function ClassPage() {
  const { classId = '' } = useParams()
  const guitarClass = useClass(classId)
  const classes = useClasses()
  const topicAction = useAsyncAction()
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null)

  if (guitarClass === undefined) return <p className="muted">Tuning up…</p>
  if (guitarClass === null) return <NotFoundPage message="This class doesn't exist. It may have been deleted." />

  return (
    <div className="page">
      <div className="stack-lg">
        <ClassHeader guitarClass={guitarClass} />
        <Fretboard />
      </div>

      <section className="section">
        <h2 className="section-label">Topics</h2>
        <TopicPicker
          topics={guitarClass.topics}
          suggestions={collectTopics(classes ?? [])}
          onAdd={(topic) => void topicAction.run(() => changeTopics(guitarClass.id, (topics) => addTopic(topics, topic)))}
          onRemove={(topic) => void topicAction.run(() => changeTopics(guitarClass.id, (topics) => removeTopic(topics, topic)))}
        />
        {topicAction.error && (
          <p className="error" role="alert">
            {topicAction.error}
          </p>
        )}
      </section>

      <section className="section">
        <div className="learnt-head">
          <h2 className="section-label">What I learnt</h2>
          <Metronome />
        </div>
        <ClassContent classId={guitarClass.id} focusNoteId={focusNoteId} />
        <AddEntryBar classId={guitarClass.id} onNoteCreated={setFocusNoteId} />
      </section>

      <DeleteClassButton guitarClass={guitarClass} />
    </div>
  )
}

function DeleteClassButton({ guitarClass }: { guitarClass: GuitarClass }) {
  const navigate = useNavigate()
  const { run, error } = useAsyncAction()
  const confirm = useConfirm()

  const remove = async () => {
    if (!(await confirm({ message: deleteClassMessage(guitarClass.number) }))) return
    const deleted = await run(async () => {
      await deleteClass(guitarClass.id)
      return true
    })
    if (deleted) navigate('/')
  }

  return (
    <div className="class-footer stack">
      <button type="button" className="btn btn-ghost btn-danger btn-small" onClick={remove}>
        <IconTrash size={16} aria-hidden="true" />
        Delete class
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
