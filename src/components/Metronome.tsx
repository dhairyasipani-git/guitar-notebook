import { IconMinus, IconPlayerPauseFilled, IconPlayerPlayFilled, IconPlus } from '@tabler/icons-react'
import type { FocusEvent, KeyboardEvent } from 'react'
import { useHotkeys } from '../hooks/useHotkeys'
import { useMetronome } from '../hooks/useMetronome'
import { BEAT_OPTIONS, MAX_BPM, MIN_BPM } from '../lib/metronome'

const BPM_STEP = 1

function signatureLabel(beats: number): string {
  return beats === 6 ? '6/8' : `${beats}/4`
}

/** A compact metronome that sits in the "What I learnt" header and stays pinned while you scroll the tabs. */
export function Metronome() {
  const { bpm, beats, isPlaying, currentBeat, error, setBpm, setBeats, toggle } = useMetronome()
  const faster = () => setBpm(bpm + BPM_STEP)
  const slower = () => setBpm(bpm - BPM_STEP)
  useHotkeys({ space: toggle, '+': faster, '=': faster, '-': slower })

  const commitTempo = (event: FocusEvent<HTMLInputElement>) => {
    const typed = Number(event.currentTarget.value)
    if (event.currentTarget.value.trim() === '' || typed === bpm) event.currentTarget.value = String(bpm)
    else setBpm(typed)
  }
  const blurOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  return (
    <div className={`metronome${isPlaying ? ' playing' : ''}`} role="group" aria-label="Metronome">
      <button type="button" className="metronome-play" aria-label={isPlaying ? 'Stop metronome' : 'Start metronome'} onClick={toggle}>
        {isPlaying ? <IconPlayerPauseFilled size={15} aria-hidden="true" /> : <IconPlayerPlayFilled size={15} aria-hidden="true" />}
      </button>
      <button type="button" className="metronome-step" aria-label="Slower" onClick={slower} disabled={bpm <= MIN_BPM}>
        <IconMinus size={14} aria-hidden="true" />
      </button>
      <label className="metronome-bpm">
        <input
          key={bpm}
          type="number"
          inputMode="numeric"
          aria-label="Tempo in BPM"
          min={MIN_BPM}
          max={MAX_BPM}
          defaultValue={bpm}
          onBlur={commitTempo}
          onKeyDown={blurOnEnter}
        />
        <span aria-hidden="true">bpm</span>
      </label>
      <button type="button" className="metronome-step" aria-label="Faster" onClick={faster} disabled={bpm >= MAX_BPM}>
        <IconPlus size={14} aria-hidden="true" />
      </button>
      <span className="metronome-beats" aria-hidden="true">
        {Array.from({ length: beats }, (_, beat) => (
          <span key={beat} className={`beat-dot${beat === 0 ? ' accent' : ''}${beat === currentBeat ? ' on' : ''}`} />
        ))}
      </span>
      <select className="metronome-signature" aria-label="Beats per bar" value={beats} onChange={(event) => setBeats(Number(event.target.value))}>
        {BEAT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {signatureLabel(option)}
          </option>
        ))}
      </select>
      {error && (
        <p className="error metronome-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
