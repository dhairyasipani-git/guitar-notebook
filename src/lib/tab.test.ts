import { describe, expect, it } from 'vitest'
import {
  addBar,
  appendDigit,
  BAR_LENGTH,
  createEmptyGrid,
  gridToAscii,
  isGridEmpty,
  isValidToken,
  normalizeGrid,
  removeLastBar,
  setCell,
  STRING_NAMES,
  type TabGrid,
} from './tab'

function withCells(grid: TabGrid, cells: ReadonlyArray<[number, number, string]>): TabGrid {
  return cells.reduce((acc, [s, c, token]) => setCell(acc, s, c, token), grid)
}

describe('createEmptyGrid', () => {
  it('creates six strings with two bars of empty cells by default', () => {
    const grid = createEmptyGrid()

    expect(grid).toHaveLength(STRING_NAMES.length)
    grid.forEach((row) => expect(row).toEqual(Array(2 * BAR_LENGTH).fill('')))
  })

  it('creates the requested number of bars', () => {
    expect(createEmptyGrid(3)[0]).toHaveLength(3 * BAR_LENGTH)
  })

  it('never creates fewer than one bar', () => {
    expect(createEmptyGrid(0)[0]).toHaveLength(BAR_LENGTH)
  })
})

describe('isValidToken', () => {
  it.each(['', '0', '7', '12', '24', 'h', 'p', '/', '\\', 'b', '~', 'x'])('accepts "%s"', (token) => {
    expect(isValidToken(token)).toBe(true)
  })

  it.each(['25', '-1', 'q', '1h', ' ', '007', '3.5'])('rejects "%s"', (token) => {
    expect(isValidToken(token)).toBe(false)
  })
})

describe('setCell', () => {
  it('returns a new grid with only the target cell changed', () => {
    const grid = createEmptyGrid(1)

    const next = setCell(grid, 2, 3, '5')

    expect(next[2][3]).toBe('5')
    expect(grid[2][3]).toBe('')
    expect(next[0]).toBe(grid[0])
  })

  it('throws on an invalid symbol', () => {
    expect(() => setCell(createEmptyGrid(1), 0, 0, 'z')).toThrow(/invalid tab symbol/i)
  })

  it('throws when the position is outside the grid', () => {
    expect(() => setCell(createEmptyGrid(1), 6, 0, '1')).toThrow(RangeError)
    expect(() => setCell(createEmptyGrid(1), 0, BAR_LENGTH, '1')).toThrow(RangeError)
  })
})

describe('appendDigit', () => {
  it('builds two-digit frets from a leading 1 or 2', () => {
    expect(appendDigit('1', '2')).toBe('12')
    expect(appendDigit('2', '4')).toBe('24')
  })

  it('replaces the cell when the result would not be a real fret', () => {
    expect(appendDigit('2', '7')).toBe('7')
    expect(appendDigit('5', '3')).toBe('3')
    expect(appendDigit('h', '3')).toBe('3')
    expect(appendDigit('', '0')).toBe('0')
  })
})

describe('addBar and removeLastBar', () => {
  it('adds one empty bar and keeps existing notes', () => {
    const grid = setCell(createEmptyGrid(1), 0, 0, '3')

    const next = addBar(grid)

    expect(next[0]).toHaveLength(2 * BAR_LENGTH)
    expect(next[0][0]).toBe('3')
    expect(next[0].slice(BAR_LENGTH)).toEqual(Array(BAR_LENGTH).fill(''))
  })

  it('removes the last bar', () => {
    expect(removeLastBar(createEmptyGrid(2))[0]).toHaveLength(BAR_LENGTH)
  })

  it('keeps at least one bar', () => {
    const grid = createEmptyGrid(1)

    expect(removeLastBar(grid)).toBe(grid)
  })
})

describe('isGridEmpty', () => {
  it('is true only when no cell has a symbol', () => {
    expect(isGridEmpty(createEmptyGrid())).toBe(true)
    expect(isGridEmpty(setCell(createEmptyGrid(), 5, 9, 'x'))).toBe(false)
  })
})

describe('gridToAscii', () => {
  it('renders an empty one-bar grid', () => {
    const expected = STRING_NAMES.map((name) => `${name}|${'-'.repeat(17)}|`).join('\n')

    expect(gridToAscii(createEmptyGrid(1))).toBe(expected)
  })

  it('joins techniques to their notes without extra dashes', () => {
    const grid = withCells(createEmptyGrid(1), [
      [2, 0, '5'],
      [2, 1, 'h'],
      [2, 2, '7'],
    ])

    const lines = gridToAscii(grid).split('\n')

    expect(lines[2]).toBe(`G|-5h7-${'-'.repeat(10)}|`)
    expect(new Set(lines.map((line) => line.length)).size).toBe(1)
  })

  it('pads columns so two-digit frets stay aligned', () => {
    const grid = withCells(createEmptyGrid(1), [
      [0, 0, '12'],
      [1, 0, '3'],
    ])

    const lines = gridToAscii(grid).split('\n')

    expect(lines[0].startsWith('e|-12-')).toBe(true)
    expect(lines[1].startsWith('B|-3--')).toBe(true)
    expect(new Set(lines.map((line) => line.length)).size).toBe(1)
  })

  it('draws a bar line after every bar', () => {
    const lines = gridToAscii(createEmptyGrid(2)).split('\n')

    lines.forEach((line) => expect(line.split('|')).toHaveLength(4))
  })
})

describe('normalizeGrid', () => {
  it('returns an empty grid for input that is not a tab', () => {
    expect(normalizeGrid('nope')).toEqual(createEmptyGrid())
    expect(normalizeGrid([['1']])).toEqual(createEmptyGrid())
  })

  it('keeps valid symbols and blanks invalid ones', () => {
    const raw = STRING_NAMES.map(() => Array(BAR_LENGTH).fill(''))
    raw[0][0] = '5'
    raw[1][1] = 'zz'
    raw[2][2] = 7

    const grid = normalizeGrid(raw)

    expect(grid[0][0]).toBe('5')
    expect(grid[1][1]).toBe('')
    expect(grid[2][2]).toBe('')
  })

  it('pads ragged strings out to whole bars', () => {
    const raw = STRING_NAMES.map((_, i) => Array(i === 0 ? BAR_LENGTH + 1 : 2).fill(''))

    const grid = normalizeGrid(raw)

    grid.forEach((row) => expect(row).toHaveLength(2 * BAR_LENGTH))
  })
})
