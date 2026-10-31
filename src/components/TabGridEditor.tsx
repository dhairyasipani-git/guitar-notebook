import { IconMinus, IconPlus } from '@tabler/icons-react'
import { useRef, useState, type KeyboardEvent } from 'react'
import { useConfirm } from './ConfirmDialog'
import {
  addBar,
  appendDigit,
  BAR_LENGTH,
  columnCount,
  MAX_FRET,
  MUTED,
  removeLastBar,
  setCell,
  STRING_NAMES,
  TECHNIQUES,
  type TabGrid,
} from '../lib/tab'

interface TabGridEditorProps {
  grid: TabGrid
  onChange: (grid: TabGrid) => void
}

interface CellPosition {
  string: number
  column: number
}

const KEYPAD_FRETS = Array.from({ length: MAX_FRET + 1 }, (_, fret) => String(fret))
const KEYPAD_SYMBOLS: readonly string[] = [...TECHNIQUES, MUTED]
const SYMBOL_NAMES: Record<string, string> = {
  h: 'Hammer-on',
  p: 'Pull-off',
  '/': 'Slide up',
  '\\': 'Slide down',
  b: 'Bend',
  '~': 'Vibrato',
  x: 'Muted note',
}
const MOVES: Record<string, [number, number]> = {
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ' ': [0, 1],
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isSameCell(a: CellPosition | null, b: CellPosition): boolean {
  return a !== null && a.string === b.string && a.column === b.column
}

export function TabGridEditor({ grid, onChange }: TabGridEditorProps) {
  const [selected, setSelected] = useState<CellPosition>({ string: 0, column: 0 })
  // The cell last typed into with the keyboard, so "1" then "2" can become fret 12.
  const lastTyped = useRef<CellPosition | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const confirm = useConfirm()
  const columns = columnCount(grid)

  const select = (position: CellPosition) => {
    setSelected({ string: clamp(position.string, 0, grid.length - 1), column: clamp(position.column, 0, columns - 1) })
    lastTyped.current = null
  }

  const write = (token: string, shouldAdvance: boolean) => {
    onChange(setCell(grid, selected.string, selected.column, token))
    if (shouldAdvance) select({ ...selected, column: selected.column + 1 })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Leave shortcuts like Cmd/Ctrl+P or Ctrl+X to the browser.
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const { key } = event
    const move = MOVES[key]
    if (move) {
      select({ string: selected.string + move[0], column: selected.column + move[1] })
    } else if (/^\d$/.test(key)) {
      const current = isSameCell(lastTyped.current, selected) ? grid[selected.string][selected.column] : ''
      write(appendDigit(current, key), false)
      lastTyped.current = selected
    } else if (KEYPAD_SYMBOLS.includes(key)) {
      write(key, true)
    } else if (key === 'Backspace' || key === 'Delete') {
      write('', false)
    } else {
      return
    }
    event.preventDefault()
  }

  const removeBar = async () => {
    const lastBarHasNotes = grid.some((row) => row.slice(-BAR_LENGTH).some((cell) => cell !== ''))
    if (lastBarHasNotes && !(await confirm({ message: 'Remove the last bar and the notes in it?', confirmLabel: 'Remove' }))) return
    const next = removeLastBar(grid)
    onChange(next)
    select({ ...selected, column: Math.min(selected.column, columnCount(next) - 1) })
  }

  return (
    <div className="stack">
      <div
        ref={gridRef}
        className="tab-grid"
        tabIndex={0}
        aria-label="Tab grid. Use the arrow keys to move and type fret numbers."
        onKeyDown={handleKeyDown}
      >
        {grid.map((row, stringIndex) => (
          <div key={STRING_NAMES[stringIndex]} className="tab-string">
            <span className="tab-string-name" aria-hidden="true">
              {STRING_NAMES[stringIndex]}
            </span>
            {row.map((cell, column) => {
              const isSelected = selected.string === stringIndex && selected.column === column
              const classes = ['tab-cell', cell && 'filled', isSelected && 'selected', (column + 1) % BAR_LENGTH === 0 && 'bar-end']
              return (
                <button
                  key={column}
                  type="button"
                  tabIndex={-1}
                  className={classes.filter(Boolean).join(' ')}
                  aria-label={`${STRING_NAMES[stringIndex]} string, beat ${column + 1}${cell ? `, ${cell}` : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    select({ string: stringIndex, column })
                    gridRef.current?.focus()
                  }}
                >
                  {cell}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="keypad" role="group" aria-label="Fret numbers">
        {KEYPAD_FRETS.map((fret) => (
          <button key={fret} type="button" className="key" onClick={() => write(fret, true)}>
            {fret}
          </button>
        ))}
      </div>
      <div className="keypad" role="group" aria-label="Techniques">
        {KEYPAD_SYMBOLS.map((symbol) => (
          <button key={symbol} type="button" className="key" title={SYMBOL_NAMES[symbol]} aria-label={SYMBOL_NAMES[symbol]} onClick={() => write(symbol, true)}>
            {symbol}
          </button>
        ))}
        <button type="button" className="key key-word" onClick={() => write('', false)}>
          Erase
        </button>
      </div>
      <div className="row wrap">
        <button type="button" className="btn btn-small" onClick={() => onChange(addBar(grid))}>
          <IconPlus size={16} aria-hidden="true" />
          Add bar
        </button>
        <button type="button" className="btn btn-small" onClick={removeBar} disabled={columns <= BAR_LENGTH}>
          <IconMinus size={16} aria-hidden="true" />
          Remove last bar
        </button>
      </div>
      <p className="faint">h hammer-on · p pull-off · / slide up · \ slide down · b bend · ~ vibrato · x muted</p>
    </div>
  )
}
