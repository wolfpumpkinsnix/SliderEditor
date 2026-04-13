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
    const pres = JSON.parse(raw) as any
    // Break cache if it's the old elements-based schema instead of entities
    if (pres && pres.slides && pres.slides.length > 0 && typeof pres.slides[0].entities === 'undefined') {
      return null
    }
    return pres as Presentation
  } catch {
    return null
  }
}

export function clearPresentation(): void {
  localStorage.removeItem(KEY)
}
