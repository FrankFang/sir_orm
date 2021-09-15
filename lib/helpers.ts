
export const returnFirst = (a: any) => a?.[0] ?? null
export const returnFalse = () => false
export const returnTrue = () => true

// JavaClass => java_class
export const camelToSnake = (className: string) =>
  className
    .replace(/([A-Z])/g,
      (match: string, capture1: string) => `_${capture1.toLowerCase()}`)
    .replace(/^_/, '')

// apple => apples
export const plural = (str: string) => {
  const map: { [key: string]: string } = {
    person: 'people',
    quiz: 'quizzes'
  }
  return str + (map[str] ?? 's')
}