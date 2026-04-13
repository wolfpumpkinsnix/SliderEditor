/**
 * signalsStore.ts
 *
 * Signals-based state layer built on @preact/signals-core.
 *
 * This module is the single source of truth for application state. It exposes
 * four core signals and a set of action functions that mirror the original
 * PresentationStore API.  The EventTarget-based store in store.ts is now a
 * thin wrapper around these signals – it stays alive for backward compatibility
 * with existing components that listen to the 'state-changed' CustomEvent.
 *
 * How to consume in new vanilla-web-component code:
 *
 *   import { effect } from '@preact/signals-core'
 *   import { mode, currentSlide } from '../state/signalsStore.ts'
 *
 *   connectedCallback() {
 *     this._disposeEffect = effect(() => {
 *       // Runs immediately and again whenever mode changes.
 *       console.log('mode is now', mode.value)
 *     })
 *   }
 *
 *   disconnectedCallback() {
 *     this._disposeEffect?.()
 *   }
 */

import { signal, computed, batch } from '@preact/signals-core'
import type { Presentation, Slide, Entity, EditorMode } from '../models/types.ts'
import { savePresentation, loadPresentation } from '../services/storage.ts'
import { examplePresentation } from '../models/defaults.ts'

// ── Bootstrap ──────────────────────────────────────────────────────────────────

const saved = loadPresentation()

// ── Core state signals ─────────────────────────────────────────────────────────

/** The full presentation document. Mutated in place, then re-assigned to a
 *  shallow copy so that signal subscribers are notified after in-place mutations. */
export const presentation = signal<Presentation>(saved ?? examplePresentation())

/** Zero-based index of the currently visible / edited slide. */
export const currentSlideIndex = signal<number>(0)

/** ID of the element currently selected in the editor, or null. */
export const selectedElementId = signal<string | null>(null)

/** Current application mode: 'edit' or 'present'. */
export const mode = signal<EditorMode>('edit')

// ── Derived (computed) signals ────────────────────────────────────────────────

/** The slide currently in view – recalculated automatically whenever
 *  `presentation` or `currentSlideIndex` changes. */
export const currentSlide = computed<Slide>(
  () => presentation.value.slides[currentSlideIndex.value],
)

// ── Private helpers ────────────────────────────────────────────────────────────

let _persistTimer: ReturnType<typeof setTimeout> | null = null

/** Stamp updatedAt and debounce-persist to localStorage (300ms). */
function persist(): void {
  presentation.value.meta.updatedAt = new Date().toISOString()
  if (_persistTimer) clearTimeout(_persistTimer)
  _persistTimer = setTimeout(() => {
    savePresentation(presentation.value)
    _persistTimer = null
  }, 300)
}

/** Flush any pending persist immediately (call on beforeunload). */
export function flushPersist(): void {
  if (_persistTimer) {
    clearTimeout(_persistTimer)
    _persistTimer = null
    savePresentation(presentation.value)
  }
}

/** After an in-place mutation of the presentation object, create a shallow copy
 *  so signal subscribers (effects / computed values) are re-notified. */
function notifyPresentation(): void {
  presentation.value = { ...presentation.value }
}

// ── Public action functions ────────────────────────────────────────────────────

export function setPresentation(p: Presentation): void {
  batch(() => {
    presentation.value = p
    currentSlideIndex.value = 0
    selectedElementId.value = null
  })
  persist()
}

export function updatePresentation(updater: (p: Presentation) => void): void {
  updater(presentation.value)
  persist()
  notifyPresentation()
}

export function goToSlide(index: number): void {
  const clamped = Math.max(0, Math.min(index, presentation.value.slides.length - 1))
  batch(() => {
    currentSlideIndex.value = clamped
    selectedElementId.value = null
  })
}

export function selectElement(id: string | null): void {
  selectedElementId.value = id
}

export function setMode(m: EditorMode): void {
  batch(() => {
    mode.value = m
    selectedElementId.value = null
  })
}

export function updateCurrentSlide(updater: (slide: Slide) => void): void {
  const slide = currentSlide.value
  if (slide) {
    updater(slide)
    persist()
    notifyPresentation()
  }
}

export function updateElement(elementId: string, updater: (el: Entity) => void): void {
  let found = false
  const updateInEntities = (entities: Entity[]): boolean => {
    for (const el of entities) {
      if (el.id === elementId) {
        updater(el)
        return true
      }
      if (el.children && updateInEntities(el.children)) {
        return true
      }
    }
    return false
  }

  for (const slide of presentation.value.slides) {
    if (updateInEntities(slide.entities)) {
      found = true
      break
    }
  }

  if (found) {
    persist()
    notifyPresentation()
  }
}

export function addSlide(slide: Slide, afterIndex?: number): void {
  const idx = afterIndex !== undefined ? afterIndex + 1 : presentation.value.slides.length
  presentation.value.slides.splice(idx, 0, slide)
  persist()
  batch(() => {
    currentSlideIndex.value = idx
    selectedElementId.value = null
    notifyPresentation()
  })
}

export function deleteSlide(index: number): void {
  if (presentation.value.slides.length <= 1) return
  presentation.value.slides.splice(index, 1)
  persist()
  batch(() => {
    currentSlideIndex.value = Math.min(index, presentation.value.slides.length - 1)
    selectedElementId.value = null
    notifyPresentation()
  })
}

export function duplicateSlide(index: number): void {
  const original = presentation.value.slides[index]
  const copy: Slide = JSON.parse(JSON.stringify(original))
  copy.id = crypto.randomUUID()

  const assignNewIds = (entities: Entity[]) => {
    for (const el of entities) {
      el.id = crypto.randomUUID()
      if (el.children) assignNewIds(el.children)
    }
  }
  assignNewIds(copy.entities)

  presentation.value.slides.splice(index + 1, 0, copy)
  persist()
  batch(() => {
    currentSlideIndex.value = index + 1
    notifyPresentation()
  })
}

export function moveSlide(fromIndex: number, toIndex: number): void {
  const slides = presentation.value.slides
  const [slide] = slides.splice(fromIndex, 1)
  slides.splice(toIndex, 0, slide)
  persist()
  batch(() => {
    currentSlideIndex.value = toIndex
    notifyPresentation()
  })
}

export function addElement(element: Entity): void {
  presentation.value.slides[currentSlideIndex.value].entities.push(element)
  persist()
  batch(() => {
    selectedElementId.value = element.id
    notifyPresentation()
  })
}

export function removeElement(elementId: string): void {
  const slide = presentation.value.slides[currentSlideIndex.value]

  const removeFromEntities = (entities: Entity[]): boolean => {
    const idx = entities.findIndex(e => e.id === elementId)
    if (idx !== -1) {
      entities.splice(idx, 1)
      return true
    }
    for (const el of entities) {
      if (el.children && removeFromEntities(el.children)) return true
    }
    return false
  }

  if (removeFromEntities(slide.entities)) {
    persist()
    batch(() => {
      if (selectedElementId.value === elementId) {
        selectedElementId.value = null
      }
      notifyPresentation()
    })
  }
}

export function updateTitle(title: string): void {
  presentation.value.title = title
  persist()
  notifyPresentation()
}

export function moveElementUp(elementId: string): void {
  const slide = presentation.value.slides[currentSlideIndex.value]
  const idx = slide.entities.findIndex(e => e.id === elementId)
  if (idx <= 0) return
  ;[slide.entities[idx - 1], slide.entities[idx]] = [slide.entities[idx], slide.entities[idx - 1]]
  persist()
  notifyPresentation()
}

export function moveElementDown(elementId: string): void {
  const slide = presentation.value.slides[currentSlideIndex.value]
  const idx = slide.entities.findIndex(e => e.id === elementId)
  if (idx === -1 || idx >= slide.entities.length - 1) return
  ;[slide.entities[idx], slide.entities[idx + 1]] = [slide.entities[idx + 1], slide.entities[idx]]
  persist()
  notifyPresentation()
}

export function bringToFront(elementId: string): void {
  const slide = presentation.value.slides[currentSlideIndex.value]
  const idx = slide.entities.findIndex(e => e.id === elementId)
  if (idx === -1 || idx === slide.entities.length - 1) return
  slide.entities.push(...slide.entities.splice(idx, 1))
  persist()
  notifyPresentation()
}

export function sendToBack(elementId: string): void {
  const slide = presentation.value.slides[currentSlideIndex.value]
  const idx = slide.entities.findIndex(e => e.id === elementId)
  if (idx <= 0) return
  slide.entities.unshift(...slide.entities.splice(idx, 1))
  persist()
  notifyPresentation()
}

export function reorderElement(elementId: string, newIndex: number): void {
  const slide = presentation.value.slides[currentSlideIndex.value]
  const oldIndex = slide.entities.findIndex(e => e.id === elementId)
  if (oldIndex === -1 || oldIndex === newIndex) return
  const clamped = Math.max(0, Math.min(newIndex, slide.entities.length - 1))
  const [el] = slide.entities.splice(oldIndex, 1)
  slide.entities.splice(clamped, 0, el)
  persist()
  notifyPresentation()
}

/**
 * Find an entity by id in a slide, searching both top-level entities
 * and children recursively.
 */
export function findElement(slide: Slide, id: string): Entity | undefined {
  const findInEntities = (entities: Entity[]): Entity | undefined => {
    for (const el of entities) {
      if (el.id === id) return el
      if (el.children) {
        const found = findInEntities(el.children)
        if (found) return found
      }
    }
    return undefined
  }
  return findInEntities(slide.entities)
}
