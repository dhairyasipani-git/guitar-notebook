import { useState } from 'react'
import { addPhoto } from '../db/photos'
import { addVideo } from '../db/videos'
import { getErrorMessage, isExpectedError } from '../lib/errors'
import { compressImage } from '../lib/image'
import { countLabel } from '../lib/text'

interface FailedFile {
  name: string
  reason: string
}

export interface MediaUpload {
  addFiles: (files: readonly File[]) => Promise<void>
  status: string | null
  error: string | null
}

function describeFailures(failures: readonly FailedFile[], addedCount: number, noun: string): string {
  const [first] = failures
  const lead = failures.length === 1 ? `${first.name} couldn't be added.` : `${countLabel(failures.length, noun)} couldn't be added.`
  const added = addedCount > 0 ? ` ${countLabel(addedCount, noun)} added.` : ''
  return `${lead} ${first.reason}${added}`
}

/** Adds picked files one at a time (keeping their order); a bad file doesn't stop the rest. */
function useFileUpload(noun: string, save: (file: File) => Promise<unknown>): MediaUpload {
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addFiles = async (files: readonly File[]) => {
    if (files.length === 0) return
    setError(null)
    setStatus(`Adding ${countLabel(files.length, noun)}…`)
    let failures: FailedFile[] = []
    for (const file of files) {
      try {
        await save(file)
      } catch (caught: unknown) {
        if (!isExpectedError(caught)) console.error(`Could not add ${noun}`, file.name, caught)
        failures = [...failures, { name: file.name, reason: getErrorMessage(caught) }]
      }
    }
    setStatus(null)
    if (failures.length > 0) setError(describeFailures(failures, files.length - failures.length, noun))
  }

  return { addFiles, status, error }
}

/** Photos are shrunk before saving so sheets stay sharp without filling the phone. */
export function usePhotoUpload(classId: string): MediaUpload {
  return useFileUpload('photo', async (file) => addPhoto(classId, await compressImage(file)))
}

/** Videos are saved as they are. */
export function useVideoUpload(classId: string): MediaUpload {
  return useFileUpload('video', (file) => addVideo(classId, file))
}
