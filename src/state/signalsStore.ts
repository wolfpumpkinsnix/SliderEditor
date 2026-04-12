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
import type { Presentation, Slide, SlideElement, EditorMode } from '../models/types.ts'
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

export function updateElement(elementId: string, updater: (el: SlideElement) => void): void {
  let found = false
  outer: for (const slide of presentation.value.slides) {
    const el = slide.elements.find(e => e.id === elementId)
    if (el) { updater(el); found = true; break outer }
    for (const topEl of slide.elements) {
      if (topEl.type === 'grid') {
        const card = topEl.children.find(c => c.id === elementId)
        if (card) { updater(card); found = true; break outer }
      }
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
  copy.elements = copy.elements.map(el => {
    const withNewId = { ...el, id: crypto.randomUUID() }
    if (el.type === 'grid') {
      const grid = el as { type: 'grid'; children: { id: string }[] }
      return { ...withNewId, children: grid.children.map(c => ({ ...c, id: crypto.randomUUID() })) }
    }
    return withNewId
  }) as Slide['elements']
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

export function addElement(element: SlideElement): void {
  presentation.value.slides[currentSlideIndex.value].elements.push(element)
  persist()
  batch(() => {
    selectedElementId.value = element.id
    notifyPresentation()
  })
}

export function removeElement(elementId: string): void {
  const slide = presentation.value.slides[currentSlideIndex.value]
  const topIndex = slide.elements.findIndex(e => e.id === elementId)
  if (topIndex !== -1) {
    slide.elements.splice(topIndex, 1)
  } else {
    for (const el of slide.elements) {
      if (el.type === 'grid') {
        const childIndex = el.children.findIndex(c => c.id === elementId)
        if (childIndex !== -1) { el.children.splice(childIndex, 1); break }
      }
    }
  }
  persist()
  batch(() => {
    if (selectedElementId.value === elementId) {
      selectedElementId.value = null
    }
    notifyPresentation()
  })
}

export function updateTitle(title: string): void {
  presentation.value.title = title
  persist()
  notifyPresentation()
}

export function moveElementUp(elementId: string): void {
  const slide = presentation.value.slides[currentSlideIndex.value]
  const idx = slide.elements.findIndex(e => e.id === elementId)
  if (idx <= 0) return
  ;[slide.elements[idx - 1], slide.elements[idx]] = [slide.elements[idx], slide.elements[idx - 1]]
  persist()
  notifyPresentation()
}

export function moveElementDown(elementId: string): void {
  const slide = presentation.value.slides[currentSlideIndex.value]
  const idx = slide.elements.findIndex(e => e.id === elementId)
  if (idx === -1 || idx >= slide.elements.length - 1) return
  ;[slide.elements[idx], slide.elements[idx + 1]] = [slide.elements[idx + 1], slide.elements[idx]]
  persist()
  notifyPresentation()
}

export function bringToFront(elementId: string): void {
  const slide = presentation.value.slides[currentSlideIndex.value]
  const idx = slide.elements.findIndex(e => e.id === elementId)
  if (idx === -1 || idx === slide.elements.length - 1) return
  slide.elements.push(...slide.elements.splice(idx, 1))
  persist()
  notifyPresentation()
}

export function sendToBack(elementId: string): void {
  const slide = presentation.value.slides[currentSlideIndex.value]
  const idx = slide.elements.findIndex(e => e.id === elementId)
  if (idx <= 0) return
  slide.elements.unshift(...slide.elements.splice(idx, 1))
  persist()
  notifyPresentation()
}

/**
 * Find an element by id in a slide, searching both top-level elements
 * and children of grid elements.
 */
export function findElement(slide: Slide, id: string): SlideElement | undefined {
  return slide.elements.find(e => e.id === id)
    ?? slide.elements.flatMap(e => e.type === 'grid' ? e.children : []).find(c => c.id === id)
}
