export interface GuitarClass {
  id: string
  number: number
  /** Calendar date of the class as YYYY-MM-DD. */
  date: string
  title: string
  /** What the class covered: techniques, theory, songs, anything. */
  topics: string[]
  createdAt: number
  updatedAt: number
}

export interface Photo {
  id: string
  classId: string
  caption: string
  blob: Blob
  createdAt: number
}

export type TabKind = 'grid' | 'text'

export interface SavedTab {
  id: string
  classId: string
  title: string
  description: string
  kind: TabKind
  /** Six strings (high e first) of cell symbols; empty for text tabs. */
  grid: string[][]
  /** Pasted plain-text tab; empty for grid tabs. */
  text: string
  createdAt: number
  updatedAt: number
}

/** A written entry in a class: a theory explanation, a description, any paragraph. */
export interface Note {
  id: string
  classId: string
  title: string
  body: string
  createdAt: number
  updatedAt: number
}

/** A question to ask next class; ticking it off deletes it. */
export interface Doubt {
  id: string
  text: string
  createdAt: number
}

export interface Video {
  id: string
  classId: string
  caption: string
  blob: Blob
  createdAt: number
}
