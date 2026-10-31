import { useEffect, useState } from 'react'

/**
 * A temporary URL for showing a stored photo, freed again when the component goes away.
 * Saved photos never change, so only a new `identity` (the photo id) makes a new URL;
 * the fresh Blob objects a live query hands back on every change are ignored.
 */
export function useObjectUrl(blob: Blob | undefined, identity: string | undefined): string | undefined {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!blob || !identity) {
      setUrl(undefined)
      return
    }
    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on identity on purpose, see above
  }, [identity])

  return url
}
