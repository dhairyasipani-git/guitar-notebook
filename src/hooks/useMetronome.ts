import { useCallback, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { clampBpm, DEFAULT_BEATS, DEFAULT_BPM, nextBeat, secondsPerBeat } from '../lib/metronome'

const SETTINGS_KEY = 'guitar-notebook:metronome'
// How often the scheduler wakes up, and how far ahead it books clicks.
// Booking ahead on the audio clock keeps the beat steady even when the page is busy.
const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_S = 0.1
const START_DELAY_S = 0.05
const CLICK_LENGTH_S = 0.05
const ACCENT_HZ = 1760
const BEAT_HZ = 1100
const MAX_PENDING_BEAT_UPDATES = 8

const settingsSchema = z.object({ bpm: z.number(), beats: z.number().int().min(1).max(12) })

interface MetronomeSettings {
  bpm: number
  beats: number
}

export interface MetronomeState extends MetronomeSettings {
  isPlaying: boolean
  /** The beat that's sounding now (0 is the accented one), or null when stopped. */
  currentBeat: number | null
  error: string | null
  setBpm: (bpm: number) => void
  setBeats: (beats: number) => void
  toggle: () => void
}

function loadSettings(): MetronomeSettings {
  try {
    const parsed = settingsSchema.safeParse(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null'))
    if (parsed.success) return { bpm: clampBpm(parsed.data.bpm), beats: parsed.data.beats }
  } catch {
    // Storage blocked or damaged: start from the defaults.
  }
  return { bpm: DEFAULT_BPM, beats: DEFAULT_BEATS }
}

function saveSettings(settings: MetronomeSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Not remembering the tempo is fine.
  }
}

function playClick(context: AudioContext, time: number, isAccent: boolean): void {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.frequency.value = isAccent ? ACCENT_HZ : BEAT_HZ
  gain.gain.setValueAtTime(isAccent ? 0.9 : 0.6, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + CLICK_LENGTH_S)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(time)
  oscillator.stop(time + CLICK_LENGTH_S)
}

function createAudioContext(): AudioContext | null {
  const AudioContextClass = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return AudioContextClass ? new AudioContextClass() : null
}

export function useMetronome(): MetronomeState {
  const [settings, setSettings] = useState(loadSettings)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentBeat, setCurrentBeat] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // The scheduler reads these on every tick, so tempo changes apply mid-play.
  const settingsRef = useRef(settings)
  const contextRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const beatTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Only remember settings once they've been changed, so just opening a class stores nothing.
  const loadedSettingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
    if (settings !== loadedSettingsRef.current) saveSettings(settings)
  }, [settings])

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    beatTimeoutsRef.current.forEach(clearTimeout)
    beatTimeoutsRef.current = []
    void contextRef.current?.close()
    contextRef.current = null
    setIsPlaying(false)
    setCurrentBeat(null)
  }, [])

  const start = useCallback(() => {
    const context = createAudioContext()
    if (!context) {
      setError("This browser can't play the metronome sound.")
      return
    }
    setError(null)
    contextRef.current = context
    void context.resume()
    let beat = 0
    let nextTime = context.currentTime + START_DELAY_S

    const schedule = () => {
      while (nextTime < context.currentTime + SCHEDULE_AHEAD_S) {
        const { bpm, beats } = settingsRef.current
        const scheduledBeat = beat % beats
        playClick(context, nextTime, scheduledBeat === 0)
        const delayMs = Math.max(0, (nextTime - context.currentTime) * 1000)
        beatTimeoutsRef.current = [
          ...beatTimeoutsRef.current.slice(-MAX_PENDING_BEAT_UPDATES),
          setTimeout(() => setCurrentBeat(scheduledBeat), delayMs),
        ]
        nextTime += secondsPerBeat(bpm)
        beat = nextBeat(scheduledBeat, beats)
      }
    }
    schedule()
    timerRef.current = setInterval(schedule, LOOKAHEAD_MS)
    setIsPlaying(true)
  }, [])

  const toggle = useCallback(() => (timerRef.current ? stop() : start()), [start, stop])

  // Leaving the page stops the sound.
  useEffect(() => stop, [stop])

  const setBpm = useCallback((bpm: number) => setSettings((current) => ({ ...current, bpm: clampBpm(bpm) })), [])
  const setBeats = useCallback((beats: number) => setSettings((current) => ({ ...current, beats })), [])

  return { ...settings, isPlaying, currentBeat, error, setBpm, setBeats, toggle }
}
