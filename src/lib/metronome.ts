export const MIN_BPM = 30
export const MAX_BPM = 260
export const DEFAULT_BPM = 80
export const BEAT_OPTIONS = [2, 3, 4, 6] as const
export const DEFAULT_BEATS = 4

export function clampBpm(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_BPM
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)))
}

export function secondsPerBeat(bpm: number): number {
  return 60 / bpm
}

/** The beat after `beat` in a bar of `beatsPerBar`, wrapping back to 0. */
export function nextBeat(beat: number, beatsPerBar: number): number {
  return beat + 1 >= beatsPerBar ? 0 : beat + 1
}
