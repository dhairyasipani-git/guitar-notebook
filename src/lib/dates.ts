const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Parses YYYY-MM-DD as a local calendar date, so the day never shifts by time zone. */
function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE.exec(value)
  if (!match) return null

  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(year, month - 1, day)
  const isRealDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return isRealDate ? date : null
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function isIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null
}

export function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function formatShortDate(value: string): string {
  const date = parseIsoDate(value)
  return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : value
}

export function formatLongDate(value: string): string {
  const date = parseIsoDate(value)
  return date ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : value
}
