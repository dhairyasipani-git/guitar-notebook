import { z } from 'zod'
import { isIsoDate } from '../lib/dates'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export const LIMITS = {
  classNumber: 10_000,
  title: 200,
  topic: 40,
  topicsPerClass: 50,
  caption: 200,
  tabDescription: 2_000,
  tabText: 50_000,
  noteBody: 50_000,
  doubt: 2_000,
} as const

function tooLong(what: string, limit: number): string {
  return `Keep ${what} under ${limit.toLocaleString('en-US')} characters`
}

const idSchema = z.uuid()
const timestampSchema = z.number().int().nonnegative()
const titleSchema = z.string().trim().max(LIMITS.title, tooLong('the title', LIMITS.title))

export const topicSchema = z.string().trim().min(1, 'Type a topic first').max(LIMITS.topic, tooLong('a topic', LIMITS.topic))

export const classSchema = z.object({
  id: idSchema,
  number: z
    .number()
    .int('Class number must be a whole number')
    .min(1, 'Class number must be 1 or more')
    .max(LIMITS.classNumber, 'That class number is too big'),
  date: z.string().refine(isIsoDate, 'Pick a real date'),
  title: titleSchema,
  topics: z.array(topicSchema).max(LIMITS.topicsPerClass, `A class can have up to ${LIMITS.topicsPerClass} topics`),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const mediaMetaSchema = z.object({
  id: idSchema,
  classId: idSchema,
  caption: z.string().trim().max(LIMITS.caption, tooLong('the caption', LIMITS.caption)),
  createdAt: timestampSchema,
})

export const photoBackupSchema = mediaMetaSchema.extend({
  dataUrl: z.string().regex(/^data:image\/[\w.+-]+;base64,[A-Za-z0-9+/=]+$/, 'Photo data is damaged'),
})

export const videoBackupSchema = mediaMetaSchema.extend({
  dataUrl: z.string().regex(/^data:video\/[\w.+-]+;base64,[A-Za-z0-9+/=]+$/, 'Video data is damaged'),
})

export const tabSchema = z.object({
  id: idSchema,
  classId: idSchema,
  title: titleSchema,
  // Older backups have no description, so it defaults to empty.
  description: z.string().trim().max(LIMITS.tabDescription, tooLong('the description', LIMITS.tabDescription)).default(''),
  kind: z.enum(['grid', 'text']),
  grid: z.array(z.array(z.string())),
  text: z.string().max(LIMITS.tabText, tooLong('the tab text', LIMITS.tabText)),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const noteSchema = z.object({
  id: idSchema,
  classId: idSchema,
  title: titleSchema,
  body: z.string().max(LIMITS.noteBody, tooLong('a note', LIMITS.noteBody)),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const doubtSchema = z.object({
  id: idSchema,
  text: z.string().trim().min(1, 'Write your doubt first').max(LIMITS.doubt, tooLong('the doubt', LIMITS.doubt)),
  createdAt: timestampSchema,
})

/** Parses a value or throws a ValidationError carrying the first friendly message. */
export function validate<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message ?? 'Some of that data is not valid')
  }
  return result.data
}
