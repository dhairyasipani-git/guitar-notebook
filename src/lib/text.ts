/** "1 photo", "3 photos", "2 classes". */
export function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function deleteClassMessage(classNumber: number): string {
  return `Delete class ${classNumber} and everything in it? This can't be undone.`
}
