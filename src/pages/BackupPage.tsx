import { IconDownload, IconShieldCheck, IconUpload } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import { useConfirm } from '../components/ConfirmDialog'
import { ShortcutsList } from '../components/ShortcutsList'
import { ThemePicker } from '../components/ThemePicker'
import { backupToBlob, exportBackup, importBackup } from '../db/backup'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { todayIso } from '../lib/dates'
import { countLabel } from '../lib/text'
import { downloadFile } from '../lib/download'
import {
  estimateStorage,
  formatBytes,
  isStoragePersisted,
  requestPersistentStorage,
  type StorageEstimate,
} from '../lib/storage'

export function BackupPage() {
  const [storage, setStorage] = useState<StorageEstimate | null>(null)
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const exportAction = useAsyncAction()
  const importAction = useAsyncAction()
  const confirm = useConfirm()

  const refreshStorage = useCallback(async () => {
    const [estimate, persisted] = await Promise.all([estimateStorage(), isStoragePersisted()])
    setStorage(estimate)
    setIsPersisted(persisted)
  }, [])

  useEffect(() => {
    void refreshStorage()
  }, [refreshStorage])

  const handleExport = async () => {
    setMessage(null)
    const backup = await exportAction.run(exportBackup)
    if (!backup) return
    downloadFile(`guitar-notebook-backup-${todayIso()}.json`, backupToBlob(backup))
    setMessage(`Backup saved with ${countLabel(backup.classes.length, 'class', 'classes')}, ${countLabel(backup.photos.length, 'photo')} and ${countLabel(backup.videos.length, 'video')}.`)
  }

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    setMessage(null)
    if (!(await confirm({ message: 'Replace everything in this notebook with the backup? Anything not in the backup will be lost.', confirmLabel: 'Replace' }))) return
    const counts = await importAction.run(async () => importBackup(await file.text()))
    if (!counts) return
    setMessage(
      `Restored ${countLabel(counts.classes, 'class', 'classes')}, ${countLabel(counts.photos, 'photo')}, ${countLabel(counts.videos, 'video')}, ${countLabel(counts.tabs, 'tab')}, ${countLabel(counts.notes, 'note')} and ${countLabel(counts.doubts, 'doubt')}.`,
    )
    void refreshStorage()
  }

  const handleProtect = async () => {
    const granted = await requestPersistentStorage()
    setIsPersisted(granted)
    if (!granted) setMessage("Your browser didn't allow it. Adding the app to your home screen usually helps.")
  }

  return (
    <div className="page">
      <h1>Settings</h1>

      <section className="card stack">
        <h2 className="section-title">Appearance</h2>
        <p className="muted">System follows your phone or computer's light and dark setting.</p>
        <ThemePicker />
      </section>

      <div className="stack">
        <h2 className="section-label">Backup</h2>
        <p className="muted">
          Your notes and photos are saved on this device only. Export a backup now and then so you never lose them, or to move them to
          another device.
        </p>
      </div>

      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}

      <section className="card stack">
        <h2 className="section-title">Export</h2>
        <p className="muted">Saves one file with all your classes, photos, videos, tabs, notes and doubts. Videos make it big, so give it a moment.</p>
        <button type="button" className="btn btn-primary align-start" onClick={handleExport} disabled={exportAction.isRunning}>
          <IconDownload size={18} aria-hidden="true" />
          Export backup
        </button>
        {exportAction.error && (
          <p className="error" role="alert">
            {exportAction.error}
          </p>
        )}
      </section>

      <section className="card stack">
        <h2 className="section-title">Restore</h2>
        <p className="muted">Replaces everything here with the contents of a backup file.</p>
        <label className="btn align-start">
          <IconUpload size={18} aria-hidden="true" />
          Choose backup file
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => {
              void handleImport(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </label>
        {importAction.error && (
          <p className="error" role="alert">
            {importAction.error}
          </p>
        )}
      </section>

      <section className="card stack">
        <h2 className="section-title">Storage</h2>
        <p className="muted">{storage ? `Using ${formatBytes(storage.usage)} on this device.` : 'Storage details aren’t available in this browser.'}</p>
        {isPersisted === true && <p className="success">Protected from automatic cleanup.</p>}
        {isPersisted === false && (
          <button type="button" className="btn align-start" onClick={handleProtect}>
            <IconShieldCheck size={18} aria-hidden="true" />
            Protect my notes from cleanup
          </button>
        )}
      </section>

      <section className="card stack">
        <h2 className="section-title">Use it on your phone</h2>
        <p className="muted">iPhone: open the app in Safari, tap Share, then Add to Home Screen.</p>
        <p className="muted">Android: open it in Chrome, tap the menu, then Install app.</p>
        <p className="faint">Notes stay on the device you add them on. Use export and restore to move them between your phone and laptop.</p>
      </section>

      <section className="card stack">
        <h2 className="section-title">Shortcuts</h2>
        <ShortcutsList />
      </section>
    </div>
  )
}
