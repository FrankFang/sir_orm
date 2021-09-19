import { Base } from './base'
import { Crud } from './crud'

export const returnFirst = (a: any) => a?.[0] ?? null
export const returnFalse = () => false
export const returnTrue = () => true
export const returnNull = () => null
export const returnAssociated = <T extends Base>(obj: T | null) => {
  if (obj instanceof Array) {
    return Promise.all(obj.map(o => o.loadAssociations()))
  } else if (obj instanceof Base) {
    return obj.loadAssociations()
  } else {
    return obj
  }
}

// JavaClass => java_class
export const camelToSnake = (className: string) => {
  if (className === undefined) {
    console.log('className', className)
    throw new Error()
  }
  return className
    .replace(/([A-Z])/g,
      (match: string, capture1: string) => `_${capture1.toLowerCase()}`)
    .replace(/^_/, '')
}

// apple => apples
export const plural = (str: string) => {
  const map: { [key: string]: string } = {
    class: 'classes',
    person: 'people',
    quiz: 'quizzes'
  }
  return map[str] ?? (str + 's')
}