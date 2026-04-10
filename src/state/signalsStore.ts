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

/** Stamp updatedAt and persist to localStorage. */
function persist(): void {
  presentation.value.meta.updatedAt = new Date().toISOString()
  savePresentation(presentation.value)
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
  for (const slide of presentation.value.slides) {
    const el = slide.elements.find(e => e.id === elementId)
    if (el) { updater(el); break }
    // Check inside grids
    for (const topEl of slide.elements) {
      if (topEl.type === 'grid') {
        const card = topEl.children.find(c => c.id === elementId)
        if (card) { updater(card); break }
      }
    }
  }
  persist()
  notifyPresentation()
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
  copy.elements = copy.elements.map(el => ({
    ...el,
    id: crypto.randomUUID(),
    ...(el.type === 'grid' ? { children: (el as { type: 'grid'; children: { id: string }[] }).children.map(c => ({ ...c, id: crypto.randomUUID() })) } : {}),
  })) as Slide['elements']
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
  currentSlide.value.elements.push(element)
  persist()
  batch(() => {
    selectedElementId.value = element.id
    notifyPresentation()
  })
}

export function removeElement(elementId: string): void {
  const slide = currentSlide.value
  slide.elements = slide.elements.filter(e => e.id !== elementId)
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
