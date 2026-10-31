export const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'] as const
export const BAR_LENGTH = 8
export const DEFAULT_BARS = 2
export const MAX_FRET = 24
export const TECHNIQUES = ['h', 'p', '/', '\\', 'b', '~'] as const
export const MUTED = 'x'

export type TabGrid = readonly (readonly string[])[]

const FRET_PATTERN = /^(0|[1-9]\d?)$/

export function isTechnique(token: string): boolean {
  return (TECHNIQUES as readonly string[]).includes(token)
}

export function isFret(token: string): boolean {
  return FRET_PATTERN.test(token) && Number(token) <= MAX_FRET
}

export function isValidToken(token: string): boolean {
  return token === '' || token === MUTED || isTechnique(token) || isFret(token)
}

export function createEmptyGrid(bars: number = DEFAULT_BARS): TabGrid {
  const columns = Math.max(1, bars) * BAR_LENGTH
  return STRING_NAMES.map(() => Array.from({ length: columns }, () => ''))
}

export function columnCount(grid: TabGrid): number {
  return grid[0]?.length ?? 0
}

export function setCell(grid: TabGrid, stringIndex: number, column: number, token: string): TabGrid {
  if (!isValidToken(token)) {
    throw new Error(`Invalid tab symbol: "${token}"`)
  }
  const isOutside = stringIndex < 0 || stringIndex >= grid.length || column < 0 || column >= columnCount(grid)
  if (isOutside) {
    throw new RangeError(`No tab cell at string ${stringIndex}, column ${column}`)
  }
  return grid.map((row, s) => (s !== stringIndex ? row : row.map((cell, c) => (c === column ? token : cell))))
}

/** Typing "1" then "2" into a cell gives fret 12; anything else replaces the cell. */
export function appendDigit(current: string, digit: string): string {
  const combined = `${current}${digit}`
  return (current === '1' || current === '2') && isFret(combined) ? combined : digit
}

export function addBar(grid: TabGrid): TabGrid {
  return grid.map((row) => [...row, ...Array.from({ length: BAR_LENGTH }, () => '')])
}

export function removeLastBar(grid: TabGrid): TabGrid {
  if (columnCount(grid) <= BAR_LENGTH) return grid
  return grid.map((row) => row.slice(0, -BAR_LENGTH))
}

export function isGridEmpty(grid: TabGrid): boolean {
  return grid.every((row) => row.every((cell) => cell === ''))
}

/**
 * Renders the grid as standard text tab. Every column is padded to its widest
 * symbol so strings stay aligned, and technique columns hug their neighbours
 * so a hammer-on reads "5h7" rather than "5-h-7".
 */
export function gridToAscii(grid: TabGrid): string {
  const columns = columnCount(grid)
  const widths = Array.from({ length: columns }, (_, c) => Math.max(1, ...grid.map((row) => row[c].length)))
  const techniqueColumns = Array.from({ length: columns }, (_, c) => grid.some((row) => isTechnique(row[c])))
  const hugsNext = (c: number): boolean => techniqueColumns[c] || (c + 1 < columns && techniqueColumns[c + 1])

  return grid
    .map((row, s) => {
      const body = row
        .map((cell, c) => {
          const gap = hugsNext(c) ? '' : '-'
          const isBarEnd = (c + 1) % BAR_LENGTH === 0
          const barLine = isBarEnd ? (c + 1 < columns ? '|-' : '|') : ''
          return cell.padEnd(widths[c], '-') + gap + barLine
        })
        .join('')
      return `${STRING_NAMES[s]}|-${body}`
    })
    .join('\n')
}

/** Turns stored or imported data back into a safe grid, dropping anything invalid. */
export function normalizeGrid(raw: unknown): TabGrid {
  const isSixStrings = Array.isArray(raw) && raw.length === STRING_NAMES.length && raw.every(Array.isArray)
  if (!isSixStrings) return createEmptyGrid()

  const rows = raw as unknown[][]
  const longest = Math.max(...rows.map((row) => row.length))
  const columns = Math.max(1, Math.ceil(longest / BAR_LENGTH)) * BAR_LENGTH
  return rows.map((row) =>
    Array.from({ length: columns }, (_, c) => {
      const cell = row[c]
      return typeof cell === 'string' && isValidToken(cell) ? cell : ''
    }),
  )
}
