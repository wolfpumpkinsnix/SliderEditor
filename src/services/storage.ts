import type { Presentation } from '../models/types.ts'

const KEY = 'slide-editor-presentation'

export function savePresentation(p: Presentation): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // ignore quota errors
  }
}

export function loadPresentation(): Presentation | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as Presentation
  } catch {
    return null
  }
}

export function clearPresentation(): void {
  localStorage.removeItem(KEY)
}
