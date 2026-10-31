const REVOKE_DELAY_MS = 1000

/** Saves a file through the browser's normal download flow. */
export function downloadFile(filename: string, file: Blob): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the download before freeing the file.
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
}
